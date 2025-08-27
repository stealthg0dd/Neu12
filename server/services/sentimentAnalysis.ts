import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '' 
});

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // 0-10 scale
  confidence: number; // 0-1 scale
}

class SentimentAnalysisService {
  async analyzeSentiment(text: string, symbol?: string): Promise<SentimentResult> {
    if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_KEY) {
      console.warn('No OpenAI API key provided. Using mock sentiment analysis.');
      return this.getMockSentiment(text);
    }

    try {
      const prompt = symbol 
        ? `Analyze the sentiment of this financial news about ${symbol}: "${text}"`
        : `Analyze the sentiment of this financial news: "${text}"`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a financial sentiment analysis expert. Analyze the sentiment of financial news and provide:
            1. sentiment: "positive", "negative", or "neutral"
            2. score: numerical sentiment score from 0 (very negative) to 10 (very positive), where 5 is neutral
            3. confidence: confidence level from 0 to 1
            
            Consider financial implications, market impact, and investor sentiment. 
            Respond with JSON in this exact format: { "sentiment": "positive|negative|neutral", "score": number, "confidence": number }`
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent analysis
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      // Validate and normalize the response
      const sentiment = ['positive', 'negative', 'neutral'].includes(result.sentiment) 
        ? result.sentiment 
        : 'neutral';
      
      const score = Math.max(0, Math.min(10, Number(result.score) || 5));
      const confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0.5));

      return {
        sentiment: sentiment as 'positive' | 'negative' | 'neutral',
        score,
        confidence,
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.getMockSentiment(text);
    }
  }

  async batchAnalyzeSentiment(texts: { text: string; symbol?: string }[]): Promise<SentimentResult[]> {
    // Process in parallel but with some rate limiting
    const results = await Promise.all(
      texts.map(async ({ text, symbol }, index) => {
        // Add small delay to avoid rate limiting
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.analyzeSentiment(text, symbol);
      })
    );
    return results;
  }

  private getMockSentiment(text: string): SentimentResult {
    // Simple mock sentiment based on keywords
    const positiveWords = ['beat', 'strong', 'growth', 'profit', 'increase', 'boost', 'success', 'gain'];
    const negativeWords = ['loss', 'decline', 'fall', 'drop', 'challenge', 'struggle', 'weakness', 'concern'];
    
    const lowerText = text.toLowerCase();
    const positiveMatches = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeMatches = negativeWords.filter(word => lowerText.includes(word)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    let score: number;
    
    if (positiveMatches > negativeMatches) {
      sentiment = 'positive';
      score = 6 + Math.min(positiveMatches, 4); // 6-10 range
    } else if (negativeMatches > positiveMatches) {
      sentiment = 'negative';
      score = 4 - Math.min(negativeMatches, 4); // 0-4 range
    } else {
      sentiment = 'neutral';
      score = 5;
    }
    
    return {
      sentiment,
      score,
      confidence: 0.7 + Math.random() * 0.2, // 0.7-0.9 range
    };
  }
}

export const sentimentAnalysis = new SentimentAnalysisService();
