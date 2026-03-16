
"use client"

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, BrainCircuit, Library, LogOut, ShieldAlert } from "lucide-react";
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
      // Small delay to allow store to settle
      const timer = setTimeout(() => {
        if (!isAdmin) router.push("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Library className="animate-pulse text-primary w-12 h-12" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Unauthorized Access</h1>
        <p className="text-muted-foreground">You do not have administrative privileges to access this area.</p>
        <Button onClick={() => router.push("/")}>Return to Terminal</Button>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-row items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Library size={18} />
          </div>
          <span className="font-bold text-primary text-lg">NEU Admin</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin/dashboard"}>
                <Link href="/admin/dashboard">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin/visitors"}>
                <Link href="/admin/visitors">
                  <Users className="w-4 h-4" />
                  <span>Visitor Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/admin/ai-insights"}>
                <Link href="/admin/ai-insights">
                  <BrainCircuit className="w-4 h-4" />
                  <span>AI Trend Summary</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-muted-foreground hover:text-destructive">
                <Link href="/">
                  <LogOut className="w-4 h-4" />
                  <span>Exit Terminal</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white sticky top-0 z-30">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {pathname.split("/").pop()?.replace("-", " ")}
            </h2>
          </div>
        </header>
        <main className="p-6 bg-background min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
