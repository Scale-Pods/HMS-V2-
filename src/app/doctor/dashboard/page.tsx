"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store-context";
import { useAuth } from "@/lib/auth-context";
import { 
  Users, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Stethoscope,
  User,
  Clock,
  ArrowRight,
  ClipboardList,
  Activity,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function DoctorDashboard() {
  const { tokens, departments, updateTokenStatus, loading } = useStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'queue' | 'reports'>('queue');
  const [selectedDept, setSelectedDept] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'doctor') {
      router.push('/login?role=doctor');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0]); // Default to first dept for demo
    }
  }, [departments, selectedDept]);

  const waitingTokens = tokens.filter(
    t => t.dept_id === selectedDept?.id && t.status === 'waiting'
  );

  const activeToken = tokens.find(
    t => t.dept_id === selectedDept?.id && t.status === 'in_consultation'
  );

  const handleCallNext = async (tokenId: string) => {
    if (activeToken) {
      toast.error("Please complete the current consultation first.");
      return;
    }
    await updateTokenStatus(tokenId, 'in_consultation');
    toast.success("Patient called for consultation.");
  };

  const handleComplete = async (tokenId: string) => {
    await updateTokenStatus(tokenId, 'completed');
    toast.success("Consultation completed successfully.");
  };

  if (!isAuthenticated || !selectedDept) return null;

  return (
    <div className="bg-[#f5f5f5] py-8 min-h-[calc(100vh-200px)]">
      <div className="max-w-[1200px] mx-auto px-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Stethoscope className="w-6 h-6" />
              Doctor Console
            </h2>
            <p className="text-sm text-muted-foreground">
              Managing Queue for <span className="font-bold text-primary">{selectedDept.name}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
             <Button 
                variant={activeTab === 'queue' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveTab('queue')}
                className="gap-2"
             >
                <Users className="w-4 h-4" /> Live Queue
             </Button>
             <Button 
                variant={activeTab === 'reports' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveTab('reports')}
                className="gap-2"
             >
                <ClipboardList className="w-4 h-4" /> OPD Reports
             </Button>
          </div>
        </div>

        {activeTab === 'queue' ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Active Consultation Panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-primary border-2 ring-4 ring-primary/5">
                <CardHeader className="bg-accent border-b border-primary/20">
                  <div className="flex justify-between items-center">
                     <CardTitle className="text-primary flex items-center gap-2">
                       <Activity className="w-5 h-5 animate-pulse" />
                       Current Consultation
                     </CardTitle>
                     {activeToken && <Badge className="bg-primary text-primary-foreground">Token: {activeToken.token_number}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  {activeToken ? (
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center shrink-0">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <div>
                          <h3 className="text-2xl font-bold text-card-foreground">{activeToken.patient?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {activeToken.patient?.gender} • {activeToken.patient?.mobile} • UHID: {activeToken.patient?.uhid}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                          <Badge variant="outline" className="bg-white">{activeToken.priority.replace('_', ' ')}</Badge>
                          <Badge variant="outline" className="bg-white">Age: {new Date().getFullYear() - new Date(activeToken.patient?.dob || '').getFullYear()} Yrs</Badge>
                        </div>
                        <div className="pt-4 flex gap-3">
                           <Button 
                              className="bg-green-600 hover:bg-green-700 flex-1 gap-2"
                              onClick={() => handleComplete(activeToken.id)}
                           >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark Completed
                           </Button>
                           <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/5 gap-2">
                              <XCircle className="w-4 h-4" />
                              No Show
                           </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-muted-foreground">No active consultation</h3>
                      <p className="text-sm text-muted-foreground">Call the next patient from the waiting list</p>
                      <Button 
                          className="mt-6 bg-primary text-primary-foreground" 
                          disabled={waitingTokens.length === 0}
                          onClick={() => handleCallNext(waitingTokens[0].id)}
                      >
                          Call Next Patient
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                 <Card className="bg-[#fff8e1] border-[#ffe082]">
                   <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#ff6f00]/10 rounded flex items-center justify-center">
                          <Clock className="w-5 h-5 text-[#ff6f00]" />
                      </div>
                      <div>
                          <p className="text-[10px] text-[#ff6f00] font-bold uppercase">Avg. Time / Patient</p>
                          <p className="text-lg font-bold text-[#212121]">12.5 Mins</p>
                      </div>
                   </CardContent>
                 </Card>
                 <Card className="bg-[#e8f5e9] border-[#c8e6c9]">
                   <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                          <p className="text-[10px] text-green-600 font-bold uppercase">Efficiency Score</p>
                          <p className="text-lg font-bold text-[#212121]">98%</p>
                      </div>
                   </CardContent>
                 </Card>
              </div>
            </div>

            {/* Waiting List Sidebar */}
            <div className="space-y-6">
              <Card className="border-[#bdbdbd]">
                <CardHeader className="py-4 border-b">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                     <span>Waiting List</span>
                     <Badge variant="secondary">{waitingTokens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[500px] overflow-y-auto govt-scrollbar">
                  {waitingTokens.length > 0 ? (
                    <div className="divide-y">
                      {waitingTokens.map((token) => {
                        return (
                          <div key={token.id} className="p-4 hover:bg-accent/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded bg-accent text-primary flex items-center justify-center text-xs font-black">
                                    {token.token_number}
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold text-card-foreground">{token.patient?.name}</p>
                                    <p className="text-[9px] text-muted-foreground">UHID: {token.patient?.uhid}</p>
                                 </div>
                              </div>
                              {token.priority !== 'standard' && (
                                <Badge className={token.priority === 'emergency' ? 'bg-red-100 text-red-600 text-[8px]' : 'bg-orange-100 text-orange-600 text-[8px]'}>
                                    {token.priority.split('_')[0]}
                                </Badge>
                              )}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-[10px] h-7 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                                onClick={() => handleCallNext(token.id)}
                                disabled={!!activeToken}
                            >
                                Call Patient <ArrowRight className="ml-1 w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs text-muted-foreground">No patients waiting</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
             <Card className="border-[#bdbdbd]">
                <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                   <div>
                      <CardTitle>OPD Registration Reports</CardTitle>
                      <CardDescription>Generated reports for institutional review (SOW 4.2)</CardDescription>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                         <ClipboardList className="w-4 h-4" /> Export PDF
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                         <Activity className="w-4 h-4" /> Export Excel
                      </Button>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="p-6 grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                         <p className="text-xs text-blue-600 font-bold uppercase">Today's Registrations</p>
                         <p className="text-3xl font-black text-blue-900">42</p>
                         <p className="text-[10px] text-blue-400 mt-1">↑ 12% from yesterday</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                         <p className="text-xs text-green-600 font-bold uppercase">Avg Wait Time</p>
                         <p className="text-3xl font-black text-green-900">18m</p>
                         <p className="text-[10px] text-green-400 mt-1">↓ 5m from last week</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                         <p className="text-xs text-orange-600 font-bold uppercase">Revenue (Mock)</p>
                         <p className="text-3xl font-black text-orange-900">₹ 420.00</p>
                         <p className="text-[10px] text-orange-400 mt-1">From OPD Registration Fees</p>
                      </div>
                   </div>
                   
                   <div className="px-6 pb-6">
                      <div className="border rounded-lg overflow-hidden">
                         <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                               <tr>
                                  <th className="px-4 py-3">Patient</th>
                                  <th className="px-4 py-3">UHID</th>
                                  <th className="px-4 py-3">Time</th>
                                  <th className="px-4 py-3">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y">
                               {tokens.slice(0, 5).map((t, i) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                     <td className="px-4 py-3 font-bold">{t.patient?.name}</td>
                                     <td className="px-4 py-3 font-mono text-[10px]">{t.patient?.uhid}</td>
                                     <td className="px-4 py-3">{new Date(t.generated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                     <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-[8px] uppercase">{t.status}</Badge>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        )}
      </div>
    </div>
  );
}
