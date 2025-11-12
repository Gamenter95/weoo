import { db } from "./db";
import { sql } from "drizzle-orm";
import { users, fundRequests, withdrawRequests, transactions, notifications, apiSettings, giftCodes, giftCodeClaims } from "@shared/schema";

export async function initializeDatabase() {
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        wwid TEXT NOT NULL UNIQUE,
        spin TEXT NOT NULL,
        balance NUMERIC(10, 2) NOT NULL DEFAULT 0
      )
    `);

    // Create fund_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fund_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        amount NUMERIC(10, 2) NOT NULL,
        after_tax_amount NUMERIC(10, 2) NOT NULL,
        utr TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create withdraw_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS withdraw_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        amount NUMERIC(10, 2) NOT NULL,
        after_tax_amount NUMERIC(10, 2) NOT NULL,
        upi_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create transactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id TEXT NOT NULL REFERENCES users(id),
        recipient_id TEXT NOT NULL REFERENCES users(id),
        amount TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create api_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_settings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
        api_enabled BOOLEAN NOT NULL DEFAULT false,
        api_token TEXT,
        domain TEXT DEFAULT 'https://wwallet.koyeb.app',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create gift_codes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gift_codes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        creator_id TEXT NOT NULL REFERENCES users(id),
        code TEXT NOT NULL UNIQUE,
        total_users INTEGER NOT NULL,
        remaining_users INTEGER NOT NULL,
        amount_per_user NUMERIC(10, 2) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        comment TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create gift_code_claims table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS gift_code_claims (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        gift_code_id TEXT NOT NULL REFERENCES gift_codes(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        amount NUMERIC(10, 2) NOT NULL,
        claimed_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    console.log("✅ Database tables initialized");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}