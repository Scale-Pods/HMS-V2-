"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { 
  Pill, 
  Search, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Printer
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
        .order('created_at', { ascending: false });

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
      // First try to find patient by UHID or mobile
      let { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .or(`uhid.ilike.%${searchQuery}%,mobile.eq.${searchQuery}`);
        
      let patientIds = patients?.map(p => p.id) || [];
      
      // Also try to find by token number
      let { data: tokens, error: tokenError } = await supabase
        .from('tokens')
        .select('patient_id')
        .ilike('token_number', `%${searchQuery}%`);
        
      if (tokens && tokens.length > 0) {
        patientIds = [...patientIds, ...tokens.map(t => t.patient_id)];
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 rounded-lg">
                <Pill className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-purple-700 uppercase tracking-tighter">Pharmacist Portal</h2>
                <p className="text-[#616161] text-xs">Managing Dispensary for AIIA Hospital</p>
            </div>
          </div>
          
          <div className="flex bg-white rounded-lg p-1 border shadow-sm">
             <Button 
                variant={activeTab === 'dispense' ? 'default' : 'ghost'} 
                className={activeTab === 'dispense' ? 'bg-purple-600 hover:bg-purple-700' : 'text-gray-500'}
                onClick={() => setActiveTab('dispense')}
             >
                <Search className="w-4 h-4 mr-2" /> Dispense Medicines
             </Button>
             <Button 
                variant={activeTab === 'inventory' ? 'default' : 'ghost'} 
                className={activeTab === 'inventory' ? 'bg-purple-600 hover:bg-purple-700' : 'text-gray-500'}
                onClick={() => setActiveTab('inventory')}
             >
                <Package className="w-4 h-4 mr-2" /> Inventory Management
             </Button>
          </div>
        </div>

        {activeTab === 'dispense' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Active Prescriptions Queue
                </h3>
                
                {activePrescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {activePrescriptions.map((presc) => (
                      <Card key={presc.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-0">
                          <div className="p-4 border-b bg-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                                {presc.token?.token_number}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{presc.patient?.name}</h4>
                                <p className="text-[10px] text-gray-500">UHID: {presc.patient?.uhid} • Registered: {new Date(presc.created_at).toLocaleTimeString()}</p>
                              </div>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700 border-none">PENDING DISPENSE</Badge>
                          </div>
                          
                          <div className="p-6 bg-[#f8fafc]">
                            <div className="mb-8 bg-white p-4 rounded-xl border border-gray-200">
                              <PatientJourney currentStep={4} />
                            </div>
                            
                            <h3 className="text-sm font-black text-gray-400 uppercase mb-4">Recommended Medicines</h3>
                            <div className="space-y-3">
                              {presc.items?.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#0d47a1]">{item.medicine?.name}</p>
                                    <p className="text-[10px] text-gray-500">{item.dosage} • {item.duration}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-gray-800">Qty: {item.quantity}</p>
                                    <Badge variant="outline" className={item.medicine?.stock >= item.quantity ? "text-[8px] bg-green-50 text-green-700" : "text-[8px] bg-red-50 text-red-700"}>
                                      Stock: {item.medicine?.stock}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <Button 
                              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 h-12 gap-2"
                              onClick={() => handleDispense(presc.id, presc.items)}
                              disabled={loading || presc.items?.some((i: any) => i.medicine?.stock < i.quantity)}
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              Dispense Medicines (Process Visit Step 5)
                            </Button>
                            {presc.items?.some((i: any) => i.medicine?.stock < i.quantity) && (
                              <p className="text-[10px] text-red-500 text-center mt-2 font-bold">⚠️ Cannot dispense: Some items are out of stock</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border-2 border-dashed p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Pill className="w-8 h-8 text-gray-300" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-400">No active prescriptions</h4>
                    <p className="text-sm text-gray-400">Waiting for doctors to suggest prescriptions...</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <Card className="shadow-md border-purple-100">
                  <CardHeader className="bg-purple-50/50 border-b">
                    <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                      <Search className="w-5 h-5" /> Search Patient Prescription
                    </CardTitle>
                    <CardDescription>Enter Patient UHID, Mobile Number, or Token Number</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Input 
                        placeholder="e.g. UHID-2026-0001 or 9876543210" 
                        className="h-12 text-lg border-purple-200 focus-visible:ring-purple-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button 
                        className="h-12 px-8 bg-purple-600 hover:bg-purple-700" 
                        onClick={handleSearch}
                        disabled={searching}
                      >
                        {searching ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {patientPrescriptions.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      Prescription History <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">{patientPrescriptions[0]?.patient?.name}</Badge>
                    </h3>
                    
                    {patientPrescriptions.map((prescription) => (
                      <Card key={prescription.id} className="shadow-sm border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-800">Prescription Date: {new Date(prescription.created_at).toLocaleDateString()}</p>
                              <Badge variant="outline" className={prescription.status === 'dispensed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                                {prescription.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">Token Ref: {prescription.token?.token_number} • Dept: {prescription.token?.department?.name}</p>
                          </div>
                          
                          {prescription.status === 'pending' && (
                            <Button 
                              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                              onClick={() => handleDispense(prescription.id, prescription.items)}
                              disabled={loading || prescription.items.length === 0}
                            >
                              <Package className="w-4 h-4 mr-2" /> Dispense Medicines
                            </Button>
                          )}
                          {prescription.status === 'dispensed' && (
                            <Button variant="outline" className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50">
                              <Printer className="w-4 h-4 mr-2" /> Print Bill
                            </Button>
                          )}
                        </div>
                        <CardContent className="p-0">
                          {prescription.items && prescription.items.length > 0 ? (
                            <Table>
                              <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                  <TableHead className="w-[40%]">Medicine Name</TableHead>
                                  <TableHead>Dosage</TableHead>
                                  <TableHead>Duration</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  {prescription.status === 'pending' && <TableHead className="text-center">Stock Status</TableHead>}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {prescription.items.map((item: any) => {
                                  const inStock = item.medicine.stock >= item.quantity;
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium text-gray-900">
                                        {item.medicine.name}
                                        <p className="text-[10px] text-gray-500 font-normal">{item.medicine.category}</p>
                                      </TableCell>
                                      <TableCell className="text-gray-600">{item.dosage}</TableCell>
                                      <TableCell className="text-gray-600">{item.duration}</TableCell>
                                      <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                      {prescription.status === 'pending' && (
                                        <TableCell className="text-center">
                                          {inStock ? (
                                            <Badge className="bg-green-100 text-green-700 border-none hover:bg-green-100 flex items-center justify-center gap-1 mx-auto w-fit">
                                              <CheckCircle2 className="w-3 h-3" /> Available ({item.medicine.stock})
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-100 flex items-center justify-center gap-1 mx-auto w-fit">
                                              <AlertCircle className="w-3 h-3" /> Low Stock ({item.medicine.stock})
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
                            <div className="p-6 text-center text-gray-500 text-sm">
                              No medicines prescribed.
                            </div>
                          )}
                          {prescription.notes && (
                            <div className="p-4 bg-yellow-50/50 border-t border-yellow-100">
                              <p className="text-xs font-bold text-yellow-800 mb-1">Doctor's Notes:</p>
                              <p className="text-sm text-yellow-900/80">{prescription.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="shadow-md">
              <CardHeader className="bg-white border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" /> Current Inventory
                    </CardTitle>
                    <CardDescription>Manage stock levels for dispensary</CardDescription>
                  </div>
                  <Button variant="outline" className="border-purple-200 text-purple-700">
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
