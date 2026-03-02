"use client";

import { useMemo } from "react";
import { IndianRupee, TrendingUp, Fuel, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { FuelEntry } from "@/lib/csv-utils";
import { formatCurrency, formatNumber } from "@/lib/csv-utils";
import {
  computeMonthlyMetrics,
  computeFillMetrics,
  computeStationMetrics,
  computeGlobalMetrics,
} from "@/lib/calculations";
import { KpiCard } from "@/components/kpi-card";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function FinanceClient({ entries }: { entries: FuelEntry[] }) {
  const global = useMemo(() => computeGlobalMetrics(entries), [entries]);
  const monthly = useMemo(() => computeMonthlyMetrics(entries), [entries]);
  const fillMetrics = useMemo(() => computeFillMetrics(entries), [entries]);
  const stations = useMemo(() => computeStationMetrics(entries), [entries]);

  const latestMonth = monthly.length >= 1 ? monthly[monthly.length - 1] : null;

  const monthlyChartData = monthly.map((m) => ({
    name: `${MONTH_NAMES[m.monthNum - 1]} ${String(m.year).slice(2)}`,
    expense: Math.round(m.expense),
  }));

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const priceTrend = sorted.map((e) => ({
    label: new Date(e.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    price: e.price_per_liter,
  }));

  const costPerKmTrend = fillMetrics
    .filter((f) => f.costPerKm !== null)
    .map((f) => ({
      label: new Date(f.entry.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      cost: parseFloat(f.costPerKm!.toFixed(2)),
    }));

  const stationPieData = stations.map((s) => ({
    name: s.station,
    value: Math.round(s.totalSpent),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Financial Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Spending trends and cost breakdown analysis
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Spent"
          value={formatCurrency(global.totalSpent)}
          icon={IndianRupee}
          trend={latestMonth?.expenseChange}
        />
        <KpiCard
          title="Avg Price/Liter"
          value={`${formatCurrency(global.avgPricePerLiter)}`}
          icon={Fuel}
        />
        <KpiCard
          title="Avg Cost/km"
          value={`${formatCurrency(global.avgCostPerKm)}`}
          icon={TrendingUp}
        />
        <KpiCard
          title="Stations Visited"
          value={`${stations.length}`}
          subtitle={
            stations.length > 0
              ? `Most visited: ${[...stations].sort((a, b) => b.fillCount - a.fillCount)[0].station}`
              : undefined
          }
          icon={PieChartIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Expense Bar */}
        <div className="neu-card rounded-xl bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Monthly Expense
          </h3>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
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
                <Bar dataKey="expense" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Fuel Price Trend */}
        <div className="neu-card rounded-xl bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Fuel Price Trend
          </h3>
          {priceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={priceTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                  formatter={(value: number) => [`${formatCurrency(value)}/l`, "Price"]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ fill: "var(--chart-2)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost per km Trend */}
        <div className="neu-card rounded-xl bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Cost per km Trend
          </h3>
          {costPerKmTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={costPerKmTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                  formatter={(value: number) => [`${formatCurrency(value)}/km`, "Cost"]}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={{ fill: "var(--chart-3)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        {/* Station Spending Pie */}
        <div className="neu-card rounded-xl bg-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Station Spending Breakdown
          </h3>
          {stationPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stationPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stationPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--card-foreground)",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Spent"]}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-card-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
      Add fuel entries to see the chart
    </div>
  );
}
