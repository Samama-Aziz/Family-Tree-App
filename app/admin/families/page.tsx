"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { formatDate } from "@/lib/format-date";

type Submitter = { id: string; name: string; email: string };
type PersonRef = { id: string; name: string; nameUrdu?: string | null };

type PendingFamily = {
  id: string;
  displayId?: string;
  husbandId: string;
  husbandName: string;
  wifeId: string;
  wifeName: string;
  sonIds: string[];
  daughterIds: string[];
  remarks: string | null;
  status: string;
  submittedBy: string;
  submitter: Submitter | null;
  createdAt: string;
};

export default function AdminFamiliesPage() {
  const [items, setItems] = useState<PendingFamily[]>([]);
  const [persons, setPersons] = useState<PersonRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [familiesRes, personsRes] = await Promise.all([
      fetch("/api/admin/pending/families"),
      fetch("/api/persons"),
    ]);
    if (familiesRes.ok) {
      const data = await familiesRes.json();
      setItems(Array.isArray(data) ? data : []);
    }
    if (personsRes.ok) {
      const data = await personsRes.json();
      setPersons(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const run = async () => {
      await load();
    };
    run().catch(console.error);
  }, [load]);

  function resolvePersons(ids: string[]): PersonRef[] {
    return ids.map((id) => persons.find((p) => p.id === id)).filter(Boolean) as PersonRef[];
  }

  function getPersonUrdu(id: string): string | null {
    const person = persons.find((p) => p.id === id);
    return person?.nameUrdu || null;
  }

  function handleAction(id: string, action: "approve" | "reject", reason?: string) {
    setActionId(id);
    startTransition(async () => {
      await fetch(`/api/admin/pending/families/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      setActionId(null);
      setRejectId(null);
      setRejectReason("");
      load().catch(console.error);
    });
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold tracking-wider uppercase mb-3">
            Admin
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Pending Families</h1>
          <p className="text-slate-500 mt-1">Review and approve or reject family submissions</p>
        </div>

        <div className="glass-card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <span className="w-1.5 h-7 rounded-full bg-amber-500" />
            <h3 className="text-lg font-bold">
              Pending Review ({loading ? "…" : items.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p className="text-lg font-medium">No pending submissions</p>
              <p className="text-sm mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const sons = resolvePersons(item.sonIds);
                const daughters = resolvePersons(item.daughterIds);
                return (
                  <div key={item.id} className="overflow-hidden">

                    {/* Card header */}
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent">
                      <div className="flex items-center gap-3 flex-wrap">
                        {item.displayId && (
                          <span className="text-xs font-mono font-bold text-brand-primary">ID: {item.displayId}</span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold ring-1 ring-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Pending
                        </span>
                      </div>
                      {item.submitter && (
                        <span className="text-[11px] text-slate-400 shrink-0">
                          By <span className="font-semibold text-slate-600">{item.submitter.name}</span>
                          {" · "}{formatDate(item.createdAt)}
                        </span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                      {/* Parents panel */}
                      <div className="p-4 sm:p-6 lg:w-72 bg-slate-50/60 flex-shrink-0 space-y-4 sm:space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-widest">Husband</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{item.husbandName}</p>
                            {getPersonUrdu(item.husbandId) && (
                              <p className="text-sm font-urdu text-slate-500 leading-relaxed truncate" dir="rtl">{getPersonUrdu(item.husbandId)}</p>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 border-l-2 border-slate-200 h-3" />

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-widest">Wife</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{item.wifeName}</p>
                            {getPersonUrdu(item.wifeId) && (
                              <p className="text-sm font-urdu text-slate-500 leading-relaxed truncate" dir="rtl">{getPersonUrdu(item.wifeId)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Children + actions panel */}
                      <div className="p-4 sm:p-6 flex-1 flex flex-col gap-6">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Sons */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              Sons ({item.sonIds.length})
                            </p>
                            {sons.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {sons.map((s) => (
                                  <span key={s.id} className="inline-flex items-baseline gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-xl border border-blue-100">
                                    <span>{s.name}</span>
                                    {s.nameUrdu && <span className="text-[11px] font-urdu text-blue-400" dir="rtl">{s.nameUrdu}</span>}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No sons</p>
                            )}
                          </div>

                          {/* Daughters */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                              Daughters ({item.daughterIds.length})
                            </p>
                            {daughters.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {daughters.map((d) => (
                                  <span key={d.id} className="inline-flex items-baseline gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 text-xs font-semibold rounded-xl border border-pink-100">
                                    <span>{d.name}</span>
                                    {d.nameUrdu && <span className="text-[11px] font-urdu text-pink-400" dir="rtl">{d.nameUrdu}</span>}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No daughters</p>
                            )}
                          </div>
                        </div>

                        {/* Remarks */}
                        {item.remarks && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Remarks</p>
                            <div className="flex items-start gap-2.5 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                              <span className="w-0.5 min-h-[1rem] self-stretch bg-slate-300 rounded-full shrink-0" />
                              <p className="text-sm text-slate-500">{item.remarks}</p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleAction(item.id, "approve")}
                            disabled={isPending && actionId === item.id}
                            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            {isPending && actionId === item.id ? "…" : "Approve"}
                          </button>
                          <button
                            onClick={() => { setRejectId(item.id); setRejectReason(""); }}
                            disabled={isPending && actionId === item.id}
                            className="px-5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-bold mb-4">Reject submission</h3>
            <div className="space-y-2 mb-5">
              <label className="text-sm font-bold text-slate-700">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this submission is rejected..."
                rows={3}
                className="input-field w-full resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAction(rejectId, "reject", rejectReason)}
                disabled={isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
              >
                {isPending ? "Rejecting..." : "Confirm Reject"}
              </button>
              <button onClick={() => setRejectId(null)} className="btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
