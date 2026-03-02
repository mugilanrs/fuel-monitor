import { getEntries } from "@/lib/actions";
import { MileageClient } from "./mileage-client";

export default async function MileagePage() {
  const entries = await getEntries();
  return <MileageClient entries={entries} />;
}
