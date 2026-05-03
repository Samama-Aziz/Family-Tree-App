import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Background blurs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[35%] h-[35%] bg-blue-100 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-emerald-100 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32 space-y-24">
        {/* Hero */}
        <div className="text-center space-y-8 animate-slide-up">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-sm font-semibold">
            Explore Your Heritage
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
            Your family story,{" "}
            <span className="bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent italic">
              beautifully visualized.
            </span>
          </h1>
          <p className="text-slate-500 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            Record your lineage, manage relationships, and explore your family history with our modern, intuitive genealogy platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/family-tree" className="btn-primary px-8 py-3 text-base">
              View Your Tree
            </Link>
            <Link href="/persons" className="btn-outline px-8 py-3 text-base">
              Manage Persons
            </Link>
          </div>
        </div>

        {/* How it Works */}
        <div className="glass-card p-8 lg:p-12 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Simple Guide</h2>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Add Persons with details and parents" },
                  { step: "2", text: "Create Family Links for couples" },
                  { step: "3", text: "Visualize and Explore the Tree" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center font-bold flex-shrink-0 text-sm">
                      {item.step}
                    </div>
                    <p className="text-slate-700 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-300">
              <p className="text-sm text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700">Pro tip:</span> Ensure parent names match exactly between records to automatically build the visualization. Our smart linking system does the rest!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
