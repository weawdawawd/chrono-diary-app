import { NavLink, useLocation } from "react-router-dom";
import { Users, Link2, CalendarClock, ShieldCheck, LayoutDashboard, Library, ClipboardList, BookText, Timer, QrCode, MessageSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useUnreadChats } from "@/hooks/useUnreadChats";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Mitarbeiter", url: "/admin/employees", icon: Users },
  { title: "Einladungen", url: "/admin/invitations", icon: Link2 },
  { title: "Bestellungen", url: "/admin/shifts", icon: ClipboardList },
  { title: "Schicht-Sessions", url: "/admin/sessions", icon: Timer },
  { title: "Objekte & Tätigkeiten", url: "/admin/catalog", icon: Library },
  { title: "Wachbuch", url: "/admin/logbook", icon: BookText },
  { title: "Patrouille", url: "/admin/patrol", icon: QrCode },
  { title: "Chat", url: "/chat", icon: MessageSquare, badge: "chat" as const },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { total: unreadChats } = useUnreadChats();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <img src={(new URL("../../assets/ledion-logo.png", import.meta.url)).href} alt="Ledion" className="w-8 h-8 object-contain shrink-0" />
          {!collapsed && (
            <div className="leading-none">
              <div className="font-display font-bold text-sm text-sidebar-foreground">LEDION</div>
              <div className="font-display text-[9px] tracking-[0.25em] text-brand-red font-semibold -mt-0.5">SECURITY</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Verwaltung</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
                const showBadge = item.badge === "chat" && unreadChats > 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.end} className="flex items-center gap-2 relative">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {showBadge && !collapsed && (
                          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">{unreadChats}</Badge>
                        )}
                        {showBadge && collapsed && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
