import OpenAI from "openai";
import type { PortfolioHolding, WatchlistItem } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ChatAnalysisInput {
  message: string;
  portfolio?: PortfolioHolding[];
  watchlist?: WatchlistItem[];
  userId: string;
}

interface ChatAnalysisResponse {
  response: string;
  analysis: {
    portfolioInsights?: string;
    marketContext?: string;
    recommendations?: string[];
  };
}

export async function analyzeChatMessage(input: ChatAnalysisInput): Promise<ChatAnalysisResponse> {
  const { message, portfolio = [], watchlist = [], userId } = input;

  // Prepare context data
  const portfolioContext = portfolio.length > 0 
    ? `Portfolio Holdings: ${portfolio.map(h => `${h.symbol} (${h.shares} shares, avg cost: $${h.avgCost})`).join(', ')}`
    : "No portfolio holdings";

  const watchlistContext = watchlist.length > 0
    ? `Watchlist: ${watchlist.map(w => `${w.symbol} (${w.assetType})`).join(', ')}`
    : "No watchlist items";

  const totalPortfolioValue = portfolio.reduce((sum, h) => sum + (parseFloat(h.shares) * parseFloat(h.avgCost)), 0);
  
  const systemPrompt = `You are an expert AI financial advisor for Neufin, a retail investor platform. You provide personalized investment insights based on user's portfolio data and market intelligence.

Current User Context:
${portfolioContext}
${watchlistContext}
Total Portfolio Value: $${totalPortfolioValue.toFixed(2)}

Your role is to:
1. Analyze the user's portfolio composition and performance
2. Provide market insights and sentiment analysis
3. Suggest optimization strategies and risk management
4. Answer investment-related questions with data-driven insights
5. Offer personalized recommendations based on their current holdings

Respond in a professional, helpful tone. Provide specific, actionable advice when possible. If asked about specific stocks, reference current market trends and sentiment data.

Respond with JSON in this exact format:
{
  "response": "Your main response to the user's question",
  "analysis": {
    "portfolioInsights": "Brief insights about their portfolio (if relevant)",
    "marketContext": "Current market context relevant to their question",
    "recommendations": ["Specific actionable recommendation 1", "Specific actionable recommendation 2"]
  }
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      response: result.response || "I apologize, but I'm having trouble processing your request right now. Please try again.",
      analysis: {
        portfolioInsights: result.analysis?.portfolioInsights,
        marketContext: result.analysis?.marketContext,
        recommendations: result.analysis?.recommendations || [],
      }
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback response when OpenAI is unavailable
    return {
      response: "I'm currently experiencing technical difficulties with my AI analysis. However, I can see you have " + 
               (portfolio.length > 0 ? `${portfolio.length} holdings in your portfolio` : "no current holdings") + 
               ". Please try your question again in a moment, or feel free to explore your portfolio data manually.",
      analysis: {
        portfolioInsights: portfolio.length > 0 ? `You have ${portfolio.length} different holdings with a total value of $${totalPortfolioValue.toFixed(2)}` : undefined,
        marketContext: "AI analysis temporarily unavailable",
        recommendations: ["Check back in a few minutes for full AI analysis", "Review your portfolio holdings manually in the meantime"],
      }
    };
  }
}

export async function validateChatInput(data: any): Promise<ChatAnalysisInput> {
  if (!data.message || typeof data.message !== 'string') {
    throw new Error('Message is required and must be a string');
  }

  if (!data.userId || typeof data.userId !== 'string') {
    throw new Error('User ID is required');
  }

  return {
    message: data.message.trim(),
    portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
    watchlist: Array.isArray(data.watchlist) ? data.watchlist : [],
    userId: data.userId,
  };
}