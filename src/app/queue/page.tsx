"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store-context";
import { 
  Users, 
  Clock, 
  Building2, 
  Activity, 
  ChevronRight,
  Monitor
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function QueueDisplayPage() {
  const { tokens, departments, loading } = useStore();
  const [currentTime, setCurrentTime] = useState("");
  const [selectedDeptForPopup, setSelectedDeptForPopup] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getActiveToken = (deptId: string) => {
    return tokens.find(t => t.dept_id === deptId && t.status === 'in_consultation');
  };

  const getWaitingCount = (deptId: string) => {
    return tokens.filter(t => t.dept_id === deptId && t.status === 'waiting').length;
  };

  return (
    <div className="bg-[#f0f4f8] min-h-[calc(100vh-200px)] py-8">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0d47a1] rounded-lg">
                <Monitor className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-[#0d47a1] uppercase tracking-tighter">Live OPD Queue Dashboard</h2>
                <p className="text-[#616161] text-xs flex items-center gap-2">
                    <Activity className="w-3 h-3 text-green-600 animate-pulse" />
                    Real-time synchronization active{currentTime ? ` • ${currentTime}` : ''}
                </p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-6">
            <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Total Waiting</p>
                <p className="text-2xl font-black text-[#ff6f00]">
                    {tokens.filter(t => t.status === 'waiting').length}
                </p>
            </div>
            <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">In Consultation</p>
                <p className="text-2xl font-black text-green-500">
                    {tokens.filter(t => t.status === 'in_consultation').length}
                </p>
            </div>
          </div>
        </div>

        {loading ? (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d47a1]"></div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => {
                    const activeToken = getActiveToken(dept.id);
                    const waitingCount = getWaitingCount(dept.id);
                    
                    return (
                        <Card key={dept.id} className="bg-white border-gray-200 shadow-lg overflow-hidden">
                            <CardHeader className="bg-[#0d47a1] py-3 border-b border-blue-800">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-white/80" />
                                        {dept.name}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] border-white/20 text-white uppercase">
                                        Room {100 + departments.indexOf(dept)}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-8 text-center relative group">
                                    <div className="absolute top-2 right-4 flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Live</span>
                                    </div>
                                    <p className="text-[10px] text-[#616161] uppercase font-black mb-2 tracking-widest">Currently Calling</p>
                                    <div className="text-7xl font-black text-[#0d47a1] tracking-tighter mb-1 group-hover:scale-105 transition-transform duration-500">
                                        {activeToken ? activeToken.token_number : '---'}
                                    </div>
                                    {activeToken && (
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-[11px] font-black text-[#424242] uppercase tracking-tight">{activeToken.patient?.name}</p>
                                            <Badge className="bg-green-600/10 text-green-600 border-green-200 text-[9px] font-black py-0 px-2 rounded uppercase">
                                                In Progress
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-[#f8f9fa] p-4 border-t border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSelectedDeptForPopup(dept.id)}>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 text-[#616161]">
                                            <Users className="w-4 h-4" />
                                            <span>Patients Waiting:</span>
                                        </div>
                                        <span className="font-bold text-[#0d47a1] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                            {waitingCount}
                                        </span>
                                    </div>
                                    
                                    {waitingCount > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <p className="text-[9px] text-[#616161] uppercase font-bold">Next in line (Click to view all)</p>
                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                {tokens
                                                    .filter(t => t.dept_id === dept.id && t.status === 'waiting')
                                                    .slice(0, 3)
                                                    .map((t) => (
                                                        <div key={t.id} className="bg-white border border-gray-200 px-3 py-1 rounded text-xs font-bold text-[#0d47a1] shrink-0 shadow-sm">
                                                            {t.token_number}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}

        <Dialog open={!!selectedDeptForPopup} onOpenChange={(open) => !open && setSelectedDeptForPopup(null)}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        Waiting Patients - {departments.find(d => d.id === selectedDeptForPopup)?.name}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Token No</TableHead>
                                <TableHead>Patient Name</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Wait Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tokens
                                .filter(t => t.dept_id === selectedDeptForPopup && t.status === 'waiting')
                                .map((token) => (
                                    <TableRow key={token.id}>
                                        <TableCell className="font-medium text-[#0d47a1]">{token.token_number}</TableCell>
                                        <TableCell>{token.patient?.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "text-[10px]",
                                                token.priority === 'emergency' ? "text-red-600 border-red-200 bg-red-50" :
                                                token.priority === 'senior_citizen' ? "text-orange-600 border-orange-200 bg-orange-50" :
                                                "text-blue-600 border-blue-200 bg-blue-50"
                                            )}>
                                                {token.priority.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {Math.floor((new Date().getTime() - new Date(token.generated_at).getTime()) / 60000)} mins
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {tokens.filter(t => t.dept_id === selectedDeptForPopup && t.status === 'waiting').length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        No patients waiting
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>

        {/* Legend / Info Footer */}
        <div className="mt-12 p-8 bg-white border border-gray-200 rounded-xl grid md:grid-cols-3 gap-8 shadow-md">
            <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-[#0d47a1]">Dynamic Routing</h4>
                    <p className="text-[11px] text-[#616161]">Queue is automatically optimized based on doctor availability.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-[#ff6f00]" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-[#0d47a1]">Priority Handling</h4>
                    <p className="text-[11px] text-[#616161]">Emergency and Senior Citizen cases are handled with priority.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Monitor className="w-6 h-6 text-[#0d47a1]" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-[#0d47a1]">Voice Announcement</h4>
                    <p className="text-[11px] text-[#616161]">Automated multi-lingual announcements for token calling.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
