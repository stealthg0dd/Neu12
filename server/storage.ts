import {
  users,
  portfolioHoldings,
  watchlist,
  sentimentData,
  alphaSignatures,
  stockPrices,
  type User,
  type InsertUser,
  type PortfolioHolding,
  type InsertPortfolioHolding,
  type WatchlistItem,
  type InsertWatchlistItem,
  type SentimentData,
  type InsertSentimentData,
  type AlphaSignature,
  type InsertAlphaSignature,
  type StockPrice,
  type InsertStockPrice,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Portfolio operations
  getPortfolioByUserId(userId: string): Promise<PortfolioHolding[]>;
  addToPortfolio(holding: InsertPortfolioHolding): Promise<PortfolioHolding>;
  updatePortfolioHolding(id: string, updates: Partial<InsertPortfolioHolding>): Promise<PortfolioHolding>;
  removeFromPortfolio(id: string): Promise<void>;

  // Watchlist operations
  getWatchlistByUserId(userId: string): Promise<WatchlistItem[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(id: string): Promise<void>;

  // Sentiment operations
  getSentimentBySymbol(symbol: string): Promise<SentimentData[]>;
  addSentimentData(data: InsertSentimentData): Promise<SentimentData>;
  getLatestSentiment(symbol: string): Promise<SentimentData | undefined>;

  // Alpha signature operations
  getAlphaSignatureBySymbol(symbol: string): Promise<AlphaSignature | undefined>;
  addAlphaSignature(signature: InsertAlphaSignature): Promise<AlphaSignature>;
  getTopAlphaSignatures(limit?: number): Promise<AlphaSignature[]>;

  // Stock price operations
  getStockPriceHistory(symbol: string, limit?: number): Promise<StockPrice[]>;
  addStockPrice(price: InsertStockPrice): Promise<StockPrice>;
  getLatestStockPrice(symbol: string): Promise<StockPrice | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Portfolio operations
  async getPortfolioByUserId(userId: string): Promise<PortfolioHolding[]> {
    return await db
      .select()
      .from(portfolioHoldings)
      .where(eq(portfolioHoldings.userId, userId));
  }

  async addToPortfolio(holding: InsertPortfolioHolding): Promise<PortfolioHolding> {
    const [newHolding] = await db
      .insert(portfolioHoldings)
      .values(holding)
      .returning();
    return newHolding;
  }

  async updatePortfolioHolding(id: string, updates: Partial<InsertPortfolioHolding>): Promise<PortfolioHolding> {
    const [updatedHolding] = await db
      .update(portfolioHoldings)
      .set(updates)
      .where(eq(portfolioHoldings.id, id))
      .returning();
    return updatedHolding;
  }

  async removeFromPortfolio(id: string): Promise<void> {
    await db
      .delete(portfolioHoldings)
      .where(eq(portfolioHoldings.id, id));
  }

  // Watchlist operations
  async getWatchlistByUserId(userId: string): Promise<WatchlistItem[]> {
    return await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId));
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const [newItem] = await db
      .insert(watchlist)
      .values(item)
      .returning();
    return newItem;
  }

  async removeFromWatchlist(id: string): Promise<void> {
    await db
      .delete(watchlist)
      .where(eq(watchlist.id, id));
  }

  // Sentiment operations
  async getSentimentBySymbol(symbol: string): Promise<SentimentData[]> {
    return await db
      .select()
      .from(sentimentData)
      .where(eq(sentimentData.symbol, symbol))
      .orderBy(desc(sentimentData.timestamp));
  }

  async addSentimentData(data: InsertSentimentData): Promise<SentimentData> {
    const [newData] = await db
      .insert(sentimentData)
      .values(data)
      .returning();
    return newData;
  }

  async getLatestSentiment(symbol: string): Promise<SentimentData | undefined> {
    const [sentiment] = await db
      .select()
      .from(sentimentData)
      .where(eq(sentimentData.symbol, symbol))
      .orderBy(desc(sentimentData.timestamp))
      .limit(1);
    return sentiment;
  }

  // Alpha signature operations
  async getAlphaSignatureBySymbol(symbol: string): Promise<AlphaSignature | undefined> {
    const [signature] = await db
      .select()
      .from(alphaSignatures)
      .where(eq(alphaSignatures.symbol, symbol))
      .orderBy(desc(alphaSignatures.timestamp))
      .limit(1);
    return signature;
  }

  async addAlphaSignature(signature: InsertAlphaSignature): Promise<AlphaSignature> {
    const [newSignature] = await db
      .insert(alphaSignatures)
      .values(signature)
      .returning();
    return newSignature;
  }

  async getTopAlphaSignatures(limit: number = 10): Promise<AlphaSignature[]> {
    return await db
      .select()
      .from(alphaSignatures)
      .orderBy(desc(alphaSignatures.alphaScore))
      .limit(limit);
  }

  // Stock price operations
  async getStockPriceHistory(symbol: string, limit: number = 100): Promise<StockPrice[]> {
    return await db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.symbol, symbol))
      .orderBy(desc(stockPrices.timestamp))
      .limit(limit);
  }

  async addStockPrice(price: InsertStockPrice): Promise<StockPrice> {
    const [newPrice] = await db
      .insert(stockPrices)
      .values(price)
      .returning();
    return newPrice;
  }

  async getLatestStockPrice(symbol: string): Promise<StockPrice | undefined> {
    const [price] = await db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.symbol, symbol))
      .orderBy(desc(stockPrices.timestamp))
      .limit(1);
    return price;
  }
}

export const storage = new DatabaseStorage();
