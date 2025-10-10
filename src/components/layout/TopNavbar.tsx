import { Bell, Search, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchContext } from "@/context/SearchContext";
import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

// Notification type from API
type AppNotification = {
  id: number;
  type: string;
  title: string;
  message?: string;
  is_read?: 0 | 1;
  created_at?: string;
};

export function TopNavbar() {
  const { search, setSearch } = React.useContext(SearchContext);
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hideSearch = Boolean(pathname && (pathname.startsWith('/reports') || pathname.startsWith('/tasks') || pathname.startsWith('/settings')));
  const [page, setPage] = useState(1);
  const pageSize = 10;
  async function loadNotifications(p = page) {
    try {
      const res = await fetch(`/api/notifications?page=${p}&pageSize=${pageSize}&ts=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setNotifications((data.notifications || []) as AppNotification[]);
      setPage(data.page || p);
    } catch {}
  }
  useEffect(() => {
    loadNotifications();
    const i = setInterval(loadNotifications, 30000);
    return () => clearInterval(i);
  }, []);
  
  // Admin name state
  const [adminName, setAdminName] = useState('Admin User');
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  useEffect(() => {
    function handleAdminNameUpdate(e: any) {
      const { firstName, lastName } = e.detail || {};
      setAdminName(`${firstName || ''} ${lastName || ''}`.trim() || 'Admin User');
    }
    window.addEventListener('adminNameUpdate', handleAdminNameUpdate);
    return () => window.removeEventListener('adminNameUpdate', handleAdminNameUpdate);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <SidebarTrigger />
        {!hideSearch && (
          <div className="relative w-96 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, phone, email, parent (comma separated)..."
              className="pl-10 bg-muted/50 border-muted-foreground/20"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4 mr-24">
        <Button variant="ghost" size="sm" onClick={toggleDarkMode} aria-label="Toggle dark mode" suppressHydrationWarning>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={async () => {
              const next = !showNotifications;
              setShowNotifications(next);
              try {
                // Run server scans (lead thresholds + due-soon reminders), then refresh
                await fetch('/api/notifications', { method: 'PATCH' });
                await loadNotifications();
              } catch {}
            }}
          >
            <Bell className="w-5 h-5" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </Button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded shadow-lg z-50 max-h-96 overflow-auto">
              <div className="p-3 font-bold border-b flex items-center justify-between">
                <span>Notifications</span>
                <button className="text-xs text-primary hover:underline" onClick={() => loadNotifications()}>Refresh</button>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-muted-foreground text-center">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 border-b last:border-b-0 text-sm">
                    <div className="font-medium">{n.title}</div>
                    {n.message && <div className="text-xs text-muted-foreground mt-1">{n.message}</div>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</span>
                      {n.is_read === 0 && (
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={async () => {
                            await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: n.id }) });
                            await loadNotifications();
                          }}
                        >Mark read</button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {notifications.length >= pageSize && (
                <div className="p-2 text-center">
                  <button
                    className="text-sm text-primary hover:underline"
                    onClick={async () => { const next = page + 1; await loadNotifications(next); }}
                  >Read more</button>
                </div>
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block font-medium">{adminName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border border-border">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}