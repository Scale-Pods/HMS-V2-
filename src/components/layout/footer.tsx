"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0d47a1] text-white">
      <div className="max-w-[1200px] mx-auto px-3 py-4">
        <div className="grid md:grid-cols-3 gap-4 text-[11px]">
          <div>
            <h3 className="font-bold text-[12px] mb-2 text-[#bbdefb]">{t("contactUs")}</h3>
            <p className="leading-relaxed text-[#e3f2fd]">
              {t("hospitalName")}<br />
              {t("addressLine1")}<br />
              {t("addressLine2")}<br />
              {t("helplineText")}<br />
              {t("email")}: info@aiia.gov.in
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[12px] mb-2 text-[#bbdefb]">{t("quickLinks")}</h3>
            <ul className="space-y-1 text-[#e3f2fd]">
              <li>
                <Link href="/" className="hover:underline hover:text-white">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:underline hover:text-white">
                  {t("onlineAppointment")}
                </Link>
              </li>
              <li>
                <Link href="/queue" className="hover:underline hover:text-white">
                  Live Queue
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[12px] mb-2 text-[#bbdefb]">{t("importantLinks")}</h3>
            <ul className="space-y-1 text-[#e3f2fd]">
              <li>
                <Link href="#" className="hover:underline hover:text-white">
                  ABDM / ABHA
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:underline hover:text-white">
                  Patient Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[#0a3d91] border-t border-[#1565c0]">
        <div className="max-w-[1200px] mx-auto px-3 py-2">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] text-[#90caf9]">
            <p>
              © {new Date().getFullYear()} All India Institute of Ayurveda. {t("copyright")}.
            </p>
            <div className="flex items-center gap-3">
              <Link href="#" className="hover:underline hover:text-white">
                {t("privacyPolicy")}
              </Link>
              <span>|</span>
              <Link href="#" className="hover:underline hover:text-white">
                {t("termsOfUse")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
