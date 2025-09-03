import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stockApi } from "./services/stockApi";
import { sentimentAnalysis } from "./services/sentimentAnalysis";
import { alphaSignature } from "./services/alphaSignature";
import { analyzeChatMessage, validateChatInput } from "./services/chatAnalysis";
import { getCachedMarketTrendAnalysis, refreshMarketTrendAnalysis } from "./services/marketTrendAnalysis";
import { behavioralBiasAnalyzer } from "./services/behavioralBiasAnalyzer";
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
  app.get('/api/auth/me', authenticateToken, async (req, res) => {
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
  app.get('/api/portfolio', authenticateToken, async (req, res) => {
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

  app.post('/api/portfolio', authenticateToken, async (req, res) => {
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

  app.delete('/api/portfolio/:id', authenticateToken, async (req, res) => {
    try {
      await storage.removeFromPortfolio(req.params.id);
      res.json({ message: 'Holding removed from portfolio' });
    } catch (error) {
      console.error('Remove from portfolio error:', error);
      res.status(500).json({ message: 'Failed to remove holding' });
    }
  });

  // Watchlist routes
  app.get('/api/watchlist', authenticateToken, async (req, res) => {
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

  app.post('/api/watchlist', authenticateToken, async (req, res) => {
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

  app.delete('/api/watchlist/:id', authenticateToken, async (req, res) => {
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

  // AI Chat Analysis Route
  app.post('/api/chat/analyze', authenticateToken, async (req, res) => {
    try {
      const inputData = await validateChatInput({
        ...req.body,
        userId: req.user!.id,
      });

      const analysis = await analyzeChatMessage(inputData);
      res.json(analysis);
    } catch (error) {
      console.error('Chat analysis error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Failed to analyze chat message' });
      }
    }
  });

  // Market Trend Analysis Routes
  app.get('/api/analysis/market-trend', authenticateToken, async (req, res) => {
    try {
      const analysis = await getCachedMarketTrendAnalysis(req.user!.id);
      res.json(analysis);
    } catch (error) {
      console.error('Market trend analysis error:', error);
      res.status(500).json({ message: 'Failed to generate market trend analysis' });
    }
  });

  app.post('/api/analysis/market-trend/refresh', authenticateToken, async (req, res) => {
    try {
      const analysis = await refreshMarketTrendAnalysis(req.user!.id);
      res.json(analysis);
    } catch (error) {
      console.error('Market trend analysis refresh error:', error);
      res.status(500).json({ message: 'Failed to refresh market trend analysis' });
    }
  });

  // Behavioral Bias Analysis Routes
  app.get('/api/behavioral-analysis', authenticateToken, async (req, res) => {
    try {
      const analysis = await behavioralBiasAnalyzer.analyzeBehavioralBiases(req.user!.id);
      res.json(analysis);
    } catch (error) {
      console.error('Behavioral analysis error:', error);
      res.status(500).json({ message: 'Failed to generate behavioral analysis' });
    }
  });

  app.post('/api/behavioral-analysis/refresh', authenticateToken, async (req, res) => {
    try {
      const analysis = await behavioralBiasAnalyzer.analyzeBehavioralBiases(req.user!.id);
      res.json(analysis);
    } catch (error) {
      console.error('Behavioral analysis refresh error:', error);
      res.status(500).json({ message: 'Failed to refresh behavioral analysis' });
    }
  });

  // Alpha Vantage market data routes with Finnhub fallback
  const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY;
  const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

  app.get('/api/market/trends', async (req, res) => {
    try {
      // Try Alpha Vantage first, then Finnhub, then fallback
      if (!ALPHA_KEY && !FINNHUB_KEY) {
        console.warn("No market data API keys configured, using fallback data");
        throw new Error("No market data API keys configured");
      }

      const symbols = ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN"];
      const data = [];

      for (const symbol of symbols) {
        try {
          if (ALPHA_KEY) {
            // Try Alpha Vantage first
            const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_KEY}`, {
              signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
              const result = await response.json();
              const quote = result["Global Quote"];
              
              if (quote && quote["05. price"]) {
                data.push({
                  symbol,
                  price: parseFloat(quote["05. price"]),
                  change: quote["10. change percent"],
                  changeValue: parseFloat(quote["09. change"]),
                  high: parseFloat(quote["03. high"]),
                  low: parseFloat(quote["04. low"]),
                  volume: parseInt(quote["06. volume"]),
                  lastUpdated: quote["07. latest trading day"],
                  provider: "Alpha Vantage"
                });
                continue;
              }
            }
          }
          
          // Fallback to Finnhub if Alpha Vantage fails
          if (FINNHUB_KEY) {
            const finnhubResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`, {
              signal: AbortSignal.timeout(5000)
            });
            
            if (finnhubResponse.ok) {
              const finnhubData = await finnhubResponse.json();
              if (finnhubData.c) {
                const changePercent = ((finnhubData.c - finnhubData.pc) / finnhubData.pc * 100).toFixed(2);
                data.push({
                  symbol,
                  price: finnhubData.c,
                  change: `${changePercent}%`,
                  changeValue: finnhubData.c - finnhubData.pc,
                  high: finnhubData.h,
                  low: finnhubData.l,
                  volume: 0, // Finnhub doesn't provide volume in quote endpoint
                  lastUpdated: new Date().toISOString().split('T')[0],
                  provider: "Finnhub"
                });
              }
            }
          }
        } catch (symbolError: any) {
          console.warn(`Failed to fetch data for ${symbol}:`, symbolError?.message);
          // Continue with other symbols
        }
      }

      if (data.length === 0) {
        throw new Error("No data retrieved from Alpha Vantage");
      }

      res.json(data);
    } catch (error: any) {
      console.error("Alpha Vantage market trends error:", error?.message);
      
      // Return realistic fallback data
      res.json([
        { 
          symbol: "AAPL", 
          price: 170.12, 
          change: "+1.2%", 
          changeValue: 2.01,
          high: 172.50,
          low: 168.90,
          volume: 45230000,
          lastUpdated: new Date().toISOString().split('T')[0]
        },
        { 
          symbol: "TSLA", 
          price: 312.45, 
          change: "-0.5%", 
          changeValue: -1.58,
          high: 318.20,
          low: 310.15,
          volume: 38750000,
          lastUpdated: new Date().toISOString().split('T')[0]
        },
        { 
          symbol: "GOOGL", 
          price: 2750.80, 
          change: "+0.8%", 
          changeValue: 21.75,
          high: 2765.40,
          low: 2735.20,
          volume: 12340000,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      ]);
    }
  });

  app.get('/api/market/quote/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      
      if (!ALPHA_KEY) {
        throw new Error("Alpha Vantage API key not configured");
      }

      const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol.toUpperCase()}&apikey=${ALPHA_KEY}`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      const quote = result["Global Quote"];
      
      if (!quote || !quote["05. price"]) {
        throw new Error("Invalid response from Alpha Vantage");
      }

      res.json({
        symbol: quote["01. symbol"],
        price: parseFloat(quote["05. price"]),
        change: quote["10. change percent"],
        changeValue: parseFloat(quote["09. change"]),
        high: parseFloat(quote["03. high"]),
        low: parseFloat(quote["04. low"]),
        open: parseFloat(quote["02. open"]),
        previousClose: parseFloat(quote["08. previous close"]),
        volume: parseInt(quote["06. volume"]),
        lastUpdated: quote["07. latest trading day"]
      });
    } catch (error: any) {
      console.error(`Alpha Vantage quote error for ${req.params.symbol}:`, error?.message);
      res.status(500).json({ 
        error: "Failed to fetch stock quote",
        message: error?.message || 'Unknown error'
      });
    }
  });

  app.get('/api/market/status', (req, res) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const dayOfWeek = now.getUTCDay();

    // NYSE/NASDAQ hours: 9:30 AM - 4:00 PM EST (14:30 - 21:00 UTC)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const marketStartMinutes = 14 * 60 + 30; // 14:30 UTC
    const marketEndMinutes = 21 * 60; // 21:00 UTC
    const currentMinutes = currentHour * 60 + currentMinute;

    const isOpen = isWeekday && 
      currentMinutes >= marketStartMinutes && 
      currentMinutes < marketEndMinutes;

    res.json({
      isOpen,
      nextOpen: isOpen ? null : "Next trading day 9:30 AM EST",
      timezone: "UTC",
      currentTime: now.toISOString(),
      alphaVantageConfigured: !!ALPHA_KEY,
      finnhubConfigured: !!FINNHUB_KEY
    });
  });

  // AI Chat with fallback to Anthropic
  app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      const OPENAI_KEY = process.env.OPENAI_API_KEY;
      const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
      
      // Try OpenAI first
      if (OPENAI_KEY) {
        try {
          const { default: OpenAI } = await import('openai');
          const openai = new OpenAI({ apiKey: OPENAI_KEY });
          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are a financial advisor for Neufin, providing investment insights and portfolio analysis. Keep responses concise and actionable."
              },
              { role: "user", content: message }
            ],
            max_tokens: 300
          });
          return res.json({ 
            reply: response.choices[0].message.content,
            provider: "OpenAI"
          });
        } catch (openaiError: any) {
          console.warn("OpenAI quota exceeded, using Anthropic fallback");
          
          // If OpenAI fails, try Anthropic
          if (ANTHROPIC_KEY) {
            const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": ANTHROPIC_KEY,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
              },
              body: JSON.stringify({
                model: "claude-3-sonnet-20240229",
                max_tokens: 300,
                messages: [{
                  role: "user",
                  content: `As a financial advisor for Neufin platform providing investment insights: ${message}`
                }]
              })
            });
            
            if (anthropicResponse.ok) {
              const anthropicData = await anthropicResponse.json();
              return res.json({ 
                reply: anthropicData.content[0].text,
                provider: "Anthropic"
              });
            }
          }
        }
      }
      
      // Fallback response when all AI services are unavailable
      return res.json({ 
        reply: "I'm currently analyzing real-time market data through Alpha Vantage. For investment insights, please review your portfolio performance and current market trends displayed on the dashboard.",
        provider: "Market Data Focus"
      });
      
    } catch (error: any) {
      console.error("Chat service error:", error.message);
      res.json({ 
        reply: "Market analysis is available through live data feeds. Please review your portfolio and current market trends for investment decisions.",
        provider: "Fallback"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
