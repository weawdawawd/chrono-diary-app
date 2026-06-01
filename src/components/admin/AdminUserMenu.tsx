import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, Moon, Sun, UserCog } from "lucide-react";
import AccountSettingsDialog from "@/components/admin/AccountSettingsDialog";

interface Props {
  email?: string;
  userId?: string;
  onSignOut: () => void;
}

export default function AdminUserMenu({ email, userId, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Menü">
            <Menu className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {email && (
            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground truncate">
              {email}
            </DropdownMenuLabel>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setAccountOpen(true); setOpen(false); }}>
            <UserCog className="w-4 h-4 mr-2 text-accent" /> E-Mail & Passwort
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setDark((d) => !d); }}>
            {dark ? <Sun className="w-4 h-4 mr-2 text-accent" /> : <Moon className="w-4 h-4 mr-2 text-accent" />}
            {dark ? "Heller Modus" : "Dunkler Modus"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog
        currentEmail={email}
        userId={userId}
        controlledOpen={accountOpen}
        onOpenChange={setAccountOpen}
        hideTrigger
      />
    </>
  );
}
