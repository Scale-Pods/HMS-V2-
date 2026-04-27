"use client";

import { useState, useRef, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  User, 
  Calendar as CalendarIcon, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2,
  AlertCircle,
  Hospital
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  mobile: z.string().length(10, "Mobile number must be 10 digits"),
  abha_id: z.string().optional(),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const { t } = useLanguage();
  const { registerPatient, departments, generateToken } = useStore();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Reg, 2: ABHA (Mock), 3: Payment (Mock), 4: Token
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState("");
  const [showAbhaModal, setShowAbhaModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [dobParts, setDobParts] = useState({ year: "", month: "", day: "" });
  const [mobileValue, setMobileValue] = useState("");
  
  const yearRef = React.useRef<HTMLInputElement>(null);
  const monthRef = React.useRef<HTMLInputElement>(null);
  const dayRef = React.useRef<HTMLInputElement>(null);

  const mobileRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      dob: "",
      gender: "",
      mobile: "",
      abha_id: "",
    },
  });

  // Function to handle DOB construction
  const updateDob = (parts: typeof dobParts) => {
    if (parts.year && parts.month && parts.day) {
      const formattedMonth = parts.month.padStart(2, '0');
      const formattedDay = parts.day.padStart(2, '0');
      form.setValue("dob", `${parts.year}-${formattedMonth}-${formattedDay}`, { shouldValidate: true });
    } else {
      form.setValue("dob", "");
    }
  };

  const onSubmit = async (values: RegistrationForm) => {
    setIsSubmitting(true);
    try {
      const patient = await registerPatient({
        name: values.name,
        dob: values.dob,
        gender: values.gender,
        mobile: values.mobile,
        abha_id: values.abha_id || null,
      });

      if (patient) {
        setRegisteredPatient(patient);
        setStep(2); // Go to ABHA Linking/Creation
        toast.success("Patient details saved!");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTokenGeneration = async () => {
    if (!selectedDept || !registeredPatient) return;
    
    setStep(3); // Go to Payment Step
  };

  const handlePaymentComplete = async () => {
    setIsPaying(true);
    // Simulate payment processing
    setTimeout(async () => {
        try {
          const birthYear = new Date(registeredPatient.dob).getFullYear();
          const age = new Date().getFullYear() - birthYear;
          const priority = age >= 60 ? 'senior_citizen' : 'standard';

          const token = await generateToken(registeredPatient.id, selectedDept, priority);
          if (token) {
            toast.success("Payment successful! Token generated.");
            router.push(`/token/${token.id}`);
          }
        } catch (error) {
            toast.error("Failed to generate token.");
        } finally {
            setIsPaying(false);
        }
    }, 2000);
  };

  return (
    <div className="bg-[#f5f5f5] py-8 min-h-[calc(100vh-200px)]">
      <div className="max-w-[800px] mx-auto px-3">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-[#0d47a1] text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <span className={`text-sm font-bold ${step >= 1 ? 'text-[#0d47a1]' : 'text-gray-500'}`}>Registration</span>
          </div>
          <div className="flex-1 h-[2px] bg-gray-200 mx-4" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-[#0d47a1] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <span className={`text-sm font-bold ${step >= 2 ? 'text-[#0d47a1]' : 'text-gray-500'}`}>Token Generation</span>
          </div>
        </div>

        {step === 1 ? (
          <Card className="border-[#bdbdbd]">
            <CardHeader className="bg-[#e3f2fd] border-b border-[#bdbdbd]">
              <CardTitle className="text-[#0d47a1] flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Registration
              </CardTitle>
              <CardDescription>
                Enter patient details to register and generate a token.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#424242]">{t("name")} *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input 
                        id="name" 
                        {...form.register("name")} 
                        className="pl-10" 
                        placeholder="Enter full name" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            mobileRef.current?.focus();
                          }
                        }}
                      />
                    </div>
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-[#424242]">{t("mobile")} *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input 
                        id="mobile" 
                        ref={mobileRef}
                        value={mobileValue}
                        inputMode="numeric"
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setMobileValue(val);
                          form.setValue("mobile", val, { shouldValidate: true });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            yearRef.current?.focus();
                          }
                        }}
                        className="pl-10 h-12 md:h-10 text-base" 
                        placeholder="10-digit mobile number" 
                        required
                      />
                    </div>
                    {form.formState.errors.mobile && (
                      <p className="text-xs text-destructive">{form.formState.errors.mobile.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#424242]">{t("dob")} * (YYYY / MM / DD)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input 
                        ref={yearRef}
                        placeholder="YYYY" 
                        maxLength={4}
                        inputMode="numeric"
                        className="h-12 md:h-10 text-center text-base"
                        value={dobParts.year}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          const newParts = { ...dobParts, year: val };
                          setDobParts(newParts);
                          updateDob(newParts);
                          if (val.length === 4) monthRef.current?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            monthRef.current?.focus();
                          }
                        }}
                      />
                      <Input 
                        ref={monthRef}
                        placeholder="MM" 
                        maxLength={2}
                        inputMode="numeric"
                        className="h-12 md:h-10 text-center text-base"
                        value={dobParts.month}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          const newParts = { ...dobParts, month: val };
                          setDobParts(newParts);
                          updateDob(newParts);
                          if (val.length === 2) dayRef.current?.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            dayRef.current?.focus();
                          }
                          if (e.key === 'Backspace' && !dobParts.month) yearRef.current?.focus();
                        }}
                      />
                      <Input 
                        ref={dayRef}
                        placeholder="DD" 
                        maxLength={2}
                        inputMode="numeric"
                        className="h-12 md:h-10 text-center text-base"
                        value={dobParts.day}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          const newParts = { ...dobParts, day: val };
                          setDobParts(newParts);
                          updateDob(newParts);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !dobParts.day) monthRef.current?.focus();
                        }}
                      />
                    </div>
                    <input type="hidden" {...form.register("dob")} />
                    {form.formState.errors.dob && (
                      <p className="text-xs text-destructive">{form.formState.errors.dob.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-[#424242]">{t("gender")} *</Label>
                    <Select onValueChange={(value) => form.setValue("gender", value)}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{t("male")}</SelectItem>
                        <SelectItem value="Female">{t("female")}</SelectItem>
                        <SelectItem value="Other">{t("other")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.gender && (
                      <p className="text-xs text-destructive">{form.formState.errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="bg-[#fff8e1] border border-[#ffe082] p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-[#ff6f00]" />
                    <h4 className="font-bold text-sm text-[#ff6f00]">ABHA Integration (Optional)</h4>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abha_id" className="text-[#424242] text-xs">ABHA Address / Number</Label>
                    <Input 
                      id="abha_id" 
                      {...form.register("abha_id")} 
                      className="bg-white" 
                      placeholder="e.g. name@abdm or 14-digit number" 
                    />
                    <p className="text-[10px] text-[#616161]">Linking ABHA ID will help in maintaining digital health records.</p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registering..." : "Register & Continue"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : step === 2 ? (
          <Card className="border-[#bdbdbd]">
            <CardHeader className="bg-[#e3f2fd] border-b">
              <div className="flex items-center gap-2 text-[#0d47a1]">
                <ShieldCheck className="w-6 h-6" />
                <CardTitle>ABDM / ABHA Integration</CardTitle>
              </div>
              <CardDescription>Link your existing ABHA or create a new one to sync your health records.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
               <div className="max-w-[400px] mx-auto space-y-6">
                 <div className="p-6 bg-white border-2 border-dashed border-blue-200 rounded-xl">
                    <p className="text-sm font-bold text-[#0d47a1] mb-2">Patient Registered with UHID</p>
                    <p className="text-2xl font-black text-gray-800">{registeredPatient?.uhid}</p>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    <Button 
                      className="h-16 text-lg bg-[#0d47a1]"
                      onClick={() => {
                        toast.info("Mocking ABHA creation flow...");
                        setTimeout(() => {
                           setRegisteredPatient({...registeredPatient, abha_id: 'abha-' + Math.random().toString(36).substring(7) + '@abdm'});
                           setStep(4);
                           toast.success("ABHA ID Created & Linked!");
                        }, 1500);
                      }}
                    >
                      Create New ABHA ID
                    </Button>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-[1px] bg-gray-200" />
                       <span className="text-xs text-gray-400">OR</span>
                       <div className="flex-1 h-[1px] bg-gray-200" />
                    </div>
                    <Button 
                      variant="outline" 
                      className="h-16 text-lg border-[#0d47a1] text-[#0d47a1]"
                      onClick={() => setStep(4)}
                    >
                      Already Have ABHA / Skip
                    </Button>
                 </div>
               </div>
            </CardContent>
          </Card>
        ) : step === 3 ? (
          <Card className="border-[#bdbdbd] shadow-2xl">
            <CardHeader className="bg-green-600 text-white">
              <CardTitle className="flex items-center gap-2">
                 <Hospital className="w-6 h-6" />
                 OPD Registration Fee
              </CardTitle>
              <CardDescription className="text-green-100">Safe & Secure Payment via Government Gateway</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
               <div className="flex flex-col items-center space-y-6">
                  <div className="text-center">
                     <p className="text-sm text-gray-500 uppercase font-bold">Total Amount to Pay</p>
                     <p className="text-5xl font-black text-gray-900">₹ 10.00</p>
                  </div>
                  
                  <div className="w-full max-w-[350px] space-y-3">
                     <p className="text-xs font-bold text-gray-400 uppercase">Select Payment Method</p>
                     <div className="grid grid-cols-1 gap-2">
                        {['UPI (Google Pay, PhonePe)', 'Credit / Debit Card', 'Net Banking'].map((method) => (
                           <button key={method} className="flex items-center justify-between p-4 border rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left">
                              <span className="font-bold text-sm">{method}</span>
                              <ArrowRight className="w-4 h-4 text-gray-300" />
                           </button>
                        ))}
                     </div>
                  </div>

                  <Button 
                    className="w-full h-14 text-xl bg-green-600 hover:bg-green-700"
                    onClick={handlePaymentComplete}
                    disabled={isPaying}
                  >
                    {isPaying ? "Processing Payment..." : "Pay ₹ 10.00 Now"}
                  </Button>
                  
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                     <ShieldCheck className="w-3 h-3" />
                     PCI-DSS Compliant • Secured by Razorpay Mock
                  </div>
               </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[#bdbdbd]">
            <CardHeader className="bg-[#e8f5e9] border-b border-[#c8e6c9]">
              <div className="flex items-center gap-2 text-[#2e7d32]">
                <CheckCircle2 className="w-6 h-6" />
                <CardTitle>Department Allocation</CardTitle>
              </div>
              <CardDescription className="text-[#2e7d32]/80">
                Patient UHID: <span className="font-bold">{registeredPatient?.uhid}</span>
                {registeredPatient?.abha_id && <span className="block text-[10px] font-mono">ABHA: {registeredPatient.abha_id}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6 p-4 bg-muted border border-border rounded-lg">
                <h4 className="font-bold text-sm text-foreground mb-2">Patient Summary</h4>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium text-foreground">{registeredPatient?.name}</span>
                  <span className="text-muted-foreground">Mobile:</span>
                  <span className="font-medium text-foreground">{registeredPatient?.mobile}</span>
                  <span className="text-muted-foreground">Age/Gender:</span>
                  <span className="font-medium text-foreground">
                    {new Date().getFullYear() - new Date(registeredPatient?.dob).getFullYear()} Yrs / {registeredPatient?.gender}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[#424242]">Select OPD Department *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setSelectedDept(dept.id)}
                        className={`p-4 md:p-3 text-left border rounded-lg transition-all ${
                          selectedDept === dept.id 
                            ? 'bg-accent border-primary ring-1 ring-primary' 
                            : 'bg-card border-border hover:border-primary'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-foreground">{dept.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase border-border text-muted-foreground">{dept.code}</Badge>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-2 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Loading departments...</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 flex gap-4">
                   <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep(1)}
                   >
                    Back
                   </Button>
                   <Button 
                    className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!selectedDept || isSubmitting}
                    onClick={handleTokenGeneration}
                   >
                    {isSubmitting ? "Generating..." : "Generate Token"}
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
