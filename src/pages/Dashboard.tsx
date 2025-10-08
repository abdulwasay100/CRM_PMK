import { 
  Users, 
  CheckSquare, 
  TrendingUp, 
  UserPlus, 
  Clock, 
  Target, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
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
      } catch {}
    })();
  }, []);

  // Removed campaigns feature

  // Data for charts now comes from API: leadsBySource, monthlyData
  const hasMonthlyData = monthlyData.some(d => d.leads > 0 || d.conversions > 0);

  // Recent leads
  const recentLeads = [...leads].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 3);
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
            <p className="text-xs text-muted-foreground">
              ₹0 revenue
            </p>
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
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{lead.fullName}</p>
                    <p className="text-sm text-muted-foreground">{lead.interestedCourse} • {lead.city}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.leadStatus === 'New' ? 'bg-primary-light text-primary' :
                      lead.leadStatus === 'Contacted' ? 'bg-warning-light text-warning' :
                      lead.leadStatus === 'Converted' ? 'bg-success-light text-success' :
                      'bg-destructive-light text-destructive'
                    }`}>
                      {lead.leadStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{task.leadName}</p>
                    <p className="text-sm text-muted-foreground">{task.type} {task.notes ? `• ${task.notes}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="text-center text-muted-foreground">No pending reminders</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}