import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink } from "lucide-react";

interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;
  symbols: string[];
  url?: string;
  sentimentScore?: number;
  sentiment?: string;
}

export default function MarketNews() {
  const { data: news, isLoading, error } = useQuery<NewsArticle[]>({
    queryKey: ["/api/market/news"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-accent text-accent-foreground';
      case 'negative': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-yellow-500 text-white';
    }
  };

  const getSentimentText = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'Positive';
      case 'negative': return 'Negative';
      default: return 'Neutral';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const articleTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - articleTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  };

  const getStockChangeColor = (symbol: string) => {
    // Mock positive/negative changes for display
    const hash = symbol.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return hash % 2 === 0 ? 'text-accent' : 'text-destructive';
  };

  const getStockChange = (symbol: string) => {
    // Mock percentage change for display
    const hash = symbol.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const change = (Math.abs(hash) % 500) / 100; // 0-5% range
    const isPositive = hash % 2 === 0;
    return `${isPositive ? '+' : '-'}${change.toFixed(1)}%`;
  };

  if (error) {
    return (
      <Card className="border border-gray-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Market News & Sentiment</h3>
          </div>
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Failed to load market news</p>
            <p className="text-sm text-muted-foreground">
              Please check your connection and try again
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Market News & Sentiment</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Last updated:</span>
            <span className="text-xs font-medium text-foreground" data-testid="text-last-updated">
              {isLoading ? "Loading..." : "2 minutes ago"}
            </span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border border border-gray-300 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-muted rounded-full animate-pulse"></div>
                    <div className="w-16 h-3 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="w-8 h-3 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="w-full h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-3/4 h-4 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-muted rounded animate-pulse"></div>
                  <div className="w-1/2 h-3 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : news && news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((article, index) => (
              <div 
                key={index} 
                className="p-4 border border border-gray-300 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => article.url && window.open(article.url, '_blank')}
                data-testid={`news-article-${index}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {article.sentiment && (
                      <>
                        <div className={`w-3 h-3 rounded-full ${
                          article.sentiment === 'positive' ? 'bg-accent' :
                          article.sentiment === 'negative' ? 'bg-destructive' :
                          'bg-yellow-500'
                        }`}></div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getSentimentColor(article.sentiment)}`}
                        >
                          {getSentimentText(article.sentiment)}
                        </Badge>
                        {article.sentimentScore && (
                          <span className="text-xs text-muted-foreground">
                            {article.sentimentScore.toFixed(1)}/10
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(article.publishedAt)}</span>
                  </div>
                </div>
                
                <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.headline}
                </h4>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                  {article.summary}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {article.symbols.length > 0 && (
                      <span className={`text-xs font-medium ${getStockChangeColor(article.symbols[0])}`}>
                        {article.symbols[0]} {getStockChange(article.symbols[0])}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">{article.source}</span>
                    {article.url && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No market news available</p>
            <p className="text-sm text-muted-foreground">
              News articles will appear here when market data is updated
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
