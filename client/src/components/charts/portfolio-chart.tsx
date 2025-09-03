import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from "lucide-react";

interface PortfolioChartProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

const timeframes = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "1Y", value: "1Y" },
];

// Mock data for portfolio performance
const mockData = [
  { date: "2024-01-01", value: 125000 },
  { date: "2024-01-02", value: 125300 },
  { date: "2024-01-03", value: 124800 },
  { date: "2024-01-04", value: 126200 },
  { date: "2024-01-05", value: 126800 },
  { date: "2024-01-06", value: 127100 },
  { date: "2024-01-07", value: 127425 },
];

export default function PortfolioChart({ selectedTimeframe, onTimeframeChange }: PortfolioChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["/api/portfolio/performance", selectedTimeframe],
    queryFn: () => Promise.resolve(mockData), // Mock for now
  });

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };

  return (
    <Card className="border border-gray-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Portfolio Performance</h3>
          <div className="flex space-x-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe.value}
                variant={selectedTimeframe === timeframe.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onTimeframeChange(timeframe.value)}
                className="text-xs"
                data-testid={`button-timeframe-${timeframe.value}`}
              >
                {timeframe.label}
              </Button>
            ))}
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading chart...</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    axisLine={false}
                    tickLine={false}
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No portfolio data available</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
