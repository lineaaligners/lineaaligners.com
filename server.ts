import express from "express";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { readFileSync } from "fs";

dotenv.config();

const firebaseConfig = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin initialized with project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
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
  
  // Endpoint to send email when a new user is created
  app.post("/api/notify-user-created", async (req, res) => {
    const { name, email, createdAt, adminLink } = req.body;
    
    // In a real app, you'd verify the request comes from an authenticated admin
    // For now, we'll assume the client-side has checked permissions (Firestore Rules handle the data part)
    
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
    const { email, password, displayName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
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
