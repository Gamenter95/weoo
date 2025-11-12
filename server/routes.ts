import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
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

      // Ensure session is saved before responding
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true, message: "Registration data saved" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid input" });
    }
  });

  // Registration - Step 2: WWID setup
  app.post("/api/auth/setup-wwid", async (req, res) => {
    try {
      if (!req.session.registrationData) {
        return res.status(400).json({ 
          error: "Registration session expired. Please start registration again.",
          sessionExpired: true 
        });
      }

      const validatedData = wwidSchema.parse(req.body) as WWIDInput;
      const fullWWID = `${validatedData.wwid}@ww`;

      // Check if WWID already exists
      const existingWWID = await storage.getUserByWWID(fullWWID);
      if (existingWWID) {
        return res.status(400).json({ error: "WWID already taken" });
      }

      // Store WWID in session and save
      req.session.wwid = fullWWID;
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true, wwid: fullWWID });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid WWID" });
    }
  });

  // Registration - Step 3: S-PIN setup and complete registration
  app.post("/api/auth/setup-spin", async (req, res) => {
    try {
      if (!req.session.registrationData || !req.session.wwid) {
        return res.status(400).json({ 
          error: "Registration session expired. Please start registration again.",
          sessionExpired: true 
        });
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
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

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
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

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
        return res.status(401).json({ 
          error: "Login session expired. Please login again.",
          sessionExpired: true 
        });
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

  // Admin Routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/fund-requests", async (req, res) => {
    try {
      const requests = await storage.getAllFundRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch fund requests" });
    }
  });

  app.get("/api/admin/withdraw-requests", async (req, res) => {
    try {
      const requests = await storage.getAllWithdrawRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch withdraw requests" });
    }
  });

  app.post("/api/admin/update-balance", async (req, res) => {
    try {
      const { userId, change } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentBalance = parseFloat(user.balance);
      const newBalance = (currentBalance + change).toFixed(2);

      await storage.updateUserBalance(userId, newBalance);

      res.json({ success: true, newBalance });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update balance" });
    }
  });

  app.post("/api/admin/approve-fund/:id", async (req, res) => {
    try {
      const request = await storage.getFundRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      const user = await storage.getUser(request.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newBalance = (parseFloat(user.balance) + parseFloat(request.afterTaxAmount)).toFixed(2);
      await storage.updateUserBalance(user.id, newBalance);
      await storage.updateFundRequestStatus(req.params.id, "approved");

      await storage.createNotification({
        userId: user.id,
        type: "fund_approved",
        title: "Fund Request Approved",
        message: `Your fund request of ₹${request.amount} has been approved. ₹${request.afterTaxAmount} added to your account.`,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to approve request" });
    }
  });

  app.post("/api/admin/decline-fund/:id", async (req, res) => {
    try {
      const request = await storage.getFundRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      await storage.updateFundRequestStatus(req.params.id, "declined");

      await storage.createNotification({
        userId: request.userId,
        type: "fund_declined",
        title: "Fund Request Declined",
        message: `Your fund request of ₹${request.amount} has been declined.`,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to decline request" });
    }
  });

  app.post("/api/admin/approve-withdraw/:id", async (req, res) => {
    try {
      const request = await storage.getWithdrawRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      await storage.updateWithdrawRequestStatus(req.params.id, "approved");

      await storage.createNotification({
        userId: request.userId,
        type: "withdraw_approved",
        title: "Withdraw Request Approved",
        message: `Your withdraw request of ₹${request.amount} has been approved. ₹${request.afterTaxAmount} will be sent to ${request.upiId}.`,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to approve request" });
    }
  });

  app.post("/api/admin/decline-withdraw/:id", async (req, res) => {
    try {
      const request = await storage.getWithdrawRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      const user = await storage.getUser(request.userId);
      if (user) {
        const newBalance = (parseFloat(user.balance) + parseFloat(request.amount)).toFixed(2);
        await storage.updateUserBalance(user.id, newBalance);
      }

      await storage.updateWithdrawRequestStatus(req.params.id, "declined");

      await storage.createNotification({
        userId: request.userId,
        type: "withdraw_declined",
        title: "Withdraw Request Declined",
        message: `Your withdraw request of ₹${request.amount} has been declined. Amount refunded to your balance.`,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to decline request" });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const notifications = await storage.getUserNotifications(req.session.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const transactions = await storage.getUserTransactions(req.session.userId);
      const users = await storage.getAllUsers();
      
      const transactionsWithUsers = transactions.map(transaction => {
        const sender = users.find(u => u.id === transaction.senderId);
        const recipient = users.find(u => u.id === transaction.recipientId);
        return {
          ...transaction,
          senderWWID: sender?.wwid,
          senderUsername: sender?.username,
          recipientWWID: recipient?.wwid,
          recipientUsername: recipient?.username,
        };
      });

      res.json(transactionsWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Profile Update
  app.post("/api/profile/update", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { field, value, verifyWith } = req.body;

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify S-PIN or password
    if (field === "spin") {
      // Verify with password
      const validPassword = await bcrypt.compare(verifyWith, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }
    } else {
      // Verify with S-PIN
      const validSpin = await bcrypt.compare(verifyWith, user.spin);
      if (!validSpin) {
        return res.status(401).json({ error: "Invalid S-PIN" });
      }
    }

    // Handle WWID change - charge ₹10
    if (field === "wwid") {
      const balance = parseFloat(user.balance);
      if (balance < 10) {
        return res.status(400).json({ error: "Insufficient balance. Need ₹10 to change WWID." });
      }

      // Check if WWID is already taken
      const existingUser = await storage.getUserByWWID(value);
      if (existingUser) {
        return res.status(400).json({ error: "WWID already taken" });
      }

      const newBalance = (balance - 10).toFixed(2);
      await storage.updateUserBalance(req.session.userId, newBalance);
      await storage.updateUserField(req.session.userId, "wwid", value);

      return res.json({
        success: true,
        message: "WWID changed successfully. ₹10 deducted from your balance.",
      });
    }

    // Handle other field updates
    let updateValue = value;
    if (field === "password" || field === "spin") {
      updateValue = await bcrypt.hash(value, 10);
    }

    await storage.updateUserField(req.session.userId, field, updateValue);

    res.json({
      success: true,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`,
    });
  });

  // API Settings Routes
  app.get("/api/api-settings", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      let settings = await storage.getApiSettings(req.session.userId);
      
      if (!settings) {
        settings = await storage.createApiSettings({
          userId: req.session.userId,
          apiEnabled: false,
          apiToken: null,
          domain: "https://wwallet.koyeb.app",
        });
      }

      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch API settings" });
    }
  });

  app.post("/api/api-settings/toggle", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = req.body as { enabled: boolean };
      const { enabled } = validatedData;
      
      let settings = await storage.getApiSettings(req.session.userId);
      
      if (!settings) {
        settings = await storage.createApiSettings({
          userId: req.session.userId,
          apiEnabled: enabled,
          apiToken: null,
          domain: "https://wwallet.koyeb.app",
        });
      } else {
        settings = await storage.updateApiSettings(req.session.userId, { apiEnabled: enabled });
      }

      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: "Failed to update API settings" });
    }
  });

  app.post("/api/api-settings/generate-token", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const generateSecureToken = async (): Promise<string> => {
        let token: string;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
          token = crypto.randomBytes(4).toString('base64url').substring(0, 5);
          
          const existingSettings = await storage.getApiSettingsByToken(token);
          if (!existingSettings) {
            isUnique = true;
            return token;
          }
          attempts++;
        }

        throw new Error("Failed to generate unique token after multiple attempts");
      };

      const newToken = await generateSecureToken();
      
      let settings = await storage.getApiSettings(req.session.userId);
      
      if (!settings) {
        settings = await storage.createApiSettings({
          userId: req.session.userId,
          apiEnabled: false,
          apiToken: newToken,
          domain: "https://wwallet.koyeb.app",
        });
      } else {
        settings = await storage.updateApiSettings(req.session.userId, { apiToken: newToken });
      }

      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to generate token" });
    }
  });

  app.post("/api/api-settings/revoke-token", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const settings = await storage.updateApiSettings(req.session.userId, { 
        apiToken: null,
        apiEnabled: false 
      });

      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: "Failed to revoke token" });
    }
  });

  app.post("/api/api-settings/update-domain", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = req.body as { domain: string };
      const { domain } = validatedData;
      
      const settings = await storage.updateApiSettings(req.session.userId, { domain });

      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: "Failed to update domain" });
    }
  });

  // Public API Wallet Endpoint
  app.get("/api/wallet", async (req, res) => {
    try {
      const { type, token, wwid, amount } = req.query;

      if (type !== 'wallet') {
        return res.status(400).json({ error: "Invalid API type" });
      }

      if (!token || !wwid || !amount) {
        return res.status(400).json({ error: "Missing required parameters: token, wwid, amount" });
      }

      const apiSettings = await storage.getApiSettingsByToken(token as string);
      
      if (!apiSettings) {
        return res.status(401).json({ error: "Invalid or revoked API token" });
      }

      if (!apiSettings.apiEnabled) {
        return res.status(403).json({ error: "API payments are disabled" });
      }

      const recipient = await storage.getUserByWWID(wwid as string);
      if (!recipient) {
        return res.status(404).json({ error: "Recipient WWID not found" });
      }

      const paymentAmount = parseFloat(amount as string);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const payer = await storage.getUser(apiSettings.userId);
      if (!payer) {
        return res.status(404).json({ error: "API owner not found" });
      }

      const payerBalance = parseFloat(payer.balance);
      if (payerBalance < paymentAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      const newPayerBalance = (payerBalance - paymentAmount).toFixed(2);
      const newRecipientBalance = (parseFloat(recipient.balance) + paymentAmount).toFixed(2);

      await storage.updateUserBalance(payer.id, newPayerBalance);
      await storage.updateUserBalance(recipient.id, newRecipientBalance);

      const transaction = await storage.createTransaction({
        senderId: payer.id,
        recipientId: recipient.id,
        amount: paymentAmount.toFixed(2),
      });

      await storage.createNotification({
        userId: payer.id,
        type: "api_payment_sent",
        title: "API Payment Sent",
        message: `₹${paymentAmount.toFixed(2)} sent to ${recipient.wwid} via API`,
      });

      await storage.createNotification({
        userId: recipient.id,
        type: "payment_received",
        title: "Payment Received",
        message: `You received ₹${paymentAmount.toFixed(2)} from ${payer.wwid} via API`,
      });

      res.json({
        success: true,
        message: "Payment successful",
        transaction,
        newBalance: newPayerBalance,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "API payment failed" });
    }
  });


  const httpServer = createServer(app);

  return httpServer;
}