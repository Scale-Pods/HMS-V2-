"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store-context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
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
  AlertTriangle,
  Pill,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientJourney } from "@/components/patient-journey";
import { supabase } from "@/lib/supabase";

export default function DoctorDashboard() {
  const { tokens, departments, updateTokenStatus, loading } = useStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'queue' | 'reports'>('queue');
  const [selectedDept, setSelectedDept] = useState<any>(null);
  
  // Prescription State
  const [inventory, setInventory] = useState<any[]>([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [selectedMedicines, setSelectedMedicines] = useState<{medicine: any, quantity: number, dosage: string, frequency: string, durationDays: string}[]>([]);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'doctor') {
      router.push('/login?role=doctor');
    } else {
      fetchInventory();
    }
  }, [isAuthenticated, user, router]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase.from('medicines').select('*').order('name');
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

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
    if (showPrescriptionForm) {
      if (!activeToken) return;
      
      if (selectedMedicines.length === 0 && !prescriptionNotes) {
         toast.error("Please add medicines or notes to the prescription.");
         return;
      }
      
      try {
        // Save Prescription
        const { data: prescData, error: prescError } = await supabase
          .from('prescriptions')
          .insert({
            patient_id: activeToken.patient_id,
            token_id: tokenId,
            notes: prescriptionNotes,
            status: 'pending'
          })
          .select()
          .single();
          
        if (prescError) throw prescError;
        
        // Save Items
        if (selectedMedicines.length > 0) {
          const items = selectedMedicines.map(m => {
            // Simple quantity calculation (rough estimate for demo)
            const days = parseInt(m.durationDays) || 1;
            const freq = m.frequency.includes('3') ? 3 : m.frequency.includes('2') ? 2 : 1;
            const dose = parseInt(m.dosage) || 1;
            
            return {
              prescription_id: prescData.id,
              medicine_id: m.medicine.id,
              quantity: days * freq * dose,
              dosage: m.dosage,
              duration: `${m.frequency} for ${m.durationDays}`
            };
          });
          
          const { error: itemsError } = await supabase
            .from('prescription_items')
            .insert(items);
            
          if (itemsError) throw itemsError;
        }
        
        toast.success("Prescription sent to pharmacist!");
      } catch (err) {
        console.error("Prescription error:", err);
        toast.error("Failed to save prescription");
        return; // Halt completion if prescription fails
      }
    }

    await updateTokenStatus(tokenId, 'completed');
    toast.success("Consultation completed successfully.");
    
    // Reset Form
    setShowPrescriptionForm(false);
    setPrescriptionNotes("");
    setSelectedMedicines([]);
  };

  const addMedicine = (medicine: any) => {
    if (selectedMedicines.find(m => m.medicine.id === medicine.id)) {
      toast.info("Medicine already added");
      return;
    }
    setSelectedMedicines([...selectedMedicines, { 
      medicine, 
      quantity: 1, 
      dosage: '1 Tablet', 
      frequency: '3 times a day (B+L+D)',
      durationDays: '5 Days' 
    }]);
    setMedicineSearch("");
  };

  const removeMedicine = (id: string) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.medicine.id !== id));
  };


  if (!isAuthenticated || !selectedDept) return null;

  return (
    <div className="bg-[#f5f5f5] py-8 min-h-[calc(100vh-200px)]">
      <div className="max-w-[1200px] mx-auto px-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Stethoscope className="w-6 h-6" />
              {user?.name || "Doctor"} Console
            </h2>
            <p className="text-sm text-muted-foreground">
              Logged in as <span className="font-bold text-primary">{user?.name}</span> • Managing <span className="font-bold text-primary">{selectedDept.name}</span>
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
                <CardContent className="p-6">
                  {activeToken && (
                    <div className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
                      <PatientJourney currentStep={3} />
                    </div>
                  )}
                  {activeToken ? (
                    <>
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
                              className="bg-purple-600 hover:bg-purple-700 flex-1 gap-2"
                              onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                              variant={showPrescriptionForm ? "outline" : "default"}
                           >
                              <Pill className="w-4 h-4" />
                              {showPrescriptionForm ? "Hide Prescription" : "Write Prescription"}
                           </Button>
                           {!showPrescriptionForm && (
                             <Button 
                                className="bg-green-600 hover:bg-green-700 flex-1 gap-2"
                                onClick={() => handleComplete(activeToken.id)}
                             >
                                <CheckCircle2 className="w-4 h-4" />
                                Mark Completed
                             </Button>
                           )}
                           <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/5 gap-2">
                              <XCircle className="w-4 h-4" />
                              No Show
                           </Button>
                        </div>
                      </div>
                    </div>
                    
                    {showPrescriptionForm && (
                      <div className="mt-8 pt-8 border-t border-gray-100 animate-in slide-in-from-top-4">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <Pill className="w-4 h-4 text-purple-600" /> 
                           Digital Prescription
                        </h4>
                        
                        <div className="space-y-6">
                           {/* Medicine Search */}
                           <div className="relative">
                             <Input 
                               placeholder="Search medicines to add..." 
                               value={medicineSearch}
                               onChange={(e) => setMedicineSearch(e.target.value)}
                               className="border-purple-200"
                             />
                             {medicineSearch && (
                               <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                 {inventory
                                   .filter(m => m.name.toLowerCase().includes(medicineSearch.toLowerCase()))
                                   .map(medicine => (
                                     <div 
                                       key={medicine.id} 
                                       className="p-2 hover:bg-purple-50 cursor-pointer text-sm flex justify-between items-center"
                                       onClick={() => addMedicine(medicine)}
                                     >
                                        <span>{medicine.name} <span className="text-gray-400 text-xs">({medicine.category})</span></span>
                                        <Plus className="w-4 h-4 text-purple-600" />
                                     </div>
                                 ))}
                                 {inventory.filter(m => m.name.toLowerCase().includes(medicineSearch.toLowerCase())).length === 0 && (
                                    <div className="p-3 text-sm text-gray-500 text-center">No medicines found</div>
                                 )}
                               </div>
                             )}
                           </div>
                           
                           {/* Selected Medicines */}
                           {selectedMedicines.length > 0 && (
                             <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 space-y-3">
                               {selectedMedicines.map((item, index) => (
                                 <div key={item.medicine.id} className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm relative">
                                   <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="absolute top-2 right-2 h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" 
                                      onClick={() => removeMedicine(item.medicine.id)}
                                   >
                                     <XCircle className="w-4 h-4" />
                                   </Button>
                                   
                                   <div className="flex-1 font-bold text-sm text-[#0d47a1]">
                                     {item.medicine.name}
                                     <div className="text-[10px] text-gray-400 font-normal">In Stock: {item.medicine.stock} units</div>
                                   </div>

                                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                     <div className="space-y-1">
                                       <label className="text-[9px] uppercase font-bold text-gray-500">Dosage</label>
                                       <Select 
                                         value={item.dosage} 
                                         onValueChange={(val) => {
                                           const newMeds = [...selectedMedicines];
                                           newMeds[index].dosage = val;
                                           setSelectedMedicines(newMeds);
                                         }}
                                       >
                                         <SelectTrigger className="h-9 text-xs">
                                           <SelectValue placeholder="Dosage" />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="1 Tablet">1 Tablet</SelectItem>
                                           <SelectItem value="2 Tablets">2 Tablets</SelectItem>
                                           <SelectItem value="1 Capsule">1 Capsule</SelectItem>
                                           <SelectItem value="5ml Syrup">5ml Syrup</SelectItem>
                                           <SelectItem value="10ml Syrup">10ml Syrup</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>

                                     <div className="space-y-1">
                                       <label className="text-[9px] uppercase font-bold text-gray-500">Frequency</label>
                                       <Select 
                                         value={item.frequency} 
                                         onValueChange={(val) => {
                                           const newMeds = [...selectedMedicines];
                                           newMeds[index].frequency = val;
                                           setSelectedMedicines(newMeds);
                                         }}
                                       >
                                         <SelectTrigger className="h-9 text-xs">
                                           <SelectValue placeholder="Frequency" />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="1 time a day (After Breakfast)">1 time a day (After Breakfast)</SelectItem>
                                           <SelectItem value="2 times a day (B+D)">2 times a day (B+D)</SelectItem>
                                           <SelectItem value="3 times a day (B+L+D)">3 times a day (B+L+D)</SelectItem>
                                           <SelectItem value="1 after eating (SOS)">1 after eating (SOS)</SelectItem>
                                           <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>

                                     <div className="space-y-1">
                                       <label className="text-[9px] uppercase font-bold text-gray-500">Duration</label>
                                       <Select 
                                         value={item.durationDays} // Need to add this to state
                                         onValueChange={(val) => {
                                           const newMeds = [...selectedMedicines];
                                           newMeds[index].durationDays = val;
                                           setSelectedMedicines(newMeds);
                                         }}
                                       >
                                         <SelectTrigger className="h-9 text-xs">
                                           <SelectValue placeholder="Duration" />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="2 Days">2 Days</SelectItem>
                                           <SelectItem value="3 Days">3 Days</SelectItem>
                                           <SelectItem value="5 Days">5 Days</SelectItem>
                                           <SelectItem value="7 Days">7 Days</SelectItem>
                                           <SelectItem value="14 Days">14 Days</SelectItem>
                                           <SelectItem value="1 Month">1 Month</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )}
                           
                           {/* Notes */}
                           <div>
                             <Textarea 
                               placeholder="Additional doctor notes..." 
                               value={prescriptionNotes}
                               onChange={(e) => setPrescriptionNotes(e.target.value)}
                               className="resize-none"
                             />
                           </div>
                           
                           <Button 
                              className="w-full bg-green-600 hover:bg-green-700 gap-2 h-12"
                              onClick={() => handleComplete(activeToken.id)}
                           >
                              <CheckCircle2 className="w-5 h-5" />
                              Save Prescription & Complete Consultation
                           </Button>
                        </div>
                      </div>
                      )}
                    </>
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
                         <p className="text-3xl font-black text-blue-900">
                            {tokens.filter(t => new Date(t.generated_at).toDateString() === new Date().toDateString()).length}
                         </p>
                         <p className="text-[10px] text-blue-400 mt-1">Institutional total (SOW 4.2)</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                         <p className="text-xs text-green-600 font-bold uppercase">Avg Wait Time</p>
                         <p className="text-3xl font-black text-green-900">
                            {tokens.filter(t => t.status === 'completed').length > 0 
                              ? Math.floor(tokens.filter(t => t.status === 'completed').reduce((acc, t) => acc + (new Date(t.completed_at || '').getTime() - new Date(t.generated_at).getTime()), 0) / tokens.filter(t => t.status === 'completed').length / 60000) 
                              : 0}m
                         </p>
                         <p className="text-[10px] text-green-400 mt-1">Based on completed sessions</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                         <p className="text-xs text-orange-600 font-bold uppercase">OPD Revenue</p>
                         <p className="text-3xl font-black text-orange-900">
                            ₹ {tokens.filter(t => new Date(t.generated_at).toDateString() === new Date().toDateString()).length * 10}
                         </p>
                         <p className="text-[10px] text-orange-400 mt-1">₹ 10.00 Registration Fee</p>
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
                               {tokens.slice().reverse().map((t, i) => (
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
