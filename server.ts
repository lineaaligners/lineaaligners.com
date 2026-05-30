import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import admin from "firebase-admin";
import {
  firebaseConfig,
  formatAdminUploadError,
  getAdminDb,
  getBearerToken,
  getFirebaseAdminApp,
  uploadAdminFile,
  verifyLoggedInAdmin
} from "./server/firebaseAdminUpload";

dotenv.config({ path: ".env.local" });
dotenv.config();

const adminApp = getFirebaseAdminApp();
const adminDb = getAdminDb(adminApp);
console.log("Firebase Admin initialized with project:", firebaseConfig.projectId);

function sendApiError(res: express.Response, error: any, fallback: string) {
  res.status(error?.status || 500).json({ error: error?.message || fallback });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email Configuration (Nodemailer)
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Defaulting to Gmail, user can change in .env
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // API Routes

  app.post("/api/admin-upload-file", express.raw({ type: "application/octet-stream", limit: "100mb" }), async (req, res) => {
    try {
      const result = await uploadAdminFile({
        idToken: getBearerToken(req.headers.authorization),
        storagePath: String(req.headers["x-storage-path"] || ""),
        contentType: String(req.headers["x-content-type"] || "application/octet-stream"),
        body: req.body,
        env: process.env
      });

      res.json(result);
    } catch (error: any) {
      console.error("Admin upload failed:", error);
      const formatted = formatAdminUploadError(error, process.env);
      res.status(formatted.status).json({ error: formatted.error });
    }
  });
  
  // Endpoint to send email when a new user is created
  app.post("/api/notify-user-created", async (req, res) => {
    try {
      await verifyLoggedInAdmin(getBearerToken(req.headers.authorization));

      const { name, email, createdAt, adminLink } = req.body;

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email credentials not set. Skipping notification.");
        return res.status(200).json({ status: "skipped", message: "Email not configured" });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Sending to self (the admin)
        subject: `New User Created: ${name}`,
        text: `A new user has been created in the Linea Portal.\n\nName: ${name}\nEmail: ${email}\nCreated At: ${createdAt}\nAdmin Link: ${adminLink}`,
      };

      await transporter.sendMail(mailOptions);
      res.json({ status: "ok" });
    } catch (error: any) {
      console.error("Failed to send email:", error);
      sendApiError(res, error, "Failed to send notification");
    }
  });

  // Endpoint to create a Firebase Auth user
  app.post("/api/create-auth-user", async (req, res) => {
    const { email, password, displayName } = req.body;

    try {
      await verifyLoggedInAdmin(getBearerToken(req.headers.authorization));

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

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || "",
        emailVerified: true // Automatically verify for admin-created accounts
      });
      res.json({ uid: userRecord.uid });
    } catch (error: any) {
      console.error("Error creating auth user:", error);

      if (error.code === "auth/email-already-exists") {
        const existingUser = await admin.auth().getUserByEmail(email);
        return res.json({ uid: existingUser.uid, existed: true });
      }
      
      // Check for specifically disabled API error
      if (error.message && error.message.includes("identitytoolkit.googleapis.com")) {
        return res.status(403).json({ 
          error: "Identity Toolkit API is disabled. Please click the link in the console logs to enable it.",
          link: "https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com"
        });
      }
      
      sendApiError(res, error, "Failed to create user");
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
