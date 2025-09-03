import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import PortfolioOverview from "@/components/portfolio/portfolio-overview";
import PortfolioChart from "@/components/charts/portfolio-chart";
import SentimentChart from "@/components/charts/sentiment-chart";
import Watchlist from "@/components/watchlist/watchlist";
import AlphaSignals from "@/components/alpha/alpha-signals";
import MarketNews from "@/components/news/market-news";
import { AddHoldingForm } from "@/components/portfolio/add-holding-form";
import PortfolioManagement from "@/components/portfolio/portfolio-management";
import { AIChatWidget } from "@/components/chat/ai-chat-widget";
import { MarketTrendWidget } from "@/components/analysis/market-trend-widget";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");

  const renderActiveView = () => {
    switch (activeView) {
      case "portfolio":
        return (
          <div className="space-y-6">
            <PortfolioOverview />
            <PortfolioManagement />
          </div>
        );
      
      case "watchlist":
        return <Watchlist />;
      
      case "market-news":
        return <MarketNews />;
      
      case "sentiment":
        return <SentimentChart />;
      
      case "alpha":
        return <AlphaSignals />;
      
      default: // dashboard
        return (
          <>
            {/* Portfolio Overview Cards */}
            <PortfolioOverview />
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <PortfolioChart 
                selectedTimeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
              />
              <SentimentChart />
            </div>
            
            {/* Watchlist and Alpha Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Watchlist />
              <AlphaSignals />
            </div>
            
            {/* Market Trend Analysis Widget */}
            <div className="mb-8">
              <MarketTrendWidget />
            </div>
            
            {/* Market News */}
            <MarketNews />
          </>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="flex-1 overflow-hidden">
        <Header />
        
        <div className="p-6 overflow-y-auto h-full scrollbar-hide">
          {renderActiveView()}
        </div>
      </main>

      {/* Floating Add Holdings Button */}
      <Dialog open={showAddHolding} onOpenChange={setShowAddHolding}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
            data-testid="button-add-holding-fab"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Asset to Portfolio</DialogTitle>
          </DialogHeader>
          <AddHoldingForm 
            onSuccess={() => setShowAddHolding(false)}
            onCancel={() => setShowAddHolding(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}
