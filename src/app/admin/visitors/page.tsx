
"use client"

import { useState } from "react";
import { useLibraryStore } from "@/hooks/use-library-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, ShieldCheck, Filter, UserX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PURPOSES, COLLEGES } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VisitorManagement() {
  const { logs, visitors, toggleBlockVisitor, isLoaded } = useLibraryStore({ fetchLogs: true });
  const [searchTerm, setSearchTerm] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all");

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.visitorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = collegeFilter === "all" || log.college === collegeFilter;
    const matchesPurpose = purposeFilter === "all" || log.purpose === purposeFilter;
    return matchesSearch && matchesCollege && matchesPurpose;
  });

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visitor Management</h1>
          <p className="text-muted-foreground">Manage entries and library access privileges.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email or ID..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={collegeFilter} onValueChange={setCollegeFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Colleges" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colleges</SelectItem>
            {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="logs">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Visit Logs</TabsTrigger>
          <TabsTrigger value="visitors">Users & Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Entries</CardTitle>
                <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Filter Purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>College/Office</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.visitorName}</TableCell>
                      <TableCell>{log.college}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{log.date}</span>
                          <span className="text-xs text-muted-foreground">{log.time}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">{log.purpose}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.isEmployee ? "secondary" : "default"} className="text-[10px] uppercase">
                          {log.isEmployee ? "Faculty" : "Student"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No visit logs found matching filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitors">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Access Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{visitor.name}</TableCell>
                      <TableCell className="text-muted-foreground">{visitor.email}</TableCell>
                      <TableCell>{visitor.college}</TableCell>
                      <TableCell>
                        {visitor.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={visitor.isBlocked ? "outline" : "destructive"} 
                          size="sm"
                          onClick={() => toggleBlockVisitor(visitor.id)}
                          className="h-8"
                        >
                          {visitor.isBlocked ? (
                            <>
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Unblock
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 mr-1" />
                              Block Entry
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
