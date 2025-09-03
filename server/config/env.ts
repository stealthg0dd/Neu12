import dotenv from "dotenv";
dotenv.config();

export const OPENAI_KEY = process.env.OPENAI_API_KEY;
export const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
export const ALPHA_KEY = process.env.ALPHA_VANTAGE_KEY;
export const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
export const DATABASE_URL = process.env.DATABASE_URL;
export const SERVER_PORT = process.env.PORT || 5000;

// API status check
export const getApiStatus = () => ({
  openai: !!OPENAI_KEY,
  anthropic: !!ANTHROPIC_KEY,
  alphaVantage: !!ALPHA_KEY,
  finnhub: !!FINNHUB_KEY,
  database: !!DATABASE_URL
});