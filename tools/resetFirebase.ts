import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const firebaseConfig = JSON.parse(readFileSync(resolve('firebase-applet-config.json'), 'utf-8'));
const projectId = firebaseConfig.projectId;
const adminEmail = process.env.RESET_ADMIN_EMAIL || 'nallbanigeno@gmail.com';
const adminPassword = process.env.RESET_ADMIN_PASSWORD;

if (process.env.CONFIRM_FIREBASE_RESET !== projectId) {
  console.error(`Refusing reset. Set CONFIRM_FIREBASE_RESET=${projectId}`);
  process.exit(1);
}

if (!adminPassword || adminPassword.length < 6) {
  console.error('Refusing reset. Set RESET_ADMIN_PASSWORD with at least 6 characters.');
  process.exit(1);
}

function getCredential() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (rawJson) return admin.credential.cert(JSON.parse(rawJson));
  if (base64Json) return admin.credential.cert(JSON.parse(Buffer.from(base64Json, 'base64').toString('utf-8')));
  if (filePath) return admin.credential.cert(JSON.parse(readFileSync(resolve(filePath), 'utf-8')));

  return admin.credential.applicationDefault();
}

admin.initializeApp({
  projectId,
  credential: getCredential()
});

const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId)
  : getFirestore(admin.app());

async function deleteAllAuthUsers() {
  let deleted = 0;
  let result = await admin.auth().listUsers(1000);

  while (result.users.length > 0) {
    const uids = result.users.map(user => user.uid);
    await admin.auth().deleteUsers(uids);
    deleted += uids.length;
    result = await admin.auth().listUsers(1000);
  }

  return deleted;
}

async function deleteAllFirestoreData() {
  const collections = await db.listCollections();
  await Promise.all(collections.map(collectionRef => db.recursiveDelete(collectionRef)));
  return collections.map(collectionRef => collectionRef.id);
}

async function seedAdmin() {
  const user = await admin.auth().createUser({
    email: adminEmail,
    password: adminPassword,
    displayName: 'Linea Admin',
    emailVerified: true
  });

  await db.collection('admins').doc(user.uid).set({
    email: adminEmail,
    role: 'admin',
    createdAt: FieldValue.serverTimestamp()
  });

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: adminEmail,
    name: 'Linea Admin',
    role: 'doctor',
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    registrationDate: FieldValue.serverTimestamp()
  });

  return user.uid;
}

console.log(`Resetting Firebase project ${projectId} / database ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
const deletedUsers = await deleteAllAuthUsers();
const deletedCollections = await deleteAllFirestoreData();
const adminUid = await seedAdmin();

console.log(`Deleted auth users: ${deletedUsers}`);
console.log(`Deleted Firestore collections: ${deletedCollections.join(', ') || '(none)'}`);
console.log(`Seeded admin: ${adminEmail} (${adminUid})`);
