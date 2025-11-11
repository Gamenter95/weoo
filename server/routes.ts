import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import {
  registerSchema,
  wwidSchema,
  spinSchema,
  loginSchema,
  verifyPinSchema,
  type RegisterInput,
  type WWIDInput,
  type SPINInput,
  type LoginInput,
  type VerifyPinInput,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Registration - Step 1: Basic info
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body) as RegisterInput;

      // Check if username or phone already exists
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingPhone = await storage.getUserByPhone(validatedData.phone);
      if (existingPhone) {
        return res.status(400).json({ error: "Phone number already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Store in session for next steps
      req.session.registrationData = {
        username: validatedData.username,
        phone: validatedData.phone,
        password: hashedPassword,
      };

      res.json({ success: true, message: "Registration data saved" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Registration - Step 2: WWID setup
  app.post("/api/auth/setup-wwid", async (req, res) => {
    try {
      if (!req.session.registrationData) {
        return res.status(400).json({ error: "Registration session not found" });
      }

      const validatedData = wwidSchema.parse(req.body) as WWIDInput;
      const fullWWID = `${validatedData.wwid}@ww`;

      // Check if WWID already exists
      const existingWWID = await storage.getUserByWWID(fullWWID);
      if (existingWWID) {
        return res.status(400).json({ error: "WWID already taken" });
      }

      // Store WWID in session
      req.session.wwid = fullWWID;

      res.json({ success: true, wwid: fullWWID });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid WWID" });
    }
  });

  // Registration - Step 3: S-PIN setup and complete registration
  app.post("/api/auth/setup-spin", async (req, res) => {
    try {
      if (!req.session.registrationData || !req.session.wwid) {
        return res.status(400).json({ error: "Registration session incomplete" });
      }

      const validatedData = spinSchema.parse(req.body) as SPINInput;

      // Hash S-PIN
      const hashedSPIN = await bcrypt.hash(validatedData.spin, 10);

      // Create user with all data
      const user = await storage.createUser({
        username: req.session.registrationData.username,
        phone: req.session.registrationData.phone,
        password: req.session.registrationData.password,
        wwid: req.session.wwid,
        spin: hashedSPIN,
      });

      // Clear registration data from session
      delete req.session.registrationData;
      delete req.session.wwid;

      res.json({
        success: true,
        message: "Account created successfully",
        user: {
          id: user.id,
          username: user.username,
          wwid: user.wwid,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create account" });
    }
  });

  // Login - Step 1: Username/Phone and Password
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body) as LoginInput;

      // Find user by username or phone
      const user = await storage.getUserByUsernameOrPhone(validatedData.usernameOrPhone);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(validatedData.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Store user ID in session for S-PIN verification
      req.session.userId = user.id;

      res.json({
        success: true,
        requiresPinVerification: true,
        username: user.username,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  // Login - Step 2: S-PIN verification
  app.post("/api/auth/verify-pin", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Login session not found" });
      }

      const validatedData = verifyPinSchema.parse(req.body) as VerifyPinInput;

      // Get user
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Verify S-PIN
      const spinMatch = await bcrypt.compare(validatedData.spin, user.spin);
      if (!spinMatch) {
        return res.status(401).json({ error: "Invalid S-PIN" });
      }

      // Complete login - session already has userId
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          wwid: user.wwid,
          balance: user.balance,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "PIN verification failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        phone: user.phone,
        wwid: user.wwid,
        balance: user.balance,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get user data" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
