import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_settings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
        api_enabled BOOLEAN NOT NULL DEFAULT false,
        api_token TEXT,
        domain TEXT DEFAULT 'https://wwallet.koyeb.app',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log("✅ API settings table initialized");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
