"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLibraryStore } from "@/hooks/use-library-store";
import { aiVisitorTrendSummary, AiVisitorTrendSummaryOutput } from "@/ai/flows/ai-visitor-trend-summary-flow";
import { BrainCircuit, Loader2, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AiInsights() {
  const { logs, isLoaded } = useLibraryStore();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AiVisitorTrendSummaryOutput | null>(null);

  const handleAnalyze = async () => {
    if (logs.length < 5) {
      toast({
        title: "Insufficient Data",
        description: "Need at least 5 log entries to generate meaningful AI insights.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Map logs to format expected by the AI flow
      const visitorLogs = logs.map(l => ({
        date: l.date,
        time: l.time,
        purpose: l.purpose,
        college: l.college,
        isEmployee: l.isEmployee
      }));

      const summary = await aiVisitorTrendSummary({ visitorLogs });
      setResult(summary);
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not generate AI summary at this time.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <BrainCircuit className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Trend Summary Tool</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Automatically summarize library usage trends, identify unusual patterns, and receive operational recommendations powered by Gemini AI.
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 px-8"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing Library Logs...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <CardTitle className="text-lg">Visitor Trend Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="leading-relaxed text-muted-foreground">
                {result.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <AlertTriangle className="w-5 h-5 text-accent-foreground" />
                <CardTitle className="text-lg">Anomalies & Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {result.unusualPatterns}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Significant Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {result.significantChanges}
                </p>
              </CardContent>
            </Card>
          </div>

          {result.recommendations && (
            <Card className="border-none shadow-md bg-accent/5 border-l-4 border-l-accent">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Lightbulb className="w-5 h-5 text-accent-foreground" />
                <CardTitle className="text-lg">Smart Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accent-foreground font-medium">
                  {result.recommendations}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!result && !isAnalyzing && (
        <Card className="border-dashed border-2 bg-transparent text-center p-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <LibraryIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-muted-foreground">No analysis performed yet</p>
              <p className="text-sm text-muted-foreground">Click the button above to analyze your visitor data.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LibraryIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  );
}