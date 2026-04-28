"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { 
  Pill, 
  Search, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PatientJourney } from "@/components/patient-journey";

export default function PharmacistDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'dispense' | 'inventory'>('dispense');
  const [searchQuery, setSearchQuery] = useState("");
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activePrescriptions, setActivePrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'pharmacist') {
      router.push('/login?role=pharmacist');
    } else {
      fetchInventory();
      fetchActivePrescriptions();
      
      // Subscribe to real-time prescription updates
      const prescSubscription = supabase
        .channel('prescription-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => {
          fetchActivePrescriptions();
        })
        .subscribe();

      return () => {
        prescSubscription.unsubscribe();
      };
    }
  }, [isAuthenticated, user, router]);

  const fetchActivePrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(*),
          token:tokens(*),
          items:prescription_items(*, medicine:medicines(*))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setActivePrescriptions(data || []);
    } catch (err) {
      console.error("Error fetching active prescriptions:", err);
    }
  };

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase.from('medicines').select('*').order('name');
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      toast.error("Failed to load inventory data");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a Patient ID, Mobile Number, or Token Number");
      return;
    }
    
    setSearching(true);
    setPatientPrescriptions([]);
    
    try {
      // 1. Try Patient Table (UHID, Mobile, or direct ID)
      let { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .or(`uhid.ilike.%${searchQuery}%,mobile.eq.${searchQuery},id.eq.${searchQuery}`);
        
      let patientIds = patients?.map(p => p.id) || [];
      
      // 2. Try Token Table (Token Number or direct ID)
      let { data: tokens, error: tokenError } = await supabase
        .from('tokens')
        .select('patient_id')
        .or(`token_number.ilike.%${searchQuery}%,id.eq.${searchQuery}`);
        
      if (tokens && tokens.length > 0) {
        patientIds = Array.from(new Set([...patientIds, ...tokens.map(t => t.patient_id)]));
      }
      
      if (patientIds.length === 0) {
        toast.error("No patient found with the provided details");
        setSearching(false);
        return;
      }

      // Fetch prescriptions for these patients
      const { data: prescriptions, error: prescError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(*),
          token:tokens(*),
          items:prescription_items(*, medicine:medicines(*))
        `)
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false });

      if (prescError) throw prescError;
      
      if (!prescriptions || prescriptions.length === 0) {
        toast.info("No prescriptions found for this patient");
      } else {
        setPatientPrescriptions(prescriptions);
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error("An error occurred while searching");
    } finally {
      setSearching(false);
    }
  };

  const handleDispense = async (prescriptionId: string, items: any[]) => {
    setLoading(true);
    try {
      // Check stock first
      for (const item of items) {
        if (item.quantity > item.medicine.stock) {
          throw new Error(`Insufficient stock for ${item.medicine.name}. Required: ${item.quantity}, Available: ${item.medicine.stock}`);
        }
      }

      // Update prescription status
      const { error: prescError } = await supabase
        .from('prescriptions')
        .update({ status: 'dispensed' })
        .eq('id', prescriptionId);

      if (prescError) throw prescError;

      // Update medicine stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('medicines')
          .update({ stock: item.medicine.stock - item.quantity })
          .eq('id', item.medicine_id);
          
        if (stockError) throw stockError;
      }

      toast.success("Medicines dispensed successfully!");
      
      // Update local state
      setPatientPrescriptions(prev => 
        prev.map(p => p.id === prescriptionId ? { ...p, status: 'dispensed' } : p)
      );
      fetchInventory(); // Refresh inventory
      fetchActivePrescriptions(); // Refresh active list
      
    } catch (err: any) {
      console.error("Dispense error:", err);
      toast.error(err.message || "Failed to dispense medicines");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'pharmacist') return null;

  return (
    <div className="bg-[#f0f4f8] min-h-[calc(100vh-200px)] py-8">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-[#0d47a1] rounded-xl shadow-lg shadow-blue-100">
                <Pill className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-black text-[#0d47a1] uppercase tracking-tighter leading-none">Pharmacist Portal</h2>
                <p className="text-[#616161] text-[10px] md:text-xs font-bold mt-1">Managing Dispensary for AIIA Hospital</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button 
                variant="outline" 
                size="sm"
                className="border-[#0d47a1] text-[#0d47a1] font-black h-10 md:h-9 uppercase text-[10px] tracking-widest hover:bg-blue-50"
                onClick={() => {
                  fetchInventory();
                  fetchActivePrescriptions();
                  toast.success("Queue refreshed");
                }}
            >
              <Clock className="w-4 h-4 mr-2" /> Refresh Queue
            </Button>
            <div className="flex bg-white rounded-lg p-1 border shadow-sm">
               <Button 
                  variant={activeTab === 'dispense' ? 'default' : 'ghost'} 
                  size="sm"
                  className={cn(
                    "flex-1 md:flex-none h-8 md:h-9 text-[10px] font-black uppercase tracking-widest",
                    activeTab === 'dispense' ? 'bg-[#0d47a1] hover:bg-[#1565c0]' : 'text-gray-500'
                  )}
                  onClick={() => setActiveTab('dispense')}
               >
                  <Search className="w-3.5 h-3.5 mr-1 md:mr-2" /> Dispense
               </Button>
               <Button 
                  variant={activeTab === 'inventory' ? 'default' : 'ghost'} 
                  size="sm"
                  className={cn(
                    "flex-1 md:flex-none h-8 md:h-9 text-[10px] font-black uppercase tracking-widest",
                    activeTab === 'inventory' ? 'bg-[#0d47a1] hover:bg-[#1565c0]' : 'text-gray-500'
                  )}
                  onClick={() => setActiveTab('inventory')}
               >
                  <Package className="w-3.5 h-3.5 mr-1 md:mr-2" /> Inventory
               </Button>
            </div>
          </div>
        </div>

        {activeTab === 'dispense' && (
          <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* 1. Active Prescriptions Queue (TOP) */}
            <section className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between border-b-2 border-[#ff6f00] pb-2">
                <h3 className="text-lg md:text-2xl font-black text-[#212121] flex items-center gap-2 md:gap-3 uppercase tracking-tight">
                  <Clock className="w-5 h-5 md:w-7 md:h-7 text-[#ff6f00]" />
                  Active Queue
                </h3>
                <Badge className="bg-[#ff6f00] text-white px-2 md:px-4 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold">
                  {activePrescriptions.length} Pending
                </Badge>
              </div>
              
              {activePrescriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {activePrescriptions.map((presc) => (
                    <Card key={presc.id} className="border-t-4 border-t-[#0d47a1] shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden bg-white">
                      <CardContent className="p-0">
                        <div className="p-4 md:p-5 border-b bg-[#f8fafc] flex justify-between items-center">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#0d47a1] rounded-xl flex items-center justify-center text-white text-lg md:text-xl font-black shadow-inner">
                              {presc.token?.token_number}
                            </div>
                            <div>
                              <h4 className="text-base md:text-xl font-black text-[#0d47a1] leading-tight">{presc.patient?.name}</h4>
                              <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">UHID: {presc.patient?.uhid} • {new Date(presc.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                          <Badge className="hidden sm:inline-flex bg-orange-100 text-[#ff6f00] border border-[#ff6f00]/20 font-black text-[8px] md:text-[10px] uppercase py-1">Ready</Badge>
                        </div>
                        
                        <div className="p-4 md:p-6">
                          <div className="mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-dashed border-gray-100 shadow-sm overflow-x-auto">
                            <div className="min-w-[300px]">
                              <PatientJourney currentStep={4} />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3 md:mb-4 border-l-4 border-[#ff6f00] pl-3">
                            <h3 className="text-[10px] md:text-sm font-black text-gray-800 uppercase tracking-widest">Recommended Prescription</h3>
                          </div>

                          <div className="space-y-3 md:space-y-4">
                            {presc.items?.map((item: any) => (
                              <div key={item.id} className="flex items-center justify-between bg-white p-3 md:p-5 rounded-lg md:rounded-xl border border-gray-100 shadow-sm hover:border-[#0d47a1]/30 transition-colors">
                                <div className="space-y-0.5 md:space-y-1">
                                  <p className="text-sm md:text-lg font-black text-[#0d47a1] leading-none">{item.medicine?.name}</p>
                                  <p className="text-[10px] md:text-xs font-bold text-gray-500 bg-gray-50 px-1.5 md:px-2 py-0.5 rounded w-fit">{item.dosage} • {item.duration}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-base md:text-xl font-black text-[#212121]">x {item.quantity}</p>
                                  <Badge variant="outline" className={item.medicine?.stock >= item.quantity ? "text-[8px] md:text-[10px] bg-green-50 text-green-700 border-green-200 font-bold" : "text-[8px] md:text-[10px] bg-red-50 text-red-700 border-red-200 font-bold"}>
                                    {item.medicine?.stock} in stock
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <Button 
                            className="w-full mt-6 md:mt-8 bg-[#ff6f00] hover:bg-[#e65100] text-white h-12 md:h-16 rounded-lg md:rounded-xl text-base md:text-lg font-black shadow-lg shadow-orange-200 gap-2 md:gap-3 group"
                            onClick={() => handleDispense(presc.id, presc.items)}
                            disabled={loading || presc.items?.some((i: any) => i.medicine?.stock < i.quantity)}
                          >
                            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
                            Dispense Medicines
                          </Button>
                          {presc.items?.some((i: any) => i.medicine?.stock < i.quantity) && (
                            <div className="flex items-center justify-center gap-2 mt-3 md:mt-4 text-red-600 animate-pulse">
                              <AlertCircle className="w-3 h-3 md:w-4 md:h-4" />
                              <p className="text-[10px] md:text-xs font-black uppercase">Insufficient Inventory</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl md:rounded-2xl border-2 border-dashed border-gray-200 p-12 md:p-20 text-center shadow-inner">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Pill className="w-8 h-8 md:w-10 md:h-10 text-gray-300" />
                  </div>
                  <h4 className="text-xl md:text-2xl font-black text-gray-400 uppercase tracking-tighter">No Pending Prescriptions</h4>
                  <p className="text-[10px] md:text-sm text-gray-400 font-medium">New prescriptions will appear here instantly.</p>
                </div>
              )}
            </section>

            {/* 2. Search & Active Dispense (MIDDLE) */}
            <section className="space-y-4 md:space-y-6 pt-8 md:pt-12 border-t-2 border-gray-200 border-dashed">
              <div className="flex items-center gap-2 md:gap-3">
                <Search className="w-5 h-5 md:w-7 md:h-7 text-[#0d47a1]" />
                <h3 className="text-lg md:text-2xl font-black text-[#212121] uppercase tracking-tight">Search & Dispense</h3>
              </div>

              <Card className="shadow-xl border-none bg-[#0d47a1] text-white overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-200">Patient Search (UHID / Mobile / Token)</label>
                      <Input 
                        placeholder="e.g. UHID-2026-0001" 
                        className="h-12 md:h-16 text-base md:text-xl font-bold bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white rounded-lg md:rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                    <Button 
                      className="h-12 md:h-16 w-full md:w-fit md:px-12 bg-[#ff6f00] hover:bg-[#e65100] text-white font-black text-base md:text-lg rounded-lg md:rounded-xl shadow-xl transition-transform active:scale-95" 
                      onClick={handleSearch}
                      disabled={searching}
                    >
                      {searching ? "SEARCHING..." : "SEARCH PATIENT"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 3. Prescription History (BOTTOM) */}
            {patientPrescriptions.length > 0 && (
              <section className="space-y-6 pt-12">
                <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                  <h3 className="text-2xl font-black text-[#212121] uppercase tracking-tight flex items-center gap-3">
                    <Activity className="w-7 h-7 text-green-600" />
                    Dispensing History
                  </h3>
                  <Badge className="bg-gray-200 text-gray-700 px-4 py-1 rounded-full text-xs font-bold uppercase">
                    Patient: {patientPrescriptions[0]?.patient?.name}
                  </Badge>
                </div>
                
                <div className="space-y-6">
                  {patientPrescriptions.map((prescription) => (
                    <Card key={prescription.id} className="shadow-lg border-none hover:shadow-2xl transition-all duration-300 bg-white">
                      <div className="bg-gray-50 p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-xl shadow-sm",
                            prescription.status === 'dispensed' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          )}>
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-gray-900 leading-tight">Visit Date: {new Date(prescription.created_at).toLocaleDateString()}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <Badge className={prescription.status === 'dispensed' ? 'bg-green-600 text-white font-bold' : 'bg-[#ff6f00] text-white font-bold'}>
                                {prescription.status.toUpperCase()}
                              </Badge>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Token Ref: {prescription.token?.token_number}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 w-full sm:w-auto">
                          {prescription.status === 'pending' && (
                            <Button 
                              className="bg-[#ff6f00] hover:bg-[#e65100] text-white font-bold flex-1 sm:flex-none h-12"
                              onClick={() => handleDispense(prescription.id, prescription.items)}
                              disabled={loading || prescription.items.length === 0}
                            >
                              <Package className="w-4 h-4 mr-2" /> Dispense Now
                            </Button>
                          )}
                          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 font-bold flex-1 sm:flex-none h-12">
                            <Printer className="w-4 h-4 mr-2" /> Print Summary
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-0">
                        {prescription.items && prescription.items.length > 0 ? (
                          <Table>
                            <TableHeader className="bg-gray-50/50">
                              <TableRow className="border-none">
                                <TableHead className="w-[40%] font-black uppercase text-[10px] text-gray-500 py-4">Medicine Item</TableHead>
                                <TableHead className="font-black uppercase text-[10px] text-gray-500 py-4">Dosage Plan</TableHead>
                                <TableHead className="font-black uppercase text-[10px] text-gray-500 py-4">Duration</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] text-gray-500 py-4">Quantity</TableHead>
                                {prescription.status === 'pending' && <TableHead className="text-center font-black uppercase text-[10px] text-gray-500 py-4">Stock Health</TableHead>}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {prescription.items.map((item: any) => {
                                const inStock = item.medicine?.stock >= item.quantity;
                                return (
                                  <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                                    <TableCell className="py-5">
                                      <p className="font-black text-[#0d47a1] text-base leading-tight">{item.medicine?.name}</p>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.medicine?.category}</p>
                                    </TableCell>
                                    <TableCell className="py-5 font-bold text-gray-700">{item.dosage}</TableCell>
                                    <TableCell className="py-5 font-bold text-gray-700">{item.duration}</TableCell>
                                    <TableCell className="text-right py-5 font-black text-lg text-[#212121]">{item.quantity}</TableCell>
                                    {prescription.status === 'pending' && (
                                      <TableCell className="text-center py-5">
                                        {inStock ? (
                                          <Badge className="bg-green-100 text-green-700 border-none px-3 py-1 font-bold">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-red-100 text-red-700 border-none px-3 py-1 font-bold">
                                            <AlertCircle className="w-3 h-3 mr-1" /> LOW
                                          </Badge>
                                        )}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                            No medication items found in this prescription.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="shadow-md">
              <CardHeader className="bg-white border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#0d47a1]" /> Current Inventory
                    </CardTitle>
                    <CardDescription>Manage stock levels for dispensary</CardDescription>
                  </div>
             <Button variant="outline" className="border-[#0d47a1] text-[#0d47a1] font-bold">
                    Update Stock
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Medicine Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Price (₹)</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-bold text-gray-800">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] text-gray-500 bg-gray-50">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-gray-700">{item.stock}</TableCell>
                          <TableCell className="text-center">
                            {item.stock > 100 ? (
                              <span className="text-xs font-bold text-green-600 flex items-center justify-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div> Healthy
                              </span>
                            ) : item.stock > 0 ? (
                              <span className="text-xs font-bold text-orange-500 flex items-center justify-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div> Low Stock
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-red-600 flex items-center justify-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div> Out of Stock
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {inventory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                            No inventory items found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
