import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from "lucide-react";

// Mock data for sentiment trends
const mockSentimentData = [
  { date: "2024-01-01", positive: 65, neutral: 25, negative: 10 },
  { date: "2024-01-02", positive: 70, neutral: 20, negative: 10 },
  { date: "2024-01-03", positive: 60, neutral: 30, negative: 10 },
  { date: "2024-01-04", positive: 75, neutral: 15, negative: 10 },
  { date: "2024-01-05", positive: 78, neutral: 17, negative: 5 },
  { date: "2024-01-06", positive: 80, neutral: 15, negative: 5 },
  { date: "2024-01-07", positive: 82, neutral: 13, negative: 5 },
];

export default function SentimentChart() {
  const { data: sentimentData, isLoading } = useQuery({
    queryKey: ["/api/market/sentiment-trends"],
    queryFn: () => Promise.resolve(mockSentimentData), // Mock for now
  });

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Sentiment Trends</h3>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span className="text-muted-foreground">Positive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-muted-foreground">Neutral</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <span className="text-muted-foreground">Negative</span>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading sentiment data...</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            {sentimentData && sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="positive" 
                    stackId="1"
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="neutral" 
                    stackId="1"
                    stroke="hsl(45, 84%, 60%)" 
                    fill="hsl(45, 84%, 60%)"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="negative" 
                    stackId="1"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-accent mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No sentiment data available</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
