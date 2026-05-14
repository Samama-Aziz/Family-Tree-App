"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import UrduKeyboard from "@/components/UrduKeyboard";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { formatDate } from "@/lib/format-date";

type Submitter = { id: string; name: string; email: string };
type PendingPerson = {
  id: string;
  name: string;
  nameUrdu: string | null;
  gender: string;
  dob: string | null;
  dod: string | null;
  fatherName: string | null;
  motherName: string | null;
  caste: string | null;
  isAlive: boolean;
  status: string;
  submittedBy: string;
  submitter: Submitter | null;
  createdAt: string;
};

const empty = {
  name: "",
  nameUrdu: "",
  gender: "Male",
  dob: "",
  dod: "",
  fatherName: "",
  motherName: "",
  caste: "",
  isAlive: true,
};

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export default function AdminPersonsPage() {
  const [items, setItems] = useState<PendingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUrduKeyboard, setShowUrduKeyboard] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fatherNames, setFatherNames] = useState<string[]>([]);
  const [motherNames, setMotherNames] = useState<string[]>([]);

  const closeKeyboard = useCallback(() => setShowUrduKeyboard(false), []);

  const extractUniqueNames = useCallback((personsList: PendingPerson[]) => {
    const fathers = new Set<string>();
    const mothers = new Set<string>();
    
    personsList.forEach((p) => {
      if (p.fatherName) fathers.add(p.fatherName);
      if (p.motherName) mothers.add(p.motherName);
    });
    
    setFatherNames(Array.from(fathers).sort());
    setMotherNames(Array.from(mothers).sort());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pending/persons");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
      extractUniqueNames(data);
    }
    setLoading(false);
  }, [extractUniqueNames]);

  useEffect(() => {
    const run = async () => {
      await load();
    };
    run().catch(console.error);
  }, [load]);

  function handleAction(id: string, action: "approve" | "reject", reason?: string) {
    setActionId(id);
    startTransition(async () => {
      await fetch(`/api/admin/pending/persons/${id}`, {
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

  function cancelEdit() {
    setEditId(null);
    setForm(empty);
    setError("");
    setShowForm(false);
    setShowUrduKeyboard(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.dob && !isValidDateString(form.dob)) {
      setError("Date of birth must be in YYYY-MM-DD format");
      return;
    }
    if (form.dod && !isValidDateString(form.dod)) {
      setError("Date of death must be in YYYY-MM-DD format");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...form,
        nameUrdu: form.nameUrdu || null,
        dob: form.dob || null,
        dod: form.isAlive ? null : (form.dod || null),
        fatherName: form.fatherName || null,
        motherName: form.motherName || null,
        caste: form.caste || null,
      };

      const res = await fetch(editId ? `/api/persons/${editId}` : "/api/persons", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      cancelEdit();
      void load();
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    setIsDeleting(true);
    await fetch(`/api/persons/${deleteId}`, { method: "DELETE" });
    setIsDeleting(false);
    setDeleteId(null);
    void load();
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 animate-slide-up">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold tracking-wider uppercase mb-3">
            Admin
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Persons Management</h1>
          <p className="text-slate-500 mt-1">Create, review, and manage family members</p>
        </div>

        {/* Add Person Form */}
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary mb-8">
            Add New Person
          </button>
        )}

        {showForm && (
          <div className="glass-card p-5 md:p-8 mb-8 md:mb-12 animate-slide-up relative overflow-visible">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold">
                {editId ? "Edit Person" : "Add New Person"}
              </h2>
              <button onClick={cancelEdit} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Ahmad Khan" className="input-field w-full min-h-[44px]" />
              </div>

              <div className="space-y-2 relative sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-bold text-slate-700 ml-1">اردو نام * <span className="text-slate-400 font-normal text-xs">(Urdu Name)</span></label>
                <div className="flex items-stretch gap-2">
                  <input name="nameUrdu" value={form.nameUrdu} onChange={handleChange} dir="rtl" placeholder="احمد خان" required className="input-field w-full font-urdu text-lg min-h-[44px] h-[44px]" />
                  <button type="button" onClick={() => setShowUrduKeyboard((v) => !v)} title="Click to open Urdu keyboard for typing Urdu text"
                    className={`flex-shrink-0 min-w-[44px] h-[44px] px-3 rounded-xl border font-bold text-sm transition-all ${showUrduKeyboard ? "bg-brand-primary text-white border-brand-primary" : "border-slate-200 text-slate-500 hover:border-brand-primary hover:text-brand-primary bg-white"}`}>
                    {/* Simple keyboard icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      <rect x="6" y="10" width="2" height="2" rx="0.5" fill="currentColor" />
                      <rect x="10" y="10" width="2" height="2" rx="0.5" fill="currentColor" />
                      <rect x="14" y="10" width="2" height="2" rx="0.5" fill="currentColor" />
                      <rect x="8" y="14" width="8" height="1.5" rx="0.75" fill="currentColor" />
                    </svg>
                  </button>
                </div>
                {showUrduKeyboard && (
                  <UrduKeyboard value={form.nameUrdu} onChange={(v) => setForm((f) => ({ ...f, nameUrdu: v }))} onClose={closeKeyboard} />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Gender *</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["Male", "Female"] as const).map((gender) => (
                    <button key={gender} type="button" onClick={() => setForm((f) => ({ ...f, gender }))}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors min-h-[44px] h-[44px] flex items-center justify-center ${form.gender === gender ? "bg-brand-primary text-white border-brand-primary" : "bg-white text-slate-600 border-slate-200 hover:border-brand-primary hover:text-brand-primary"}`}>
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5"><CalendarIcon /> Date of Birth</label>
                <input name="dob" type="date" value={form.dob} onChange={handleChange} className="input-field w-full min-h-[44px] h-[44px]" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Father&apos;s Full Name *</label>
                <input
                  name="fatherName"
                  list="admin-father-names"
                  value={form.fatherName}
                  onChange={handleChange}
                  placeholder="Father's full name"
                  required
                  className="input-field w-full min-h-[44px] h-[44px]"
                />
                <datalist id="admin-father-names">
                  {fatherNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Mother&apos;s Full Name *</label>
                <input
                  name="motherName"
                  list="admin-mother-names"
                  value={form.motherName}
                  onChange={handleChange}
                  placeholder="Mother's full name"
                  required
                  className="input-field w-full min-h-[44px] h-[44px]"
                />
                <datalist id="admin-mother-names">
                  {motherNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Caste</label>
                <select name="caste" value={form.caste || ""} onChange={handleChange} className="input-field w-full min-h-[44px] h-[44px]">
                  <option value="">— Select caste —</option>
                  <option value="Arayan">Arayan</option>
                  <option value="Baig Khan">Baig Khan</option>
                  <option value="Chohan">Chohan</option>
                  <option value="Khokhar">Khokhar</option>
                  <option value="Mughal">Mughal</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <button type="button" role="switch" aria-checked={form.isAlive}
                  onClick={() => setForm((f) => ({ ...f, isAlive: !f.isAlive }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${form.isAlive ? "bg-brand-accent" : "bg-slate-200"}`}>
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${form.isAlive ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <span className="text-sm font-bold text-slate-700">Is Alive</span>
              </div>

              {!form.isAlive && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5"><CalendarIcon /> Date of Death</label>
                  <input name="dod" type="date" value={form.dod} onChange={handleChange} className="input-field w-full min-h-[44px] h-[44px]" />
                </div>
              )}

              {error && (
                <div className="col-span-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
              )}

              <div className="col-span-full flex gap-3 pt-5 mt-1 border-t border-slate-100">
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? "Saving..." : editId ? "Update" : "Save Person"}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

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
              {items.map((item) => (
                <div key={item.id} className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex items-start gap-2.5 flex-wrap">
                        <div className="min-w-0">
                          <span className="text-base sm:text-lg font-black text-slate-900 break-words">{item.name}</span>
                          {item.nameUrdu && (
                            <span className="block text-sm sm:text-base text-slate-500 font-urdu mt-0.5 leading-relaxed" dir="rtl">{item.nameUrdu}</span>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-1 sm:mt-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tight ${
                            item.gender === "Male" ? "bg-blue-50 text-blue-600" :
                            item.gender === "Female" ? "bg-pink-50 text-pink-600" :
                            "bg-slate-100 text-slate-600"
                          }`}>{item.gender}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-tight ${
                            item.isAlive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}>{item.isAlive ? "Alive" : "Deceased"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs sm:text-sm text-slate-500">
                        {item.dob && <div className="flex items-center gap-1.5"><span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">DOB:</span> <span className="font-semibold text-slate-600 truncate">{formatDate(item.dob)}</span></div>}
                        {!item.isAlive && item.dod && <div className="flex items-center gap-1.5"><span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">DOD:</span> <span className="font-semibold text-red-600 truncate">{formatDate(item.dod)}</span></div>}
                        {item.fatherName && <div className="flex items-center gap-1.5"><span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">Father:</span> <span className="font-semibold text-slate-600 truncate">{item.fatherName}</span></div>}
                        {item.motherName && <div className="flex items-center gap-1.5"><span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">Mother:</span> <span className="font-semibold text-slate-600 truncate">{item.motherName}</span></div>}
                        {item.caste && <div className="flex items-center gap-1.5"><span className="font-bold text-slate-400 uppercase tracking-tighter text-[9px]">Caste:</span> <span className="font-semibold text-slate-600 truncate">{item.caste}</span></div>}
                      </div>

                      {item.submitter && (
                        <p className="text-[10px] sm:text-xs text-slate-400 italic pt-1">
                          By <span className="font-bold text-slate-500 uppercase tracking-tight">{item.submitter.name}</span>
                          <span className="hidden sm:inline"> ({item.submitter.email})</span> on {formatDate(item.createdAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 sm:gap-3 flex-shrink-0 pt-2 md:pt-0">
                      <button
                        onClick={() => handleAction(item.id, "approve")}
                        disabled={isPending && actionId === item.id}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-brand-accent active:scale-95 disabled:opacity-50"
                      >
                        {isPending && actionId === item.id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => { setRejectId(item.id); setRejectReason(""); }}
                        disabled={isPending && actionId === item.id}
                        className="flex-1 md:flex-none px-5 py-2.5 bg-white border-2 border-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
              <button
                onClick={() => setRejectId(null)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      <DeleteConfirmModal
        open={Boolean(deleteId)}
        title="Delete person?"
        message="This action cannot be undone."
        busy={isDeleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
