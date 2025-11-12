import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  wwid: text("wwid").notNull().unique(),
  spin: text("spin").notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
});

export const wwidSchema = z.object({
  wwid: z.string().regex(/^[a-z0-9]{3,20}$/, "WWID must be 3-20 characters, lowercase letters and numbers only"),
});

export const spinSchema = z.object({
  spin: z.string().regex(/^\d{4}$/, "S-PIN must be exactly 4 digits"),
});

export const loginSchema = z.object({
  usernameOrPhone: z.string().min(3),
  password: z.string().min(6),
});

export const verifyPinSchema = z.object({
  spin: z.string().regex(/^\d{4}$/, "S-PIN must be exactly 4 digits"),
});

export const forgotPasswordSchema = z.object({
  usernameOrPhone: z.string().min(3),
  spin: z.string().regex(/^\d{4}$/, "S-PIN must be exactly 4 digits"),
});

export const forgotSpinSchema = z.object({
  usernameOrPhone: z.string().min(3),
  password: z.string().min(6),
});

export const addFundSchema = z.object({
  amount: z.number().min(10, "Minimum amount is ₹10"),
  utr: z.string().min(12).max(12),
});

export const payToUserSchema = z.object({
  recipientWWID: z.string().min(5),
  amount: z.number().min(1, "Amount must be at least ₹1"),
  spin: z.string().regex(/^\d{4}$/, "S-PIN must be exactly 4 digits"),
});

export const createGiftCodeSchema = z.object({
  totalUsers: z.number().min(1, "Must allow at least 1 user"),
  amountPerUser: z.number().min(1, "Amount per user must be at least ₹1"),
  comment: z.string().optional(),
  code: z.string().optional(),
});

export const claimGiftCodeSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export const giftCodes = pgTable("gift_codes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: text("creator_id").notNull().references(() => users.id),
  code: text("code").notNull().unique(),
  totalUsers: integer("total_users").notNull(),
  remainingUsers: integer("remaining_users").notNull(),
  amountPerUser: numeric("amount_per_user", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  comment: text("comment"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const giftCodeClaims = pgTable("gift_code_claims", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCodeId: text("gift_code_id").notNull().references(() => giftCodes.id),
  userId: text("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

export const withdrawSchema = z.object({
  amount: z.number().min(20, "Minimum withdrawal is ₹20"),
  upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI ID format"),
});

export const toggleApiSchema = z.object({
  enabled: z.boolean(),
});

export const updateDomainSchema = z.object({
  domain: z.string().url("Invalid domain URL"),
});

export const fundRequests = pgTable("fund_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  afterTaxAmount: numeric("after_tax_amount", { precision: 10, scale: 2 }).notNull(),
  utr: text("utr").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const withdrawRequests = pgTable("withdraw_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  afterTaxAmount: numeric("after_tax_amount", { precision: 10, scale: 2 }).notNull(),
  upiId: text("upi_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: text("sender_id").notNull().references(() => users.id),
  recipientId: text("recipient_id").notNull().references(() => users.id),
  amount: text("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiSettings = pgTable("api_settings", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique().references(() => users.id),
  apiEnabled: boolean("api_enabled").notNull().default(false),
  apiToken: text("api_token"),
  domain: text("domain").default("https://weoo.replit.app"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApiSettingsSchema = createInsertSchema(apiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WWIDInput = z.infer<typeof wwidSchema>;
export type SPINInput = z.infer<typeof spinSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyPinInput = z.infer<typeof verifyPinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotSpinInput = z.infer<typeof forgotSpinSchema>;
export type AddFundInput = z.infer<typeof addFundSchema>;
export type PayToUserInput = z.infer<typeof payToUserSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type ApiSettings = typeof apiSettings.$inferSelect;
export type InsertApiSettings = z.infer<typeof insertApiSettingsSchema>;
export type CreateGiftCodeInput = z.infer<typeof createGiftCodeSchema>;
export type ClaimGiftCodeInput = z.infer<typeof claimGiftCodeSchema>;
export type GiftCode = typeof giftCodes.$inferSelect;
export type GiftCodeClaim = typeof giftCodeClaims.$inferSelect;