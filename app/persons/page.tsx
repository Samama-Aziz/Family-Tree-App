"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import UrduKeyboard from "@/components/UrduKeyboard";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

type Person = {
  id: string;
  name: string;
  nameUrdu: string | null;
  gender: string;
  age: number | null;
  dob: string | null;
  dod: string | null;
  fatherName: string | null;
  motherName: string | null;
  isAlive: boolean;
};

const empty = {
  name: "",
  nameUrdu: "",
  gender: "Male",
  dob: "",
  dod: "",
  fatherName: "",
  motherName: "",
  isAlive: true,
};

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export default function PersonsPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUrduKeyboard, setShowUrduKeyboard] = useState(false);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/persons");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to load persons");
        setPersons([]);
        return;
      }
      const data = await res.json();
      setPersons(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Failed to load persons: " + String(err));
      setPersons([]);
    }
  }

  useEffect(() => {
    const run = async () => {
      await load();
    };
    void run();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  const closeKeyboard = useCallback(() => setShowUrduKeyboard(false), []);

  function startEdit(p: Person) {
    setEditId(p.id);
    setForm({
      name: p.name,
      nameUrdu: p.nameUrdu ?? "",
      gender: p.gender,
      dob: p.dob ? p.dob.slice(0, 10) : "",
      dod: p.dod ? p.dod.slice(0, 10) : "",
      fatherName: p.fatherName ?? "",
      motherName: p.motherName ?? "",
      isAlive: p.isAlive,
    });
    setShowForm(true);
    setShowUrduKeyboard(false);
  }

  function cancelEdit() {
    setEditId(null);
    setForm(empty);
    setError("");
    setShowForm(false);
    setShowUrduKeyboard(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidDateString(form.dob)) {
      setError("Birth date must be in YYYY-MM-DD format");
      return;
    }

    if (!form.isAlive && !isValidDateString(form.dod)) {
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
      };
      const url = editId ? `/api/persons/${editId}` : "/api/persons";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      cancelEdit();
      load();
    });
  }

  async function handleDeleteConfirm() {
    if (!deletePersonId) return;
    setIsDeleting(true);
    await fetch(`/api/persons/${deletePersonId}`, { method: "DELETE" });
    setIsDeleting(false);
    setDeletePersonId(null);
    load();
  }

  const genderBadge = (gender: string) =>
    gender === "Male"
      ? "bg-blue-50 text-blue-500 border-blue-100"
      : gender === "Female"
      ? "bg-pink-50 text-pink-500 border-pink-100"
      : "bg-slate-50 text-slate-500 border-slate-200";

  const fatherNameSuggestions = Array.from(
    new Set(
      persons
        .filter((p) => p.gender === "Male")
        .map((p) => `${p.name}${p.nameUrdu ? ` - ${p.nameUrdu}` : ""}`)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
  const motherNameSuggestions = Array.from(
    new Set(
      persons
        .filter((p) => p.gender === "Female")
        .map((p) => `${p.name}${p.nameUrdu ? ` - ${p.nameUrdu}` : ""}`)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-12 animate-slide-up">
          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wider uppercase">
              Directory
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Persons</h1>
            <p className="text-slate-500 text-sm md:text-base font-medium">
              Manage your family members and descendants
            </p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary self-start sm:self-auto">
              Add New Person
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-card p-5 md:p-8 mb-8 md:mb-12 animate-slide-up relative overflow-visible">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold">
                {editId ? "Edit Person Details" : "Create New Person"}
              </h2>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ahmad Khan"
                  className="input-field w-full"
                />
              </div>

              {/* Urdu Name */}
              <div className="space-y-2 relative sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  اردو نام * <span className="text-slate-400 font-normal text-xs">(Urdu Name)</span>
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    name="nameUrdu"
                    value={form.nameUrdu}
                    onChange={handleChange}
                    dir="rtl"
                    placeholder="احمد خان"
                    required
                    className="input-field w-full font-urdu text-lg min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUrduKeyboard((v) => !v)}
                    title="Toggle Urdu Keyboard"
                    className={`flex-shrink-0 min-w-[44px] h-[44px] px-3 rounded-xl border font-bold text-sm transition-all ${
                      showUrduKeyboard
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "border-slate-200 text-slate-500 hover:border-brand-primary hover:text-brand-primary bg-white"
                    }`}
                  >
                    ک+
                  </button>
                </div>
                {showUrduKeyboard && (
                  <UrduKeyboard
                    value={form.nameUrdu}
                    onChange={(v) => setForm((f) => ({ ...f, nameUrdu: v }))}
                    onClose={closeKeyboard}
                  />
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Gender *</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["Male", "Female", "Other"] as const).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, gender }))}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                        form.gender === gender
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "bg-white text-slate-600 border-slate-200 hover:border-brand-primary hover:text-brand-primary"
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                  <CalendarIcon /> Birth Date *
                </label>
                <input
                  name="dob"
                  type="text"
                  value={form.dob}
                  onChange={handleChange}
                  placeholder="YYYY-MM-DD"
                  pattern="\d{4}-\d{2}-\d{2}"
                  required
                  className="input-field w-full"
                />
              </div>

              {/* Father */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Father&apos;s Full Name *</label>
                <input
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleChange}
                  placeholder="Father's full name"
                  list="persons-father-name-suggestions"
                  required
                  className="input-field w-full"
                />
                <datalist id="persons-father-name-suggestions">
                  {fatherNameSuggestions.map((displayName) => (
                    <option key={displayName} value={displayName} />
                  ))}
                </datalist>
              </div>

              {/* Mother */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Mother&apos;s Full Name *</label>
                <input
                  name="motherName"
                  value={form.motherName}
                  onChange={handleChange}
                  placeholder="Mother's full name"
                  list="persons-mother-name-suggestions"
                  required
                  className="input-field w-full"
                />
                <datalist id="persons-mother-name-suggestions">
                  {motherNameSuggestions.map((displayName) => (
                    <option key={displayName} value={displayName} />
                  ))}
                </datalist>
              </div>

              {/* Is Alive toggle */}
              <div className="flex items-center gap-3 pt-5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isAlive}
                  onClick={() => setForm((f) => ({ ...f, isAlive: !f.isAlive }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                    form.isAlive ? "bg-brand-accent" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      form.isAlive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-bold text-slate-700">Is Alive</span>
              </div>

              {/* Date of Death */}
              {!form.isAlive && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                    <CalendarIcon /> Date of Death *
                  </label>
                  <input
                    name="dod"
                    type="text"
                    value={form.dod}
                    onChange={handleChange}
                    placeholder="YYYY-MM-DD"
                    pattern="\d{4}-\d{2}-\d{2}"
                    required={!form.isAlive}
                    className="input-field w-full"
                  />
                </div>
              )}

              {error && (
                <div className="col-span-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="col-span-full flex gap-3 pt-5 mt-1 border-t border-slate-100">
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

        {/* List */}
        <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="px-5 md:px-8 py-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
            <span className="w-1.5 h-7 rounded-full bg-brand-primary" />
            <h3 className="text-lg md:text-xl font-bold">All Persons ({persons.length})</h3>
          </div>

          {persons.length === 0 ? (
            <div className="px-5 py-20 text-center space-y-3">
              <p className="text-slate-400 text-lg font-medium">Your directory is currently empty.</p>
              <button onClick={() => setShowForm(true)} className="text-brand-primary font-bold hover:underline text-sm">
                Add your first family member
              </button>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {persons.map((p) => (
                  <div key={p.id} className="px-4 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border ${genderBadge(p.gender)}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{p.name}</div>
                          {p.nameUrdu && (
                            <div className="text-sm text-slate-500 font-urdu text-right" dir="rtl">{p.nameUrdu}</div>
                          )}
                          <div className="text-xs text-slate-400 font-medium">{p.gender}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(p)}
                          className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={() => setDeletePersonId(p.id)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ring-1 ring-inset ${
                        p.isAlive
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-600 ring-slate-300"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.isAlive ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {p.isAlive ? "Living" : "Deceased"}
                      </span>
                      {p.age && <span className="text-slate-500">{p.age} yrs</span>}
                      {p.dob && <span className="text-slate-400">Born: {new Date(p.dob).toLocaleDateString("en-GB")}</span>}
                      {!p.isAlive && p.dod && <span className="text-slate-400">Died: {new Date(p.dod).toLocaleDateString("en-GB")}</span>}
                    </div>

                    {(p.fatherName || p.motherName) && (
                      <div className="flex gap-3 text-xs text-slate-500">
                        {p.fatherName && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {p.fatherName}
                          </span>
                        )}
                        {p.motherName && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> {p.motherName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      {["Member", "Details", "Parents", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-6 lg:px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {persons.map((p) => (
                      <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 lg:px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${genderBadge(p.gender)}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-base font-bold text-slate-900">{p.name}</div>
                              {p.nameUrdu && (
                                <div className="text-sm text-slate-500 font-urdu leading-relaxed" dir="rtl">{p.nameUrdu}</div>
                              )}
                              <div className="text-xs text-slate-400 font-medium">{p.gender}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <div className="space-y-1 text-sm">
                            <div>Age: <span className="text-slate-500">{p.age ?? "N/A"}</span></div>
                            <div className="text-xs text-slate-400">Born: {p.dob ? new Date(p.dob).toLocaleDateString("en-GB") : "—"}</div>
                            {!p.isAlive && p.dod && (
                              <div className="text-xs text-slate-400">Died: {new Date(p.dod).toLocaleDateString("en-GB")}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <div className="space-y-1 text-xs font-medium">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span className="text-slate-400">Father:</span>
                              <span className="text-slate-600">{p.fatherName || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                              <span className="text-slate-400">Mother:</span>
                              <span className="text-slate-600">{p.motherName || "Unknown"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                            p.isAlive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-slate-100 text-slate-600 ring-slate-300"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.isAlive ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {p.isAlive ? "Living" : "Deceased"}
                          </span>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(p)}
                              className="p-2 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button
                              onClick={() => setDeletePersonId(p.id)}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        open={Boolean(deletePersonId)}
        title="Delete person?"
        message="This action cannot be undone."
        busy={isDeleting}
        onCancel={() => setDeletePersonId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
