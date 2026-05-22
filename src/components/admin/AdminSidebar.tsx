import { NavLink, useLocation } from "react-router-dom";
import { Users, Link2, CalendarClock, ShieldCheck, LayoutDashboard, Library, ClipboardList, BookText } from "lucide-react";
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

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Mitarbeiter", url: "/admin/employees", icon: Users },
  { title: "Einladungen", url: "/admin/invitations", icon: Link2 },
  { title: "Bestellungen", url: "/admin/shifts", icon: ClipboardList },
  { title: "Objekte & Tätigkeiten", url: "/admin/catalog", icon: Library },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

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
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
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
