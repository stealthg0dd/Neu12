import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, Bitcoin, Coins, DollarSign, Building } from "lucide-react";

const addHoldingSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  companyName: z.string().min(1, "Company/Asset name is required"),
  assetType: z.enum(['stock', 'etf', 'crypto', 'commodity', 'forex']),
  shares: z.string().min(1, "Quantity is required").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a positive number"),
  avgCost: z.string().min(1, "Average cost is required").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Must be a positive number"),
  sector: z.string().optional(),
});

type AddHoldingFormData = z.infer<typeof addHoldingSchema>;

interface AddHoldingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddHoldingForm({ onSuccess, onCancel }: AddHoldingFormProps) {
  const [selectedAssetType, setSelectedAssetType] = useState<string>('stock');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddHoldingFormData>({
    resolver: zodResolver(addHoldingSchema),
    defaultValues: {
      symbol: "",
      companyName: "",
      assetType: "stock",
      shares: "",
      avgCost: "",
      sector: "",
    },
  });

  const addHoldingMutation = useMutation({
    mutationFn: async (data: AddHoldingFormData) => {
      const response = await apiRequest("POST", "/api/portfolio", {
        ...data,
        shares: parseFloat(data.shares).toString(),
        avgCost: parseFloat(data.avgCost).toString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Success",
        description: "Asset added to portfolio successfully!",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add asset to portfolio",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AddHoldingFormData) => {
    addHoldingMutation.mutate(data);
  };

  const assetTypeInfo = {
    stock: {
      icon: TrendingUp,
      label: "Stocks",
      description: "Individual company stocks",
      examples: ["AAPL", "TSLA", "MSFT", "GOOGL"],
      quantityLabel: "Shares",
    },
    etf: {
      icon: Building,
      label: "ETFs",
      description: "Exchange-traded funds",
      examples: ["SPY", "QQQ", "VTI", "VOO"],
      quantityLabel: "Shares",
    },
    crypto: {
      icon: Bitcoin,
      label: "Cryptocurrency",
      description: "Digital currencies",
      examples: ["BTC-USD", "ETH-USD", "ADA-USD"],
      quantityLabel: "Coins",
    },
    commodity: {
      icon: Coins,
      label: "Commodities",
      description: "Physical goods & resources",
      examples: ["GLD", "SLV", "USO", "UNG"],
      quantityLabel: "Units",
    },
    forex: {
      icon: DollarSign,
      label: "Forex",
      description: "Currency pairs",
      examples: ["EURUSD=X", "GBPUSD=X", "USDJPY=X"],
      quantityLabel: "Units",
    },
  };

  const currentAssetInfo = assetTypeInfo[selectedAssetType as keyof typeof assetTypeInfo] || assetTypeInfo.stock;
  const IconComponent = currentAssetInfo.icon;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add to Portfolio
        </CardTitle>
        <CardDescription>
          Add a new asset to your investment portfolio. Supports stocks, ETFs, crypto, commodities, and forex.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Asset Type Selection */}
            <div className="space-y-3">
              <Label>Asset Type</Label>
              <Tabs value={selectedAssetType} onValueChange={setSelectedAssetType} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  {Object.entries(assetTypeInfo).map(([type, info]) => {
                    const IconComp = info.icon;
                    return (
                      <TabsTrigger key={type} value={type} className="flex flex-col gap-1 py-3">
                        <IconComp className="h-4 w-4" />
                        <span className="text-xs">{info.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                
                {Object.entries(assetTypeInfo).map(([type, info]) => (
                  <TabsContent key={type} value={type} className="mt-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">{info.label}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <strong>Examples:</strong> {info.examples.join(", ")}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              
              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} value={selectedAssetType} onChange={() => {}} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol/Ticker</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={currentAssetInfo.examples[0]}
                        className="uppercase"
                        data-testid="input-symbol"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company/Asset Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Asset name"
                        data-testid="input-company-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Investment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shares"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{currentAssetInfo.quantityLabel}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="any"
                        placeholder="0.00"
                        data-testid="input-shares"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avgCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Cost Per Unit</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="any"
                        placeholder="0.00"
                        data-testid="input-avg-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Sector (for stocks) */}
            {selectedAssetType === 'stock' && (
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector (Optional)</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger data-testid="select-sector">
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Financial Services">Financial Services</SelectItem>
                          <SelectItem value="Consumer Cyclical">Consumer Cyclical</SelectItem>
                          <SelectItem value="Industrials">Industrials</SelectItem>
                          <SelectItem value="Communication Services">Communication Services</SelectItem>
                          <SelectItem value="Energy">Energy</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
                          <SelectItem value="Basic Materials">Basic Materials</SelectItem>
                          <SelectItem value="Consumer Defensive">Consumer Defensive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={addHoldingMutation.isPending}
                className="flex-1"
                data-testid="button-add-holding"
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {addHoldingMutation.isPending ? "Adding..." : `Add ${currentAssetInfo.label}`}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}