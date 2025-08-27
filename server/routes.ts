import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stockApi } from "./services/stockApi";
import { sentimentAnalysis } from "./services/sentimentAnalysis";
import { alphaSignature } from "./services/alphaSignature";
import { authenticateToken, generateToken, hashPassword, comparePassword, type AuthRequest } from "./middleware/auth";
import { insertUserSchema, insertPortfolioHoldingSchema, insertWatchlistSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      const token = generateToken(user.id);
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ message: 'Invalid input data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Invalid input data' });
    }
  });

  // Protected routes
  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Portfolio routes
  app.get('/api/portfolio', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const holdings = await storage.getPortfolioByUserId(req.user!.id);
      
      // Get current prices for all holdings
      const symbols = holdings.map(h => h.symbol);
      const quotes = await stockApi.getMultipleQuotes(symbols);
      
      // Merge holdings with current prices
      const portfolioWithPrices = holdings.map(holding => {
        const quote = quotes.find(q => q.symbol === holding.symbol);
        const currentPrice = quote?.price || Number(holding.currentPrice) || 0;
        const totalValue = Number(holding.shares) * currentPrice;
        const totalCost = Number(holding.shares) * Number(holding.avgCost);
        const gainLoss = totalValue - totalCost;
        const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

        return {
          ...holding,
          currentPrice,
          totalValue,
          totalCost,
          gainLoss,
          gainLossPercent,
          change: quote?.change || 0,
          changePercent: quote?.changePercent || 0,
        };
      });

      res.json(portfolioWithPrices);
    } catch (error) {
      console.error('Get portfolio error:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
  });

  app.post('/api/portfolio', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const holdingData = insertPortfolioHoldingSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Get company info and current price
      const quote = await stockApi.getQuote(holdingData.symbol);
      if (quote) {
        holdingData.currentPrice = quote.price.toString();
        holdingData.companyName = quote.companyName || holdingData.companyName;
        holdingData.sector = quote.sector || holdingData.sector;
        holdingData.assetType = quote.assetType;
      }

      // Fallback to company info API if quote doesn't have details
      if (!holdingData.companyName || !holdingData.sector) {
        const companyInfo = await stockApi.getCompanyInfo(holdingData.symbol);
        if (companyInfo) {
          holdingData.companyName = holdingData.companyName || companyInfo.name;
          holdingData.sector = holdingData.sector || companyInfo.sector;
        }
      }

      const holding = await storage.addToPortfolio(holdingData);
      res.json(holding);
    } catch (error) {
      console.error('Add to portfolio error:', error);
      res.status(400).json({ message: 'Invalid portfolio data' });
    }
  });

  app.delete('/api/portfolio/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.removeFromPortfolio(req.params.id);
      res.json({ message: 'Holding removed from portfolio' });
    } catch (error) {
      console.error('Remove from portfolio error:', error);
      res.status(500).json({ message: 'Failed to remove holding' });
    }
  });

  // Watchlist routes
  app.get('/api/watchlist', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const watchlist = await storage.getWatchlistByUserId(req.user!.id);
      
      // Get current prices and sentiment for all watchlist items
      const symbols = watchlist.map(w => w.symbol);
      const quotes = await stockApi.getMultipleQuotes(symbols);
      
      const watchlistWithData = await Promise.all(
        watchlist.map(async (item) => {
          const quote = quotes.find(q => q.symbol === item.symbol);
          const sentiment = await storage.getLatestSentiment(item.symbol);
          const alphaSignatureData = await storage.getAlphaSignatureBySymbol(item.symbol);

          return {
            ...item,
            currentPrice: quote?.price || 0,
            change: quote?.change || 0,
            changePercent: quote?.changePercent || 0,
            sentimentScore: sentiment?.score || 5,
            sentiment: sentiment?.sentiment || 'neutral',
            alphaScore: alphaSignatureData?.alphaScore || 5,
          };
        })
      );

      res.json(watchlistWithData);
    } catch (error) {
      console.error('Get watchlist error:', error);
      res.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  });

  app.post('/api/watchlist', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const watchlistData = insertWatchlistSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Get company info
      const companyInfo = await stockApi.getCompanyInfo(watchlistData.symbol);
      if (companyInfo) {
        watchlistData.companyName = companyInfo.name;
        watchlistData.sector = companyInfo.sector;
      }

      const item = await storage.addToWatchlist(watchlistData);
      res.json(item);
    } catch (error) {
      console.error('Add to watchlist error:', error);
      res.status(400).json({ message: 'Invalid watchlist data' });
    }
  });

  app.delete('/api/watchlist/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.removeFromWatchlist(req.params.id);
      res.json({ message: 'Item removed from watchlist' });
    } catch (error) {
      console.error('Remove from watchlist error:', error);
      res.status(500).json({ message: 'Failed to remove item' });
    }
  });

  // Market sentiment routes
  app.get('/api/market/sentiment/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const sentimentData = await storage.getSentimentBySymbol(symbol);
      res.json(sentimentData);
    } catch (error) {
      console.error('Get sentiment error:', error);
      res.status(500).json({ message: 'Failed to fetch sentiment data' });
    }
  });

  app.post('/api/market/sentiment', async (req, res) => {
    try {
      const { symbol, newsTitle, newsContent, source } = req.body;
      
      if (!newsTitle || !symbol) {
        return res.status(400).json({ message: 'Symbol and news title are required' });
      }

      // Analyze sentiment
      const sentimentResult = await sentimentAnalysis.analyzeSentiment(
        newsContent || newsTitle, 
        symbol
      );

      // Store sentiment data
      const sentimentData = await storage.addSentimentData({
        symbol,
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        confidence: sentimentResult.confidence,
        newsTitle,
        newsContent,
        source,
      });

      res.json(sentimentData);
    } catch (error) {
      console.error('Add sentiment error:', error);
      res.status(500).json({ message: 'Failed to analyze sentiment' });
    }
  });

  // Alpha signature routes
  app.get('/api/market/alpha-signature/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const signature = await storage.getAlphaSignatureBySymbol(symbol);
      
      if (!signature) {
        // Calculate if not exists
        const calculated = await alphaSignature.calculateAlphaSignature(symbol);
        return res.json(calculated);
      }

      res.json(signature);
    } catch (error) {
      console.error('Get alpha signature error:', error);
      res.status(500).json({ message: 'Failed to fetch alpha signature' });
    }
  });

  app.get('/api/market/alpha-signature', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const signatures = await storage.getTopAlphaSignatures(limit);
      res.json(signatures);
    } catch (error) {
      console.error('Get top alpha signatures error:', error);
      res.status(500).json({ message: 'Failed to fetch alpha signatures' });
    }
  });

  // Market data routes
  app.get('/api/market/quote/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const quote = await stockApi.getQuote(symbol);
      
      if (!quote) {
        return res.status(404).json({ message: 'Stock not found' });
      }

      // Store the price data
      await storage.addStockPrice({
        symbol: quote.symbol,
        price: quote.price.toString(),
        change: quote.change?.toString(),
        changePercent: quote.changePercent?.toString(),
        volume: quote.volume,
      });

      res.json(quote);
    } catch (error) {
      console.error('Get quote error:', error);
      res.status(500).json({ message: 'Failed to fetch quote' });
    }
  });

  app.get('/api/market/news', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const news = await stockApi.getMarketNews(limit);
      
      // Analyze sentiment for news articles
      const newsWithSentiment = await Promise.all(
        news.map(async (article) => {
          if (article.symbols.length > 0) {
            const sentiment = await sentimentAnalysis.analyzeSentiment(
              article.headline + ' ' + article.summary,
              article.symbols[0]
            );
            
            // Store sentiment data
            await storage.addSentimentData({
              symbol: article.symbols[0],
              sentiment: sentiment.sentiment,
              score: sentiment.score,
              confidence: sentiment.confidence,
              newsTitle: article.headline,
              newsContent: article.summary,
              source: article.source,
            });

            return {
              ...article,
              sentimentScore: sentiment.score,
              sentiment: sentiment.sentiment,
            };
          }
          return article;
        })
      );

      res.json(newsWithSentiment);
    } catch (error) {
      console.error('Get market news error:', error);
      res.status(500).json({ message: 'Failed to fetch market news' });
    }
  });

  // Search stocks
  app.get('/api/market/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Search query required' });
      }

      // This would typically search a stock database
      // For now, return some common stocks that match the query
      const commonStocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
        { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
        { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
      ];

      const query = q.toLowerCase();
      const results = commonStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(query) || 
        stock.name.toLowerCase().includes(query)
      );

      res.json(results);
    } catch (error) {
      console.error('Search stocks error:', error);
      res.status(500).json({ message: 'Failed to search stocks' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
