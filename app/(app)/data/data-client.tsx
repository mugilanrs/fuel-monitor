"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { FuelEntry } from "@/lib/csv-utils";
import { STATIONS, generateId, formatCurrency, entriesToCSV } from "@/lib/csv-utils";
import { addEntry, deleteEntry, saveAllEntries } from "@/lib/actions";

const PAGE_SIZE = 10;

export function DataClient({ initialEntries }: { initialEntries: FuelEntry[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState<FuelEntry[]>(() =>
    [...initialEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  );
  const [page, setPage] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const paged = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleAdd = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const newEntry: FuelEntry = {
      id: generateId(),
      date: today,
      odometer: 0,
      liters: 0,
      amount: 0,
      price_per_liter: 0,
      station: STATIONS[0],
    };
    setEntries((prev) => {
      const updated = [...prev, newEntry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      return updated;
    });
    setDirty(true);
    // Navigate to last page where new entry will be
    const newTotal = Math.ceil((entries.length + 1) / PAGE_SIZE);
    setPage(newTotal - 1);
  }, [entries.length]);

  const handleDelete = useCallback(
    (id: string) => {
      startTransition(async () => {
        try {
          const updated = await deleteEntry(id);
          setEntries(
            [...updated].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
          );
          toast.success("Entry deleted");
          router.refresh();
        } catch {
          toast.error("Failed to delete entry");
        }
      });
    },
    [router]
  );

  const handleCellChange = useCallback(
    (id: string, field: keyof FuelEntry, value: string) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const updated = { ...e };
          if (field === "odometer" || field === "liters" || field === "amount") {
            (updated[field] as number) = parseFloat(value) || 0;
            if (updated.liters > 0) {
              updated.price_per_liter = parseFloat(
                (updated.amount / updated.liters).toFixed(2)
              );
            }
          } else if (field === "date" || field === "station") {
            (updated[field] as string) = value;
          }
          return updated;
        })
      );
      setDirty(true);
    },
    []
  );

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        const saved = await saveAllEntries(entries);
        setEntries(
          [...saved].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        );
        setDirty(false);
        toast.success("All changes saved");
        router.refresh();
      } catch {
        toast.error("Failed to save changes");
      }
    });
  }, [entries, router]);

  const handleExport = useCallback(() => {
    const csv = entriesToCSV(entries);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fuel-log.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }, [entries]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Data Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edit, manage, and export your fuel log data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAdd} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Add Row
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            variant={dirty ? "default" : "secondary"}
            disabled={!dirty || isPending}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button onClick={handleExport} size="sm" variant="outline" className="gap-1.5">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="neu-card rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Odometer (km)</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Liters</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Price/L</th>
                <th className="px-3 py-3 text-left font-medium text-muted-foreground">Station</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground w-12">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                    No entries yet. Click &quot;Add Row&quot; to start logging.
                  </td>
                </tr>
              ) : (
                paged.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleCellChange(entry.id, "date", e.target.value)}
                        className="h-8 text-xs bg-transparent border-transparent hover:border-input focus:border-input"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={entry.odometer || ""}
                        onChange={(e) => handleCellChange(entry.id, "odometer", e.target.value)}
                        placeholder="0"
                        className="h-8 text-xs bg-transparent border-transparent hover:border-input focus:border-input w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={entry.liters || ""}
                        onChange={(e) => handleCellChange(entry.id, "liters", e.target.value)}
                        placeholder="0"
                        className="h-8 text-xs bg-transparent border-transparent hover:border-input focus:border-input w-20"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={entry.amount || ""}
                        onChange={(e) => handleCellChange(entry.id, "amount", e.target.value)}
                        placeholder="0"
                        className="h-8 text-xs bg-transparent border-transparent hover:border-input focus:border-input w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-muted-foreground font-mono px-2">
                        {entry.price_per_liter > 0
                          ? formatCurrency(entry.price_per_liter)
                          : "--"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={entry.station}
                        onValueChange={(v) => handleCellChange(entry.id, "station", v)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-transparent border-transparent hover:border-input focus:border-input w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(entry.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sr-only">Delete entry</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} ({entries.length} entries)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {dirty && (
        <p className="text-xs text-muted-foreground">
          You have unsaved changes. Click &quot;Save Changes&quot; to persist them.
        </p>
      )}
    </div>
  );
}
