"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  const publicNavItems = [
    { href: "/", label: t("home") },
    { href: "/register", label: t("onlineAppointment") },
    { href: "/queue", label: "Live Queue" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-[#0d47a1] text-white px-4 py-2 z-50"
      >
        {t("skipContent")}
      </a>

      {/* Top utility bar */}
      <div className="bg-muted text-primary text-[11px] border-b border-border">
        <div className="max-w-[1200px] mx-auto px-3 py-1 flex justify-between items-center">
          <div className="flex items-center gap-1"></div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hover:bg-gray-100 px-1"
              onClick={() => (document.body.style.fontSize = "large")}
            >
              A+
            </button>
            <button type="button" className="hover:bg-gray-100 px-1" onClick={() => (document.body.style.fontSize = "medium")}>
              A
            </button>
            <button
              type="button"
              className="hover:bg-gray-100 px-1"
              onClick={() => (document.body.style.fontSize = "small")}
            >
              A-
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="hover:underline px-1"
            >
              {language === "en" ? "हिंदी" : "English"}
            </button>
            <span className="text-gray-300">|</span>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="font-bold">{user?.role?.toUpperCase()}</span>
                <button
                    type="button"
                    onClick={logout}
                    className="hover:underline px-1 text-destructive"
                >
                    {t("logout")}
                </button>
              </div>
            ) : (
              <Link href="/login" className="hover:underline px-1">
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header with logo */}
      <div className="bg-white border-b-[3px] border-[#ff6f00]">
        <div className="max-w-[1200px] mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/b/b4/Emblem_of_India_with_transparent_background.png"
                alt={t("emblemAlt")}
                width={60}
                height={60}
                className="h-[60px] w-[60px] object-contain mix-blend-multiply"
                priority
                unoptimized
              />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-primary leading-tight tracking-tight uppercase">
                  {t("hospitalName")}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t("govtName")}
                </p>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              <div className="text-right text-[11px] text-muted-foreground">
                <p>{t("emergencyServices")}</p>
                <p className="font-bold text-primary">{t("helplineText")}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <nav className="bg-white hidden md:block border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-3">
          <ul className="flex items-center">
            {publicNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block px-4 py-2 text-[13px] font-medium transition-colors border-r border-border",
                    pathname === item.href 
                        ? "bg-[#e3f2fd] text-primary border-b-2 border-b-primary font-bold" 
                        : "text-primary hover:bg-blue-50"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {user?.role === 'doctor' && (
                <li>
                    <Link
                    href="/doctor/dashboard"
                    className={cn(
                        "block px-4 py-2 text-[13px] font-medium transition-colors border-r border-border",
                        pathname === "/doctor/dashboard" 
                            ? "bg-[#e3f2fd] text-primary border-b-2 border-b-primary font-bold" 
                            : "text-primary hover:bg-blue-50"
                    )}
                    >
                    {t("doctorDashboard")}
                    </Link>
                </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#bdbdbd]">
          <nav className="max-w-[1200px] mx-auto px-3 py-2">
            <ul className="space-y-0">
              {publicNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-2 text-[13px] font-medium border-b border-[#eeeeee]",
                      pathname === item.href
                        ? "bg-[#e3f2fd] text-[#0d47a1]"
                        : "text-[#212121] hover:bg-[#f5f5f5]"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
                <li className="pt-2">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-[13px] font-medium text-[#c62828] hover:bg-[#f5f5f5]"
                    >
                      {t("logout")}
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-[13px] font-medium text-[#0d47a1] hover:bg-[#f5f5f5]"
                    >
                      {t("login")}
                    </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
