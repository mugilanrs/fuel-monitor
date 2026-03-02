import { getEntries } from "@/lib/actions";
import { FinanceClient } from "./finance-client";

export default async function FinancePage() {
  const entries = await getEntries();
  return <FinanceClient entries={entries} />;
}
