import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WatchlistItem {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  sentimentScore: number;
  sentiment: string;
  alphaScore: number;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  sector: string;
}

export default function Watchlist() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlist, isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
  });

  const { data: searchResults, isLoading: isSearching } = useQuery<StockSearchResult[]>({
    queryKey: ["/api/market/search", searchQuery],
    enabled: searchQuery.length > 1,
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async (stock: StockSearchResult) => {
      const response = await apiRequest("POST", "/api/watchlist", {
        symbol: stock.symbol,
        companyName: stock.name,
        sector: stock.sector,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setIsAddDialogOpen(false);
      setSearchQuery("");
      setSelectedStock(null);
      toast({
        title: "Added to Watchlist",
        description: `${selectedStock?.name} has been added to your watchlist.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add",
        description: error.message.includes("400") ? "Stock already in watchlist" : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/watchlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Removed from Watchlist",
        description: "Stock has been removed from your watchlist.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Remove",
        description: "An error occurred while removing the stock.",
        variant: "destructive",
      });
    },
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-accent';
      case 'negative': return 'bg-destructive';
      default: return 'bg-yellow-500';
    }
  };

  const getSentimentText = (score: number) => {
    if (score >= 7) return 'text-accent';
    if (score <= 3) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const handleAddStock = () => {
    if (selectedStock) {
      addToWatchlistMutation.mutate(selectedStock);
    }
  };

  return (
    <Card className="border border-gray-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Watchlist</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-primary hover:text-primary/80"
                data-testid="button-add-to-watchlist"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock to Watchlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-stock-search"
                  />
                </div>
                
                {isSearching && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}
                
                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((stock) => (
                      <div
                        key={stock.symbol}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedStock?.symbol === stock.symbol
                            ? 'border-primary bg-primary/5'
                            : 'border border-gray-300 hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedStock(stock)}
                        data-testid={`stock-option-${stock.symbol}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-sm text-muted-foreground">{stock.name}</p>
                          </div>
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {stock.sector}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel-add"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddStock}
                    disabled={!selectedStock || addToWatchlistMutation.isPending}
                    data-testid="button-confirm-add"
                  >
                    {addToWatchlistMutation.isPending ? "Adding..." : "Add to Watchlist"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border border-gray-300">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 w-12 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : watchlist && watchlist.length > 0 ? (
          <div className="space-y-4">
            {watchlist.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between py-3 border-b border border-gray-300 last:border-b-0 group"
                data-testid={`watchlist-item-${item.symbol}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{item.symbol}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.companyName}</p>
                    <p className="text-sm text-muted-foreground">{item.sector}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-mono font-medium text-foreground">
                      ${item.currentPrice.toFixed(2)}
                    </p>
                    <p className={`text-sm ${item.changePercent >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getSentimentColor(item.sentiment)}`}></div>
                    <span className={`text-xs font-medium ${getSentimentText(item.alphaScore)}`}>
                      {item.alphaScore.toFixed(1)}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromWatchlistMutation.mutate(item.id)}
                    data-testid={`button-remove-${item.symbol}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
            <p className="text-sm text-muted-foreground">
              Add stocks to track their performance and sentiment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
