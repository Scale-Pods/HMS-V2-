"use client";

import Link from "next/link";
import { 
  Calendar, 
  CreditCard, 
  Stethoscope, 
  Clock, 
  Users, 
  FileText, 
  ChevronRight,
  User,
  ShieldCheck,
  AlertCircle,
  Monitor
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const { t } = useLanguage();

  const services = [
    {
      icon: Calendar,
      title: t("onlineAppointment"),
      href: "/register",
    },
    {
      icon: Users,
      title: "Live Queue Status",
      href: "/queue",
    },
    {
      icon: ShieldCheck,
      title: "ABHA Services",
      href: "/abha",
    },
    {
      icon: Clock,
      title: t("emergency247"),
      href: "#",
    },
  ];

  const quickLinks = [
    { label: t("patientLogin"), href: "/login?role=patient", icon: Users },
    { label: t("doctorLogin"), href: "/login?role=doctor", icon: Stethoscope },
    { label: t("adminLogin"), href: "/login?role=admin", icon: FileText },
  ];

  return (
    <div className="bg-[#f5f5f5]">
      {/* Latest News Marquee */}
      <div className="bg-[#fff8e1] border-b border-[#ffe082] py-1.5">
        <div className="max-w-[1200px] mx-auto px-3">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="bg-[#c62828] text-white px-2 py-0.5 text-[11px] font-bold shrink-0 uppercase">
              {t("latestNews")}
            </span>
            <div className="overflow-hidden flex-1">
              <p className="text-[#bf360c] animate-marquee whitespace-nowrap">
                {t("newsTicker")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero / Welcome Section */}
      <div className="bg-white border-b border-[#e0e0e0] py-8">
        <div className="max-w-[1200px] mx-auto px-3">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#0d47a1] mb-4">
                {t("welcomeTitle")}
              </h2>
              <p className="text-sm text-[#424242] leading-relaxed mb-6">
                {t("welcomeText")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#0d47a1] text-white hover:bg-[#1565c0] px-6 h-12">
                  <Link href="/register">{t("bookAppointment")}</Link>
                </Button>
                <Button variant="outline" asChild className="border-[#0d47a1] text-[#0d47a1] hover:bg-[#e3f2fd] px-6 h-12">
                  <Link href="/queue">View Live Queue</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => (
                <Link
                  key={service.title}
                  href={service.href}
                  className="bg-[#0d47a1] border border-blue-800 p-6 rounded-lg hover:bg-[#1565c0] transition-all group"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{service.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1200px] mx-auto px-3 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Left Column: Quick Access Panels */}
          <div className="space-y-6">
            <div className="bg-white border border-[#bdbdbd] rounded-lg overflow-hidden">
              <div className="bg-[#0d47a1] text-white px-4 py-2 flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase">{t("quickAccess")}</h3>
              </div>
              <div className="p-4 grid md:grid-cols-3 gap-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex flex-col items-center p-4 border border-[#eeeeee] rounded hover:bg-[#f5f5f5] transition-colors"
                  >
                    <link.icon className="w-8 h-8 text-[#ff6f00] mb-2" />
                    <span className="text-[12px] font-bold text-[#212121]">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#0d47a1] to-[#1565c0] text-white border border-blue-800 rounded-lg overflow-hidden shadow-lg">
              <div className="p-5 flex gap-4 items-center">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Monitor className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-1">AIIA Mobile App</h4>
                  <p className="text-xs text-blue-100 mb-3">
                    Download the official AIIA App for Android and iOS. Register tokens, view live queue, and manage health records on the go.
                  </p>
                  <div className="flex gap-2">
                     <Badge className="bg-white text-blue-900 text-[10px] py-1">Android</Badge>
                     <Badge className="bg-white text-blue-900 text-[10px] py-1">iOS</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Information Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-[#bdbdbd] rounded-lg overflow-hidden">
              <div className="bg-[#ff6f00] text-white px-4 py-2">
                <h3 className="font-bold text-sm uppercase">{t("importantLinks")}</h3>
              </div>
              <ul className="p-2 space-y-1">
                {[
                  t("patientRights"),
                  t("healthResources"),
                  "AIIA Research Papers",
                  "COVID-19 Guidelines",
                  t("feedbackPortal")
                ].map((item) => (
                  <li key={item}>
                    <Link href="#" className="flex items-center gap-2 p-2 text-xs text-[#0d47a1] hover:bg-[#f5f5f5] rounded">
                      <ChevronRight className="w-3 h-3" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#e3f2fd] border border-[#bbdefb] p-4 rounded-lg">
              <h3 className="font-bold text-sm text-[#0d47a1] mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                OPD Hours
              </h3>
              <p className="text-xs text-[#424242] leading-relaxed">
                <strong>Monday - Friday:</strong> 08:00 AM - 04:00 PM<br />
                <strong>Saturday:</strong> 08:00 AM - 01:00 PM<br />
                <strong>Sunday:</strong> Emergency Only
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section - SOW 2.6 */}
        <section className="mt-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0d47a1]">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-2">Common queries regarding registration and queue management.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              { q: "How do I get a digital token?", a: "Register using your mobile number, select your department, and complete the ₹10 payment." },
              { q: "What is ABHA ID?", a: "ABHA (Ayushman Bharat Health Account) is a unique health ID that helps you store health records digitally." },
              { q: "Is registration mandatory for walk-in patients?", a: "Yes, all patients must generate a token at the counter or online for OPD consultation." },
              { q: "Can I cancel my token?", a: "Tokens are non-refundable but can be rescheduled at the OPD helpdesk." }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-white border border-border rounded-xl shadow-sm">
                <h4 className="font-bold text-[#0d47a1] mb-2 flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4" />
                  {item.q}
                </h4>
                <p className="text-sm text-[#616161] text-left">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
