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
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Minimal notification type for local state
type AppNotification = {
  key: string;
  message: string;
};

export function TopNavbar() {
  const { search, setSearch } = React.useContext(SearchContext);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    try {
      const isDark = localStorage.getItem('theme') === 'dark';
      setDarkMode(isDark);
    } catch {}
  }, []);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  useEffect(() => {
    // Notifications generation simplified. Campaigns and other heavy logic removed.
    setNotifications([]);
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
    function handleAdminNameUpdate(e) {
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
        <div className="relative w-96 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, phone, email, parent (comma separated)..."
            className="pl-10 bg-muted/50 border-muted-foreground/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" suppressHydrationWarning>
          {mounted ? (darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <Moon className="w-5 h-5" />}
        </Button>
        <div className="relative">
          <Button variant="ghost" size="sm" className="relative" onClick={() => setShowNotifications(v => !v)}>
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded shadow-lg z-50 max-h-96 overflow-auto">
              <div className="p-3 font-bold border-b">Notifications</div>
              {notifications.length === 0 ? (
                <div className="p-4 text-muted-foreground text-center">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.key} className="p-3 border-b last:border-b-0 text-sm">
                    {n.message}
                  </div>
                ))
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