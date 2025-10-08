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

export function TopNavbar() {
  const { search, setSearch } = React.useContext(SearchContext);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
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
    // Fetch all data
    const leads = [];
    const reminders = [];
    const groups = [];
    // Removed campaigns feature
    // 1. Lead count milestones
    const leadMilestones = [5, 10, 20, 100, 200, 300, 400, 500, 1000, 1500];
    const leadMilestone = leadMilestones.filter(m => leads.length >= m).slice(-1)[0];
    // 2. Today's reminders
    const today = new Date().toISOString().slice(0, 10);
    const todaysReminders = reminders.filter(r => r.dueDate && r.dueDate.slice(0, 10) === today);
    // 3. Active campaigns
    const activeCampaigns = [];
    // 4. Group count milestones
    const groupMilestones = [10, 50, 100, 200];
    const groupMilestone = groupMilestones.filter(m => groups.length >= m).slice(-1)[0];
    // 5. Fake leads (use DetectFakeLeads logic: phone/email missing, or phone starts with 000/123/999)
    const fakeLeads = leads.filter(l => !l.phone || !l.email || /^(000|123|999)/.test(l.phone));
    // Build notifications
    const notifs = [];
    if (leadMilestone) notifs.push({ type: 'milestone', key: `leads-${leadMilestone}`, message: `Congratulations! You have reached ${leadMilestone} leads.` });
    todaysReminders.forEach(r => notifs.push({ type: 'reminder', key: `reminder-${r.id}`, message: `You have a reminder for ${r.leadName} today.` }));
    activeCampaigns.forEach(c => notifs.push({ type: 'campaign', key: `campaign-${c.id}`, message: `Campaign "${c.name}" is active.` }));
    if (groupMilestone) notifs.push({ type: 'group', key: `groups-${groupMilestone}`, message: `You have created ${groupMilestone} groups.` });
    // Removed fake lead notifications
    setNotifications(notifs);
  }, []);
  const router = useRouter();
  // Admin name state
  const [adminName, setAdminName] = useState('Admin User');
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
        <Button variant="ghost" size="sm" onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}