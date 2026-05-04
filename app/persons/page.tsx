"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import UrduKeyboard from "@/components/UrduKeyboard";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { ListLoadingSkeleton } from "@/components/LoadingSkeleton";
import { formatDate } from "@/lib/format-date";

type Person = {
  id: string;
  displayId: string;
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
  submittedByName: string | null;
  rejectionReason: string | null;
  age?: number;
};

const emptyForm = {
  name: "",
  nameUrdu: "",
  gender: "Male" as "Male" | "Female",
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

function StatusBadge({ status, reason }: { status: string; reason?: string | null }) {
  if (status === "approved") return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-tight">Approved</span>;
  if (status === "rejected") return (
    <div className="group relative inline-block">
      <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase tracking-tight cursor-help">Rejected</span>
      {reason && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 font-medium leading-relaxed">
          {reason}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
  return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase tracking-tight">Pending Approval</span>;
}

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [pendingItems, setPendingItems] = useState<Person[]>([]);
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const [isLoadingPersons, setIsLoadingPersons] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"approved" | "pending" | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"approved" | "pending" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUrduKeyboard, setShowUrduKeyboard] = useState(false);

  const isAdmin = user?.role === "admin";
  const closeKeyboard = useCallback(() => setShowUrduKeyboard(false), []);

  const loadUser = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) setUser(await res.json());
  }, []);

  const loadPersons = useCallback(async () => {
    setIsLoadingPersons(true);
    const res = await fetch("/api/persons");
    if (res.ok) setPersons(await res.json());
    setIsLoadingPersons(false);
  }, []);

  const loadPending = useCallback(async () => {
    if (isAdmin) return;
    setIsLoadingPending(true);
    const res = await fetch("/api/pending/persons");
    if (res.ok) setPendingItems(await res.json());
    setIsLoadingPending(false);
  }, [isAdmin]);

  useEffect(() => {
    const init = async () => {
      await loadUser();
      await loadPersons();
    };
    init().catch(console.error);
  }, [loadUser, loadPersons]);

  useEffect(() => {
    const initPending = async () => {
      if (user && !isAdmin) {
        await loadPending();
      }
    };
    initPending().catch(console.error);
  }, [user, isAdmin, loadPending]);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditType(null);
    setForm(emptyForm);
    setShowForm(false);
    setError("");
  };

  const startEdit = (p: Person, type: "approved" | "pending") => {
    setEditId(p.id);
    setEditType(type);
    setForm({
      name: p.name,
      nameUrdu: p.nameUrdu || "",
      gender: p.gender as "Male" | "Female",
      dob: p.dob || "",
      dod: p.dod || "",
      fatherName: p.fatherName || "",
      motherName: p.motherName || "",
      caste: p.caste || "",
      isAlive: p.isAlive,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const url = editType === "pending" 
        ? `/api/pending/persons/${editId}` 
        : (editId ? `/api/persons/${editId}` : (isAdmin ? "/api/persons" : "/api/pending/persons"));
      
      const method = (editId || editType === "pending") ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nameUrdu: form.nameUrdu || null,
          dob: form.dob || null,
          dod: form.isAlive ? null : (form.dod || null),
          fatherName: form.fatherName || null,
          motherName: form.motherName || null,
          caste: form.caste || null,
        }),
      });

      if (res.ok) {
        cancelEdit();
        loadPersons().catch(console.error);
        loadPending().catch(console.error);
      } else {
        const d = await res.json();
        setError(d.error || "Failed to save");
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    const url = deleteType === "pending" ? `/api/pending/persons/${deleteId}` : `/api/persons/${deleteId}`;
    await fetch(url, { method: "DELETE" });
    setIsDeleting(false);
    setDeleteId(null);
    setDeleteType(null);
    loadPersons().catch(console.error);
    loadPending().catch(console.error);
  };

  const filteredPersons = (persons || []).filter((p) => {
    const s = searchQuery.toLowerCase().trim();
    const haystack = [p.name, p.nameUrdu, p.displayId, p.gender, p.fatherName, p.motherName, p.caste]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(s);
  });

  const pendingCount = (pendingItems || []).filter(p => p.status === "pending").length;
  const rejectedCount = (pendingItems || []).filter(p => p.status === "rejected").length;
  const pendingItemsArray = pendingItems || [];

  const totalPages = Math.ceil(filteredPersons.length / (itemsPerPage || 10));
  const paginatedPersons = filteredPersons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-12 animate-slide-up">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wider uppercase">
              Directory
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Persons</h1>
            <p className="text-slate-500 text-sm md:text-base font-medium">
              {isAdmin ? "Manage all family members" : "Submit and track your family members"}
            </p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary self-start sm:self-auto">
              {isAdmin ? "Add Person" : "Submit New Person"}
            </button>
          )}
        </div>

        {showForm && (
          <div className="glass-card p-5 md:p-8 mb-8 md:mb-12 animate-slide-up relative overflow-visible">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  {editId ? "Edit Person" : "New Person"}
                </h2>
                {!isAdmin && !editId && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">Will be sent for admin approval</p>
                )}
              </div>
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
                <input name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Father&apos;s full name" required className="input-field w-full min-h-[44px] h-[44px]" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Mother&apos;s Full Name *</label>
                <input name="motherName" value={form.motherName} onChange={handleChange} placeholder="Mother&apos;s full name" required className="input-field w-full min-h-[44px] h-[44px]" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Caste</label>
                <input
                  name="caste"
                  list="caste-options"
                  value={form.caste || ""}
                  onChange={handleChange}
                  placeholder="Select or type caste..."
                  className="input-field w-full min-h-[44px] h-[44px]"
                />
                <datalist id="caste-options">
                  <option value="Arayan" />
                  <option value="Baig" />
                  <option value="Chohan" />
                  <option value="Khokhar" />
                  <option value="Khan" />
                  <option value="Mughal" />
                </datalist>
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
                  {isPending ? "Saving..." : editId ? "Update" : isAdmin ? "Save" : "Submit for Approval"}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {!isAdmin && (
          <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit animate-slide-up">
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "approved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              My Approved ({persons.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"} relative`}
            >
              My Submissions
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">{pendingCount}</span>
              )}
              {rejectedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">{rejectedCount}</span>
              )}
            </button>
          </div>
        )}

        {(isAdmin || activeTab === "approved") && (
          <div className="glass-card overflow-x-auto animate-slide-up mb-6" style={{ animationDelay: "100ms" }}>
            <div className="min-w-full">
              <div className="px-5 md:px-8 py-5 bg-slate-50 border-b border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-7 rounded-full bg-brand-primary" />
                  <h3 className="text-lg md:text-xl font-bold">{isAdmin ? "All Family Members" : "My Approved Submissions"}</h3>
                  <span className="ml-auto px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-full whitespace-nowrap">{filteredPersons.length} results</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by name, ID, father name..."
                      value={searchQuery}
                      onChange={onSearchChange}
                      className="input-field w-full pl-10 min-h-[40px] h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {isLoadingPersons ? (
                <div className="px-5 md:px-8 py-6">
                  <ListLoadingSkeleton count={3} />
                </div>
              ) : filteredPersons.length === 0 ? (
                <div className="px-5 py-20 text-center space-y-3">
                  <p className="text-slate-400 text-lg font-medium">
                    {persons.length === 0
                      ? (isAdmin ? "No persons yet." : "None of your submissions have been approved yet.")
                      : "No matching results found"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="sm:hidden divide-y divide-slate-100">
                    {paginatedPersons.map((p) => (
                      <div key={p.id} className="px-4 py-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-bold text-brand-primary whitespace-nowrap">{p.displayId}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.gender === "Male" ? "bg-blue-50 text-blue-600" : p.gender === "Female" ? "bg-pink-50 text-pink-600" : "bg-slate-100 text-slate-600"}`}>{p.gender}</span>
                            </div>
                            <div className="font-bold text-slate-900 break-words">{p.name}</div>
                            {p.nameUrdu && <div className="text-sm text-slate-600 font-urdu mt-0.5" dir="rtl">{p.nameUrdu}</div>}
                            <div className="text-xs text-slate-500 mt-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                              {p.dob && (
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Born</span>
                                  <span className="font-semibold text-slate-700 text-xs">{formatDate(p.dob)}</span>
                                </div>
                              )}
                              {!p.isAlive && p.dod && (
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-rose-400 uppercase tracking-widest text-[9px]">Passed</span>
                                  <span className="font-semibold text-rose-600 text-xs">{formatDate(p.dod)}</span>
                                </div>
                              )}
                              {p.fatherName && (
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Father</span>
                                  <span className="italic px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 ring-1 ring-blue-100 text-[11px] truncate ml-4">{p.fatherName}</span>
                                </div>
                              )}
                              {p.motherName && (
                                <div className="flex items-center justify-between pt-1">
                                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Mother</span>
                                  <span className="italic px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 ring-1 ring-pink-100 text-[11px] truncate ml-4">{p.motherName}</span>
                                </div>
                              )}
                              {p.caste && (
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Caste</span>
                                  <span className="font-medium text-slate-600 text-[11px]">{p.caste}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex flex-col gap-2">
                              <button onClick={() => startEdit(p, "approved")} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-500 rounded-xl transition-all active:scale-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => { setDeleteId(p.id); setDeleteType("approved"); }} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl transition-all active:scale-90">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs">ID</th>
                          <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs">Member Name</th>
                          <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs">Date of Birth</th>
                          <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs">Caste</th>
                          <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs">Parents</th>
                          <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs">Status</th>
                          {isAdmin && <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-xs">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedPersons.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-brand-primary text-xs">{p.displayId}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>{p.name}</span>
                                {p.nameUrdu && <span className="text-xs text-slate-500 font-urdu" dir="rtl">({p.nameUrdu})</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${p.gender === "Male" ? "text-blue-600 bg-blue-50" : "text-pink-600 bg-pink-50"}`}>{p.gender}</span>
                                {p.submittedByName && (
                                  <span className="text-[10px] font-medium text-slate-400">by {p.submittedByName}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {p.dob && (
                                  <div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Born</div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-600 font-semibold text-sm tabular-nums">{formatDate(p.dob)}</span>
                                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">Age: {p.age}</span>
                                    </div>
                                  </div>
                                )}
                                {!p.isAlive && p.dod && (
                                  <div>
                                    <div className="text-[9px] font-bold text-rose-400 uppercase tracking-widest leading-none mb-1">Passed</div>
                                    <div className="text-rose-500 font-semibold text-sm tabular-nums">{formatDate(p.dod)}</div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className="text-slate-600 font-bold">{p.caste ?? "—"}</span>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600">
                              <div className="space-y-1">
                                {p.fatherName && (
                                  <div>
                                    <span className="font-semibold uppercase text-blue-600 text-[10px] mr-2">Father:</span>
                                    <span className="text-slate-400 font-bold ">{p.fatherName}</span>
                                  </div>
                                )}
                                {p.motherName && (
                                  <div>
                                    <span className="font-semibold uppercase text-pink-600 text-[10px] mr-2">Mother:</span>
                                    <span className="text-slate-400 font-bold ">{p.motherName}</span>
                                  </div>
                                )}
                                {!p.fatherName && !p.motherName && <span>—</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${p.isAlive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${p.isAlive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                {p.isAlive ? "Living" : "Deceased"}
                              </span>
                            </td>
                            {isAdmin && (
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => startEdit(p, "approved")} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                  </button>
                                  <button onClick={() => { setDeleteId(p.id); setDeleteType("approved"); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-sm text-slate-600">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn-outline px-3 py-1 text-xs disabled:opacity-50">Prev</button>
                        <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn-outline px-3 py-1 text-xs disabled:opacity-50">Next</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {!isAdmin && activeTab === "pending" && (
          <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="px-5 md:px-8 py-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
              <span className="w-1.5 h-7 rounded-full bg-amber-500" />
              <h3 className="text-lg md:text-xl font-bold">My Submissions ({pendingCount + rejectedCount})</h3>
            </div>

            {isLoadingPending ? (
              <div className="px-5 md:px-8 py-6">
                <ListLoadingSkeleton count={2} />
              </div>
            ) : pendingItemsArray.length === 0 ? (
              <div className="px-5 py-20 text-center">
                <p className="text-slate-400">No submissions yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingItemsArray.map((item) => (
                  <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs text-brand-primary font-mono font-bold">{item.displayId}</span>
                        <span className="font-bold text-slate-900">{item.name}</span>
                        {item.nameUrdu && <span className="text-xs text-slate-600 font-urdu" dir="rtl">({item.nameUrdu})</span>}
                        <StatusBadge status={item.status} reason={item.rejectionReason} />
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.fatherName && <span>Father: {item.fatherName}</span>}
                      </div>
                    </div>
                    {item.status === "pending" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(item, "pending")} className="p-2 hover:bg-blue-50 text-blue-500 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => { setDeleteId(item.id); setDeleteType("pending"); }} className="p-2 hover:bg-red-50 text-red-500 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={Boolean(deleteId)}
        title="Delete person?"
        message="This action cannot be undone."
        busy={isDeleting}
        onCancel={() => { setDeleteId(null); setDeleteType(null); }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
