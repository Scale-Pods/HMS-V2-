"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Printer, 
  ArrowLeft, 
  Download, 
  Share2, 
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  User,
  ShieldCheck
} from "lucide-react";
import { useStore } from "@/lib/store-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TokenDisplayPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tokens } = useStore();
  const [token, setToken] = useState<any>(null);

  useEffect(() => {
    if (id && tokens.length > 0) {
      const found = tokens.find(t => t.id === id);
      if (found) setToken(found);
    }
  }, [id, tokens]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `
      ALL INDIA INSTITUTE OF AYURVEDA
      Digital Token Receipt
      -------------------------------
      Token Number: ${token.token_number}
      Patient: ${token.patient?.name}
      UHID: ${token.patient?.uhid}
      Dept: ${token.department?.name}
      Date: ${new Date(token.generated_at).toLocaleDateString()}
      Time: ${new Date(token.generated_at).toLocaleTimeString()}
      Priority: ${token.priority}
      -------------------------------
      Please show this at the OPD counter.
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `token-${token.token_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Token details downloaded as text file.");
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d47a1]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f5] py-8 min-h-[calc(100vh-200px)]">
      <div className="max-w-[500px] mx-auto px-3">
        <Button 
          variant="ghost" 
          className="mb-4 text-[#616161] hover:text-[#0d47a1] print:hidden"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Home
        </Button>

        {/* Digital Token Card - Optimized for Printing */}
        <Card id="printable-token" className="border-[#bdbdbd] shadow-lg print:shadow-none print:border-2 overflow-hidden print-area">
          <div className="bg-[#0d47a1] text-white p-6 text-center print:bg-white print:text-black print:border-b-2 print:border-black">
            <div className="flex justify-center mb-2">
                <div className="bg-white p-1 rounded-sm">
                    <Building2 className="w-8 h-8 text-[#0d47a1]" />
                </div>
            </div>
            <h1 className="font-black uppercase tracking-tighter text-xl">All India Institute of Ayurveda</h1>
            <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">Government of India • New Delhi</p>
          </div>
          
          <CardContent className="p-0">
            <div className="p-6 text-center border-b border-dashed border-[#e0e0e0]">
              <div className="inline-block p-4 bg-[#e3f2fd] rounded-full mb-4 print:bg-white print:border-2">
                <CheckCircle2 className="w-12 h-12 text-[#0d47a1]" />
              </div>
              <h3 className="text-4xl font-black text-[#212121] mb-1">{token.token_number}</h3>
              <Badge variant="outline" className={cn(
                "uppercase text-[10px]",
                token.priority === 'emergency' ? "bg-red-50 text-red-700 border-red-200" :
                token.priority === 'senior_citizen' ? "bg-orange-50 text-orange-700 border-orange-200" :
                "bg-blue-50 text-blue-700 border-blue-200"
              )}>
                {token.priority.replace('_', ' ')} Category
              </Badge>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-[#616161] uppercase flex items-center gap-1">
                    <User className="w-3 h-3" /> Patient Name
                  </p>
                  <p className="text-sm font-bold text-[#212121] truncate">{token.patient?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-[#616161] uppercase flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Department
                  </p>
                  <p className="text-sm font-bold text-[#212121]">{token.department?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-[#616161] uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date of Visit
                  </p>
                  <p className="text-sm font-bold text-[#212121]">
                    {new Date(token.generated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-[#616161] uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Generation Time
                  </p>
                  <p className="text-sm font-bold text-[#212121]">
                    {new Date(token.generated_at).toLocaleTimeString('en-IN', { hour12: false })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-[#616161] uppercase flex items-center gap-1">
                    UHID
                  </p>
                  <p className="text-[11px] font-mono font-bold text-[#212121]">{token.patient?.uhid}</p>
                </div>
                {token.patient?.abha_id && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#616161] uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#ff6f00]" /> ABHA ID
                    </p>
                    <p className="text-[11px] font-mono font-bold text-[#ff6f00]">{token.patient?.abha_id}</p>
                  </div>
                )}
              </div>

              {/* Barcode Placeholder for scanner integration */}
              <div className="pt-6 flex flex-col items-center">
                 <div className="w-full h-12 bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px)] mb-1" />
                 <p className="text-[9px] font-mono text-gray-400">{token.id.slice(0, 18).toUpperCase()}</p>
              </div>
            </div>

            <div className="bg-[#e8f5e9] p-4 text-center border-t border-[#c8e6c9] flex items-center justify-center gap-3">
               <div className="flex items-center gap-1 text-[#2e7d32] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> WhatsApp Sent
               </div>
               <div className="w-[1px] h-4 bg-[#c8e6c9]" />
               <div className="flex items-center gap-1 text-[#2e7d32] font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Email Sent
               </div>
            </div>

            <div className="bg-[#f8f9fa] p-4 text-center border-t border-[#e0e0e0]">
               <p className="text-[9px] text-[#757575] italic leading-tight">
                Please proceed to <strong>Room No. {101 + (token.id.charCodeAt(0) % 20)}</strong> for your consultation.<br />
                Token is system-generated and non-editable.
               </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden">
            <Button 
                className="flex-1 bg-[#0d47a1] hover:bg-[#1565c0] gap-2 h-12"
                onClick={handlePrint}
            >
                <Printer className="w-4 h-4" />
                Print Token
            </Button>
            <Button 
                variant="outline" 
                className="flex-1 gap-2 border-[#bdbdbd] h-12"
                onClick={handleDownload}
            >
                <Download className="w-4 h-4" />
                Download
            </Button>
            <Button variant="outline" className="w-full sm:w-12 p-0 border-[#bdbdbd] h-12">
                <Share2 className="w-4 h-4" />
            </Button>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 print:hidden">
            <Clock className="w-5 h-5 text-[#0d47a1] mt-0.5" />
            <div>
                <h4 className="font-bold text-sm text-[#0d47a1]">Estimated Waiting Time</h4>
                <p className="text-xs text-[#424242]">
                    Based on the current queue, your estimated waiting time is approximately <strong>25 minutes</strong>. 
                    We will notify you via WhatsApp when your turn is near.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
