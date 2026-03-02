import Papa from "papaparse";

export interface FuelEntry {
  id: string;
  date: string;
  odometer: number;
  liters: number;
  amount: number;
  price_per_liter: number;
  station: string;
}

export const STATIONS = [
  "Bharat Petroleum",
  "Hindustan Petroleum",
  "Shell",
  "Nayara",
  "Indian Oil",
] as const;

export const CSV_HEADERS = "id,date,odometer,liters,amount,price_per_liter,station";

export function parseCSV(csvString: string): FuelEntry[] {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row) => ({
    id: row.id || generateId(),
    date: row.date || "",
    odometer: parseFloat(row.odometer) || 0,
    liters: parseFloat(row.liters) || 0,
    amount: parseFloat(row.amount) || 0,
    price_per_liter: parseFloat(row.price_per_liter) || 0,
    station: row.station || "",
  }));
}

export function entriesToCSV(entries: FuelEntry[]): string {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return Papa.unparse(sorted, {
    columns: ["id", "date", "odometer", "liters", "amount", "price_per_liter", "station"],
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}
