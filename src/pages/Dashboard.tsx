import { 
  Users, 
  CheckSquare, 
  TrendingUp, 
  UserPlus, 
  Clock, 
  Target, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  GraduationCap,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import React, { useEffect, useState } from "react";
import { SearchContext } from "@/context/SearchContext";
import { useRouter } from "next/navigation";

const leadsBySource = [
  { name: "Website", value: 45, color: "#3B82F6" },
  { name: "Social Media", value: 32, color: "#10B981" },
  { name: "Referral", value: 28, color: "#F59E0B" },
  { name: "Advertisement", value: 25, color: "#EF4444" },
  { name: "Walk-in", value: 15, color: "#8B5CF6" },
  { name: "Phone Call", value: 11, color: "#06B6D4" }
];

const monthlyData = [
  { month: "Jan", leads: 45, conversions: 12 },
  { month: "Feb", leads: 52, conversions: 15 },
  { month: "Mar", leads: 48, conversions: 11 },
  { month: "Apr", leads: 61, conversions: 18 },
  { month: "May", leads: 55, conversions: 14 },
  { month: "Jun", leads: 67, conversions: 21 }
];

async function fetchDashboardMetrics() {
  const res = await fetch('/api/dashboard/metrics', { cache: 'no-store' });
  return res.json();
}

export default function Dashboard() {
  const [leads, setLeads] = React.useState<any[]>([]);
  const [reminders, setReminders] = React.useState<any[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [{ totalLeads, newLeadsToday, conversionRate }, setTotals] = React.useState({ totalLeads: 0, newLeadsToday: 0, conversionRate: 0 });
  const [leadsBySource, setLeadsBySourceState] = React.useState<any[]>([]);
  const [monthlyData, setMonthlyDataState] = React.useState<any[]>([]);
  // Recent leads status filter
  const [activeRecentLeadsStatus, setActiveRecentLeadsStatus] = React.useState<'all' | 'New' | 'Contacted' | 'Converted' | 'Not Interested'>('all');
  const [reminderCategories, setReminderCategories] = React.useState<any>({});
  const [activeReminderSection, setActiveReminderSection] = React.useState<'default' | 'pending' | 'inProgress' | 'completed'>('default');
  const navigate = useRouter();
  React.useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const data = await fetchDashboardMetrics();
        setLeads(data.recentLeads || []);
        setReminders(data.pendingTasks || []);
        setTotals({
          totalLeads: data.totals?.totalLeads || 0,
          newLeadsToday: data.totals?.newLeadsToday || 0,
          conversionRate: data.totals?.conversionRate || 0,
        });
        setMonthlyDataState(data.monthly || []);
        setLeadsBySourceState(data.leadsBySource || []);
        setReminderCategories(data.reminderCategories || {});
      } catch {}
    })();
  }, []);

  // Removed campaigns feature

  // Data for charts now comes from API: leadsBySource, monthlyData
  const hasMonthlyData = monthlyData.some(d => d.leads > 0 || d.conversions > 0);

  // DB search for dashboard (no localStorage)
  const { search } = React.useContext(SearchContext);
  const normalizedQuery = (search || '').trim().toLowerCase();
  const allLeadsSorted = React.useMemo(() => (
    [...leads].sort((a, b) => (b.created_at || b.createdAt || '').localeCompare(a.created_at || a.createdAt || ''))
  ), [leads]);
  const searchMatches = React.useMemo(() => {
    if (!normalizedQuery) return allLeadsSorted;
    const qDigits = normalizedQuery.replace(/\D/g, '');
    return allLeadsSorted.filter((l: any) => {
      const name = (l.full_name || l.fullName || '').toLowerCase();
      const parent = (l.parent_name || l.parentName || '').toLowerCase();
      const email = (l.email || '').toLowerCase();
      const city = (l.city || '').toLowerCase();
      const course = (l.interested_course || l.interestedCourse || '').toLowerCase();
      const phoneDigits = String(l.phone || '').replace(/\D/g, '');
      return (
        name.includes(normalizedQuery) ||
        parent.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        city.includes(normalizedQuery) ||
        course.includes(normalizedQuery) ||
        (qDigits && phoneDigits.includes(qDigits))
      );
    });
  }, [allLeadsSorted, normalizedQuery]);
  const isSearching = Boolean(normalizedQuery);
  const recentLeads = isSearching ? searchMatches : allLeadsSorted.slice(0, 15);
  const recentLeadsCounts = React.useMemo(() => {
    const getStatus = (l: any) => (l.lead_status || l.leadStatus) as 'New' | 'Contacted' | 'Converted' | 'Not Interested' | undefined;
    const counts = { all: recentLeads.length, New: 0, Contacted: 0, Converted: 0, 'Not Interested': 0 } as Record<string, number>;
    recentLeads.forEach((l: any) => {
      const s = getStatus(l);
      if (s && counts[s] !== undefined) counts[s] += 1;
    });
    return counts;
  }, [recentLeads]);
  const filteredRecentLeads = React.useMemo(() => {
    if (activeRecentLeadsStatus === 'all') return recentLeads;
    return recentLeads.filter((l: any) => (l.lead_status || l.leadStatus) === activeRecentLeadsStatus);
  }, [recentLeads, activeRecentLeadsStatus]);
  const pendingTasks = reminders.filter(task => task.status === "Pending").slice(0, 3);

  // After leadsBySource is defined, calculate total leads and add percentage to each source
  const totalLeadsForSource = leadsBySource.reduce((sum, s) => sum + s.value, 0);
  const leadsBySourceWithPercent = leadsBySource.map(s => ({
    ...s,
    percent: totalLeadsForSource > 0 ? Math.round((s.value / totalLeadsForSource) * 100) : 0
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your CRM.</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" onClick={() => navigate.push("/leads/add")}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add New Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-success flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +{newLeadsToday} today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
            <CheckSquare className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders.filter(t => t.status === 'Pending').length}</div>
            <p className="text-xs text-success flex items-center">
              <ArrowDownRight className="w-3 h-3 mr-1" />
              {reminders.filter(t => t.status === 'Completed').length} completed
            </p>
          </CardContent>
        </Card>

        {/* Removed campaigns card */}

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {!mounted ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Loading chart...</div>
            ) : hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" name="Leads" />
                  <Bar dataKey="conversions" fill="hsl(var(--success))" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {!mounted ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Loading chart...</div>
            ) : leads.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadsBySourceWithPercent}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={false}
                  >
                    {leadsBySourceWithPercent.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    formatter={(value, entry) => {
                      const item = leadsBySourceWithPercent.find(s => s.name === value);
                      return `${value} (${item ? item.percent : 0}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle>{isSearching ? `Search Results (${recentLeads.length})` : `Recent Leads (${recentLeads.length})`}</CardTitle>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button
                variant={activeRecentLeadsStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveRecentLeadsStatus('all')}
              >
                All ({recentLeadsCounts.all})
              </Button>
              <Button
                variant={activeRecentLeadsStatus === 'New' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveRecentLeadsStatus('New')}
              >
                New ({recentLeadsCounts['New'] || 0})
              </Button>
              <Button
                variant={activeRecentLeadsStatus === 'Contacted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveRecentLeadsStatus('Contacted')}
              >
                Contacted ({recentLeadsCounts['Contacted'] || 0})
              </Button>
              <Button
                variant={activeRecentLeadsStatus === 'Converted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveRecentLeadsStatus('Converted')}
              >
                Converted ({recentLeadsCounts['Converted'] || 0})
              </Button>
              <Button
                variant={activeRecentLeadsStatus === 'Not Interested' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveRecentLeadsStatus('Not Interested')}
              >
                Not Interested ({recentLeadsCounts['Not Interested'] || 0})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredRecentLeads.map((lead: any) => (
                <div key={lead.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-base">{lead.full_name || lead.fullName}</p>
                      <p className="text-sm text-muted-foreground">{(lead.parent_name || lead.parentName) && `Parent: ${lead.parent_name || lead.parentName}`}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (lead.lead_status || lead.leadStatus) === 'New' ? 'bg-primary-light text-primary' :
                      (lead.lead_status || lead.leadStatus) === 'Contacted' ? 'bg-warning-light text-warning' :
                      (lead.lead_status || lead.leadStatus) === 'Converted' ? 'bg-success-light text-success' :
                      'bg-destructive-light text-destructive'
                    }`}>
                      {lead.lead_status || lead.leadStatus}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{lead.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{lead.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{lead.interested_course || lead.interestedCourse || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{lead.city}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created: {new Date(lead.created_at || lead.createdAt).toLocaleDateString()}</span>
                      <span>Age: {lead.age || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentLeads.length === 0 && (
                <div className="text-center text-muted-foreground py-8">{isSearching ? 'No leads match your search' : 'No recent leads found'}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reminders Section */}
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
            <div className="flex gap-2 mt-2">
              <Button 
                variant={activeReminderSection === 'default' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveReminderSection('default')}
              >
                All ({reminders.length})
              </Button>
              <Button 
                variant={activeReminderSection === 'pending' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveReminderSection('pending')}
              >
                Pending ({reminderCategories.pending?.length || 0})
              </Button>
              <Button 
                variant={activeReminderSection === 'inProgress' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveReminderSection('inProgress')}
              >
                In Progress ({reminderCategories.inProgress?.length || 0})
              </Button>
              <Button 
                variant={activeReminderSection === 'completed' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveReminderSection('completed')}
              >
                Completed ({reminderCategories.completed?.length || 0})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(() => {
                let displayTasks = [];
                switch (activeReminderSection) {
                  case 'pending':
                    displayTasks = reminderCategories.pending || [];
                    break;
                  case 'inProgress':
                    displayTasks = reminderCategories.inProgress || [];
                    break;
                  case 'completed':
                    displayTasks = reminderCategories.completed || [];
                    break;
                  default:
                    displayTasks = reminders;
                }
                
                return displayTasks.map((task: any) => (
                  <div key={task.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-base">{task.lead_name || task.leadName}</p>
                        <p className="text-sm text-muted-foreground">Type: {task.type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'Pending' ? 'bg-warning-light text-warning' :
                        task.status === 'In Progress' ? 'bg-primary-light text-primary' :
                        'bg-success-light text-success'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {task.notes && (
                        <div className="flex items-start gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">{task.notes}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Due: {new Date(task.due_date || task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(task.created_at || task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ));
              })()}
              {(() => {
                let displayTasks = [];
                switch (activeReminderSection) {
                  case 'pending':
                    displayTasks = reminderCategories.pending || [];
                    break;
                  case 'inProgress':
                    displayTasks = reminderCategories.inProgress || [];
                    break;
                  case 'completed':
                    displayTasks = reminderCategories.completed || [];
                    break;
                  default:
                    displayTasks = reminders;
                }
                return displayTasks.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No {activeReminderSection === 'default' ? '' : activeReminderSection} reminders found
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}