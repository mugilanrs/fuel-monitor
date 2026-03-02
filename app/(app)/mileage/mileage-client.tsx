"use client";

import { useMemo } from "react";
import { Gauge, TrendingUp, TrendingDown, Zap } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { FuelEntry } from "@/lib/csv-utils";
import { formatNumber } from "@/lib/csv-utils";
import {
  computeFillMetrics,
  computeGlobalMetrics,
  computeRollingAverage,
} from "@/lib/calculations";
import { KpiCard } from "@/components/kpi-card";

export function MileageClient({ entries }: { entries: FuelEntry[] }) {
  const fillMetrics = useMemo(() => computeFillMetrics(entries), [entries]);
  const global = useMemo(() => computeGlobalMetrics(entries), [entries]);

  const mileageData = useMemo(() => {
    const mileages = fillMetrics.map((f) => f.mileage);
    const rolling = computeRollingAverage(mileages, 3);

    return fillMetrics.map((f, i) => ({
      date: f.entry.date,
      mileage: f.mileage,
      rolling: rolling[i],
      label: new Date(f.entry.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
    }));
  }, [fillMetrics]);

  const validMileageData = mileageData.filter((d) => d.mileage !== null);

  const fluctuationData = useMemo(() => {
    return validMileageData.map((d, i) => {
      const prev = i > 0 ? validMileageData[i - 1].mileage! : d.mileage!;
      return {
        ...d,
        change: d.mileage! - prev,
      };
    });
  }, [validMileageData]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Mileage Intelligence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Deep analysis of your riding efficiency patterns
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Average Mileage"
          value={`${formatNumber(global.avgMileage)} km/l`}
          icon={Gauge}
        />
        <KpiCard
          title="Best Mileage"
          value={`${formatNumber(global.bestMileage)} km/l`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Worst Mileage"
          value={`${formatNumber(global.worstMileage)} km/l`}
          icon={TrendingDown}
        />
        <KpiCard
          title="Variance"
          value={`${formatNumber(global.bestMileage - global.worstMileage)} km/l`}
          subtitle="Best - Worst range"
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mileage Trend Line + Rolling Average */}
        <div className="neu-card rounded-xl bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Mileage Trend with 3-Fill Rolling Average
          </h3>
          {validMileageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={validMileageData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--card-foreground)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)} km/l`,
                    name === "mileage" ? "Actual" : "Rolling Avg",
                  ]}
                />
                <ReferenceLine
                  y={global.avgMileage}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--primary)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="rolling"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Best vs Worst Comparison */}
        <div className="neu-card rounded-xl bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Best vs Worst Comparison
          </h3>
          <div className="flex flex-col gap-6 justify-center h-[280px]">
            <ComparisonBar
              label="Best Mileage"
              value={global.bestMileage}
              max={global.bestMileage}
              color="bg-emerald-500 dark:bg-emerald-400"
            />
            <ComparisonBar
              label="Average Mileage"
              value={global.avgMileage}
              max={global.bestMileage}
              color="bg-primary"
            />
            <ComparisonBar
              label="Worst Mileage"
              value={global.worstMileage}
              max={global.bestMileage}
              color="bg-red-400 dark:bg-red-500"
            />
          </div>
        </div>
      </div>

      {/* Efficiency Fluctuation */}
      <div className="neu-card rounded-xl bg-card p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">
          Efficiency Fluctuation
        </h3>
        {fluctuationData.length > 1 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={fluctuationData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--card-foreground)",
                }}
                formatter={(value: number) => [`${value.toFixed(1)} km/l`, "Change"]}
              />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
              <defs>
                <linearGradient id="mileageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="change"
                stroke="var(--primary)"
                fill="url(#mileageGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold text-card-foreground">{formatNumber(value)} km/l</span>
      </div>
      <div className="h-3 rounded-full bg-secondary overflow-hidden neu-inset">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
      Add more fuel entries to see the chart
    </div>
  );
}
