import { useState } from "react";
import { WorkEntry, calculateDuration, calculateDurationMinutes } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Clock, Calendar, Trash2, FileText, Pencil, Check, X, Copy, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Props {
  entries: WorkEntry[];
  onDelete: (id: string) => void;
  onEdit?: (id: string, updates: { date: string; start_time: string; end_time: string; location: string; description: string }) => void;
  onDuplicate?: (entry: { date: string; startTime: string; endTime: string; location: string; description: string }) => void;
}

export default function WorkEntryList({ entries, onDelete, onEdit, onDuplicate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ date: "", start_time: "", end_time: "", location: "", description: "" });

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-display font-semibold text-lg text-foreground">Noch keine Einträge</p>
        <p className="text-sm text-muted-foreground mt-1">Füge deinen ersten Arbeitseintrag hinzu.</p>
      </motion.div>
    );
  }

  const grouped = entries.reduce<Record<string, WorkEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const startEdit = (entry: WorkEntry) => {
    setEditingId(entry.id);
    setEditData({
      date: entry.date,
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5),
      location: entry.location,
      description: entry.description,
    });
  };

  const saveEdit = () => {
    if (editingId && onEdit) {
      onEdit(editingId, editData);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {sortedDates.map((date) => {
          const dayMinutes = grouped[date].reduce(
            (sum, e) => sum + calculateDurationMinutes(e.start_time, e.end_time), 0
          );
          const dayH = Math.floor(dayMinutes / 60);
          const dayM = dayMinutes % 60;

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-foreground">
                    {format(parseISO(date), "EEEE, d. MMMM", { locale: de })}
                  </h3>
                </div>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {dayH}h {dayM.toString().padStart(2, "0")}m
                </span>
              </div>
              <div className="space-y-2">
                {grouped[date].map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="group bg-card hover:shadow-md transition-all border-l-4 border-l-primary/20 hover:border-l-primary/60">
                      <CardContent className="p-4">
                        {editingId === entry.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <Input type="date" value={editData.date} onChange={(e) => setEditData(d => ({ ...d, date: e.target.value }))} className="text-xs h-9" />
                              <Input type="time" value={editData.start_time} onChange={(e) => setEditData(d => ({ ...d, start_time: e.target.value }))} className="text-xs h-9" />
                              <Input type="time" value={editData.end_time} onChange={(e) => setEditData(d => ({ ...d, end_time: e.target.value }))} className="text-xs h-9" />
                            </div>
                            <Input value={editData.location} onChange={(e) => setEditData(d => ({ ...d, location: e.target.value }))} placeholder="Ort" className="text-xs h-9" />
                            <Textarea value={editData.description} onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))} rows={2} className="text-xs" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit} className="h-8 text-xs"><Check className="w-3.5 h-3.5 mr-1" /> Speichern</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-xs"><X className="w-3.5 h-3.5 mr-1" /> Abbrechen</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                  <Clock className="w-3.5 h-3.5 text-primary" />
                                  {entry.start_time.slice(0, 5)} – {entry.end_time.slice(0, 5)}
                                  <span className="text-muted-foreground font-normal text-xs">
                                    ({calculateDuration(entry.start_time, entry.end_time)})
                                  </span>
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                  <MapPin className="w-3.5 h-3.5 text-accent" />
                                  {entry.location}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/70 flex items-start gap-1.5">
                                <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/50 shrink-0" />
                                {entry.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {onDuplicate && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => onDuplicate({
                                    date: new Date().toISOString().split("T")[0],
                                    startTime: entry.start_time.slice(0, 5),
                                    endTime: entry.end_time.slice(0, 5),
                                    location: entry.location,
                                    description: entry.description,
                                  })}
                                  aria-label="Duplizieren"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => startEdit(entry)}
                                  aria-label="Bearbeiten"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => onDelete(entry.id)}
                                aria-label="Löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
