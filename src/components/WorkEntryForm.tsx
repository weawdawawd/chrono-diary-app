import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="bg-card border-2 border-dashed border-accent/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-sm">
            <Plus className="w-4 h-4 text-accent-foreground" />
          </div>
          <h2 className="font-display font-bold text-base">Neuer Eintrag</h2>
        </div>
        <div className="px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs font-medium">Datum</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="start" className="text-xs font-medium">Von</Label>
                <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end" className="text-xs font-medium">Bis</Label>
                <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-10" />
              </div>
            </div>
            <div className="space-y-1 relative" ref={locationRef}>
              <Label htmlFor="location" className="text-xs font-medium">Ort</Label>
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
                className="h-10"
              />
              {showSuggestions && filteredLocations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg overflow-hidden"
                >
                  {filteredLocations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                      onClick={() => {
                        setLocation(loc);
                        setShowSuggestions(false);
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                      {loc}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc" className="text-xs font-medium">Tätigkeit</Label>
              <Textarea
                id="desc"
                placeholder="Was hast du gemacht?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto h-10">
              <Send className="w-4 h-4 mr-1.5" />
              Eintrag speichern
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
