"use client";

import { useEffect, useRef } from "react";

const ROWS = [
  ["ا", "آ", "ب", "پ", "ت", "ٹ", "ث", "ج", "چ"],
  ["ح", "خ", "د", "ڈ", "ذ", "ر", "ڑ", "ز", "ژ"],
  ["س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف"],
  ["ق", "ک", "گ", "ل", "م", "ن", "ں", "و", "ہ"],
  ["ھ", "ء", "ی", "ے", "۔", "،", "؟", "!"],
];

export default function UrduKeyboard({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-50 mt-1 w-full min-w-[280px] max-w-[min(560px,calc(100vw-2rem))] bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">اردو کی بورڈ</span>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-sm transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5">
        {ROWS.map((row, i) => (
          <div key={i} className="flex gap-1 justify-center flex-wrap">
            {row.map((char) => (
              <button
                key={char}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(value + char); }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-base hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm active:scale-90 font-urdu"
              >
                {char}
              </button>
            ))}
          </div>
        ))}

        <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(value + " "); }}
            className="flex-1 h-8 sm:h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm font-urdu hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm active:scale-95"
          >
            مسافہ
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(value.slice(0, -1)); }}
            className="w-14 sm:w-16 h-8 sm:h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm active:scale-95"
          >
            ⌫
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(""); }}
            className="w-14 sm:w-16 h-8 sm:h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm active:scale-95"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
