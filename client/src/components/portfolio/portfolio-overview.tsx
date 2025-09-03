import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Zap, Thermometer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioHolding {
  id: string;
  symbol: string;
  shares: string;
  avgCost: string;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function PortfolioOverview() {
  const { data: portfolio, isLoading } = useQuery<PortfolioHolding[]>({
    queryKey: ["/api/portfolio"],
  });

  const { data: marketSentiment } = useQuery({
    queryKey: ["/api/market/sentiment-summary"],
    queryFn: () => Promise.resolve({ sentiment: "Bullish", score: 78 }), // Mock for now
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border border-gray-300">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalValue = portfolio?.reduce((sum, holding) => sum + holding.totalValue, 0) || 0;
  const totalCost = portfolio?.reduce((sum, holding) => sum + holding.totalCost, 0) || 0;
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Calculate today's P&L (mock for now - would need daily price changes)
  const todaysPnL = totalValue * 0.0095; // Mock 0.95% daily gain
  const todaysPnLPercent = 0.95;

  // Mock alpha score calculation
  const alphaScore = 8.4;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Portfolio Value */}
      <Card className="border border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Portfolio Value</h3>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-1" data-testid="text-portfolio-value">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-sm ${totalGainLoss >= 0 ? 'text-accent' : 'text-destructive'}`}>
              ({totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Today's P&L */}
      <Card className="border border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Today's P&L</h3>
            <DollarSign className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-1" data-testid="text-daily-pnl">
            +${todaysPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-accent text-sm font-medium">+{todaysPnLPercent}%</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Alpha Score */}
      <Card className="border border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Alpha Score</h3>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary mb-1" data-testid="text-alpha-score">
            {alphaScore}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-accent text-sm font-medium">Strong Buy Signal</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Market Sentiment */}
      <Card className="border border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Market Sentiment</h3>
            <Thermometer className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-1" data-testid="text-market-sentiment">
            {marketSentiment?.sentiment || "Neutral"}
          </p>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < Math.floor((marketSentiment?.score || 50) / 20) ? 'bg-accent' : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-sm">
              {marketSentiment?.score || 50}% positive
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
