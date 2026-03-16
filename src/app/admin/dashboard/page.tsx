
"use client"

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLibraryStore } from "@/hooks/use-library-store";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Users, GraduationCap, Briefcase, BookOpen, Download, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const { logs, isLoaded } = useLibraryStore();
  const [timeRange, setTimeRange] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!mounted) return [];
    
    const now = new Date();
    if (timeRange === "day") {
      return logs.filter(log => isWithinInterval(new Date(log.date), {
        start: startOfDay(now),
        end: endOfDay(now)
      }));
    }
    if (timeRange === "week") {
      return logs.filter(log => isWithinInterval(new Date(log.date), {
        start: startOfWeek(now),
        end: endOfWeek(now)
      }));
    }
    if (timeRange === "month") {
      return logs.filter(log => isWithinInterval(new Date(log.date), {
        start: startOfMonth(now),
        end: endOfMonth(now)
      }));
    }
    return logs;
  }, [logs, timeRange, mounted]);

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
    if (!mounted) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, "yyyy-MM-dd");
    }).reverse();

    return last7Days.map(date => {
      const count = logs.filter(l => l.date === date).length;
      return { date: format(new Date(date), "MMM dd"), count };
    });
  }, [logs, mounted]);

  const generateReport = () => {
    const reportData = {
      reportType: "Library Patronage Report",
      generatedAt: new Date().toISOString(),
      timeRange,
      metrics: stats,
      rawLogs: filteredLogs
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neu_library_patronage_${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isLoaded || !mounted) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Patronage Analytics</h1>
          <p className="text-muted-foreground font-medium">Monitoring the intellectual pulse of the university.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white border-2">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Historical Data</SelectItem>
              <SelectItem value="day">Today's Visits</SelectItem>
              <SelectItem value="week">Weekly View</SelectItem>
              <SelectItem value="month">Monthly Overview</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="default" onClick={generateReport} className="bg-primary hover:bg-primary/90 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Export Archive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg border-none bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BookOpen size={64} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs">Total Patronage</CardDescription>
            <CardTitle className="text-4xl font-black">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-primary-foreground/70 font-medium">
              <Users className="w-4 h-4 mr-2" />
              {stats.uniqueVisitors} unique scholars
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-none border-t-4 border-t-accent bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Student Learners</CardDescription>
            <CardTitle className="text-4xl font-black text-primary">{stats.students}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground font-medium">
              <GraduationCap className="w-4 h-4 mr-2 text-accent" />
              Active student research
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none border-t-4 border-t-primary bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Faculty & Staff</CardDescription>
            <CardTitle className="text-4xl font-black text-primary">{stats.employees}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground font-medium">
              <Briefcase className="w-4 h-4 mr-2 text-primary" />
              Institutional personnel
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-none border-t-4 border-t-accent bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Engagement Index</CardDescription>
            <CardTitle className="text-4xl font-black text-accent">
              {stats.total > 0 ? ((stats.uniqueVisitors / stats.total) * 100).toFixed(1) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground font-medium">
              <Activity className="w-4 h-4 mr-2 text-accent" />
              Return frequency rate
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-2 border-muted/50 bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-primary">Scholarly Traffic Flow</CardTitle>
              <CardDescription>Daily visitor volume for the past week.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 3, stroke: "#fff" }}
                  activeDot={{ r: 10, strokeWidth: 4, stroke: "#fff", fill: "hsl(var(--accent))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-2 border-muted/50 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary">Research Motivation</CardTitle>
            <CardDescription>Distribution of visit purposes.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="250">
              <PieChart>
                <Pie
                  data={purposeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {purposeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={[`hsl(var(--primary))`, `hsl(var(--accent))`, "#1e293b", "#475569", "#94a3b8"][index % 5]} 
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {purposeData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: [`hsl(var(--primary))`, `hsl(var(--accent))`, "#1e293b", "#475569", "#94a3b8"][i % 5] }} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
