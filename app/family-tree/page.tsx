"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { formatDate } from "@/lib/format-date";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

type Person = { id: string; name: string; nameUrdu?: string | null; gender: string; fatherName?: string | null; motherName?: string | null; caste?: string | null };

type FullPerson = {
  id: string;
  name: string;
  nameUrdu: string | null;
  gender: string;
  isAlive: boolean;
  age: number | null;
  dob: string | null;
  dod: string | null;
  fatherName: string | null;
  motherName: string | null;
};

type PersonSnap = {
  id: string;
  name: string;
  nameUrdu: string | null;
  gender: string;
  isAlive: boolean;
  age: number | null;
};

type TreeNode = PersonSnap & {
  relation?: string;
  partner?: PersonSnap;
  children?: TreeNode[];
};

// ── Person detail modal ──────────────────────────────────────────────────────

function PersonDetailModal({
  personId,
  onClose,
}: {
  personId: string;
  onClose: () => void;
}) {
  const [person, setPerson] = useState<FullPerson | null>(null);

  useEffect(() => {
    fetch(`/api/persons/${personId}`)
      .then((r) => r.json())
      .then(setPerson);
  }, [personId]);

  const dot =
    person?.gender === "Male"
      ? "bg-blue-400"
      : person?.gender === "Female"
      ? "bg-pink-400"
      : "bg-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-slide-up border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-sm"
        >
          ✕
        </button>

        {!person ? (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-6 w-6 text-brand-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <span className={`w-3 h-3 rounded-full ${dot}`} />
              <h2 className="text-2xl font-black text-slate-900 text-center leading-tight">
                {person.name}
              </h2>
              {person.nameUrdu && (
                <p className="text-lg text-slate-500 font-urdu" dir="rtl">{person.nameUrdu}</p>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                  person.isAlive
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                    : "bg-slate-100 text-slate-600 ring-slate-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${person.isAlive ? "bg-emerald-500" : "bg-slate-400"}`} />
                {person.isAlive ? "Living" : "Deceased"}
              </span>
            </div>

            {/* Details grid */}
            <div className="space-y-3">
              <Row label="Gender" value={person.gender} />
              <Row label="Age" value={person.age ? `${person.age} years` : "—"} />
              <Row label="Date of Birth" value={formatDate(person.dob)} />
              {!person.isAlive && (
                <Row label="Date of Death" value={formatDate(person.dod)} />
              )}
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-3">
                <Row label="Father" value={person.fatherName ?? "Unknown"} />
                <Row label="Mother" value={person.motherName ?? "Unknown"} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-semibold text-slate-400">{label}</span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}

// ── Individual person card ───────────────────────────────────────────────────

function PersonCard({
  node,
  isRoot = false,
  onPersonClick,
}: {
  node: PersonSnap & { relation?: string };
  isRoot?: boolean;
  onPersonClick: (id: string) => void;
}) {
  const dot =
    node.gender === "Male"
      ? "bg-blue-400"
      : node.gender === "Female"
      ? "bg-pink-400"
      : "bg-slate-400";

  const card = isRoot
    ? "border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/10"
    : node.gender === "Male"
    ? "border-blue-200 bg-blue-50/60"
    : node.gender === "Female"
    ? "border-pink-200 bg-pink-50/60"
    : "border-slate-200 bg-slate-50";

  return (
    <div
      onClick={() => onPersonClick(node.id)}
      className={`px-3 sm:px-4 md:px-5 py-3 sm:py-4 rounded-2xl border-2 text-center min-w-[130px] sm:min-w-[150px] max-w-[220px] cursor-pointer hover:shadow-md hover:ring-2 hover:ring-brand-primary/30 transition-all duration-200 ${card}`}
    >
      {node.relation && (
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">
          {node.relation}
        </p>
      )}
      <div className="flex flex-col items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <p className={`font-bold text-slate-900 leading-snug ${isRoot ? "text-base" : "text-sm"}`}>
          {node.name}
        </p>
        {node.nameUrdu && (
          <p className="text-[13px] lg:text-[14px] text-slate-500 font-urdu leading-relaxed break-words" dir="rtl">
            {node.nameUrdu}
          </p>
        )}
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
          {node.age ? `${node.age} yrs` : node.isAlive ? "Living" : "Deceased"}
        </p>
      </div>
    </div>
  );
}

// ── Recursive tree node ──────────────────────────────────────────────────────

function TreeView({
  node,
  isRoot = false,
  direction,
  onPersonClick,
}: {
  node: TreeNode;
  isRoot?: boolean;
  direction: "upward" | "downward";
  onPersonClick: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isUp = direction === "upward";

  const coupleRow = (
    <div className="flex items-center gap-3">
      <PersonCard node={node} isRoot={isRoot} onPersonClick={onPersonClick} />
      {node.partner && (
        <>
          <span className="text-slate-300 text-2xl font-thin select-none">+</span>
          <PersonCard node={node.partner} onPersonClick={onPersonClick} />
        </>
      )}
    </div>
  );

  const toggleBtn = hasChildren && (
    <button
      type="button"
      onClick={() => setCollapsed((c) => !c)}
      className={`w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[10px] font-black text-slate-400 hover:border-brand-primary hover:text-brand-primary transition-all duration-300 ${
        isUp ? (collapsed ? "rotate-180" : "") : collapsed ? "" : "rotate-180"
      }`}
    >
      {isUp ? "↑" : "↓"}
    </button>
  );

  const childrenBlock = hasChildren && !collapsed && (
    isUp ? (
      <>
        {node.children!.length === 2 ? (
          // Father + Mother couple pair — shown side-by-side with +
          <div className="relative flex gap-3 items-end px-4">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-400" />
            <div className="flex flex-col items-center">
              <TreeView node={node.children![0]} direction={direction} onPersonClick={onPersonClick} />
              <div className="w-0.5 h-8 bg-slate-400" />
            </div>
            <span className="text-slate-300 text-2xl font-thin mb-8 select-none flex-shrink-0">+</span>
            <div className="flex flex-col items-center">
              <TreeView node={node.children![1]} direction={direction} onPersonClick={onPersonClick} />
              <div className="w-0.5 h-8 bg-slate-400" />
            </div>
          </div>
        ) : (
          <div className="relative flex gap-10 items-end px-4">
            {node.children!.length > 1 && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-slate-400" />
            )}
            {node.children!.map((child, i) => (
              <div key={child.id + i} className="flex flex-col items-center">
                <TreeView node={child} direction={direction} onPersonClick={onPersonClick} />
                <div className="w-0.5 h-8 bg-slate-400" />
              </div>
            ))}
          </div>
        )}
        <div className="w-0.5 h-5 bg-slate-400" />
      </>
    ) : (
      <>
        <div className="w-0.5 h-5 bg-slate-400" />
        <div className="relative flex gap-10 items-start px-4">
          {node.children!.length > 1 && (
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-slate-400" />
          )}
          {node.children!.map((child, i) => (
            <div key={child.id + i} className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-slate-400" />
              <TreeView node={child} direction={direction} onPersonClick={onPersonClick} />
            </div>
          ))}
        </div>
      </>
    )
  );

  if (isUp) {
    return (
      <div className="flex flex-col items-center">
        {childrenBlock}
        {hasChildren && <div className="mb-3">{toggleBtn}</div>}
        {coupleRow}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {coupleRow}
      {hasChildren && <div className="mt-3">{toggleBtn}</div>}
      {childrenBlock}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FamilyTreePage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [personQuery, setPersonQuery] = useState("");
  const [isPersonOpen, setIsPersonOpen] = useState(false);
  const [direction, setDirection] = useState<"upward" | "downward">("downward");
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [detailPersonId, setDetailPersonId] = useState<string | null>(null);
  const [slowNetwork, setSlowNetwork] = useState(false);
  const personSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load from cache first
    const cached = localStorage.getItem("cache_persons");
    if (cached) setPersons(JSON.parse(cached));

    fetch("/api/persons").then((r) => r.json()).then((data) => {
      setPersons(data);
      if (Array.isArray(data)) localStorage.setItem("cache_persons", JSON.stringify(data));
    });
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (personSelectorRef.current && !personSelectorRef.current.contains(e.target as Node)) {
        setIsPersonOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

const filteredPersons = persons.filter((p) => {
  const haystack = [p.name, p.nameUrdu, p.gender, p.fatherName, p.motherName, p.caste]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(personQuery.toLowerCase().trim());
});

  function handleGenerate() {
    if (!selectedId) return;
    setError("");
    setSlowNetwork(false);
    
    // Set a timeout to warn about slow network
    const slowNetworkTimer = setTimeout(() => {
      setSlowNetwork(true);
    }, 2000);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/family-tree/${selectedId}?direction=${direction}`);
        clearTimeout(slowNetworkTimer);
        setSlowNetwork(false);
        
        if (!res.ok) { setError("Failed to load tree"); return; }
        const data = await res.json();
        setTree(data.tree);
      } catch (err) {
        clearTimeout(slowNetworkTimer);
        setError("Failed to load tree");
      }
    });
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-12 animate-slide-up space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-wider uppercase">
            Visualizer
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight">Family Tree</h1>
          <p className="text-slate-500 text-base font-medium">Explore lineage and heritage</p>
        </div>

        {/* Controls */}
        <div className="glass-card p-8 mb-12 animate-slide-up relative overflow-visible z-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -mr-16 -mt-16 -p" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
            <div className="lg:col-span-1 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Select Person</label>
              <div className="relative" ref={personSelectorRef}>
                <input
                  value={personQuery}
                  onFocus={() => setIsPersonOpen(true)}
                  onChange={(e) => {
                    setPersonQuery(e.target.value);
                    setSelectedId("");
                    setIsPersonOpen(true);
                  }}
                  placeholder="Search a person..."
                  className="input-field w-full"
                />

                {selectedId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId("");
                      setPersonQuery("");
                      setIsPersonOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="Clear selected person"
                  >
                    ×
                  </button>
                )}

                {isPersonOpen && (
                  <div className="absolute left-0 top-full mt-2 z-[999] w-full min-w-[280px] max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {filteredPersons.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-400 italic">No person found</p>
                    ) : (
                      filteredPersons.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(p.id);
                            setPersonQuery(p.name);
                            setIsPersonOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-800 shrink-0">{p.name}</span>
                            {p.nameUrdu && (
                              <span className="text-sm font-urdu text-slate-600 leading-relaxed" dir="rtl">
                                {p.nameUrdu}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-slate-400">{p.gender}</span>
                            {(p.fatherName || p.motherName) && (
                              <span className="text-[11px] text-slate-400">
                                {p.fatherName ? `Father: ${p.fatherName}` : "Father: Unknown"} · {p.motherName ? `Mother: ${p.motherName}` : "Mother: Unknown"}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">View Mode</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(["downward", "upward"] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir)}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                      direction === dir
                        ? "bg-white text-brand-primary shadow-sm ring-1 ring-slate-200"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <span>{dir === "downward" ? "Descendants" : "Ancestors"}</span>
                    <span className="text-[10px] font-medium opacity-60">
                      {dir === "downward" ? "selected is root" : "selected is leaf"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <button
                onClick={handleGenerate}
                disabled={!selectedId || isPending}
                className="btn-primary w-full h-[46px]"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : "Generate Tree"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          {slowNetwork && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm font-medium">
              ⏳ Generating family tree... This may take a moment depending on the family size.
            </div>
          )}
        </div>

        {/* Tree */}
        {tree ? (
          <div className="glass-card overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="p-8 pb-0 text-center">
              <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">
                {direction === "downward" ? "Descendant Chart" : "Ancestry Chart"}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{tree.name}</h2>
              {tree.nameUrdu && (
                <p className="text-lg text-slate-500 font-urdu leading-relaxed" dir="rtl">{tree.nameUrdu}</p>
              )}
              <div className="w-10 h-1 bg-brand-primary mx-auto mt-3 rounded-full opacity-30" />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 mb-4 text-xs text-slate-400 font-semibold bg-white/50 backdrop-blur-sm py-2 px-4 rounded-full mx-auto w-fit border border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-200 border-2 border-blue-300 inline-block" /> Male
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-pink-200 border-2 border-pink-300 inline-block" /> Female
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-300 font-thin text-base">+</span> Couple
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Zoom/Pan enabled
              </span>
            </div>

            <div className="relative h-[600px] border-t border-slate-100 bg-slate-50/30">
              <TransformWrapper
                initialScale={0.8}
                minScale={0.1}
                maxScale={2}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ disabled: true }}
                doubleClick={{ disabled: true }}
                panning={{ velocityDisabled: true }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                      <button onClick={() => zoomIn()} className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-slate-50 text-slate-600 border border-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                      <button onClick={() => zoomOut()} className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-slate-50 text-slate-600 border border-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                      <button onClick={() => resetTransform()} className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-slate-50 text-slate-600 border border-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
                      </button>
                    </div>

                    <TransformComponent
                      wrapperStyle={{
                        width: "100%",
                        height: "100%",
                        cursor: "grab",
                      }}
                      contentStyle={{
                        padding: "100px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minWidth: "100%",
                        minHeight: "100%",
                      }}
                    >
                      <div className="flex justify-center flex-shrink-0">
                        <TreeView
                          node={tree}
                          isRoot
                          direction={direction}
                          onPersonClick={setDetailPersonId}
                        />
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          </div>
        ) : (
          <div className="glass-card py-32 text-center space-y-3 border border-dashed animate-slide-up" style={{ animationDelay: "100ms" }}>
            <p className="text-slate-400 text-lg font-medium">
              Select a person and click Generate<br />to visualize the family tree.
            </p>
          </div>
        )}
      </div>

      {/* Person detail modal */}
      {detailPersonId && (
        <PersonDetailModal
          personId={detailPersonId}
          onClose={() => setDetailPersonId(null)}
        />
      )}
    </div>
  );
}
