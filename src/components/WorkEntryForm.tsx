import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { WorkEntry } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  onAdd: (entry: Omit<WorkEntry, "id">) => void;
}

export default function WorkEntryForm({ onAdd }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }
    onAdd({
      date,
      startTime,
      endTime,
      location: location.trim(),
      description: description.trim(),
    });
    setLocation("");
    setDescription("");
    toast.success("Eintrag gespeichert!");
  };

  return (
    <Card className="border-2 border-dashed border-accent/40 bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Plus className="w-4 h-4 text-accent-foreground" />
          </span>
          Neuer Eintrag
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Datum</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="start">Von</Label>
              <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">Bis</Label>
              <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Ort</Label>
            <Input
              id="location"
              placeholder="z.B. Büro Berlin, Baustelle München..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Tätigkeit</Label>
            <Textarea
              id="desc"
              placeholder="Was hast du gemacht?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Eintrag speichern
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
