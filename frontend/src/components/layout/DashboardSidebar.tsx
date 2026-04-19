"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CreditCard,
  ClipboardList, UserPlus, MessageSquare, Settings, ChevronLeft,
  Building2, Bell, BarChart3
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/dashboard/students", icon: Users },
  { label: "Teachers", href: "/dashboard/teachers", icon: GraduationCap },
  { label: "Classes", href: "/dashboard/classes", icon: BookOpen },
  { label: "Fees", href: "/dashboard/fees", icon: CreditCard },
  { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
  { label: "Admissions", href: "/dashboard/admissions", icon: UserPlus },
  { label: "Communication", href: "/dashboard/communication", icon: MessageSquare },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector((s) => s.ui);
  const { tenant } = useAppSelector((s) => s.auth);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-card transition-all duration-300 shrink-0",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / School Name */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{tenant?.name || "SchoolSaaS"}</p>
            <p className="text-xs text-muted-foreground capitalize">{tenant?.plan || "basic"} plan</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-link",
                isActive && "active",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            sidebarCollapsed && "justify-center"
          )}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
