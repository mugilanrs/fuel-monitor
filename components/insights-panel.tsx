import { Lightbulb } from "lucide-react";

interface InsightsPanelProps {
  insights: string[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="neu-card rounded-xl bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
          <Lightbulb className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-card-foreground">Dynamic Insights</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-3 rounded-lg bg-secondary/60 transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <p className="text-sm text-card-foreground leading-relaxed">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
