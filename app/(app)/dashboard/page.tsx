import { getEntries } from "@/lib/actions";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const entries = await getEntries();
  return <DashboardClient entries={entries} />;
}
