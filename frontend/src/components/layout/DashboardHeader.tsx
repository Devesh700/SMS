"use client";
import { Bell, Search, Sun, Moon, LogOut, User, ChevronDown } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { logout } from "@/store/slices/authSlice";
import { setTheme } from "@/store/slices/uiSlice";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useGetNotificationsQuery } from "@/store/api/allApis";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function DashboardHeader() {
  const { user } = useAppSelector((s) => s.auth);
  const { unreadCount } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const { resolvedTheme, setTheme: setNextTheme } = useTheme();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: notifData } = useGetNotificationsQuery();
  const totalUnread = notifData?.data?.unreadCount ?? unreadCount;

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth/login");
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setNextTheme(next);
    dispatch(setTheme(next));
  };

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search students, teachers..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 rounded-lg border border-transparent focus:border-primary focus:outline-none focus:bg-background transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 ml-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => router.push("/dashboard/notifications")}
        >
          <Bell className="w-4 h-4" />
          {totalUnread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace("_", " ")}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
              <button
                onClick={() => { setShowUserMenu(false); router.push("/dashboard/settings/profile"); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
