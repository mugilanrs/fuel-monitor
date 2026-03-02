import { getEntries } from "@/lib/actions";
import { DataClient } from "./data-client";

export default async function DataPage() {
  const entries = await getEntries();
  return <DataClient initialEntries={entries} />;
}
