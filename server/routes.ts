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

  // Forgot Password - verify S-PIN and login
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const validatedData = req.body as any;

      const user = await storage.getUserByUsernameOrPhone(validatedData.usernameOrPhone);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const spinMatch = await bcrypt.compare(validatedData.spin, user.spin);
      if (!spinMatch) {
        return res.status(401).json({ error: "Invalid S-PIN" });
      }

      req.session.userId = user.id;

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
      res.status(400).json({ error: error.message || "Password recovery failed" });
    }
  });

  // Forgot S-PIN - verify password and login
  app.post("/api/auth/forgot-spin", async (req, res) => {
    try {
      const validatedData = req.body as any;

      const user = await storage.getUserByUsernameOrPhone(validatedData.usernameOrPhone);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const passwordMatch = await bcrypt.compare(validatedData.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      req.session.userId = user.id;

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
      res.status(400).json({ error: error.message || "S-PIN recovery failed" });
    }
  });

  // Add Fund - submit request with UTR
  app.post("/api/transactions/add-fund", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = req.body as any;
      const amount = validatedData.amount;
      const afterTaxAmount = amount * 0.97;

      const request = await storage.createFundRequest({
        userId: req.session.userId,
        amount: amount.toFixed(2),
        afterTaxAmount: afterTaxAmount.toFixed(2),
        utr: validatedData.utr,
        status: "pending",
      });

      res.json({
        success: true,
        message: "Fund request submitted successfully",
        request,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to submit fund request" });
    }
  });

  // Pay to User
  app.post("/api/transactions/pay-to-user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = req.body as any;

      const sender = await storage.getUser(req.session.userId);
      if (!sender) {
        return res.status(404).json({ error: "Sender not found" });
      }

      const recipient = await storage.getUserByWWID(validatedData.recipientWWID);
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      if (sender.id === recipient.id) {
        return res.status(400).json({ error: "Cannot pay to yourself" });
      }

      const spinMatch = await bcrypt.compare(validatedData.spin, sender.spin);
      if (!spinMatch) {
        return res.status(401).json({ error: "Invalid S-PIN" });
      }

      const senderBalance = parseFloat(sender.balance);
      const amount = validatedData.amount;

      if (senderBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const newSenderBalance = (senderBalance - amount).toFixed(2);
      const newRecipientBalance = (parseFloat(recipient.balance) + amount).toFixed(2);

      await storage.updateUserBalance(sender.id, newSenderBalance);
      await storage.updateUserBalance(recipient.id, newRecipientBalance);

      const transaction = await storage.createTransaction({
        senderId: sender.id,
        recipientId: recipient.id,
        amount: amount.toFixed(2),
      });

      res.json({
        success: true,
        message: "Payment successful",
        transaction,
        newBalance: newSenderBalance,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Payment failed" });
    }
  });

  // Withdraw
  app.post("/api/transactions/withdraw", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = req.body as any;

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const amount = validatedData.amount;
      const afterTaxAmount = amount * 0.97;
      const userBalance = parseFloat(user.balance);

      if (userBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const newBalance = (userBalance - amount).toFixed(2);
      await storage.updateUserBalance(user.id, newBalance);

      const request = await storage.createWithdrawRequest({
        userId: user.id,
        amount: amount.toFixed(2),
        afterTaxAmount: afterTaxAmount.toFixed(2),
        upiId: validatedData.upiId,
        status: "pending",
      });

      res.json({
        success: true,
        message: "Withdrawal request submitted successfully",
        request,
        newBalance,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Withdrawal failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
