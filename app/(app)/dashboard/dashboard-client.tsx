"use client";

import { useMemo } from "react";
import { Route, Fuel, IndianRupee, Gauge } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FuelEntry } from "@/lib/csv-utils";
import { formatCurrency, formatNumber } from "@/lib/csv-utils";
import {
  computeGlobalMetrics,
  computeMonthlyMetrics,
  generateInsights,
} from "@/lib/calculations";
import { KpiCard } from "@/components/kpi-card";
import { InsightsPanel } from "@/components/insights-panel";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function DashboardClient({ entries }: { entries: FuelEntry[] }) {
  const global = useMemo(() => computeGlobalMetrics(entries), [entries]);
  const monthly = useMemo(() => computeMonthlyMetrics(entries), [entries]);
  const insights = useMemo(() => generateInsights(entries), [entries]);

  const latestMonth = monthly.length >= 1 ? monthly[monthly.length - 1] : null;

  const chartData = monthly.map((m) => ({
    name: `${MONTH_NAMES[m.monthNum - 1]} ${String(m.year).slice(2)}`,
    expense: Math.round(m.expense),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Overview Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fuel performance summary for your Honda CB350 H{"'"}ness
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Distance"
          value={`${formatNumber(global.totalDistance, 0)} km`}
          subtitle="Last odometer reading"
          icon={Route}
        />
        <KpiCard
          title="Total Fuel Spent"
          value={formatCurrency(global.totalSpent)}
          subtitle={`${formatNumber(global.totalLiters, 1)} liters consumed`}
          icon={IndianRupee}
          trend={latestMonth?.expenseChange}
        />
        <KpiCard
          title="Avg Mileage"
          value={`${formatNumber(global.avgMileage)} km/l`}
          subtitle={`Best: ${formatNumber(global.bestMileage)} | Worst: ${formatNumber(global.worstMileage)}`}
          icon={Gauge}
          trend={latestMonth?.mileageChange}
        />
        <KpiCard
          title="Cost per km"
          value={`${formatCurrency(global.avgCostPerKm)}`}
          subtitle={`Avg price: ${formatCurrency(global.avgPricePerLiter)}/l`}
          icon={Fuel}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 neu-card rounded-xl bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Monthly Expense Comparison
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--card-foreground)",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Expense"]}
                />
                <Bar
                  dataKey="expense"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              Add fuel entries to see the chart
            </div>
          )}
        </div>

        <InsightsPanel insights={insights} />
      </div>
    </div>
  );
}
