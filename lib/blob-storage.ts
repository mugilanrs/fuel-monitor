import { put, list } from "@vercel/blob";
import { CSV_HEADERS, parseCSV, entriesToCSV, type FuelEntry } from "./csv-utils";

const BLOB_FILENAME = "fuel-log.csv";

async function findBlobUrl(): Promise<string | null> {
  const { blobs } = await list();
  const match = blobs.find((b) => b.pathname === BLOB_FILENAME);
  return match?.url ?? null;
}

export async function readEntries(): Promise<FuelEntry[]> {
  const url = await findBlobUrl();
  if (!url) {
    // Create initial CSV with headers only
    await put(BLOB_FILENAME, CSV_HEADERS + "\n", {
      access: "public",
      addRandomSuffix: false,
    });
    return [];
  }

  const response = await fetch(url, { cache: "no-store" });
  const text = await response.text();
  return parseCSV(text);
}

export async function writeEntries(entries: FuelEntry[]): Promise<void> {
  const csv = entriesToCSV(entries);
  await put(BLOB_FILENAME, csv, {
    access: "public",
    addRandomSuffix: false,
  });
}
