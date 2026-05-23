// ============================================================================
// LanguageSelector.tsx — Multi-language dropdown powered by Google Translate
// Displays a compact dropdown with 15 languages, flag emojis, and native labels.
// Selecting a language triggers Google Translate to translate the entire page
// in real-time, including dynamic Firebase content.
// ============================================================================
import React, { useState, useRef, useEffect } from "react";
import { Languages, ChevronDown, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, useLanguage } from "../utils/i18n";
import { setTranslateLanguage } from "../utils/i18n";

export default function LanguageSelector() {
  const { translateLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === translateLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div ref={ref} className="relative notranslate">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
        title="Change language"
      >
        <Languages className="h-3.5 w-3.5 text-indigo-400" />
        <span className="notranslate">{currentLangObj.flag}</span>
        <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-black/40 z-[9999] py-1.5">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 mb-1">
            Translate Page
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setTranslateLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-slate-800/70 cursor-pointer ${
                translateLang === lang.code
                  ? "text-indigo-300 bg-indigo-500/10"
                  : "text-slate-300"
              }`}
            >
              <span className="text-base notranslate">{lang.flag}</span>
              <span className="flex-1 notranslate">{lang.label}</span>
              {translateLang === lang.code && (
                <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              )}
            </button>
          ))}

          {/* Google Translate attribution — required by ToS */}
          <div className="px-3 pt-2 pb-1.5 border-t border-slate-800 mt-1">
            <div className="text-[9px] text-slate-600 text-center">
              Powered by Google Translate
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
