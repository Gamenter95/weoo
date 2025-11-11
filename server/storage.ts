import { type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { users, schema } from "@shared/schema";
import { eq, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByWWID(wwid: string): Promise<User | undefined>;
  getUserByUsernameOrPhone(usernameOrPhone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWWID(id: string, wwid: string): Promise<void>;
  updateUserSPIN(id: string, spin: string): Promise<void>;
  updateUserBalance(userId: string, newBalance: string): Promise<User | undefined>;
  createFundRequest(data: any): Promise<any>;
  createWithdrawRequest(data: any): Promise<any>;
  createTransaction(data: any): Promise<any>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone));
    return result[0];
  }

  async getUserByWWID(wwid: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.wwid, wwid));
    return result[0];
  }

  async getUserByUsernameOrPhone(usernameOrPhone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(
      or(eq(users.username, usernameOrPhone), eq(users.phone, usernameOrPhone))
    );
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserWWID(id: string, wwid: string): Promise<void> {
    await db.update(users).set({ wwid }).where(eq(users.id, id));
  }

  async updateUserSPIN(id: string, spin: string): Promise<void> {
    await db.update(users).set({ spin }).where(eq(users.id, id));
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createFundRequest(data: any): Promise<any> {
    const [request] = await db.insert(schema.fundRequests).values(data).returning();
    return request;
  }

  async createWithdrawRequest(data: any): Promise<any> {
    const [request] = await db.insert(schema.withdrawRequests).values(data).returning();
    return request;
  }

  async createTransaction(data: any): Promise<any> {
    const [transaction] = await db.insert(schema.transactions).values(data).returning();
    return transaction;
  }
}

export const storage = new DbStorage();