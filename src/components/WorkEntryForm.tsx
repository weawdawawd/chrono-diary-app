import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onAdd: (entry: {
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
  }) => void;
  savedLocations: string[];
}

export default function WorkEntryForm({ onAdd, savedLocations }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const filteredLocations = savedLocations.filter((l) =>
    l.toLowerCase().includes(location.toLowerCase()) && l.toLowerCase() !== location.toLowerCase()
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
          <div className="space-y-1.5 relative" ref={locationRef}>
            <Label htmlFor="location">Ort</Label>
            <Input
              id="location"
              placeholder="z.B. Büro Berlin, Baustelle München..."
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              maxLength={200}
            />
            {showSuggestions && filteredLocations.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                    onClick={() => {
                      setLocation(loc);
                      setShowSuggestions(false);
                    }}
                  >
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    {loc}
                  </button>
                ))}
              </div>
            )}
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
