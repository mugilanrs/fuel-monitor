"use server";

import { readEntries, writeEntries } from "./blob-storage";
import { generateId, type FuelEntry } from "./csv-utils";

export async function getEntries(): Promise<FuelEntry[]> {
  return readEntries();
}

export async function addEntry(
  data: Omit<FuelEntry, "id" | "price_per_liter">
): Promise<FuelEntry[]> {
  const entries = await readEntries();
  const pricePerLiter = data.liters > 0 ? data.amount / data.liters : 0;
  const newEntry: FuelEntry = {
    ...data,
    id: generateId(),
    price_per_liter: parseFloat(pricePerLiter.toFixed(2)),
  };
  entries.push(newEntry);
  await writeEntries(entries);
  return entries;
}

export async function updateEntry(updated: FuelEntry): Promise<FuelEntry[]> {
  const entries = await readEntries();
  const index = entries.findIndex((e) => e.id === updated.id);
  if (index === -1) throw new Error("Entry not found");

  updated.price_per_liter =
    updated.liters > 0
      ? parseFloat((updated.amount / updated.liters).toFixed(2))
      : 0;

  entries[index] = updated;
  await writeEntries(entries);
  return entries;
}

export async function deleteEntry(id: string): Promise<FuelEntry[]> {
  const entries = await readEntries();
  const filtered = entries.filter((e) => e.id !== id);
  await writeEntries(filtered);
  return filtered;
}

export async function saveAllEntries(entries: FuelEntry[]): Promise<FuelEntry[]> {
  const recalculated = entries.map((e) => ({
    ...e,
    price_per_liter: e.liters > 0 ? parseFloat((e.amount / e.liters).toFixed(2)) : 0,
  }));
  await writeEntries(recalculated);
  return recalculated;
}
