import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddHoldingForm } from "./add-holding-form";
import { Trash2, Edit, Plus, Download, TrendingUp, DollarSign, Target } from "lucide-react";

interface PortfolioHolding {
  id: string;
  symbol: string;
  companyName: string;
  assetType: string;
  shares: string;
  avgCost: string;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
  change: number;
  changePercent: number;
  sector?: string;
}

const samplePortfolioData = [
  { symbol: "AAPL", companyName: "Apple Inc.", assetType: "stock", shares: "50", avgCost: "150.00", sector: "Technology" },
  { symbol: "TSLA", companyName: "Tesla Inc.", assetType: "stock", shares: "25", avgCost: "200.00", sector: "Consumer Cyclical" },
  { symbol: "MSFT", companyName: "Microsoft Corporation", assetType: "stock", shares: "40", avgCost: "300.00", sector: "Technology" },
  { symbol: "SPY", companyName: "SPDR S&P 500 ETF", assetType: "etf", shares: "30", avgCost: "400.00" },
  { symbol: "BTC-USD", companyName: "Bitcoin", assetType: "crypto", shares: "0.5", avgCost: "45000.00" },
  { symbol: "ETH-USD", companyName: "Ethereum", assetType: "crypto", shares: "2", avgCost: "3000.00" },
  { symbol: "GLD", companyName: "SPDR Gold Shares", assetType: "commodity", shares: "20", avgCost: "180.00" },
];

export default function PortfolioManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolio = [], isLoading } = useQuery<PortfolioHolding[]>({
    queryKey: ["/api/portfolio"],
  });

  const addSampleDataMutation = useMutation({
    mutationFn: async () => {
      const promises = samplePortfolioData.map(holding =>
        apiRequest("POST", "/api/portfolio", holding)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Sample Portfolio Added",
        description: "7 sample holdings have been added to your portfolio for testing alpha signals.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add sample data",
        variant: "destructive",
      });
    },
  });

  const deleteHoldingMutation = useMutation({
    mutationFn: async (holdingId: string) => {
      return apiRequest("DELETE", `/api/portfolio/${holdingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Success",
        description: "Holding removed from portfolio",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove holding",
        variant: "destructive",
      });
    },
  });

  const clearPortfolioMutation = useMutation({
    mutationFn: async () => {
      const promises = portfolio.map(holding =>
        apiRequest("DELETE", `/api/portfolio/${holding.id}`)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Portfolio Cleared",
        description: "All holdings have been removed from your portfolio.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear portfolio",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'etf': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'crypto': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'commodity': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'forex': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Management</h2>
          <p className="text-muted-foreground">
            Manage your holdings and generate alpha signals
          </p>
        </div>
        <div className="flex gap-3">
          {portfolio.length === 0 && (
            <Button 
              onClick={() => addSampleDataMutation.mutate()}
              disabled={addSampleDataMutation.isPending}
              variant="outline"
              data-testid="button-add-sample-data"
            >
              <Download className="h-4 w-4 mr-2" />
              {addSampleDataMutation.isPending ? "Adding..." : "Add Sample Data"}
            </Button>
          )}
          {portfolio.length > 0 && (
            <Button 
              onClick={() => clearPortfolioMutation.mutate()}
              disabled={clearPortfolioMutation.isPending}
              variant="outline"
              data-testid="button-clear-portfolio"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {clearPortfolioMutation.isPending ? "Clearing..." : "Clear All"}
            </Button>
          )}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-holding">
                <Plus className="h-4 w-4 mr-2" />
                Add Holding
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Asset to Portfolio</DialogTitle>
              </DialogHeader>
              <AddHoldingForm 
                onSuccess={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty State */}
      {portfolio.length === 0 && (
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            Your portfolio is empty. Add holdings manually or use sample data to test alpha signals and market intelligence features.
          </AlertDescription>
        </Alert>
      )}

      {/* Portfolio Holdings */}
      {portfolio.length > 0 && (
        <div className="space-y-4">
          {portfolio.map((holding) => (
            <Card key={holding.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg" data-testid={`text-symbol-${holding.symbol}`}>
                          {holding.symbol}
                        </h3>
                        <Badge 
                          variant="secondary" 
                          className={getAssetTypeColor(holding.assetType)}
                          data-testid={`badge-type-${holding.assetType}`}
                        >
                          {holding.assetType.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{holding.companyName}</p>
                      {holding.sector && (
                        <p className="text-xs text-muted-foreground">Sector: {holding.sector}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Shares</p>
                      <p className="font-medium" data-testid={`text-shares-${holding.symbol}`}>
                        {parseFloat(holding.shares).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Cost</p>
                      <p className="font-medium">{formatCurrency(parseFloat(holding.avgCost))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Price</p>
                      <div className="flex items-center justify-end gap-1">
                        <p className="font-medium">{formatCurrency(holding.currentPrice)}</p>
                        <span className={`text-xs ${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({holding.changePercent >= 0 ? '+' : ''}{holding.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <div className="text-right">
                        <p className="font-semibold" data-testid={`text-total-value-${holding.symbol}`}>
                          {formatCurrency(holding.totalValue)}
                        </p>
                        <div className={`text-sm ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.gainLoss >= 0 ? '+' : ''}{formatCurrency(holding.gainLoss)}
                          <span className="ml-1">
                            ({holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteHoldingMutation.mutate(holding.id)}
                      disabled={deleteHoldingMutation.isPending}
                      data-testid={`button-delete-${holding.symbol}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}