# Security Specification - Linea Aligners Kosovo

## 1. Data Invariants
- **Users**: Every user must have a unique UID, a name, and a role (Doctor/Patient). Doctors can manage patients; Patients can only view their own data.
- **Patients**: Patient records are managed by Administrators. Each patient is linked to a `userId`.
- **Aligner Cases**: Clinical cases managed by Administrators.
- **Files/Documents**: Clinical assets belong to either a Case or a Patient. Access is restricted to the owning User, the assigned Doctor, or an Administrator.
- **Scans**: Clinical uploads by Doctors. Accessible by the uploader (Doctor), assigned Patients, and Administrators.

## 2. The "Dirty Dozen" Payloads (Rejected Cases)
1. **Identity Spoofing**: User A attempts to update User B's profile.
2. **Role Escalation**: Patient attempts to change their role to 'doctor'.
3. **Orphaned Case**: Creating an Aligner Case without a valid patient name.
4. **Unauthorized Document Access**: Patient A attempts to read Patient B's medical documents.
5. **Ghost Asset**: Uploading a file to a non-existent Aligner Case.
6. **Shadow Update**: Updating an Aligner Case with an unverified field like `priority: 'high'`.
7. **Malicious ID**: Using a 2MB string as a Document ID to cause resource exhaustion.
8. **PII Leak**: Guest user attempting to list all registered emails in `/users`.
9. **History Alteration**: Updating the `createdAt` timestamp of a case after creation.
10. **Doctor Impersonation**: Non-doctor user attempting to create a clinical scan in `/scans`.
11. **Client-Side ID Injection**: Creating a user document where `uid` in data does not match `request.auth.uid`.
12. **Relationship Hijacking**: User A attempts to create a `doctor_patient` relationship between User B and User C.

## 3. Test Runner (Draft)
A `firestore.rules.test.ts` will be implemented to verify that:
- Unverified users are rejected for write operations.
- Non-admin users cannot delete global collections.
- Patients can ONLY read their own files.
- Doctors can ONLY manage patients assigned to them.
