import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio holdings
export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: varchar("symbol").notNull(),
  companyName: varchar("company_name").notNull(),
  shares: decimal("shares", { precision: 10, scale: 4 }).notNull(),
  avgCost: decimal("avg_cost", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  sector: varchar("sector"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Watchlist
export const watchlist = pgTable("watchlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: varchar("symbol").notNull(),
  companyName: varchar("company_name").notNull(),
  sector: varchar("sector"),
  addedAt: timestamp("added_at").defaultNow(),
});

// Market sentiment data
export const sentimentData = pgTable("sentiment_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(),
  sentiment: varchar("sentiment").notNull(), // 'positive', 'negative', 'neutral'
  score: real("score").notNull(), // 0-10 scale
  confidence: real("confidence").notNull(), // 0-1 scale
  newsTitle: text("news_title").notNull(),
  newsContent: text("news_content"),
  source: varchar("source"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Alpha signature calculations
export const alphaSignatures = pgTable("alpha_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(),
  alphaScore: real("alpha_score").notNull(), // Combined score 0-10
  sentimentScore: real("sentiment_score").notNull(),
  volatilityScore: real("volatility_score").notNull(),
  momentumScore: real("momentum_score").notNull(),
  signal: varchar("signal").notNull(), // 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Stock price history for charts
export const stockPrices = pgTable("stock_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  change: decimal("change", { precision: 10, scale: 2 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  volume: integer("volume"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  portfolioHoldings: many(portfolioHoldings),
  watchlist: many(watchlist),
}));

export const portfolioHoldingsRelations = relations(portfolioHoldings, ({ one }) => ({
  user: one(users, {
    fields: [portfolioHoldings.userId],
    references: [users.id],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  user: one(users, {
    fields: [watchlist.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  addedAt: true,
});

export const insertSentimentDataSchema = createInsertSchema(sentimentData).omit({
  id: true,
  timestamp: true,
});

export const insertAlphaSignatureSchema = createInsertSchema(alphaSignatures).omit({
  id: true,
  timestamp: true,
});

export const insertStockPriceSchema = createInsertSchema(stockPrices).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type InsertPortfolioHolding = z.infer<typeof insertPortfolioHoldingSchema>;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
export type SentimentData = typeof sentimentData.$inferSelect;
export type InsertSentimentData = z.infer<typeof insertSentimentDataSchema>;
export type AlphaSignature = typeof alphaSignatures.$inferSelect;
export type InsertAlphaSignature = z.infer<typeof insertAlphaSignatureSchema>;
export type StockPrice = typeof stockPrices.$inferSelect;
export type InsertStockPrice = z.infer<typeof insertStockPriceSchema>;
