import { type User, type InsertUser, type ApiSettings, type InsertApiSettings, fundRequests, withdrawRequests, transactions, notifications, apiSettings } from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, or, desc, sql } from "drizzle-orm";
import { generateId } from "./utils";

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
  getAllUsers(): Promise<any[]>;
  getAllFundRequests(): Promise<any[]>;
  getAllWithdrawRequests(): Promise<any[]>;
  getFundRequest(id: string): Promise<any>;
  getWithdrawRequest(id: string): Promise<any>;
  updateFundRequestStatus(id: string, status: string): Promise<void>;
  updateWithdrawRequestStatus(id: string, status: string): Promise<void>;
  createNotification(data: any): Promise<any>;
  getUserNotifications(userId: string): Promise<any[]>;
  updateUserField(userId: string, field: string, value: string): Promise<void>;
  getApiSettings(userId: string): Promise<ApiSettings | undefined>;
  createApiSettings(data: InsertApiSettings): Promise<ApiSettings>;
  updateApiSettings(userId: string, data: Partial<InsertApiSettings>): Promise<ApiSettings | undefined>;
  getApiSettingsByToken(token: string): Promise<ApiSettings | undefined>;
  getUserTransactions(userId: string): Promise<any[]>;
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
    const [request] = await db.insert(fundRequests).values(data).returning();
    return request;
  }

  async createWithdrawRequest(data: any): Promise<any> {
    const [request] = await db.insert(withdrawRequests).values(data).returning();
    return request;
  }

  async createTransaction(data: any): Promise<any> {
    const [transaction] = await db.insert(transactions).values(data).returning();
    return transaction;
  }

  async getAllUsers(): Promise<any[]> {
    return await db.select().from(users);
  }

  async getAllFundRequests(): Promise<any[]> {
    const requests = await db.select({
      id: fundRequests.id,
      userId: fundRequests.userId,
      amount: fundRequests.amount,
      afterTaxAmount: fundRequests.afterTaxAmount,
      utr: fundRequests.utr,
      status: fundRequests.status,
      createdAt: fundRequests.createdAt,
      username: users.username,
    })
    .from(fundRequests)
    .leftJoin(users, eq(fundRequests.userId, users.id))
    .orderBy(desc(fundRequests.createdAt));

    return requests;
  }

  async getAllWithdrawRequests(): Promise<any[]> {
    const requests = await db.select({
      id: withdrawRequests.id,
      userId: withdrawRequests.userId,
      amount: withdrawRequests.amount,
      afterTaxAmount: withdrawRequests.afterTaxAmount,
      upiId: withdrawRequests.upiId,
      status: withdrawRequests.status,
      createdAt: withdrawRequests.createdAt,
      username: users.username,
    })
    .from(withdrawRequests)
    .leftJoin(users, eq(withdrawRequests.userId, users.id))
    .orderBy(desc(withdrawRequests.createdAt));

    return requests;
  }

  async getFundRequest(id: string): Promise<any> {
    const [request] = await db.select().from(fundRequests).where(eq(fundRequests.id, id));
    return request;
  }

  async getWithdrawRequest(id: string): Promise<any> {
    const [request] = await db.select().from(withdrawRequests).where(eq(withdrawRequests.id, id));
    return request;
  }

  async updateFundRequestStatus(id: string, status: string): Promise<void> {
    await db.update(fundRequests).set({ status }).where(eq(fundRequests.id, id));
  }

  async updateWithdrawRequestStatus(id: string, status: string): Promise<void> {
    await db.update(withdrawRequests).set({ status }).where(eq(withdrawRequests.id, id));
  }

  async createNotification(data: any): Promise<any> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUserTransactions(userId: string): Promise<any[]> {
    return db
      .select()
      .from(transactions)
      .where(
        or(
          eq(transactions.senderId, userId),
          eq(transactions.recipientId, userId)
        )
      )
      .orderBy(desc(transactions.createdAt));
  }

  async updateUserField(userId: string, field: string, value: string): Promise<void> {
    await db.update(users).set({ [field]: value }).where(eq(users.id, userId));
  }

  async getApiSettings(userId: string): Promise<ApiSettings | undefined> {
    const [settings] = await db.select().from(apiSettings).where(eq(apiSettings.userId, userId));
    return settings;
  }

  async createApiSettings(data: InsertApiSettings): Promise<ApiSettings> {
    const [settings] = await db
      .insert(apiSettings)
      .values({
        id: generateId(),
        userId: data.userId,
        apiEnabled: data.apiEnabled,
        apiToken: data.apiToken,
        domain: data.domain || "https://wwallet.koyeb.app",
      })
      .returning();
    return settings;
  }

  async updateApiSettings(userId: string, data: Partial<InsertApiSettings>): Promise<ApiSettings | undefined> {
    const [settings] = await db.update(apiSettings)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(apiSettings.userId, userId))
      .returning();
    return settings;
  }

  async getApiSettingsByToken(token: string): Promise<ApiSettings | undefined> {
    const [settings] = await db.select().from(apiSettings).where(eq(apiSettings.apiToken, token));
    return settings;
  }
}

export const storage = new DbStorage();