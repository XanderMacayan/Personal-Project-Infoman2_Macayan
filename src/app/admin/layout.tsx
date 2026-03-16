"use client"

import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, 
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, 
  SidebarTrigger, SidebarInset 
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, BrainCircuit, Library, LogOut, ShieldAlert, Settings, Activity } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLibraryStore } from "@/hooks/use-library-store";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isLoaded } = useLibraryStore();

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      const timer = setTimeout(() => {
        if (!isAdmin) router.push("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Library className="animate-pulse text-primary w-12 h-12" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4 bg-slate-50">
        <div className="p-6 bg-white rounded-3xl shadow-2xl border-none space-y-4 max-w-sm">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-black text-primary uppercase italic">UNAUTHORIZED</h1>
          <p className="text-muted-foreground font-medium">Clearance level insufficient for administrative console access.</p>
          <Button onClick={() => router.push("/")} className="w-full h-12 font-black rounded-xl">RETURN TO TERMINAL</Button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "Visitor Log", icon: Users, href: "/admin/visitors" },
    { label: "AI Insights", icon: BrainCircuit, href: "/admin/ai-insights" },
  ];

  return (
    <SidebarProvider>
      <Sidebar className="border-r-2 border-muted/50">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 institutional-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Library size={22} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-primary text-xl tracking-tighter uppercase italic leading-none">NEU Admin</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Management Portal</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarMenu className="space-y-1">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.href}
                  className="h-12 rounded-xl data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-primary/20 transition-all font-bold"
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm tracking-tight">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-6">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="h-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold">
                <Link href="/">
                  <LogOut className="w-5 h-5" />
                  <span>Exit Console</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-[#F8FAFC]">
        <header className="flex h-20 shrink-0 items-center gap-4 px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-muted/50">
          <SidebarTrigger className="text-primary" />
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Activity size={16} className="text-accent" />
               <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                 System Status: <span className="text-green-600">Active</span>
               </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-primary uppercase tracking-tighter leading-none">Librarian Access</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Institutional Unit</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-muted border-2 border-white shadow-sm flex items-center justify-center text-primary font-black italic">
                A
              </div>
            </div>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}