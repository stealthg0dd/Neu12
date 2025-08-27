import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import PortfolioOverview from "@/components/portfolio/portfolio-overview";
import PortfolioChart from "@/components/charts/portfolio-chart";
import SentimentChart from "@/components/charts/sentiment-chart";
import Watchlist from "@/components/watchlist/watchlist";
import AlphaSignals from "@/components/alpha/alpha-signals";
import MarketNews from "@/components/news/market-news";

export default function Dashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header />
        
        <div className="p-6 overflow-y-auto h-full scrollbar-hide">
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
          
          {/* Market News */}
          <MarketNews />
        </div>
      </main>
    </div>
  );
}
