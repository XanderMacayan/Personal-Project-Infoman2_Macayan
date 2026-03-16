"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLibraryStore } from "@/hooks/use-library-store";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Users, GraduationCap, Briefcase, FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const { logs, isLoaded } = useLibraryStore();
  const [timeRange, setTimeRange] = useState("all");

  const filteredLogs = useMemo(() => {
    if (timeRange === "day") {
      return logs.filter(log => isWithinInterval(new Date(log.date), {
        start: startOfDay(new Date()),
        end: endOfDay(new Date())
      }));
    }
    if (timeRange === "week") {
      return logs.filter(log => isWithinInterval(new Date(log.date), {
        start: startOfWeek(new Date()),
        end: endOfWeek(new Date())
      }));
    }
    if (timeRange === "month") {
      return logs.filter(log => isWithinInterval(new Date(log.date), {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
      }));
    }
    return logs;
  }, [logs, timeRange]);

  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const employees = filteredLogs.filter(l => l.isEmployee).length;
    const students = total - employees;
    const uniqueVisitors = new Set(filteredLogs.map(l => l.visitorId)).size;

    return { total, employees, students, uniqueVisitors };
  }, [filteredLogs]);

  const purposeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      counts[log.purpose] = (counts[log.purpose] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  const dailyTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, "yyyy-MM-dd");
    }).reverse();

    return last7Days.map(date => {
      const count = logs.filter(l => l.date === date).length;
      return { date: format(new Date(date), "MMM dd"), count };
    });
  }, [logs]);

  const generatePDF = () => {
    // PDF Generation Simulation
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      stats,
      logs: filteredLogs
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neu_library_report_${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Library Statistics</h1>
          <p className="text-muted-foreground">Monitor visitor trends and usage data.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-none bg-primary text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/80 font-medium">Total Visitors</CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-primary-foreground/70">
              <Users className="w-4 h-4 mr-1" />
              {stats.uniqueVisitors} unique individuals
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Students</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">{stats.students}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4 mr-1" />
              Academic learners
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Faculty/Staff</CardDescription>
            <CardTitle className="text-3xl font-bold text-accent-foreground">{stats.employees}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Briefcase className="w-4 h-4 mr-1" />
              NEU Personnel
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Engagement Rate</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.total > 0 ? ((stats.uniqueVisitors / stats.total) * 100).toFixed(1) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="w-4 h-4 mr-1" />
              Return frequency
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg">Visitor Traffic (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader>
            <CardTitle className="text-lg">Purpose of Visit</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={purposeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {purposeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[`hsl(var(--primary))`, `hsl(var(--accent))`, "#94a3b8", "#334155", "#64748b"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}