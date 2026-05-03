"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { ListLoadingSkeleton } from "@/components/LoadingSkeleton";
import { useAuth } from "@/components/AuthContext";
import { formatDate } from "@/lib/format-date";

type Person = {
  id: string;
  name: string;
  nameUrdu?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  gender: string;
  caste?: string | null;
  dob?: string | null;
  dod?: string | null;
  isAlive?: boolean;
};

type Family = {
  id: string;
  displayId: string;
  husbandId: string;
  husbandName: string;
  wifeId: string;
  wifeName: string;
  sonIds: string[];
  daughterIds: string[];
  remarks: string | null;
  submittedByName?: string | null;
  husband?: Person | null;
  wife?: Person | null;
  sons?: Person[];
  daughters?: Person[];
};

type PendingFamily = {
  id: string;
  displayId: string;
  husbandName: string;
  wifeName: string;
  sonIds: string[];
  daughterIds: string[];
  remarks: string | null;
  status: string;
  rejectionReason: string | null;
};

const empty = {
  husbandId: "",
  wifeId: "",
  sonIds: [] as string[],
  daughterIds: [] as string[],
  remarks: "",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function personLabel(p: Person) {
  return `${p.name}${p.nameUrdu ? ` - ${p.nameUrdu}` : ""}`;
}

function personSearchText(p: Person) {
  return `${p.name} ${p.nameUrdu ?? ""} ${p.fatherName ?? ""} ${p.motherName ?? ""}`.toLowerCase();
}

function StatusBadge({ status, reason }: { status: string; reason?: string | null }) {
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold ring-1 ring-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Pending
      </span>
    );
  if (status === "rejected")
    return (
      <span title={reason ?? "Rejected"} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold ring-1 ring-red-200">
        Rejected{reason ? ` — ${reason}` : ""}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold ring-1 ring-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Approved
    </span>
  );
}

function SearchablePersonSelect({
  label, value, options, placeholder, onChange,
}: { label: string; value: string; options: Person[]; placeholder: string; onChange: (id: string) => void }) {
  const selected = options.find((p) => p.id === value) ?? null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); if (!value) setQuery(""); }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [value]);

  const filtered = options.filter((p) => personSearchText(p).includes(query.toLowerCase()));

  return (
    <div className="space-y-2" ref={ref}>
      <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
      <div className="relative">
        <input
          value={open ? query : (selected ? personLabel(selected) : query)}
          onFocus={() => { setOpen(true); setQuery(selected ? personLabel(selected) : query); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (value) onChange(""); }}
          placeholder={placeholder}
          className="input-field w-full"
        />
        {value && (
          <button type="button" onClick={() => { onChange(""); setQuery(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">×</button>
        )}
        {open && (
          <div className="absolute z-30 mt-2 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400 italic">No person found</p>
            ) : filtered.map((p) => (
              <button key={p.id} type="button"
                onClick={() => { onChange(p.id); setQuery(personLabel(p)); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0">
                <span className="block text-sm font-medium text-slate-700">{p.name}</span>
                {p.nameUrdu && <span className="block text-xs text-slate-500 font-urdu leading-relaxed" dir="rtl">{p.nameUrdu}</span>}
                {(p.fatherName || p.motherName) && (
                  <span className="mt-1 block text-[11px] text-slate-500">
                    {p.fatherName ? `Father: ${p.fatherName}` : "Father: Unknown"} | {p.motherName ? `Mother: ${p.motherName}` : "Mother: Unknown"}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonPicker({ label, selectedIds, available, onAdd, onRemove }: {
  label: string; selectedIds: string[]; available: Person[];
  onAdd: (id: string) => void; onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = available.filter((p) => selectedIds.includes(p.id));
  const unselected = available.filter((p) => !selectedIds.includes(p.id));
  const filtered = unselected.filter((p) => personSearchText(p).includes(query.toLowerCase()));

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
      <div className="min-h-[52px] p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap gap-2 items-center">
        {selected.map((p) => (
          <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 border border-slate-200">
            <span className="max-w-[180px]">
              <span className="block break-words">{p.name}</span>
              {p.nameUrdu && <span className="block text-xs text-slate-500 font-urdu" dir="rtl">{p.nameUrdu}</span>}
            </span>
            <button type="button" onClick={() => onRemove(p.id)} className="text-slate-400 hover:text-slate-700">×</button>
          </span>
        ))}
        <div className="relative min-w-[220px] flex-1" ref={ref}>
          <input
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="input-field w-full min-h-[40px]"
          />
          {open && (
            <div className="absolute left-0 top-11 z-30 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400 italic">{unselected.length === 0 ? "No more persons available" : "No match found"}</p>
              ) : filtered.map((p) => (
                <button key={p.id} type="button" onClick={() => { onAdd(p.id); setQuery(""); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 font-medium border-b border-slate-100 last:border-0">
                  <span className="block">{p.name}</span>
                  {p.nameUrdu && <span className="block text-xs text-slate-500 font-urdu" dir="rtl">{p.nameUrdu}</span>}
                  {(p.fatherName || p.motherName) && (
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {p.fatherName ? `Father: ${p.fatherName}` : "Father: Unknown"} | {p.motherName ? `Mother: ${p.motherName}` : "Mother: Unknown"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonDetailModal({ person, onClose }: { person: Person; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{person.name}</h2>
            {person.nameUrdu && <p className="text-base font-urdu text-slate-600 mt-0.5" dir="rtl">{person.nameUrdu}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              person.gender === "Male" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100" :
              person.gender === "Female" ? "bg-pink-50 text-pink-700 ring-1 ring-pink-100" :
              "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            }`}>{person.gender}</span>
            {person.isAlive === false && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 ring-1 ring-slate-200">Deceased</span>
            )}
            {person.isAlive === true && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">Alive</span>
            )}
          </div>
          <div className="pt-2 space-y-2.5 border-t border-slate-100">
            {person.dob && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 font-medium w-28 shrink-0">Date of Birth</span>
                <span className="font-semibold text-slate-700">{formatDate(person.dob)}</span>
              </div>
            )}
            {person.dod && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 font-medium w-28 shrink-0">Date of Death</span>
                <span className="font-semibold text-slate-700">{formatDate(person.dod)}</span>
              </div>
            )}
            {person.caste && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 font-medium w-28 shrink-0">Caste</span>
                <span className="font-semibold text-slate-700">{person.caste}</span>
              </div>
            )}
            {person.fatherName && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 font-medium w-28 shrink-0">Father</span>
                <span className="font-semibold text-slate-700">{person.fatherName}</span>
              </div>
            )}
            {person.motherName && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 font-medium w-28 shrink-0">Mother</span>
                <span className="font-semibold text-slate-700">{person.motherName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact person card used inside family cards for sons / daughters
function ChildCard({
  person,
  full,
  accent,
}: {
  person: Person;
  full: Person | undefined;
  accent: "blue" | "pink";
}) {
  const isAlive = full?.isAlive ?? person.isAlive;
  const caste = full?.caste ?? person.caste;
  const dob = full?.dob ?? person.dob;

  const bg = accent === "blue" ? "bg-white border-blue-100 hover:border-blue-300 hover:bg-blue-50/40" : "bg-white border-pink-100 hover:border-pink-300 hover:bg-pink-50/40";
  const genderBadge = accent === "blue" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700";

  return (
    <div className={`text-left p-3 rounded-xl border w-full ${bg}`}>
      {/* Name row */}
      <div className="mb-2 flex items-baseline gap-1.5 flex-wrap">
        <p className="text-xs font-bold text-slate-800 leading-tight break-words">{person.name}</p>
        {person.nameUrdu && (
          <p className="text-[11px] font-urdu text-slate-500 leading-relaxed" dir="rtl">{person.nameUrdu}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${genderBadge}`}>
          {person.gender}
        </span>
        {isAlive !== undefined && (
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${isAlive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {isAlive ? "Living" : "Deceased"}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="text-[10px] text-slate-500 space-y-0.5">
        {dob && <p>{formatDate(dob)}</p>}
        {caste && <p>Caste: <span className="font-semibold text-slate-600">{caste}</span></p>}
        <p>Father: {person.fatherName || "Unknown"}</p>
        <p>Mother: {person.motherName || "Unknown"}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FamiliesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: families = [], mutate: mutateFamilies, isLoading: isLoadingFamilies } = useSWR<Family[]>("/api/families", fetcher, {
    revalidateOnFocus: false, dedupingInterval: 30000,
  });
  const { data: persons = [] } = useSWR<Person[]>("/api/persons", fetcher, {
    revalidateOnFocus: false, dedupingInterval: 30000,
  });
  const { data: pendingFamilies = [], mutate: mutatePendingFamilies, isLoading: isLoadingPending } = useSWR<PendingFamily[]>(
    !isAdmin ? "/api/pending/families" : null, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteFamilyId, setDeleteFamilyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"approved" | "pending">("approved");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const selectedPerson = persons.find((p) => p.id === selectedPersonId) ?? null;

  const filteredFamilies = families.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.husbandName.toLowerCase().includes(q) ||
      f.wifeName.toLowerCase().includes(q) ||
      f.displayId.toLowerCase().includes(q)
    );
  });

  function startEdit(f: Family) {
    setEditId(f.id);
    setForm({ husbandId: f.husbandId, wifeId: f.wifeId, sonIds: f.sonIds || [], daughterIds: f.daughterIds || [], remarks: f.remarks ?? "" });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditId(null);
    setForm(empty);
    setError("");
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.husbandId || !form.wifeId) { setError("Please select both husband and wife"); return; }

    startTransition(async () => {
      let url: string;
      let method: string;

      if (isAdmin) {
        url = editId ? `/api/families/${editId}` : "/api/families";
        method = editId ? "PUT" : "POST";
      } else {
        url = "/api/pending/families";
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) { const data = await res.json(); setError(data.error ?? "Something went wrong"); return; }

      cancelEdit();
      void mutateFamilies();
      void mutatePendingFamilies();
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteFamilyId) return;
    setIsDeleting(true);
    await fetch(`/api/families/${deleteFamilyId}`, { method: "DELETE" });
    setIsDeleting(false);
    setDeleteFamilyId(null);
    void mutateFamilies();
  }

  const males = persons.filter((p) => p.gender === "Male");
  const females = persons.filter((p) => p.gender === "Female");
  const pendingCount = pendingFamilies.filter((f) => f.status === "pending").length;
  const rejectedCount = pendingFamilies.filter((f) => f.status === "rejected").length;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-slide-up">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wider uppercase">
              Connections
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Families</h1>
            <p className="text-slate-500 text-base font-medium">
              {isAdmin ? "Manage all family connections" : "Submit family connections for approval"}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                {isAdmin ? "Add Family Record" : "Submit Family Record"}
              </button>
            )}
            <Link href="/persons" className="btn-outline">Add Person</Link>
          </div>
        </div>

        {/* Family Form */}
        {showForm && (
          <div className="glass-card p-8 mb-12 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">{editId ? "Edit Family Link" : "Create Family Record"}</h2>
                {!isAdmin && <p className="text-xs text-amber-600 mt-1 font-medium">Will be submitted for admin approval. Only approved persons can be linked.</p>}
              </div>
              <button onClick={cancelEdit} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SearchablePersonSelect label="Husband *" value={form.husbandId} options={males} placeholder="Search husband by name..." onChange={(id) => setForm((f) => ({ ...f, husbandId: id }))} />
                <SearchablePersonSelect label="Wife *" value={form.wifeId} options={females} placeholder="Search wife by name..." onChange={(id) => setForm((f) => ({ ...f, wifeId: id }))} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PersonPicker label="Sons" selectedIds={form.sonIds} available={males}
                  onAdd={(id) => setForm((f) => ({ ...f, sonIds: [...f.sonIds, id] }))}
                  onRemove={(id) => setForm((f) => ({ ...f, sonIds: f.sonIds.filter((s) => s !== id) }))} />
                <PersonPicker label="Daughters" selectedIds={form.daughterIds} available={females}
                  onAdd={(id) => setForm((f) => ({ ...f, daughterIds: [...f.daughterIds, id] }))}
                  onRemove={(id) => setForm((f) => ({ ...f, daughterIds: f.daughterIds.filter((d) => d !== id) }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Notes / Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} placeholder="Any additional information..." className="input-field w-full resize-none" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>}
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? "Saving..." : editId ? "Update Record" : isAdmin ? "Save Record" : "Submit for Approval"}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs for regular users */}
        {!isAdmin && (
          <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit animate-slide-up">
            <button onClick={() => setActiveTab("approved")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "approved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              Approved ({families.length})
            </button>
            <button onClick={() => setActiveTab("pending")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              My Submissions
              {pendingCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full font-bold">{pendingCount}</span>}
              {rejectedCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">{rejectedCount}</span>}
            </button>
          </div>
        )}

        {/* Approved families */}
        {(isAdmin || activeTab === "approved") && (
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "100ms" }}>

            {/* Search */}
            <div className="relative max-w-lg">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by husband, wife, or family ID..."
                className="input-field w-full pl-10"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">×</button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {isLoadingFamilies ? (
                <ListLoadingSkeleton count={3} />
              ) : filteredFamilies.length === 0 ? (
                <div className="glass-card py-24 text-center space-y-3">
                  <p className="text-slate-400 text-lg font-medium">
                    {searchQuery ? "No families match your search." : isAdmin ? "No family links yet." : "No approved family links yet."}
                  </p>
                  {!searchQuery && !isAdmin && <p className="text-sm text-slate-400">Submit a family record — it will appear here after admin approval.</p>}
                </div>
              ) : filteredFamilies.map((f) => (
                <div key={f.id} className="glass-card overflow-hidden group hover:shadow-md hover:border-brand-primary/20 transition-all duration-300">
                  <div className="px-6 md:px-8 pt-4 pb-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent flex items-center justify-between gap-4">
                    <div className="text-xs text-brand-primary font-mono font-bold">ID: {f.displayId}</div>
                    {f.submittedByName && (
                      <span className="text-[11px] text-slate-400">Added by <span className="font-semibold text-slate-600">{f.submittedByName}</span></span>
                    )}
                  </div>
                  <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                    {/* Parents */}
                    <div className="p-6 md:p-8 lg:w-80 bg-slate-50/70 flex-shrink-0">
                      <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Husband</p>
                            <p className="text-base font-bold text-slate-900">{f.husbandName}</p>
                            {f.husband?.nameUrdu && <p className="text-sm text-slate-500 font-urdu leading-relaxed" dir="rtl">{f.husband.nameUrdu}</p>}
                          </div>
                        </div>
                        <div className="ml-5 border-l-2 border-slate-200 h-4" />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wife</p>
                            <p className="text-base font-bold text-slate-900">{f.wifeName}</p>
                            {f.wife?.nameUrdu && <p className="text-sm text-slate-500 font-urdu leading-relaxed" dir="rtl">{f.wife.nameUrdu}</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Children & actions */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col gap-6">

                      {/* Sons */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Sons ({f.sonIds?.length || 0})
                        </p>
                        {f.sons && f.sons.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                            {f.sons.map((s) => (
                              <ChildCard
                                key={s.id}
                                person={s}
                                full={persons.find((p) => p.id === s.id)}
                                accent="blue"
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-sm">No sons recorded</p>
                        )}
                      </div>

                      {/* Daughters */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                          Daughters ({f.daughterIds?.length || 0})
                        </p>
                        {f.daughters && f.daughters.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                            {f.daughters.map((d) => (
                              <ChildCard
                                key={d.id}
                                person={d}
                                full={persons.find((p) => p.id === d.id)}
                                accent="pink"
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-sm">No daughters recorded</p>
                        )}
                      </div>

                      {/* Remarks */}
                      {f.remarks && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Remarks</p>
                          <div className="flex items-start gap-2.5 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                            <span className="w-0.5 min-h-[1rem] self-stretch bg-slate-300 rounded-full shrink-0" />
                            <p className="text-sm text-slate-500">{f.remarks}</p>
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="flex gap-3 pt-4 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(f)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Edit</button>
                          <button onClick={() => setDeleteFamilyId(f.id)} className="px-4 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Submissions tab */}
        {!isAdmin && activeTab === "pending" && (
          <div className="space-y-4 animate-slide-up">
            <p className="text-sm font-semibold text-slate-500">My Family Submissions ({pendingFamilies.length})</p>
            {isLoadingPending ? (
              <ListLoadingSkeleton count={2} />
            ) : pendingFamilies.length === 0 ? (
              <div className="glass-card py-20 text-center space-y-3">
                <p className="text-slate-400 text-lg font-medium">No family submissions yet.</p>
                <button onClick={() => setShowForm(true)} className="text-brand-primary font-bold hover:underline text-sm">Submit your first family connection</button>
              </div>
            ) : pendingFamilies.map((f) => {
              const sons = f.sonIds.map((id) => persons.find((p) => p.id === id)).filter(Boolean) as typeof persons;
              const daughters = f.daughterIds.map((id) => persons.find((p) => p.id === id)).filter(Boolean) as typeof persons;
              return (
                <div key={f.id} className="glass-card overflow-hidden">

                  {/* Card header */}
                  <div className="px-6 pt-4 pb-3 flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono font-bold text-brand-primary">ID: {f.displayId}</span>
                      <StatusBadge status={f.status} reason={f.rejectionReason} />
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                    {/* Parents panel */}
                    <div className="p-4 sm:p-5 lg:w-64 bg-slate-50/60 flex-shrink-0 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Husband</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{f.husbandName}</p>
                        </div>
                      </div>
                      <div className="ml-4 border-l-2 border-slate-200 h-3" />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wife</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{f.wifeName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Children panel */}
                    <div className="p-5 flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />Sons ({f.sonIds.length})
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
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />Daughters ({f.daughterIds.length})
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
                      {f.remarks && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Remarks</p>
                          <div className="flex items-start gap-2.5 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                            <span className="w-0.5 min-h-[1rem] self-stretch bg-slate-300 rounded-full shrink-0" />
                            <p className="text-sm text-slate-500">{f.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={Boolean(deleteFamilyId)}
        title="Delete family record?"
        message="This action cannot be undone."
        busy={isDeleting}
        onCancel={() => setDeleteFamilyId(null)}
        onConfirm={handleDeleteConfirm}
      />

      {selectedPerson && (
        <PersonDetailModal person={selectedPerson} onClose={() => setSelectedPersonId(null)} />
      )}
    </div>
  );
}
