import { WorkEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  entry: WorkEntry;
  onDuplicate: (entry: {
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
  }) => void;
}

export default function DuplicateButton({ entry, onDuplicate }: Props) {
  const handleDuplicate = () => {
    const today = new Date().toISOString().split("T")[0];
    onDuplicate({
      date: today,
      startTime: entry.start_time.slice(0, 5),
      endTime: entry.end_time.slice(0, 5),
      location: entry.location,
      description: entry.description,
    });
    toast.success("Eintrag dupliziert für heute!");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={handleDuplicate}
      aria-label="Duplizieren"
    >
      <Copy className="w-3.5 h-3.5" />
    </Button>
  );
}
