import type { FuelEntry } from "./csv-utils";

export interface FillMetrics {
  entry: FuelEntry;
  distance: number | null;
  mileage: number | null;
  costPerKm: number | null;
}

export interface GlobalMetrics {
  totalDistance: number;
  totalLiters: number;
  totalSpent: number;
  avgMileage: number;
  bestMileage: number;
  worstMileage: number;
  avgCostPerKm: number;
  avgPricePerLiter: number;
}

export interface MonthlyMetrics {
  month: string;
  year: number;
  monthNum: number;
  expense: number;
  avgMileage: number;
  totalDistance: number;
  expenseChange: number | null;
  mileageChange: number | null;
}

export interface StationMetrics {
  station: string;
  totalSpent: number;
  avgMileage: number;
  fillCount: number;
}

function sortByDate(entries: FuelEntry[]) {
  return [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function computeFillMetrics(entries: FuelEntry[]): FillMetrics[] {
  const sorted = sortByDate(entries);

  return sorted.map((entry, index) => {
    if (index === 0) {
      return { entry, distance: null, mileage: null, costPerKm: null };
    }

    const prev = sorted[index - 1];
    const distance = entry.odometer - prev.odometer;

    if (distance <= 0 || prev.liters <= 0) {
      return { entry, distance: null, mileage: null, costPerKm: null };
    }

    // ✅ Correct fill-to-fill logic
    const mileage = distance / prev.liters;
    const costPerKm = prev.amount / distance;

    return {
      entry,
      distance,
      mileage: isFinite(mileage) ? mileage : null,
      costPerKm: isFinite(costPerKm) ? costPerKm : null,
    };
  });
}

export function computeGlobalMetrics(entries: FuelEntry[]): GlobalMetrics {
  const defaults: GlobalMetrics = {
    totalDistance: 0,
    totalLiters: 0,
    totalSpent: 0,
    avgMileage: 0,
    bestMileage: 0,
    worstMileage: 0,
    avgCostPerKm: 0,
    avgPricePerLiter: 0,
  };

  if (entries.length < 2) return defaults;

  const sorted = sortByDate(entries);
  const fillMetrics = computeFillMetrics(sorted);
  const validFills = fillMetrics.filter((f) => f.mileage !== null);

  // Total distance = last odometer reading (absolute reading on the dial)
  const totalDistance = sorted[sorted.length - 1].odometer;

  // Distance traveled between first and last fill (for mileage calculation)
  const distanceTraveled =
    sorted[sorted.length - 1].odometer - sorted[0].odometer;

  // Exclude last fill's fuel (not yet consumed) for mileage calculation
  const totalLiters = sorted
    .slice(0, -1)
    .reduce((sum, e) => sum + e.liters, 0);

  const totalSpent = sorted.reduce((sum, e) => sum + e.amount, 0);

  const mileages = validFills.map((f) => f.mileage!);
  const costs = validFills
    .filter((f) => f.costPerKm !== null)
    .map((f) => f.costPerKm!);

  return {
    totalDistance,
    totalLiters,
    totalSpent,
    avgMileage:
      totalLiters > 0 ? distanceTraveled / totalLiters : 0,
    bestMileage: mileages.length ? Math.max(...mileages) : 0,
    worstMileage: mileages.length ? Math.min(...mileages) : 0,
    avgCostPerKm:
      costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
    avgPricePerLiter:
      totalLiters > 0 ? totalSpent / sorted.reduce((s, e) => s + e.liters, 0) : 0,
  };
}

export function computeMonthlyMetrics(entries: FuelEntry[]): MonthlyMetrics[] {
  if (entries.length < 2) return [];

  const sorted = sortByDate(entries);
  const fillMetrics = computeFillMetrics(sorted);

  const monthMap = new Map<
    string,
    { fills: FillMetrics[]; entries: FuelEntry[] }
  >();

  fillMetrics.forEach((fm) => {
    const d = new Date(fm.entry.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    if (!monthMap.has(key)) {
      monthMap.set(key, { fills: [], entries: [] });
    }

    monthMap.get(key)!.fills.push(fm);
    monthMap.get(key)!.entries.push(fm.entry);
  });

  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => {
      const [yearStr, monthStr] = key.split("-");
      const expense = data.entries.reduce((sum, e) => sum + e.amount, 0);

      const validMileages = data.fills
        .filter((f) => f.mileage !== null)
        .map((f) => f.mileage!);

      const avgMileage =
        validMileages.length
          ? validMileages.reduce((a, b) => a + b, 0) /
          validMileages.length
          : 0;

      const totalDistance = data.fills
        .filter((f) => f.distance !== null)
        .reduce((sum, f) => sum + f.distance!, 0);

      return {
        month: key,
        year: parseInt(yearStr),
        monthNum: parseInt(monthStr),
        expense,
        avgMileage,
        totalDistance,
        expenseChange: null,
        mileageChange: null,
      };
    });

  for (let i = 1; i < months.length; i++) {
    const prev = months[i - 1];
    const curr = months[i];

    if (prev.expense > 0) {
      curr.expenseChange =
        ((curr.expense - prev.expense) / prev.expense) * 100;
    }

    if (prev.avgMileage > 0) {
      curr.mileageChange =
        ((curr.avgMileage - prev.avgMileage) / prev.avgMileage) * 100;
    }
  }

  return months;
}

export function computeStationMetrics(
  entries: FuelEntry[]
): StationMetrics[] {
  if (entries.length < 2) return [];

  const fillMetrics = computeFillMetrics(entries);
  const stationMap = new Map<
    string,
    { totalSpent: number; mileages: number[]; count: number }
  >();

  fillMetrics.forEach((fm) => {
    const station = fm.entry.station;
    if (!station) return;

    if (!stationMap.has(station)) {
      stationMap.set(station, {
        totalSpent: 0,
        mileages: [],
        count: 0,
      });
    }

    const data = stationMap.get(station)!;

    data.totalSpent += fm.entry.amount;
    data.count++;

    if (fm.mileage !== null) {
      data.mileages.push(fm.mileage);
    }
  });

  return Array.from(stationMap.entries()).map(([station, data]) => ({
    station,
    totalSpent: data.totalSpent,
    avgMileage:
      data.mileages.length
        ? data.mileages.reduce((a, b) => a + b, 0) /
        data.mileages.length
        : 0,
    fillCount: data.count,
  }));
}

export function computeRollingAverage(
  mileages: (number | null)[],
  window = 3
): (number | null)[] {
  return mileages.map((_, idx) => {
    const start = Math.max(0, idx - window + 1);
    const slice = mileages
      .slice(start, idx + 1)
      .filter((m): m is number => m !== null);

    if (!slice.length) return null;

    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function generateInsights(entries: FuelEntry[]): string[] {
  if (entries.length < 2) {
    return ["Add more fuel entries to see insights."];
  }

  const insights: string[] = [];
  const global = computeGlobalMetrics(entries);
  const monthly = computeMonthlyMetrics(entries);
  const stations = computeStationMetrics(entries);

  if (monthly.length >= 2) {
    const latest = monthly[monthly.length - 1];

    if (latest.mileageChange !== null) {
      const dir = latest.mileageChange >= 0 ? "improved" : "dropped";
      insights.push(
        `Mileage ${dir} by ${Math.abs(
          latest.mileageChange
        ).toFixed(1)}% compared to last month.`
      );
    }

    if (latest.expenseChange !== null) {
      const dir = latest.expenseChange >= 0 ? "more" : "less";
      insights.push(
        `You spent ${Math.abs(
          latest.expenseChange
        ).toFixed(1)}% ${dir} this month on fuel.`
      );
    }
  }

  if (stations.length > 0) {
    const best = [...stations].sort(
      (a, b) => b.avgMileage - a.avgMileage
    )[0];

    if (best.avgMileage > 0) {
      insights.push(
        `${best.station} gives you the highest average mileage at ${best.avgMileage.toFixed(
          1
        )} km/l.`
      );
    }
  }

  if (global.bestMileage > 0 && global.worstMileage > 0) {
    insights.push(
      `Best mileage recorded: ${global.bestMileage.toFixed(
        1
      )} km/l. Worst: ${global.worstMileage.toFixed(1)} km/l.`
    );
  }

  return insights.length
    ? insights
    : ["Add more fuel entries to see insights."];
}
