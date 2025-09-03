import express from "express";
import OpenAI from "openai";
import axios from "axios";

const router = express.Router();
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

router.post("/", async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Try OpenAI first
    if (OPENAI_KEY) {
      try {
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
        console.warn("OpenAI failed, trying Anthropic:", openaiError.message);
        
        // If OpenAI fails due to quota, fall back to Anthropic
        if (ANTHROPIC_KEY) {
          const anthropicResponse = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-3-sonnet-20240229",
              max_tokens: 300,
              messages: [{
                role: "user",
                content: `As a financial advisor for Neufin platform, provide investment insights: ${message}`
              }]
            },
            {
              headers: {
                "x-api-key": ANTHROPIC_KEY,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
              }
            }
          );
          return res.json({ 
            reply: anthropicResponse.data.content[0].text,
            provider: "Anthropic"
          });
        }
      }
    }
    
    // If only Anthropic is available
    if (ANTHROPIC_KEY) {
      const anthropicResponse = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-3-sonnet-20240229",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `As a financial advisor for Neufin platform, provide investment insights: ${message}`
          }]
        },
        {
          headers: {
            "x-api-key": ANTHROPIC_KEY,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
          }
        }
      );
      return res.json({ 
        reply: anthropicResponse.data.content[0].text,
        provider: "Anthropic"
      });
    }
    
    // Fallback response
    return res.json({ 
      reply: "I'm currently focusing on analyzing your portfolio with real-time Alpha Vantage market data. For personalized investment advice, consider reviewing your holdings and market trends.",
      provider: "Fallback"
    });
    
  } catch (error: any) {
    console.error("All AI services failed:", error.message);
    res.json({ 
      reply: "Market analysis is available through real-time data feeds. Please review your portfolio and current market trends for investment decisions.",
      provider: "Fallback"
    });
  }
});

export default router;