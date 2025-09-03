import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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

export function MarketTrendWidget() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: analysis, isLoading, error } = useQuery<MarketTrendAnalysis>({
    queryKey: ["/api/analysis/market-trend"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/analysis/market-trend/refresh", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/market-trend"] });
      setIsRefreshing(false);
    },
    onError: () => {
      setIsRefreshing(false);
    },
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Unable to load market analysis</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "bearish":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "bearish":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 dark:text-green-400";
      case "high":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-yellow-600 dark:text-yellow-400";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Trend Analysis
          </CardTitle>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            data-testid="button-refresh-analysis"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Sentiment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSentimentIcon(analysis.overallSentiment)}
            <span className="font-medium">Market Sentiment</span>
          </div>
          <Badge className={getSentimentColor(analysis.overallSentiment)}>
            {analysis.overallSentiment.toUpperCase()}
          </Badge>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Confidence</span>
          <span className="font-medium">{(analysis.confidence * 100).toFixed(0)}%</span>
        </div>

        {/* Main Recommendation */}
        <div className="bg-muted/50 rounded-lg p-3">
          <h4 className="font-medium mb-2">Recommendation</h4>
          <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
        </div>

        {/* Portfolio Overview */}
        <div className="space-y-2">
          <h4 className="font-medium">Portfolio Analysis</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total Value:</span>
              <p className="font-medium">${analysis.portfolioAnalysis.totalValue.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Risk Level:</span>
              <p className={cn("font-medium capitalize", getRiskColor(analysis.portfolioAnalysis.riskLevel))}>
                {analysis.portfolioAnalysis.riskLevel}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Top Performer:</span>
              <p className="font-medium">{analysis.portfolioAnalysis.topPerformer}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Diversification:</span>
              <p className="font-medium">{analysis.portfolioAnalysis.diversificationScore}/10</p>
            </div>
          </div>
        </div>

        {/* Market Context */}
        <div className="space-y-2">
          <h4 className="font-medium">Market Context</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trend:</span>
              <span className={cn("capitalize", 
                analysis.marketContext.marketTrend === "up" ? "text-green-600" : 
                analysis.marketContext.marketTrend === "down" ? "text-red-600" : "text-yellow-600"
              )}>
                {analysis.marketContext.marketTrend}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volatility:</span>
              <span className="capitalize">{analysis.marketContext.volatilityLevel}</span>
            </div>
          </div>
        </div>

        {/* Key Factors */}
        {analysis.marketContext.keyFactors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Key Factors</h4>
            <ul className="text-sm space-y-1">
              {analysis.marketContext.keyFactors.slice(0, 3).map((factor, index) => (
                <li key={index} className="text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {analysis.actionItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Action Items</h4>
            <ul className="text-sm space-y-1">
              {analysis.actionItems.slice(0, 2).map((item, index) => (
                <li key={index} className="text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Last updated: {new Date(analysis.lastUpdated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}