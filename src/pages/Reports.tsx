import { useState, useEffect } from "react";
import { Calendar, Download, FileText, TrendingUp, Users, Target, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Legend,
  AreaChart,
  Area
} from "recharts";

// Fetch leads from backend (DB)
async function fetchLeadsFromDB() {
  const res = await fetch('/api/leads', { cache: 'no-store' });
  const data = await res.json();
  return (data.leads || []).map((l: any) => ({
    id: String(l.id),
    fullName: l.full_name,
    parentName: l.parent_name,
    createdAt: l.created_at,
    interestedCourse: l.interested_course,
    leadStatus: l.lead_status,
    inquirySource: l.inquiry_source,
    country: l.country,
  }));
}

export default function Reports() {
  const [period, setPeriod] = useState("monthly");
  const [leads, setLeads] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try { setLeads(await fetchLeadsFromDB()); } catch {}
    })();
  }, []);

  // Group leads by period
  const getPeriodKey = (date: Date) => {
    if (period === 'daily') return date.toLocaleDateString('en-US', { weekday: 'short' });
    if (period === 'weekly') return `Week ${Math.ceil(date.getDate() / 7)}`;
    if (period === 'monthly') return date.toLocaleDateString('en-US', { month: 'short' });
    if (period === 'yearly') return date.getFullYear().toString();
    return '';
  };
  const periodMap = new Map();
  leads.forEach(l => {
    if (!l.createdAt) return;
    const d = new Date(l.createdAt);
    const key = getPeriodKey(d);
    if (!periodMap.has(key)) periodMap.set(key, { leads: 0, conversions: 0, revenue: 0 });
    periodMap.get(key).leads++;
    if (l.leadStatus === 'Converted') periodMap.get(key).conversions++;
    // Revenue: if you have a revenue field, add it here
  });
  const currentData = Array.from(periodMap.entries()).map(([k, v]) => ({ period: k, ...v }));
  // Pie data for course interest
  const courseMap = new Map();
  leads.forEach(l => {
    if (!l.interestedCourse) return;
    if (!courseMap.has(l.interestedCourse)) courseMap.set(l.interestedCourse, 0);
    courseMap.set(l.interestedCourse, courseMap.get(l.interestedCourse) + 1);
  });
  const coursePieData = Array.from(courseMap.entries()).map(([name, value]) => ({ name, value, color: undefined }));

  // --- Real Data for Analytics ---
  const reminders: any[] = [];
  const groups: any[] = [];
  // Removed campaigns feature

  // 1. Daily/Weekly Lead Inflow
  const dailyMap = new Map();
  const weeklyMap = new Map();
  leads.forEach(l => {
    if (!l.createdAt) return;
    const d = new Date(l.createdAt);
    const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const week = `${d.getFullYear()}-W${Math.ceil((d.getDate() + 1) / 7)}`;
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    weeklyMap.set(week, (weeklyMap.get(week) || 0) + 1);
  });
  const dailyInflow = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));
  const weeklyInflow = Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }));

  // 2. Conversion Rate by Course and Source
  const courseStats: Record<string, { total: number; converted: number }> = {};
  const sourceStats: Record<string, { total: number; converted: number }> = {};
  leads.forEach(l => {
    // Course
    if (l.interestedCourse) {
      if (!courseStats[l.interestedCourse]) courseStats[l.interestedCourse] = { total: 0, converted: 0 };
      courseStats[l.interestedCourse].total++;
      if (l.leadStatus === 'Converted') courseStats[l.interestedCourse].converted++;
    }
    // Source
    if (l.inquirySource) {
      if (!sourceStats[l.inquirySource]) sourceStats[l.inquirySource] = { total: 0, converted: 0 };
      sourceStats[l.inquirySource].total++;
      if (l.leadStatus === 'Converted') sourceStats[l.inquirySource].converted++;
    }
  });

  // 3. Location-wise Lead Generation (Country-wise)
  const countryStats = {} as Record<string, number>;
  leads.forEach(l => {
    const key = l.country || 'Unknown';
    if (!countryStats[key]) countryStats[key] = 0;
    countryStats[key]++;
  });

  // Removed fake/suspicious leads report

  // 5. Campaign Performance Stats
  // (Assume campaigns have sentCount, replyCount, viewCount fields if available)

  const downloadPDF = () => {
    console.log("Downloading PDF report...");
    // Implementation would go here
  };

  const downloadExcel = () => {
    console.log("Downloading Excel report...");
    // Implementation would go here
  };

  const chartColors = [
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e42', // orange
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f472b6', // pink
    '#facc15', // yellow
    '#22d3ee', // sky
    '#a3e635', // lime
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your CRM performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={downloadExcel}>
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </Button>
        </div>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-primary" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily (This Week)</SelectItem>
                <SelectItem value="weekly">Weekly (This Month)</SelectItem>
                <SelectItem value="monthly">Monthly (This Year)</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.reduce((sum, item) => sum + item.leads, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.reduce((sum, item) => sum + item.conversions, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData.reduce((sum, item) => sum + item.leads, 0) > 0 ? ((currentData.reduce((sum, item) => sum + item.conversions, 0) / currentData.reduce((sum, item) => sum + item.leads, 0)) * 100).toFixed(1) : '0.0'}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads & Conversions Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Leads & Conversions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {currentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="conversions" stackId="2" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Course Interest Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Course Interest Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {coursePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={coursePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {coursePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  formatter={(value: any, entry: any) => {
                    const total = coursePieData.reduce((sum, d) => sum + (d.value || 0), 0);
                    const pct = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : '0.0';
                    return `${value} (${pct}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {currentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
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
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">Period</th>
                  <th className="border border-border p-2 text-right">Leads</th>
                  <th className="border border-border p-2 text-right">Conversions</th>
                  <th className="border border-border p-2 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? currentData.map((item, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="border border-border p-2">{item.period}</td>
                    <td className="border border-border p-2 text-right">{item.leads}</td>
                    <td className="border border-border p-2 text-right">{item.conversions}</td>
                    <td className="border border-border p-2 text-right">{(item.leads > 0 ? ((item.conversions / item.leads) * 100).toFixed(1) : '0.0')}%</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="text-center text-muted-foreground py-8">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- Reporting & Analytics Section (Charts) --- */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Course</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(courseStats).length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(courseStats).map(([course, stat]) => ({
                course,
                rate: stat.total > 0 ? (stat.converted / stat.total) * 100 : 0
              }))}>
                <XAxis dataKey="course" />
                <YAxis domain={[0, 100]} tickFormatter={v => v + '%'} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Bar dataKey="rate" name="Conversion %">
                  {Object.keys(courseStats).map((_, idx) => (
                    <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-muted-foreground">No data</div>}
        </CardContent>
      </Card>
      {/* Removed Conversion Rate by Counselor */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Source</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(sourceStats).length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(sourceStats).map(([source, stat]) => ({
                    name: source,
                    value: stat.total > 0 ? (stat.converted / stat.total) * 100 : 0
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={false}
                  labelLine={false}
                >
                  {Object.keys(sourceStats).map((_, idx) => (
                    <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  layout="horizontal"
                  formatter={(value: any, entry: any) => `${value} (${Number(entry?.payload?.value ?? 0).toFixed(1)}%)`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-muted-foreground">No data</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Location-wise Lead Generation (Country)</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(countryStats).length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={Object.entries(countryStats).map(([country, count]) => ({ country, count }))}>
                <XAxis dataKey="country" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count">
                  {Object.keys(countryStats).map((_, idx) => (
                    <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-muted-foreground">No data</div>}
        </CardContent>
      </Card>
      {/* Removed fake/suspicious leads and campaign performance sections */}
    </div>
  );
}