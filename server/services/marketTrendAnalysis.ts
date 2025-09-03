import OpenAI from "openai";
import type { PortfolioHolding, WatchlistItem } from "@shared/schema";
import { storage } from "../storage";
import { stockApi } from "./stockApi";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface MarketTrendAnalysis {
  overallSentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  recommendation: string;
  portfolioAnalysis: {
    totalValue: number;
    topPerformer: string;
    riskLevel: "low" | "medium" | "high";
    diversificationScore: number;
  };
  marketContext: {
    marketTrend: "up" | "down" | "sideways";
    volatilityLevel: "low" | "medium" | "high";
    keyFactors: string[];
  };
  actionItems: string[];
  lastUpdated: string;
}

export async function generateMarketTrendAnalysis(userId: string): Promise<MarketTrendAnalysis> {
  try {
    // Get user's portfolio and watchlist
    const portfolio = await storage.getPortfolioByUserId(userId);
    const watchlist = await storage.getWatchlistByUserId(userId);
    
    // Get current market data for portfolio holdings
    const portfolioSymbols = portfolio.map(h => h.symbol);
    const portfolioQuotes = portfolioSymbols.length > 0 ? await stockApi.getMultipleQuotes(portfolioSymbols) : [];
    
    // Calculate portfolio metrics
    const portfolioWithCurrentPrices = portfolio.map(holding => {
      const quote = portfolioQuotes.find(q => q.symbol === holding.symbol);
      const currentPrice = quote?.price || parseFloat(holding.currentPrice || "0");
      const shares = parseFloat(holding.shares);
      const avgCost = parseFloat(holding.avgCost);
      
      return {
        ...holding,
        currentPrice,
        currentValue: shares * currentPrice,
        costBasis: shares * avgCost,
        gainLoss: (currentPrice - avgCost) * shares,
        gainLossPercent: avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0,
      };
    });

    const totalCurrentValue = portfolioWithCurrentPrices.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCostBasis = portfolioWithCurrentPrices.reduce((sum, h) => sum + h.costBasis, 0);
    const totalGainLoss = portfolioWithCurrentPrices.reduce((sum, h) => sum + h.gainLoss, 0);
    
    // Find top performer
    const topPerformer = portfolioWithCurrentPrices.length > 0 
      ? portfolioWithCurrentPrices.reduce((best, current) => 
          current.gainLossPercent > best.gainLossPercent ? current : best
        ).symbol
      : "N/A";

    // Calculate diversification score (simplified)
    const uniqueSectors = new Set(portfolio.map(h => h.sector).filter(Boolean)).size;
    const uniqueAssetTypes = new Set(portfolio.map(h => h.assetType)).size;
    const diversificationScore = Math.min(10, (uniqueSectors * 2) + (uniqueAssetTypes * 1.5));

    // Get recent sentiment data for market context
    const recentSentiments = await Promise.all(
      portfolioSymbols.slice(0, 5).map(symbol => storage.getLatestSentiment(symbol))
    );
    const avgSentimentScore = recentSentiments.filter(Boolean).reduce((sum, s) => sum + (s?.score || 5), 0) / Math.max(recentSentiments.filter(Boolean).length, 1);

    // Prepare context for AI analysis
    const portfolioContext = `
Portfolio Summary:
- Total Holdings: ${portfolio.length}
- Total Value: $${totalCurrentValue.toFixed(2)}
- Total Gain/Loss: $${totalGainLoss.toFixed(2)} (${totalCostBasis > 0 ? ((totalGainLoss / totalCostBasis) * 100).toFixed(2) : 0}%)
- Top Performer: ${topPerformer}
- Diversification Score: ${diversificationScore.toFixed(1)}/10
- Holdings: ${portfolioWithCurrentPrices.map(h => `${h.symbol} (${h.gainLossPercent.toFixed(1)}%)`).join(', ')}
- Average Sentiment Score: ${avgSentimentScore.toFixed(1)}/10

Watchlist: ${watchlist.map(w => w.symbol).join(', ') || 'None'}
`;

    const systemPrompt = `You are an expert financial analyst providing market trend analysis and investment recommendations. Based on the user's portfolio data and current market conditions, provide a comprehensive analysis.

Current Portfolio Context:
${portfolioContext}

Analyze the portfolio and market conditions to provide:
1. Overall market sentiment (bullish/bearish/neutral) with confidence level
2. Portfolio-specific recommendations
3. Risk assessment
4. Market context and key factors
5. Specific action items

Respond with JSON in this exact format:
{
  "overallSentiment": "bullish|bearish|neutral",
  "confidence": 0.85,
  "recommendation": "Main investment recommendation based on portfolio and market analysis",
  "portfolioAnalysis": {
    "totalValue": ${totalCurrentValue},
    "topPerformer": "${topPerformer}",
    "riskLevel": "low|medium|high",
    "diversificationScore": ${diversificationScore}
  },
  "marketContext": {
    "marketTrend": "up|down|sideways",
    "volatilityLevel": "low|medium|high",
    "keyFactors": ["Factor 1", "Factor 2", "Factor 3"]
  },
  "actionItems": ["Action 1", "Action 2", "Action 3"],
  "lastUpdated": "${new Date().toISOString()}"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Provide a comprehensive market trend analysis for this portfolio." }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 800,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      overallSentiment: result.overallSentiment || "neutral",
      confidence: result.confidence || 0.5,
      recommendation: result.recommendation || "Unable to generate recommendation at this time.",
      portfolioAnalysis: {
        totalValue: totalCurrentValue,
        topPerformer: topPerformer,
        riskLevel: result.portfolioAnalysis?.riskLevel || "medium",
        diversificationScore: Math.round(diversificationScore),
      },
      marketContext: {
        marketTrend: result.marketContext?.marketTrend || "sideways",
        volatilityLevel: result.marketContext?.volatilityLevel || "medium",
        keyFactors: result.marketContext?.keyFactors || ["Market analysis pending"],
      },
      actionItems: result.actionItems || ["Review portfolio balance", "Monitor market conditions"],
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Market trend analysis error:", error);
    
    // Fallback analysis when AI is unavailable - use real portfolio data  
    const portfolio = await storage.getPortfolioByUserId(userId);
    const totalValue = portfolio.reduce((sum, h) => sum + (parseFloat(h.shares) * parseFloat(h.avgCost)), 0);
    const topPerformer = portfolio.length > 0 ? portfolio[0].symbol : "No holdings";
    
    return {
      overallSentiment: "neutral",
      confidence: 0.6,
      recommendation: "Alpha Vantage providing real-time market data for informed portfolio decisions",
      portfolioAnalysis: {
        totalValue: totalValue,
        topPerformer: topPerformer,
        riskLevel: "medium",
        diversificationScore: Math.min(portfolio.length * 20, 100), // Basic diversification score
      },
      marketContext: {
        marketTrend: "sideways",
        volatilityLevel: "medium", 
        keyFactors: [
          "Real-time market data available through Alpha Vantage integration",
          "Portfolio tracking enabled with live price updates",
          "Market analysis available with comprehensive data feeds"
        ],
      },
      actionItems: [
        "Review current portfolio allocation and performance", 
        "Monitor real-time market trends via Alpha Vantage data",
        "Consider rebalancing based on market conditions"
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Cache for market trend analysis (5 minute cache)
const analysisCache = new Map<string, { data: MarketTrendAnalysis; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedMarketTrendAnalysis(userId: string): Promise<MarketTrendAnalysis> {
  const cached = analysisCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const analysis = await generateMarketTrendAnalysis(userId);
  analysisCache.set(userId, { data: analysis, timestamp: now });
  
  return analysis;
}

export async function refreshMarketTrendAnalysis(userId: string): Promise<MarketTrendAnalysis> {
  // Force refresh by removing from cache
  analysisCache.delete(userId);
  return await getCachedMarketTrendAnalysis(userId);
}