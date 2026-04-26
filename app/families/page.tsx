"use client";

import { useState, useEffect, useTransition, useRef } from "react";

type Person = {
  id: string;
  name: string;
  nameUrdu?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  gender: string;
};

type Family = {
  id: string;
  husbandId: string;
  husbandName: string;
  wifeId: string;
  wifeName: string;
  sonIds: string[];
  daughterIds: string[];
  remarks: string | null;
  husband?: Person | null;
  wife?: Person | null;
  sons?: Person[];
  daughters?: Person[];
};

const empty = {
  husbandId: "",
  wifeId: "",
  sonIds: [] as string[],
  daughterIds: [] as string[],
  remarks: "",
};

// ── PersonPicker ─────────────────────────────────────────────────────────────

function PersonPicker({
  label,
  selectedIds,
  available,
  onAdd,
  onRemove,
}: {
  label: string;
  selectedIds: string[];
  available: Person[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = available.filter((p) => selectedIds.includes(p.id));
  const unselected = available.filter((p) => !selectedIds.includes(p.id));

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>
      <div className="min-h-[52px] p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap gap-2 items-center">
        {selected.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 border border-slate-200"
          >
            <span className="max-w-[180px]">
              <span className="block break-words">{p.name}</span>
              {p.nameUrdu && (
                <span className="block text-[11px] text-slate-500 font-urdu leading-relaxed" dir="rtl">
                  {p.nameUrdu}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors leading-none text-base"
            >
              ×
            </button>
          </span>
        ))}

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold leading-none transition-all ${
              open
                ? "bg-brand-primary text-white"
                : "bg-slate-100 hover:bg-brand-primary hover:text-white text-slate-500"
            }`}
            title={`Add ${label.slice(0, -1)}`}
          >
            +
          </button>

          {open && (
            <div className="absolute left-0 top-9 z-30 w-52 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {unselected.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400 italic">
                  No more persons available
                </p>
              ) : (
                unselected.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onAdd(p.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 font-medium transition-colors border-b border-slate-100 last:border-0"
                  >
                    <span className="block">{p.name}</span>
                    {p.nameUrdu && (
                      <span className="block text-[11px] text-slate-500 font-urdu leading-relaxed" dir="rtl">
                        {p.nameUrdu}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddNameUrdu, setQuickAddNameUrdu] = useState("");
  const [quickAddGender, setQuickAddGender] = useState("Male");

  async function loadFamilies() {
    try {
      const res = await fetch("/api/families");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setFamilies(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load families");
    }
  }

  async function loadPersons() {
    try {
      const res = await fetch("/api/persons");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPersons(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load persons");
    }
  }

  useEffect(() => {
    const run = async () => {
      await Promise.all([loadPersons(), loadFamilies()]);
    };
    void run();
  }, []);

  function startEdit(f: Family) {
    setEditId(f.id);
    setForm({
      husbandId: f.husbandId,
      wifeId: f.wifeId,
      sonIds: f.sonIds || [],
      daughterIds: f.daughterIds || [],
      remarks: f.remarks ?? "",
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditId(null);
    setForm(empty);
    setError("");
    setShowForm(false);
  }

  async function handleQuickAdd() {
    if (!quickAddName) return;
    try {
      const res = await fetch("/api/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickAddName,
          nameUrdu: quickAddNameUrdu || null,
          gender: quickAddGender,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setQuickAddName("");
      setQuickAddNameUrdu("");
      setQuickAddGender("Male");
      setShowQuickAdd(false);
      await loadPersons();
    } catch {
      setError("Failed to add person");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.husbandId || !form.wifeId) {
      setError("Please select both husband and wife");
      return;
    }
    startTransition(async () => {
      const url = editId ? `/api/families/${editId}` : "/api/families";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      cancelEdit();
      loadFamilies();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this family record?")) return;
    await fetch(`/api/families/${id}`, { method: "DELETE" });
    loadFamilies();
  }

  const males = persons.filter((p) => p.gender === "Male");
  const females = persons.filter((p) => p.gender === "Female");

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
              Link ancestors and descendants together
            </p>
          </div>
          {!showForm && (
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Add Family Record
              </button>
              <button onClick={() => setShowQuickAdd(true)} className="btn-outline">
                Quick Add Person
              </button>
            </div>
          )}
        </div>

        {/* Quick Add Person */}
        {showQuickAdd && (
          <div className="glass-card p-6 mb-12 animate-slide-up">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Quick Add Person</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Enter full name..."
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="اردو نام"
                  value={quickAddNameUrdu}
                  onChange={(e) => setQuickAddNameUrdu(e.target.value)}
                  dir="rtl"
                  className="input-field w-full font-urdu text-lg"
                />
              </div>
              <select
                value={quickAddGender}
                onChange={(e) => setQuickAddGender(e.target.value)}
                className="input-field min-w-[120px]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <button onClick={handleQuickAdd} className="btn-primary px-8">
                Add
              </button>
              <button onClick={() => setShowQuickAdd(false)} className="btn-outline px-4">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="glass-card p-8 mb-12 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16" />

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {editId ? "Edit Family Link" : "Create Family Record"}
              </h2>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
              {/* Couple selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Husband *</label>
                  <select
                    value={form.husbandId}
                    onChange={(e) => setForm({ ...form, husbandId: e.target.value })}
                    className="input-field w-full cursor-pointer"
                    required
                  >
                    <option value="">Select Husband...</option>
                    {males.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.nameUrdu ? ` - ${p.nameUrdu}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Wife *</label>
                  <select
                    value={form.wifeId}
                    onChange={(e) => setForm({ ...form, wifeId: e.target.value })}
                    className="input-field w-full cursor-pointer"
                    required
                  >
                    <option value="">Select Wife...</option>
                    {females.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.nameUrdu ? ` - ${p.nameUrdu}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Children pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PersonPicker
                  label="Sons"
                  selectedIds={form.sonIds}
                  available={males}
                  onAdd={(id) => setForm((f) => ({ ...f, sonIds: [...f.sonIds, id] }))}
                  onRemove={(id) => setForm((f) => ({ ...f, sonIds: f.sonIds.filter((s) => s !== id) }))}
                />
                <PersonPicker
                  label="Daughters"
                  selectedIds={form.daughterIds}
                  available={females}
                  onAdd={(id) => setForm((f) => ({ ...f, daughterIds: [...f.daughterIds, id] }))}
                  onRemove={(id) => setForm((f) => ({ ...f, daughterIds: f.daughterIds.filter((d) => d !== id) }))}
                />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Notes / Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  rows={2}
                  placeholder="Any additional information..."
                  className="input-field w-full resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="submit" disabled={isPending} className="btn-primary">
                  {isPending ? "Saving..." : editId ? "Update Record" : "Save Record"}
                </button>
                <button type="button" onClick={cancelEdit} className="btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Family Cards */}
        <div className="grid grid-cols-1 gap-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          {families.length === 0 ? (
            <div className="glass-card py-24 text-center space-y-3">
              <p className="text-slate-400 text-lg font-medium">No family links established yet.</p>
              <button onClick={() => setShowForm(true)} className="text-brand-primary font-bold hover:underline text-sm">
                Create your first family connection
              </button>
            </div>
          ) : (
            families.map((f) => (
              <div key={f.id} className="glass-card overflow-hidden group hover:shadow-md hover:border-brand-primary/20 transition-all duration-300">
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                  {/* Parents */}
                  <div className="p-6 md:p-8 lg:w-80 bg-slate-50/70 flex-shrink-0">
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Husband</p>
                          <p className="text-base font-bold text-slate-900">{f.husbandName}</p>
                          {f.husband?.nameUrdu && (
                            <p className="text-sm text-slate-500 font-urdu leading-relaxed break-words" dir="rtl">
                              {f.husband.nameUrdu}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-5 border-l-2 border-slate-200 h-4" />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wife</p>
                          <p className="text-base font-bold text-slate-900">{f.wifeName}</p>
                          {f.wife?.nameUrdu && (
                            <p className="text-sm text-slate-500 font-urdu leading-relaxed break-words" dir="rtl">
                              {f.wife.nameUrdu}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Children & actions */}
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Sons ({f.sonIds?.length || 0})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {f.sons && f.sons.length > 0
                              ? f.sons.map((s) => (
                                  <span key={s.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-xl border border-blue-100 max-w-full">
                                    <span className="block break-words">{s.name}</span>
                                    {s.nameUrdu && (
                                      <span className="block text-[11px] text-blue-600/80 font-urdu leading-relaxed break-words" dir="rtl">
                                        {s.nameUrdu}
                                      </span>
                                    )}
                                    <span className="mt-1 block text-[10px] text-blue-800/70 leading-relaxed">
                                      Father: {s.fatherName || "Unknown"}
                                    </span>
                                    <span className="block text-[10px] text-blue-800/70 leading-relaxed">
                                      Mother: {s.motherName || "Unknown"}
                                    </span>
                                  </span>
                                ))
                              : <span className="text-slate-400 italic text-sm font-normal">No sons recorded</span>}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                            Daughters ({f.daughterIds?.length || 0})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {f.daughters && f.daughters.length > 0
                              ? f.daughters.map((d) => (
                                  <span key={d.id} className="px-2.5 py-1 bg-pink-50 text-pink-700 text-xs font-semibold rounded-xl border border-pink-100 max-w-full">
                                    <span className="block break-words">{d.name}</span>
                                    {d.nameUrdu && (
                                      <span className="block text-[11px] text-pink-600/80 font-urdu leading-relaxed break-words" dir="rtl">
                                        {d.nameUrdu}
                                      </span>
                                    )}
                                    <span className="mt-1 block text-[10px] text-pink-800/70 leading-relaxed">
                                      Father: {d.fatherName || "Unknown"}
                                    </span>
                                    <span className="block text-[10px] text-pink-800/70 leading-relaxed">
                                      Mother: {d.motherName || "Unknown"}
                                    </span>
                                  </span>
                                ))
                              : <span className="text-slate-400 italic text-sm font-normal">No daughters recorded</span>}
                          </div>
                        </div>
                      </div>
                      {f.remarks && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-500 italic">
                          &quot;{f.remarks}&quot;
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(f)}
                        className="flex items-center gap-1.5 px-3 py-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors text-sm font-semibold"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors text-sm font-semibold"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
