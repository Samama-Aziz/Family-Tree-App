"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  pendingPersons: number;
  pendingFamilies: number;
  totalPersons: number;
  totalFamilies: number;
  totalUsers: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const cards = stats
    ? [
        { label: "Pending Persons", value: stats.pendingPersons, href: "/admin/persons", urgent: stats.pendingPersons > 0, color: "amber" },
        { label: "Pending Families", value: stats.pendingFamilies, href: "/admin/families", urgent: stats.pendingFamilies > 0, color: "amber" },
        { label: "Approved Persons", value: stats.totalPersons, href: "/persons", urgent: false, color: "emerald" },
        { label: "Approved Families", value: stats.totalFamilies, href: "/families", urgent: false, color: "emerald" },
        { label: "Total Users", value: stats.totalUsers, href: "#", urgent: false, color: "blue" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="mb-0 sm:mb-8 animate-slide-up">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] sm:text-xs font-black tracking-widest uppercase mb-3">
            Admin Console
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-2 font-medium text-sm sm:text-base">Review and approve user submissions</p>
        </div>

        {!stats ? (
          <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-slide-up">
            {cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`glass-card p-5 sm:p-7 hover:shadow-xl transition-all hover:-translate-y-1 ${card.href === "#" ? "pointer-events-none" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mb-1">{card.label}</p>
                    <p className={`text-3xl sm:text-4xl font-black ${
                      card.color === "amber" ? "text-amber-600" :
                      card.color === "emerald" ? "text-emerald-600" : "text-blue-600"
                    }`}>
                      {card.value}
                    </p>
                  </div>
                  {card.urgent && card.value > 0 && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tight flex-shrink-0">
                      Review Needed
                    </span>
                  )}
                </div>
                {card.href !== "#" && (
                  <p className="mt-5 text-[10px] sm:text-xs text-brand-primary font-black uppercase tracking-widest inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Manage <span>→</span>
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
