import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  // Real-time status indicator
  const { data: isLive } = useQuery({
    queryKey: ["/api/market/status"],
    queryFn: () => Promise.resolve(true), // Mock for now
    refetchInterval: 30000, // Check every 30 seconds
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement stock search functionality
      console.log("Searching for:", searchQuery);
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Real-time market intelligence and portfolio insights
          </p>
        </div>
        
        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Stock Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64"
              data-testid="input-search"
            />
          </form>
          
          {/* Real-time indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-accent animate-pulse' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground" data-testid="status-live">
              {isLive ? "Live" : "Offline"}
            </span>
          </div>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            data-testid="button-notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
