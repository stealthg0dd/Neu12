import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, TrendingDown, TrendingUp, AlertTriangle, BarChart3, RefreshCw, Target, Shield, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface BiasDetection {
  biasType: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  description: string;
  evidence: string[];
  recommendation: string;
  detectedAt: string;
}

interface BehavioralProfile {
  userId: string;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  tradingFrequency: "low" | "medium" | "high";
  averageHoldPeriod: number;
  diversificationScore: number;
  biasScores: Record<string, number>;
  lastAnalyzed: string;
}

interface BiasAnalysisResult {
  overallBiasScore: number;
  detectedBiases: BiasDetection[];
  behavioralProfile: BehavioralProfile;
  recommendations: string[];
  riskAssessment: {
    level: "low" | "medium" | "high";
    factors: string[];
  };
  improvementAreas: string[];
}

export default function BehavioralAnalysis() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: analysis, isLoading, error } = useQuery<BiasAnalysisResult>({
    queryKey: ["/api/behavioral-analysis"],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/behavioral-analysis/refresh", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/behavioral-analysis"] });
      setIsRefreshing(false);
    },
    onError: () => {
      setIsRefreshing(false);
    },
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMutation.mutate();
  };

  const getBiasTypeLabel = (biasType: string) => {
    const labels: Record<string, string> = {
      loss_aversion: "Loss Aversion",
      overconfidence: "Overconfidence",
      anchoring: "Anchoring",
      herding: "Herding",
      confirmation_bias: "Confirmation Bias",
      recency_bias: "Recency Bias",
      disposition_effect: "Disposition Effect"
    };
    return labels[biasType] || biasType;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-red-600 dark:text-red-400";
    if (score >= 4) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Behavioral Bias Analysis</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Behavioral Bias Analysis</h1>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Unavailable</AlertTitle>
          <AlertDescription>
            Unable to load behavioral bias analysis. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Behavioral Bias Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your trading patterns for cognitive biases and improve decision-making
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefreshing}
          data-testid="button-refresh-behavioral-analysis"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh Analysis
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Overall Bias Score</span>
            </div>
            <div className="mt-2">
              <div className={cn("text-2xl font-bold", getScoreColor(analysis.overallBiasScore))}>
                {analysis.overallBiasScore.toFixed(1)}/10
              </div>
              <Progress value={analysis.overallBiasScore * 10} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Detected Biases</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{analysis.detectedBiases.length}</div>
              <p className="text-xs text-muted-foreground">Active biases found</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Risk Level</span>
            </div>
            <div className="mt-2">
              <Badge className={getSeverityColor(analysis.riskAssessment.level)}>
                {analysis.riskAssessment.level.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.riskAssessment.factors.length} risk factors
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Diversification</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {analysis.behavioralProfile.diversificationScore}/10
              </div>
              <p className="text-xs text-muted-foreground">Portfolio spread</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="biases">Detected Biases</TabsTrigger>
          <TabsTrigger value="profile">Behavioral Profile</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Current Risk Level</span>
                  <Badge className={getSeverityColor(analysis.riskAssessment.level)}>
                    {analysis.riskAssessment.level.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Risk Factors:</h4>
                  <ul className="space-y-1">
                    {analysis.riskAssessment.factors.map((factor, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Biases */}
          {analysis.detectedBiases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Bias Detections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.detectedBiases.slice(0, 3).map((bias, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{getBiasTypeLabel(bias.biasType)}</h4>
                        <Badge className={getSeverityColor(bias.severity)}>
                          {bias.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{bias.description}</p>
                      <div className="text-xs text-muted-foreground">
                        Confidence: {(bias.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="biases" className="space-y-6">
          {analysis.detectedBiases.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Major Biases Detected</h3>
                <p className="text-muted-foreground">
                  Your trading patterns show minimal cognitive biases. Keep up the disciplined approach!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analysis.detectedBiases.map((bias, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {getBiasTypeLabel(bias.biasType)}
                      </CardTitle>
                      <Badge className={getSeverityColor(bias.severity)}>
                        {bias.severity} ({(bias.confidence * 100).toFixed(0)}% confidence)
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{bias.description}</p>
                    
                    <div>
                      <h4 className="font-medium mb-2">Evidence:</h4>
                      <ul className="space-y-1">
                        {bias.evidence.map((evidence, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recommendation:
                      </h4>
                      <p className="text-sm">{bias.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trading Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Risk Tolerance:</span>
                  <Badge variant="outline">
                    {analysis.behavioralProfile.riskTolerance}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Trading Frequency:</span>
                  <Badge variant="outline">
                    {analysis.behavioralProfile.tradingFrequency}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Hold Period:</span>
                  <span className="font-medium">
                    {analysis.behavioralProfile.averageHoldPeriod} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Diversification:</span>
                  <span className="font-medium">
                    {analysis.behavioralProfile.diversificationScore}/10
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bias Susceptibility Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(analysis.behavioralProfile.biasScores).map(([bias, score]) => (
                  <div key={bias} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{getBiasTypeLabel(bias)}</span>
                      <span className={getScoreColor(score)}>{score}/10</span>
                    </div>
                    <Progress value={score * 10} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Action Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Improvement Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysis.improvementAreas.map((area, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1">→</span>
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Educational Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Behavioral Finance Basics</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn about common cognitive biases that affect investment decisions.
                  </p>
                  <Button variant="outline" size="sm">Learn More</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Systematic Investment Approach</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Develop rules-based strategies to minimize emotional decision-making.
                  </p>
                  <Button variant="outline" size="sm">Learn More</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last analyzed: {new Date(analysis.behavioralProfile.lastAnalyzed).toLocaleString()}
      </div>
    </div>
  );
}