import { useState, useEffect } from "react";

import { safeStorage } from "./storage";

// ============================================================================
// Multi-language system powered by Google Translate
// - Keeps backward-compat with existing t(vi, en) helper for static UI strings
// - Adds full-page real-time translation via Google Translate for ALL content
//   including dynamic Firebase data, chat messages, etc.
// - Supported: 100+ languages via Google Translate
// ============================================================================

export type Language = "vi" | "en";

// Available translation languages — Google Translate language codes
// This list powers the dropdown selector in the Navbar
export interface TranslationLanguage {
  code: string;   // Google Translate language code
  label: string;  // Display name in that language
  flag: string;   // Emoji flag for visual identification
}

export const SUPPORTED_LANGUAGES: TranslationLanguage[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
  { code: "th", label: "ภาษาไทย", flag: "🇹🇭" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
];

// --- Legacy vi/en toggle system (backward compat) ---
let globalLangListeners: Array<(lang: Language) => void> = [];
let currentLang: Language = (safeStorage.getItem("indiecollab_lang") as Language) || "vi";

export function getLanguage(): Language {
  return currentLang;
}

export function setLanguage(lang: Language) {
  currentLang = lang;
  safeStorage.setItem("indiecollab_lang", lang);
  globalLangListeners.forEach((listener) => listener(lang));
}

// --- Google Translate full-page translation ---

// Store the selected Google Translate language code
let currentTranslateLang: string = safeStorage.getItem("indiecollab_translate_lang") || "vi";
let translateListeners: Array<(code: string) => void> = [];

export function getTranslateLanguage(): string {
  return currentTranslateLang;
}

// Trigger Google Translate to switch language by manipulating the hidden select
export function setTranslateLanguage(langCode: string) {
  currentTranslateLang = langCode;
  safeStorage.setItem("indiecollab_translate_lang", langCode);

  // Also keep the legacy vi/en system in sync
  if (langCode === "vi" || langCode === "en") {
    setLanguage(langCode);
  } else {
    // For non vi/en languages, set base to "en" for the t() helper
    setLanguage("en");
  }

  // Trigger Google Translate DOM translation
  triggerGoogleTranslate(langCode);

  // Notify all listeners
  translateListeners.forEach((fn) => fn(langCode));
}

function triggerGoogleTranslate(langCode: string) {
  // If the target is Vietnamese (source language), restore original page
  if (langCode === "vi") {
    // Restore original by selecting empty value
    const iframe = document.querySelector(".goog-te-banner-frame") as HTMLIFrameElement;
    if (iframe) {
      const innerDoc = iframe.contentDocument || iframe.contentWindow?.document;
      const restoreBtn = innerDoc?.querySelector(".goog-te-button button") as HTMLButtonElement;
      if (restoreBtn) restoreBtn.click();
    }
    // Also try the cookie-based restore
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    // Reload to fully restore if needed
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select && select.value !== "") {
      select.value = "";
      select.dispatchEvent(new Event("change"));
    }
    return;
  }

  // Set the Google Translate cookie and trigger
  document.cookie = `googtrans=/vi/${langCode}; path=/;`;
  document.cookie = `googtrans=/vi/${langCode}; path=/; domain=${window.location.hostname}`;

  // Try to find and trigger the Google Translate dropdown
  const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event("change"));
  } else {
    // Widget not loaded yet — retry after a short delay
    setTimeout(() => {
      const retrySelect = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (retrySelect) {
        retrySelect.value = langCode;
        retrySelect.dispatchEvent(new Event("change"));
      }
    }, 1500);
  }
}

// Hook for components to use translation state
export function useLanguage() {
  const [lang, setLang] = useState<Language>(currentLang);
  const [translateLang, setTranslateLangState] = useState<string>(currentTranslateLang);

  useEffect(() => {
    const listener = (newLang: Language) => setLang(newLang);
    globalLangListeners.push(listener);
    return () => {
      globalLangListeners = globalLangListeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    const listener = (code: string) => setTranslateLangState(code);
    translateListeners.push(listener);
    return () => {
      translateListeners = translateListeners.filter((l) => l !== listener);
    };
  }, []);

  // Backward-compat helper: returns Vietnamese or English string
  const t = (vi: string, en: string): string => {
    return lang === "vi" ? vi : en;
  };

  // Legacy toggle (vi <-> en)
  const toggleLanguage = () => {
    setTranslateLanguage(currentTranslateLang === "vi" ? "en" : "vi");
  };

  return { lang, t, toggleLanguage, translateLang, setTranslateLanguage };
}

// Initialize Google Translate on page load with saved preference
export function initGoogleTranslate() {
  const saved = safeStorage.getItem("indiecollab_translate_lang");
  if (saved && saved !== "vi") {
    // Delay to let the Google Translate widget initialize
    setTimeout(() => triggerGoogleTranslate(saved), 2500);
  }
}
