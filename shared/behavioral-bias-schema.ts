import { z } from "zod";

// Behavioral bias types
export const BiasType = z.enum([
  "loss_aversion",
  "overconfidence", 
  "anchoring",
  "herding",
  "confirmation_bias",
  "recency_bias",
  "disposition_effect"
]);

export const BiasDetection = z.object({
  biasType: BiasType,
  severity: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  evidence: z.array(z.string()),
  recommendation: z.string(),
  detectedAt: z.string().datetime(),
});

export const UserTransaction = z.object({
  id: z.string(),
  userId: z.string(),
  symbol: z.string(),
  type: z.enum(["buy", "sell"]),
  quantity: z.number().positive(),
  price: z.number().positive(),
  timestamp: z.string().datetime(),
  sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
  marketPrice: z.number().positive().optional(),
  reasoning: z.string().optional(),
});

export const BehavioralProfile = z.object({
  userId: z.string(),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
  tradingFrequency: z.enum(["low", "medium", "high"]),
  averageHoldPeriod: z.number(), // in days
  diversificationScore: z.number().min(0).max(10),
  biasScores: z.record(BiasType, z.number().min(0).max(10)),
  lastAnalyzed: z.string().datetime(),
});

export const BiasAnalysisResult = z.object({
  overallBiasScore: z.number().min(0).max(10),
  detectedBiases: z.array(BiasDetection),
  behavioralProfile: BehavioralProfile,
  recommendations: z.array(z.string()),
  riskAssessment: z.object({
    level: z.enum(["low", "medium", "high"]),
    factors: z.array(z.string()),
  }),
  improvementAreas: z.array(z.string()),
});

export type BiasTypeEnum = z.infer<typeof BiasType>;
export type BiasDetectionType = z.infer<typeof BiasDetection>;
export type UserTransactionType = z.infer<typeof UserTransaction>;
export type BehavioralProfileType = z.infer<typeof BehavioralProfile>;
export type BiasAnalysisResultType = z.infer<typeof BiasAnalysisResult>;