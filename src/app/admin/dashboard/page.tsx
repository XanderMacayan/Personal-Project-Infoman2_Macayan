"use client"

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLibraryStore } from "@/hooks/use-library-store";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { 
  Users, GraduationCap, Briefcase, BookOpen, Download, 
  Calendar, Activity, Loader2, ArrowUpRight, TrendingUp,
  Clock, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { logs, isLoaded } = useLibraryStore({ fetchLogs: true });
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    const avgDaily = total > 0 ? (total / (timeRange === "week" ? 7 : timeRange === "month" ? 30 : 1)).toFixed(1) : 0;

    return { total, employees, students, uniqueVisitors, avgDaily };
  }, [filteredLogs, timeRange]);

  const purposeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      counts[log.purpose] = (counts[log.purpose] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

  const generateReport = async () => {
    setIsExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      doc.setFillColor(26, 54, 93);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("NEU LIBRARY", 14, 20);
      doc.setFontSize(10);
      doc.text("Institutional Patronage & Scholarly Traffic Report", 14, 28);
      doc.text(`Period: ${timeRange.toUpperCase()}`, 14, 34);

      doc.setFontSize(16);
      doc.setTextColor(26, 54, 93);
      doc.text("Executive Summary", 14, 55);
      
      const summaryTableData = [
        ["Metric", "Value"],
        ["Total Traffic", stats.total.toString()],
        ["Student Research", stats.students.toString()],
        ["Faculty Engagement", stats.employees.toString()],
        ["Unique Scholars", stats.uniqueVisitors.toString()],
      ];

      autoTable(doc, {
        startY: 65,
        head: [summaryTableData[0]],
        body: summaryTableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [38, 92, 50] }
      });

      doc.save(`neu_library_report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast({ title: "Report Exported", description: "PDF generated successfully." });
    } catch (error) {
      toast({ title: "Export Failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isLoaded || !mounted) return null;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#1e293b', '#64748b', '#94a3b8'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Activity size={12} />
            Real-time Monitoring
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter uppercase italic">Patronage Insights</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <MapPin size={14} className="text-accent" />
            Institutional Library Main Terminal
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white border-2 rounded-xl h-11">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Historical Archive</SelectItem>
              <SelectItem value="day">Today's Traffic</SelectItem>
              <SelectItem value="week">Past 7 Days</SelectItem>
              <SelectItem value="month">Monthly Overview</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="default" 
            onClick={generateReport} 
            disabled={isExporting}
            className="bg-primary hover:bg-primary/95 font-black uppercase tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-primary/20"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {isExporting ? "Processing" : "Export Archive"}
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Patronage", value: stats.total, icon: BookOpen, color: "bg-primary", sub: `${stats.uniqueVisitors} unique scholars` },
          { label: "Student Research", value: stats.students, icon: GraduationCap, color: "bg-accent", sub: "Active academic sessions" },
          { label: "Faculty Engagement", value: stats.employees, icon: Briefcase, color: "bg-[#1e293b]", sub: "Institutional personnel" },
          { label: "Engagement Index", value: `${stats.total > 0 ? ((stats.uniqueVisitors / stats.total) * 100).toFixed(1) : 0}%`, icon: TrendingUp, color: "bg-white", sub: "Return frequency rate", darkText: true }
        ].map((card, i) => (
          <Card key={i} className={cn("relative overflow-hidden border-none shadow-xl transition-all hover:scale-[1.02]", card.color, card.darkText ? "text-primary border-2 border-muted" : "text-white")}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <card.icon size={80} />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className={cn("font-black uppercase tracking-widest text-[10px]", card.darkText ? "text-muted-foreground" : "text-white/60")}>
                {card.label}
              </CardDescription>
              <CardTitle className="text-5xl font-black tracking-tighter italic">{card.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("flex items-center text-xs font-bold uppercase tracking-wider", card.darkText ? "text-muted-foreground" : "text-white/70")}>
                <Activity className="w-3 h-3 mr-2" />
                {card.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-primary/5 pb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <Clock className="w-4 h-4 text-primary" />
                 <CardTitle className="text-xl font-black text-primary uppercase italic">Traffic Flow</CardTitle>
              </div>
              <CardDescription className="font-medium">Scholarly volume trajectory over the past week.</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary tracking-tighter">{stats.avgDaily}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg. Daily Visits</p>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-accent/5 pb-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <CardTitle className="text-xl font-black text-primary uppercase italic">Research Goals</CardTitle>
            </div>
            <CardDescription className="font-medium">Primary motivation for library use.</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="250">
              <PieChart>
                <Pie
                  data={purposeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {purposeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-8 space-y-3 px-4">
              {purposeData.slice(0, 4).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <span className="text-xs font-black text-primary">{((p.value / stats.total) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}