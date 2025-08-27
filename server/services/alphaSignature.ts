import { storage } from '../storage';
import { stockApi } from './stockApi';
import { sentimentAnalysis } from './sentimentAnalysis';

interface AlphaMetrics {
  sentimentScore: number;
  volatilityScore: number;
  momentumScore: number;
  alphaScore: number;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

class AlphaSignatureService {
  async calculateAlphaSignature(symbol: string): Promise<AlphaMetrics> {
    try {
      // Get sentiment score
      const latestSentiment = await storage.getLatestSentiment(symbol);
      const sentimentScore = latestSentiment?.score || 5; // Default to neutral

      // Get price history for volatility and momentum
      const priceHistory = await storage.getStockPriceHistory(symbol, 20);
      
      // Calculate volatility score (lower volatility = higher score)
      const volatilityScore = this.calculateVolatilityScore(priceHistory);
      
      // Calculate momentum score
      const momentumScore = this.calculateMomentumScore(priceHistory);
      
      // Calculate combined alpha score
      const alphaScore = this.calculateAlphaScore(sentimentScore, volatilityScore, momentumScore);
      
      // Generate signal
      const signal = this.generateSignal(alphaScore);
      
      const metrics: AlphaMetrics = {
        sentimentScore,
        volatilityScore,
        momentumScore,
        alphaScore,
        signal,
      };

      // Store the alpha signature
      await storage.addAlphaSignature({
        symbol,
        alphaScore,
        sentimentScore,
        volatilityScore,
        momentumScore,
        signal,
      });

      return metrics;
    } catch (error) {
      console.error(`Error calculating alpha signature for ${symbol}:`, error);
      // Return neutral metrics on error
      return {
        sentimentScore: 5,
        volatilityScore: 5,
        momentumScore: 5,
        alphaScore: 5,
        signal: 'hold',
      };
    }
  }

  private calculateVolatilityScore(priceHistory: any[]): number {
    if (priceHistory.length < 5) {
      return 5; // Default neutral score
    }

    // Calculate returns
    const returns = [];
    for (let i = 1; i < priceHistory.length; i++) {
      const currentPrice = Number(priceHistory[i].price);
      const previousPrice = Number(priceHistory[i - 1].price);
      returns.push((currentPrice - previousPrice) / previousPrice);
    }

    // Calculate standard deviation
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);

    // Convert to 0-10 scale (lower volatility = higher score)
    // Typical daily volatility ranges from 0.01 (1%) to 0.05 (5%)
    const volatilityPercent = standardDeviation * 100;
    let score = Math.max(0, 10 - (volatilityPercent * 2));
    
    return Math.min(10, Math.max(0, score));
  }

  private calculateMomentumScore(priceHistory: any[]): number {
    if (priceHistory.length < 10) {
      return 5; // Default neutral score
    }

    // Calculate short-term momentum (last 5 days) vs medium-term (last 10 days)
    const recentPrices = priceHistory.slice(0, 5).map(p => Number(p.price));
    const olderPrices = priceHistory.slice(5, 10).map(p => Number(p.price));

    const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((sum, price) => sum + price, 0) / olderPrices.length;

    const momentumPercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Convert to 0-10 scale
    // Strong positive momentum (+5%) = 10, Strong negative momentum (-5%) = 0
    let score = 5 + (momentumPercent * 2); // Scale: 5 + (-5 to +5) * 2 = 0 to 10
    
    return Math.min(10, Math.max(0, score));
  }

  private calculateAlphaScore(sentiment: number, volatility: number, momentum: number): number {
    // Weighted combination: sentiment 40%, volatility 30%, momentum 30%
    const weightedScore = (sentiment * 0.4) + (volatility * 0.3) + (momentum * 0.3);
    return Math.round(weightedScore * 10) / 10; // Round to 1 decimal place
  }

  private generateSignal(alphaScore: number): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
    if (alphaScore >= 8.5) return 'strong_buy';
    if (alphaScore >= 7) return 'buy';
    if (alphaScore >= 4 && alphaScore <= 6) return 'hold';
    if (alphaScore >= 2.5) return 'sell';
    return 'strong_sell';
  }

  async updateAlphaSignatures(symbols: string[]): Promise<void> {
    console.log(`Updating alpha signatures for ${symbols.length} symbols...`);
    
    // Process symbols in batches to avoid overwhelming the APIs
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (symbol) => {
          try {
            await this.calculateAlphaSignature(symbol);
          } catch (error) {
            console.error(`Failed to update alpha signature for ${symbol}:`, error);
          }
        })
      );

      // Add delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('Alpha signatures update completed.');
  }
}

export const alphaSignature = new AlphaSignatureService();
