import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AlphaSignal {
  id: string;
  symbol: string;
  alphaScore: number;
  signal: string;
  sentimentScore: number;
  volatilityScore: number;
  momentumScore: number;
  timestamp: string;
}

// Mock company data
const companyInfo: Record<string, { name: string; sector: string; price: number; change: number }> = {
  'NVDA': { name: 'NVIDIA Corporation', sector: 'Technology', price: 487.23, change: 5.67 },
  'AMD': { name: 'Advanced Micro Devices', sector: 'Technology', price: 156.78, change: 3.45 },
  'GOOGL': { name: 'Alphabet Inc.', sector: 'Technology', price: 142.89, change: 1.23 },
};

export default function AlphaSignals() {
  const { data: alphaSignals, isLoading } = useQuery<AlphaSignal[]>({
    queryKey: ["/api/market/alpha-signature"],
    queryFn: async () => {
      // Mock data for alpha signals
      return [
        {
          id: '1',
          symbol: 'NVDA',
          alphaScore: 9.1,
          signal: 'strong_buy',
          sentimentScore: 8.5,
          volatilityScore: 7.2,
          momentumScore: 9.8,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          symbol: 'AMD',
          alphaScore: 8.7,
          signal: 'buy',
          sentimentScore: 8.0,
          volatilityScore: 8.1,
          momentumScore: 9.0,
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          symbol: 'GOOGL',
          alphaScore: 7.4,
          signal: 'hold',
          sentimentScore: 6.5,
          volatilityScore: 8.8,
          momentumScore: 6.9,
          timestamp: new Date().toISOString(),
        },
      ];
    },
  });

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'strong_buy': return 'bg-accent text-accent-foreground';
      case 'buy': return 'bg-primary text-primary-foreground';
      case 'hold': return 'bg-yellow-500 text-white';
      case 'sell': return 'bg-orange-500 text-white';
      case 'strong_sell': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSignalText = (signal: string) => {
    switch (signal) {
      case 'strong_buy': return 'Strong Buy';
      case 'buy': return 'Buy';
      case 'hold': return 'Hold';
      case 'sell': return 'Sell';
      case 'strong_sell': return 'Strong Sell';
      default: return 'Unknown';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-accent';
    if (score >= 7) return 'text-primary';
    if (score >= 4 && score <= 6) return 'text-yellow-500';
    if (score >= 2.5) return 'text-orange-500';
    return 'text-destructive';
  };

  const getAlphaSignatureProps = (symbol: string, alphaScore: number) => {
    if (alphaScore >= 8.5) {
      return {
        bgClass: 'bg-gradient-to-r from-accent/5 to-transparent',
        borderClass: 'border-accent/20',
        scoreClass: 'bg-accent text-accent-foreground',
        strengthText: 'Strong',
        strengthColor: 'text-accent'
      };
    }
    if (alphaScore >= 7) {
      return {
        bgClass: 'bg-gradient-to-r from-primary/5 to-transparent',
        borderClass: 'border-primary/20',
        scoreClass: 'bg-primary text-primary-foreground',
        strengthText: 'Strong',
        strengthColor: 'text-primary'
      };
    }
    return {
      bgClass: 'bg-gradient-to-r from-yellow-500/5 to-transparent',
      borderClass: 'border-yellow-500/20',
      scoreClass: 'bg-yellow-500 text-white',
      strengthText: 'Moderate',
      strengthColor: 'text-yellow-500'
    };
  };

  return (
    <Card className="border border-gray-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Top Alpha Signals</h3>
          <Badge variant="secondary" className="text-xs">
            Live Updates
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border border-gray-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-12 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : alphaSignals && alphaSignals.length > 0 ? (
          <div className="space-y-4">
            {alphaSignals.map((signal) => {
              const company = companyInfo[signal.symbol];
              const alphaProps = getAlphaSignatureProps(signal.symbol, signal.alphaScore);
              
              return (
                <div 
                  key={signal.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${alphaProps.bgClass} ${alphaProps.borderClass}`}
                  data-testid={`alpha-signal-${signal.symbol}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${alphaProps.scoreClass}`}>
                        <span className="text-sm font-bold">{signal.alphaScore.toFixed(1)}</span>
                      </div>
                      <span className={`text-xs font-medium mt-1 ${alphaProps.strengthColor}`}>
                        {alphaProps.strengthText}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{signal.symbol}</p>
                      <p className="text-sm text-muted-foreground">{company?.name || 'Unknown Company'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          High Sentiment
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {signal.alphaScore >= 7 ? 'Low Volatility' : 'Stable'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-foreground">
                      ${company?.price.toFixed(2) || '0.00'}
                    </p>
                    <p className={`text-sm ${(company?.change || 0) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {(company?.change || 0) >= 0 ? '+' : ''}{(company?.change || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No alpha signals available</p>
            <p className="text-sm text-muted-foreground">
              Alpha signals will appear when market conditions are analyzed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
