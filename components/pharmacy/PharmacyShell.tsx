// components/pharmacy/PharmacyShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navItems = [
  { href: "/pharmacy", label: "Overview" },
  { href: "/pharmacy/prescriptions", label: "Prescriptions" },
  { href: "/pharmacy/billing", label: "Billing" },
  { href: "/pharmacy/deliveries", label: "Deliveries" },
  { href: "/pharmacy/patients", label: "Patients" },
  { href: "/pharmacy/settings", label: "Settings" },
];

export default function PharmacyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center px-4 py-6 md:py-10">
      <div className="w-full max-w-6xl rounded-3xl border border-slate-800 bg-slate-950/90 shadow-[0_0_80px_rgba(15,118,110,0.35)] backdrop-blur-xl p-5 md:p-8 flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Pharmacy Console
            </h1>
            <p className="text-sm text-slate-400">
              Manage prescriptions, billing, and medication fulfillment.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-emerald-400/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pharmacist view</span>
          </div>
        </header>

        {/* Nav */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 text-sm">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/pharmacy" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-3 md:px-4 py-1.5 transition-all ${
                  isActive
                    ? "bg-slate-100 text-slate-950 font-medium shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-emerald-400/70 via-sky-500/70 to-transparent" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
