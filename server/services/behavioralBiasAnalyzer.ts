import OpenAI from "openai";
import type { PortfolioHolding } from "@shared/schema";
import type { BiasAnalysisResultType, BiasDetectionType, UserTransactionType, BehavioralProfileType } from "@shared/behavioral-bias-schema";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export class BehavioralBiasAnalyzer {
  
  /**
   * Analyze user's trading behavior for cognitive biases
   */
  async analyzeBehavioralBiases(userId: string): Promise<BiasAnalysisResultType> {
    try {
      // Get user data
      const portfolio = await storage.getPortfolioByUserId(userId);
      const transactions = await this.getUserTransactions(userId);
      const sentimentHistory = await this.getUserSentimentHistory(userId);
      
      // Calculate behavioral metrics
      const behavioralProfile = await this.calculateBehavioralProfile(userId, portfolio, transactions);
      
      // Detect specific biases using rule-based analysis
      const detectedBiases = await this.detectBiases(portfolio, transactions, sentimentHistory, behavioralProfile);
      
      // Use AI to enhance analysis and provide insights
      const aiAnalysis = await this.getAIBiasAnalysis(portfolio, transactions, detectedBiases, behavioralProfile);
      
      const overallBiasScore = this.calculateOverallBiasScore(detectedBiases);
      
      return {
        overallBiasScore,
        detectedBiases,
        behavioralProfile,
        recommendations: aiAnalysis.recommendations,
        riskAssessment: aiAnalysis.riskAssessment,
        improvementAreas: aiAnalysis.improvementAreas,
      };
      
    } catch (error) {
      console.error("Behavioral bias analysis error:", error);
      return this.getFallbackAnalysis(userId);
    }
  }

  /**
   * Rule-based bias detection algorithms
   */
  private async detectBiases(
    portfolio: PortfolioHolding[], 
    transactions: UserTransactionType[], 
    sentimentHistory: any[],
    profile: BehavioralProfileType
  ): Promise<BiasDetectionType[]> {
    const biases: BiasDetectionType[] = [];
    
    // Loss Aversion Detection
    const lossAversionBias = this.detectLossAversion(transactions);
    if (lossAversionBias) biases.push(lossAversionBias);
    
    // Overconfidence Detection
    const overconfidenceBias = this.detectOverconfidence(transactions, profile);
    if (overconfidenceBias) biases.push(overconfidenceBias);
    
    // Anchoring Detection
    const anchoringBias = this.detectAnchoring(transactions);
    if (anchoringBias) biases.push(anchoringBias);
    
    // Herding Detection
    const herdingBias = this.detectHerding(transactions, sentimentHistory);
    if (herdingBias) biases.push(herdingBias);
    
    // Confirmation Bias Detection
    const confirmationBias = this.detectConfirmationBias(transactions, sentimentHistory);
    if (confirmationBias) biases.push(confirmationBias);
    
    return biases;
  }

  /**
   * Detect Loss Aversion: Selling winners too early, holding losers too long
   */
  private detectLossAversion(transactions: UserTransactionType[]): BiasDetectionType | null {
    const sellTransactions = transactions.filter(t => t.type === "sell");
    const buyTransactions = transactions.filter(t => t.type === "buy");
    
    let quickSellWinners = 0;
    let heldLosers = 0;
    let totalTrades = 0;
    
    // Analyze sell patterns
    for (const sell of sellTransactions) {
      const correspondingBuy = buyTransactions
        .filter(b => b.symbol === sell.symbol && new Date(b.timestamp) < new Date(sell.timestamp))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (correspondingBuy) {
        totalTrades++;
        const gainLoss = ((sell.price - correspondingBuy.price) / correspondingBuy.price) * 100;
        const holdDays = (new Date(sell.timestamp).getTime() - new Date(correspondingBuy.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        
        // Quick sell of winners (< 30 days, > 5% gain)
        if (gainLoss > 5 && holdDays < 30) {
          quickSellWinners++;
        }
        
        // Holding losers long (> 90 days, < -10% loss)
        if (gainLoss < -10 && holdDays > 90) {
          heldLosers++;
        }
      }
    }
    
    if (totalTrades < 3) return null;
    
    const lossAversionScore = ((quickSellWinners + heldLosers) / totalTrades) * 10;
    
    if (lossAversionScore > 3) {
      return {
        biasType: "loss_aversion",
        severity: lossAversionScore > 7 ? "high" : lossAversionScore > 5 ? "medium" : "low",
        confidence: Math.min(0.9, lossAversionScore / 10),
        description: "Tendency to sell winning positions too quickly while holding losing positions too long",
        evidence: [
          `${quickSellWinners} instances of selling winners quickly`,
          `${heldLosers} instances of holding losers too long`,
          `Pattern detected across ${totalTrades} trades`
        ],
        recommendation: "Consider setting predetermined price targets and stop-losses to avoid emotional decision-making",
        detectedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  /**
   * Detect Overconfidence: High-risk trades, low diversification, frequent trading
   */
  private detectOverconfidence(transactions: UserTransactionType[], profile: BehavioralProfileType): BiasDetectionType | null {
    const recentTransactions = transactions
      .filter(t => new Date(t.timestamp) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .length;
    
    const tradingFrequency = recentTransactions / 90; // trades per day
    const diversificationScore = profile.diversificationScore;
    
    // High frequency + low diversification = overconfidence
    const overconfidenceScore = (tradingFrequency * 2) + ((10 - diversificationScore) / 2);
    
    if (overconfidenceScore > 4) {
      return {
        biasType: "overconfidence",
        severity: overconfidenceScore > 8 ? "high" : overconfidenceScore > 6 ? "medium" : "low",
        confidence: Math.min(0.85, overconfidenceScore / 10),
        description: "Excessive trading frequency combined with poor diversification suggests overconfidence",
        evidence: [
          `${recentTransactions} trades in last 90 days`,
          `Diversification score: ${diversificationScore}/10`,
          `High trading frequency: ${tradingFrequency.toFixed(2)} trades/day`
        ],
        recommendation: "Reduce trading frequency and improve portfolio diversification. Consider index funds for core holdings",
        detectedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  /**
   * Detect Anchoring: Trading around specific price levels repeatedly
   */
  private detectAnchoring(transactions: UserTransactionType[]): BiasDetectionType | null {
    const symbolTransactions = new Map<string, UserTransactionType[]>();
    
    // Group transactions by symbol
    transactions.forEach(t => {
      if (!symbolTransactions.has(t.symbol)) {
        symbolTransactions.set(t.symbol, []);
      }
      symbolTransactions.get(t.symbol)!.push(t);
    });
    
    let anchoringInstances = 0;
    let totalSymbols = 0;
    
    // Analyze each symbol for anchoring patterns
    symbolTransactions.forEach((symbolTxns, symbol) => {
      if (symbolTxns.length < 3) return;
      
      totalSymbols++;
      const prices = symbolTxns.map(t => t.price).sort((a, b) => a - b);
      const priceRange = prices[prices.length - 1] - prices[0];
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      
      // Check if most trades cluster around a specific price (anchoring)
      const clusteredTrades = symbolTxns.filter(t => 
        Math.abs(t.price - avgPrice) / avgPrice < 0.05 // within 5% of average
      ).length;
      
      if (clusteredTrades / symbolTxns.length > 0.7) {
        anchoringInstances++;
      }
    });
    
    if (totalSymbols === 0) return null;
    
    const anchoringScore = (anchoringInstances / totalSymbols) * 10;
    
    if (anchoringScore > 3) {
      return {
        biasType: "anchoring",
        severity: anchoringScore > 7 ? "high" : anchoringScore > 5 ? "medium" : "low",
        confidence: Math.min(0.8, anchoringScore / 10),
        description: "Trading decisions appear anchored to specific price levels rather than fundamentals",
        evidence: [
          `${anchoringInstances} of ${totalSymbols} symbols show price anchoring`,
          "Transactions clustered around historical price points",
          "Limited price range exploration in trading decisions"
        ],
        recommendation: "Focus on fundamental analysis rather than historical price levels. Use technical indicators beyond simple price anchors",
        detectedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  /**
   * Detect Herding: Following popular sentiment spikes
   */
  private detectHerding(transactions: UserTransactionType[], sentimentHistory: any[]): BiasDetectionType | null {
    if (sentimentHistory.length < 10) return null;
    
    let herdingInstances = 0;
    
    // Check if buys coincide with positive sentiment spikes
    for (const transaction of transactions.filter(t => t.type === "buy")) {
      const sentimentNearTrade = sentimentHistory.find(s => 
        s.symbol === transaction.symbol &&
        Math.abs(new Date(s.timestamp).getTime() - new Date(transaction.timestamp).getTime()) < 24 * 60 * 60 * 1000 // within 24 hours
      );
      
      if (sentimentNearTrade && sentimentNearTrade.sentiment === "positive" && sentimentNearTrade.score > 7) {
        herdingInstances++;
      }
    }
    
    const buyTransactions = transactions.filter(t => t.type === "buy").length;
    if (buyTransactions === 0) return null;
    
    const herdingScore = (herdingInstances / buyTransactions) * 10;
    
    if (herdingScore > 4) {
      return {
        biasType: "herding",
        severity: herdingScore > 8 ? "high" : herdingScore > 6 ? "medium" : "low",
        confidence: Math.min(0.75, herdingScore / 10),
        description: "Tendency to follow market sentiment and popular trends rather than independent analysis",
        evidence: [
          `${herdingInstances} of ${buyTransactions} purchases followed positive sentiment spikes`,
          "Trading decisions correlate with market sentiment trends",
          "Limited evidence of contrarian or independent decision-making"
        ],
        recommendation: "Develop independent investment thesis. Consider contrarian strategies and avoid FOMO-driven decisions",
        detectedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  /**
   * Detect Confirmation Bias: Only following sentiment that matches existing positions
   */
  private detectConfirmationBias(transactions: UserTransactionType[], sentimentHistory: any[]): BiasDetectionType | null {
    // This would require more complex analysis of information consumption patterns
    // For now, return null as this requires additional data sources
    return null;
  }

  /**
   * Get AI-enhanced analysis and recommendations
   */
  private async getAIBiasAnalysis(
    portfolio: PortfolioHolding[], 
    transactions: UserTransactionType[], 
    detectedBiases: BiasDetectionType[],
    profile: BehavioralProfileType
  ): Promise<{
    recommendations: string[];
    riskAssessment: { level: "low" | "medium" | "high"; factors: string[] };
    improvementAreas: string[];
  }> {
    try {
      const systemPrompt = `You are a behavioral finance expert analyzing trading patterns for cognitive biases. Based on the detected biases and trading data, provide insights and recommendations.

Portfolio: ${portfolio.length} holdings
Recent Transactions: ${transactions.length}
Detected Biases: ${detectedBiases.map(b => `${b.biasType} (${b.severity})`).join(', ')}
Risk Tolerance: ${profile.riskTolerance}
Trading Frequency: ${profile.tradingFrequency}

Provide analysis in JSON format:
{
  "recommendations": ["Specific actionable recommendation 1", "Recommendation 2", "Recommendation 3"],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["Risk factor 1", "Risk factor 2"]
  },
  "improvementAreas": ["Area 1", "Area 2", "Area 3"]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze this behavioral profile and provide recommendations." }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 600,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        recommendations: result.recommendations || ["Review trading patterns regularly", "Consider systematic investment approach"],
        riskAssessment: {
          level: result.riskAssessment?.level || "medium",
          factors: result.riskAssessment?.factors || ["Multiple biases detected"]
        },
        improvementAreas: result.improvementAreas || ["Emotional discipline", "Systematic analysis"]
      };

    } catch (error) {
      console.error("AI bias analysis error:", error);
      return {
        recommendations: ["Develop systematic investment approach", "Set clear entry/exit rules", "Practice emotional discipline"],
        riskAssessment: {
          level: detectedBiases.length > 2 ? "high" : detectedBiases.length > 0 ? "medium" : "low",
          factors: detectedBiases.map(b => `${b.biasType} detected`)
        },
        improvementAreas: ["Systematic decision-making", "Bias awareness", "Portfolio diversification"]
      };
    }
  }

  /**
   * Calculate behavioral profile metrics
   */
  private async calculateBehavioralProfile(
    userId: string,
    portfolio: PortfolioHolding[],
    transactions: UserTransactionType[]
  ): Promise<BehavioralProfileType> {
    
    // Calculate diversification score
    const uniqueSectors = new Set(portfolio.map(h => h.sector).filter(Boolean)).size;
    const uniqueAssetTypes = new Set(portfolio.map(h => h.assetType)).size;
    const diversificationScore = Math.min(10, (uniqueSectors * 2) + (uniqueAssetTypes * 1.5));
    
    // Calculate trading frequency
    const recentTransactions = transactions.filter(t => 
      new Date(t.timestamp) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    ).length;
    const tradingFrequency = recentTransactions > 30 ? "high" : recentTransactions > 10 ? "medium" : "low";
    
    // Estimate risk tolerance from portfolio composition
    const cryptoAllocation = portfolio.filter(h => h.assetType === "crypto").length / Math.max(portfolio.length, 1);
    const riskTolerance = cryptoAllocation > 0.3 ? "aggressive" : cryptoAllocation > 0.1 ? "moderate" : "conservative";
    
    return {
      userId,
      riskTolerance: riskTolerance as "conservative" | "moderate" | "aggressive",
      tradingFrequency: tradingFrequency as "low" | "medium" | "high",
      averageHoldPeriod: 30, // Simplified calculation
      diversificationScore: Math.round(diversificationScore),
      biasScores: {
        loss_aversion: 5,
        overconfidence: 5,
        anchoring: 5,
        herding: 5,
        confirmation_bias: 5,
        recency_bias: 5,
        disposition_effect: 5
      },
      lastAnalyzed: new Date().toISOString(),
    };
  }

  /**
   * Calculate overall bias score from detected biases
   */
  private calculateOverallBiasScore(biases: BiasDetectionType[]): number {
    if (biases.length === 0) return 2; // Low baseline bias
    
    const totalScore = biases.reduce((sum, bias) => {
      const severityScore = bias.severity === "high" ? 8 : bias.severity === "medium" ? 5 : 2;
      return sum + (severityScore * bias.confidence);
    }, 0);
    
    return Math.min(10, totalScore / biases.length);
  }

  /**
   * Get user transaction history (simplified - in real app would come from database)
   */
  private async getUserTransactions(userId: string): Promise<UserTransactionType[]> {
    // In a real implementation, this would fetch from a transactions table
    // For now, generate sample transactions based on portfolio
    const portfolio = await storage.getPortfolioByUserId(userId);
    
    return portfolio.map((holding, index) => ({
      id: `txn-${index}`,
      userId,
      symbol: holding.symbol,
      type: "buy" as const,
      quantity: parseFloat(holding.shares),
      price: parseFloat(holding.avgCost),
      timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: "neutral" as const,
    }));
  }

  /**
   * Get user sentiment history
   */
  private async getUserSentimentHistory(userId: string): Promise<any[]> {
    // In a real implementation, this would fetch user's sentiment interaction history
    // For now, return empty array
    return [];
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  private async getFallbackAnalysis(userId: string): Promise<BiasAnalysisResultType> {
    const portfolio = await storage.getPortfolioByUserId(userId);
    
    return {
      overallBiasScore: 5,
      detectedBiases: [],
      behavioralProfile: {
        userId,
        riskTolerance: "moderate",
        tradingFrequency: "medium",
        averageHoldPeriod: 30,
        diversificationScore: Math.min(10, portfolio.length * 2),
        biasScores: {
          loss_aversion: 5,
          overconfidence: 5,
          anchoring: 5,
          herding: 5,
          confirmation_bias: 5,
          recency_bias: 5,
          disposition_effect: 5
        },
        lastAnalyzed: new Date().toISOString(),
      },
      recommendations: [
        "Behavioral analysis temporarily unavailable",
        "Review trading patterns manually",
        "Consider systematic investment approach"
      ],
      riskAssessment: {
        level: "medium",
        factors: ["Analysis pending"]
      },
      improvementAreas: [
        "Check back for updated analysis",
        "Practice emotional discipline",
        "Maintain portfolio diversification"
      ]
    };
  }
}

export const behavioralBiasAnalyzer = new BehavioralBiasAnalyzer();