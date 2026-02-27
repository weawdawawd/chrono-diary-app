import { useState } from "react";
import { WorkEntry } from "@/lib/types";

const STORAGE_KEY = "work-entries";

function loadEntries(): WorkEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: WorkEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useWorkEntries() {
  const [entries, setEntries] = useState<WorkEntry[]>(loadEntries);

  const addEntry = (entry: Omit<WorkEntry, "id">) => {
    const newEntry: WorkEntry = { ...entry, id: crypto.randomUUID() };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  return { entries, addEntry, deleteEntry };
}
