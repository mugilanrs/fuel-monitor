"use server";

import { generateId, type FuelEntry } from "./csv-utils";

/**
 * TEMPORARY in-memory storage.
 * This resets on each server restart.
 * Used only to stabilize deployment.
 */

let memoryStore: FuelEntry[] = [];

export async function getEntries(): Promise<FuelEntry[]> {
  return memoryStore;
}

export async function addEntry(
  data: Omit<FuelEntry, "id" | "price_per_liter">
): Promise<FuelEntry[]> {
  const pricePerLiter =
    data.liters > 0 ? parseFloat((data.amount / data.liters).toFixed(2)) : 0;

  const newEntry: FuelEntry = {
    ...data,
    id: generateId(),
    price_per_liter: pricePerLiter,
  };

  memoryStore.push(newEntry);
  return memoryStore;
}

export async function updateEntry(
  updated: FuelEntry
): Promise<FuelEntry[]> {
  const index = memoryStore.findIndex((e) => e.id === updated.id);
  if (index === -1) throw new Error("Entry not found");

  updated.price_per_liter =
    updated.liters > 0
      ? parseFloat((updated.amount / updated.liters).toFixed(2))
      : 0;

  memoryStore[index] = updated;
  return memoryStore;
}

export async function deleteEntry(id: string): Promise<FuelEntry[]> {
  memoryStore = memoryStore.filter((e) => e.id !== id);
  return memoryStore;
}

export async function saveAllEntries(
  entries: FuelEntry[]
): Promise<FuelEntry[]> {
  memoryStore = entries.map((e) => ({
    ...e,
    price_per_liter:
      e.liters > 0
        ? parseFloat((e.amount / e.liters).toFixed(2))
        : 0,
  }));

  return memoryStore;
}