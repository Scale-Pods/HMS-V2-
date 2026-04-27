"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { 
  User, 
  Stethoscope, 
  ShieldCheck, 
  ArrowRight,
  Hospital
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const role = searchParams.get("role") as UserRole;

  const handleLogin = (selectedRole: UserRole) => {
    login(selectedRole);
    toast.success(`Logged in as ${selectedRole}`);
    if (selectedRole === 'doctor') {
      router.push('/doctor/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="bg-[#f5f5f5] flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <div className="max-w-[400px] w-full px-3">
        <Card className="border-[#bdbdbd] shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-[#e3f2fd] rounded-full flex items-center justify-center mx-auto mb-4">
              <Hospital className="w-8 h-8 text-[#0d47a1]" />
            </div>
            <CardTitle className="text-xl font-black text-[#0d47a1] uppercase">AIIA HMS Login</CardTitle>
            <CardDescription>Select your role to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button 
                variant={role === 'patient' || !role ? 'default' : 'outline'} 
                className="w-full h-14 justify-start gap-4 text-left border-[#bdbdbd]"
                onClick={() => handleLogin('patient')}
            >
                <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                    <p className="font-bold text-sm">Patient Portal</p>
                    <p className="text-[10px] opacity-70">Book tokens & view e-cards</p>
                </div>
                <ArrowRight className="ml-auto w-4 h-4 opacity-30" />
            </Button>

            <Button 
                variant={role === 'doctor' ? 'default' : 'outline'} 
                className="w-full h-14 justify-start gap-4 text-left border-[#bdbdbd]"
                onClick={() => handleLogin('doctor')}
            >
                <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-green-600" />
                </div>
                <div>
                    <p className="font-bold text-sm">Doctor Console</p>
                    <p className="text-[10px] opacity-70">Manage queue & consultations</p>
                </div>
                <ArrowRight className="ml-auto w-4 h-4 opacity-30" />
            </Button>

            <Button 
                variant={role === 'admin' ? 'default' : 'outline'} 
                className="w-full h-14 justify-start gap-4 text-left border-[#bdbdbd]"
                onClick={() => handleLogin('admin')}
            >
                <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                    <p className="font-bold text-sm">Administrator</p>
                    <p className="text-[10px] opacity-70">System configuration & reports</p>
                </div>
                <ArrowRight className="ml-auto w-4 h-4 opacity-30" />
            </Button>
            
            <div className="pt-4 text-center">
                <p className="text-[10px] text-gray-500 italic">
                    MVP Demonstration: Role selection bypasses official authentication.
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
