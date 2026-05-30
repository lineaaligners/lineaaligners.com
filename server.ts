import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { readFileSync } from "fs";

dotenv.config();

const firebaseConfig = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
const defaultAdminEmail = "nallbanigeno@gmail.com";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const appOptions: admin.AppOptions = {
      projectId: firebaseConfig.projectId,
    };
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccount) {
      appOptions.credential = admin.credential.cert(JSON.parse(serviceAccount));
    }

    admin.initializeApp(appOptions);
    console.log("Firebase Admin initialized with project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

const adminDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId)
  : getFirestore(admin.app());

function getBearerToken(req: express.Request) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
}

async function verifyFirebaseRequest(req: express.Request) {
  const token = getBearerToken(req);
  if (!token) {
    throw Object.assign(new Error("Missing Firebase ID token"), { status: 401 });
  }

  return admin.auth().verifyIdToken(token);
}

async function isAdminRequest(decodedToken: DecodedIdToken) {
  const configuredAdmins = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || defaultAdminEmail)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (decodedToken.email && configuredAdmins.includes(decodedToken.email.toLowerCase())) {
    return true;
  }

  try {
    const adminDoc = await adminDb.collection("admins").doc(decodedToken.uid).get();
    return adminDoc.exists;
  } catch (error) {
    console.warn("Unable to check admins collection:", error);
    return false;
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email Configuration (Nodemailer)
  const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
  const notificationTo = process.env.REGISTRATION_NOTIFICATION_TO || process.env.EMAIL_TO || gmailUser;
  const emailConfigured = Boolean(gmailUser && gmailPass && notificationTo);
  const transporter = emailConfigured
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      })
    : null;

  // API Routes
  
  // Endpoint to send email when a new user is created
  app.post("/api/notify-user-created", async (req, res) => {
    let decodedToken: DecodedIdToken;

    try {
      decodedToken = await verifyFirebaseRequest(req);
    } catch (error: any) {
      return res.status(error.status || 401).json({ error: getErrorMessage(error) });
    }

    const { userId, name, email, role, status, source, createdAt, adminLink } = req.body;

    if (!userId || !name || !email) {
      return res.status(400).json({ error: "userId, name, and email are required" });
    }

    if (decodedToken.uid !== userId && !(await isAdminRequest(decodedToken))) {
      return res.status(403).json({ error: "Not allowed to send this registration notification" });
    }

    if (!emailConfigured || !transporter) {
      console.warn("Email credentials not set. Skipping notification.");
      return res.status(200).json({ status: "skipped", message: "Email not configured" });
    }

    const emailSender = process.env.EMAIL_FROM || gmailUser || "";
    const notificationRecipient = notificationTo || gmailUser || "";
    const registeredAt = createdAt ? new Date(createdAt) : new Date();
    const registeredAtText = Number.isNaN(registeredAt.getTime())
      ? new Date().toISOString()
      : registeredAt.toISOString();

    const mailOptions = {
      from: emailSender,
      to: notificationRecipient,
      replyTo: email,
      subject: `New Linea registration: ${name}`,
      text: [
        "A new user registered in the Linea Portal.",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Role: ${role || "unknown"}`,
        `Status: ${status || "active"}`,
        `Source: ${source || "unknown"}`,
        `Firebase UID: ${userId}`,
        `Created At: ${registeredAtText}`,
        `Admin Link: ${adminLink || ""}`
      ].join("\n"),
      html: `
        <h2>New Linea registration</h2>
        <p>A new user registered in the Linea Portal.</p>
        <table cellpadding="6" cellspacing="0" border="0">
          <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
          <tr><td><strong>Role</strong></td><td>${escapeHtml(role || "unknown")}</td></tr>
          <tr><td><strong>Status</strong></td><td>${escapeHtml(status || "active")}</td></tr>
          <tr><td><strong>Source</strong></td><td>${escapeHtml(source || "unknown")}</td></tr>
          <tr><td><strong>Firebase UID</strong></td><td>${escapeHtml(userId)}</td></tr>
          <tr><td><strong>Created At</strong></td><td>${escapeHtml(registeredAtText)}</td></tr>
          <tr><td><strong>Admin Link</strong></td><td>${adminLink ? `<a href="${escapeHtml(adminLink)}">${escapeHtml(adminLink)}</a>` : ""}</td></tr>
        </table>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ status: "ok" });
    } catch (error) {
      console.error("Failed to send email:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Endpoint to create a Firebase Auth user
  app.post("/api/create-auth-user", async (req, res) => {
    let decodedToken: DecodedIdToken;

    try {
      decodedToken = await verifyFirebaseRequest(req);
    } catch (error: any) {
      return res.status(error.status || 401).json({ error: getErrorMessage(error) });
    }

    if (!(await isAdminRequest(decodedToken))) {
      return res.status(403).json({ error: "Only admins can create portal users" });
    }

    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Backend validation (matching frontend's flexible rules)
    if (displayName && displayName.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ error: "Invalid email format (must contain @)" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || "",
        emailVerified: true // Automatically verify for admin-created accounts
      });
      res.json({ uid: userRecord.uid });
    } catch (error: any) {
      console.error("Error creating auth user:", error);
      
      // Check for specifically disabled API error
      if (error.message && error.message.includes("identitytoolkit.googleapis.com")) {
        return res.status(403).json({ 
          error: "Identity Toolkit API is disabled. Please click the link in the console logs to enable it.",
          link: "https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com"
        });
      }
      
      res.status(500).json({ error: error.message || "Failed to create user" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
