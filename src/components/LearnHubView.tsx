import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Trophy,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Key,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import { useLanguage } from "../utils/i18n";
import { getAuth } from "firebase/auth";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "./Toast";
import type {
  LearningOpportunity,
  LearningKeyword,
  LearningSource,
  LearningScanRun
} from "../types";

interface LearnHubViewProps {
  currentUser: { id: string; displayName: string; avatarUrl: string; jobTitle: string } | null;
  onShowAuth: () => void;
}

export default function LearnHubView({ currentUser, onShowAuth }: LearnHubViewProps) {
  const { t } = useLanguage();
  const { toasts, success, removeToast } = useToast();

  // Loading and State
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<LearningOpportunity[]>([]);
  
  // Public Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [costFilter, setCostFilter] = useState<string>("all"); // "all" | "free"
  const [langFilter, setLangFilter] = useState<string>("all"); // "all" | "vi" | "en"

  // Pagination states
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // AI Core BYOK States
  const [byokStatusLoading, setByokStatusLoading] = useState(false);
  const [hasUserApiKey, setHasUserApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [byokSaving, setByokSaving] = useState(false);
  const [byokMessage, setByokMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Admin States
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<"moderation" | "keywords" | "sources" | "scan-runs">("moderation");
  const [adminLoading, setAdminLoading] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<LearningOpportunity[]>([]);
  const [keywords, setKeywords] = useState<LearningKeyword[]>([]);
  const [sources, setSources] = useState<LearningSource[]>([]);
  const [scanRuns, setScanRuns] = useState<LearningScanRun[]>([]);

  // Admin Creation Forms
  const [newKeyword, setNewKeyword] = useState("");
  const [newKeywordCategory, setNewKeywordCategory] = useState("course");
  const [newSourceDomain, setNewSourceDomain] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceMode, setNewSourceMode] = useState<"rss" | "sitemap">("rss");

  // Load public opportunities & check admin credentials, BYOK state
  useEffect(() => {
    loadPublicFeed();
    if (currentUser) {
      checkAdminStatus();
      checkByokStatus();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Load public opportunities feed
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const loadPublicFeed = async () => {
    try {
      const res = await fetch("/api/learn-hub/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.items || []);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error("Failed to load public feed", err);
    } finally {
      if (isFirstLoad) {
        setIsFirstLoad(false);
      }
      if (!currentUser) setLoading(false);
    }
  };

  // Load more public opportunities
  const loadMoreOpportunities = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/learn-hub/opportunities?after=${nextCursor}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities((prev) => [...prev, ...((data.items || []).filter((item: LearningOpportunity) => !prev.some(p => p.id === item.id)))]);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error("Failed to load more opportunities", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Securely verify if the current user has admin access
  const checkAdminStatus = async () => {
    if (!currentUser) return;
    try {
      // Decode JWT token via headers
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch("/api/admin/learn-hub/review-queue", {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.ok) {
        setIsAdmin(true);
        // Load initial admin queues
        const data = await res.json();
        setReviewQueue(data.items || []);
        loadAdminKeywordsAndSources(idToken);
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Load BYOK key status
  const checkByokStatus = async () => {
    if (!currentUser) return;
    setByokStatusLoading(true);
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch("/api/ai-core/provider-keys", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHasUserApiKey(!!data.hasKey);
      }
    } catch (err) {
      console.error("Error checking BYOK status", err);
    } finally {
      setByokStatusLoading(false);
    }
  };

  const getFirebaseIdToken = async (): Promise<string | null> => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) return null;
      return await auth.currentUser.getIdToken(/* forceRefresh */ true);
    } catch (e) {
      console.warn("getIdToken failed:", e);
      return null;
    }
  };

  // Load admin dependencies
  const loadAdminKeywordsAndSources = async (token: string) => {
    try {
      const [kwRes, srcRes, logRes] = await Promise.all([
        fetch("/api/admin/learn-hub/keywords", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/learn-hub/sources", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/learn-hub/scan-runs", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (kwRes.ok) {
        const d = await kwRes.json();
        setKeywords(d.items || []);
      }
      if (srcRes.ok) {
        const d = await srcRes.json();
        setSources(d.items || []);
      }
      if (logRes.ok) {
        const d = await logRes.json();
        setScanRuns(d.items || []);
      }
    } catch (err) {
      console.error("Error loading admin dependencies", err);
    }
  };

  // Save BYOK Key
  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) return;
    setByokSaving(true);
    setByokMessage(null);

    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) throw new Error("Chưa đăng nhập hệ thống.");

      const res = await fetch("/api/ai-core/provider-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ apiKey: newApiKey.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setHasUserApiKey(true);
        setNewApiKey("");
        setByokMessage({ type: "success", text: t("Cấu hình API Key cá nhân thành công!", "Personal API key configured successfully!") });
      } else {
        setByokMessage({ type: "error", text: data.error || t("Không thể kiểm chứng API Key.", "Failed to validate API Key.") });
      }
    } catch (err: any) {
      setByokMessage({ type: "error", text: err.message || t("Dịch vụ tạm thời bận.", "Service is busy.") });
    } finally {
      setByokSaving(false);
    }
  };

  // Revoke BYOK Key
  const handleRevokeApiKey = async () => {
    if (!window.confirm(t("Bạn có chắc chắn muốn xóa API Key cá nhân của mình?", "Are you sure you want to delete your personal API key?"))) return;
    setByokSaving(true);
    setByokMessage(null);

    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) throw new Error("Chưa đăng nhập.");

      const res = await fetch("/api/ai-core/provider-keys", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.ok) {
        setHasUserApiKey(false);
        setByokMessage({ type: "success", text: t("Đã khôi phục dùng khóa hệ thống mặc định.", "Successfully reverted to system default SDK key.") });
      } else {
        setByokMessage({ type: "error", text: t("Không thể xóa khóa.", "Failed to delete key.") });
      }
    } catch (err: any) {
      setByokMessage({ type: "error", text: err.message });
    } finally {
      setByokSaving(false);
    }
  };

  // Admin Actions
  const handleReview = async (id: string, status: "published" | "rejected") => {
    setAdminLoading(true);
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch(`/api/admin/learn-hub/opportunities/${id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setReviewQueue(prev => prev.filter(item => item.id !== id));
        loadPublicFeed(); // Refresh the feed if approved/published
      }
    } catch (err) {
      console.error("Moderation review failed", err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    setAdminLoading(true);
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch("/api/admin/learn-hub/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          query: newKeyword.trim(),
          category: newKeywordCategory
        })
      });

      if (res.ok) {
        setNewKeyword("");
        loadAdminKeywordsAndSources(idToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!window.confirm("Xóa từ khóa này?")) return;
    setAdminLoading(true);
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch(`/api/admin/learn-hub/keywords/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.ok) {
        loadAdminKeywordsAndSources(idToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSourceDomain.trim() || !newSourceUrl.trim()) return;
    setAdminLoading(true);
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch("/api/admin/learn-hub/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          domain: newSourceDomain.trim(),
          entryUrl: newSourceUrl.trim(),
          sourceMode: newSourceMode
        })
      });

      if (res.ok) {
        setNewSourceDomain("");
        setNewSourceUrl("");
        loadAdminKeywordsAndSources(idToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!window.confirm("Xóa nguồn thu thập này?")) return;
    setAdminLoading(true);
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch(`/api/admin/learn-hub/sources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.ok) {
        loadAdminKeywordsAndSources(idToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleTriggerCrawl = async () => {
    setAdminLoading(true);
    try {
      const idToken = await getFirebaseIdToken();
      if (!idToken) return;

      const res = await fetch("/api/admin/learn-hub/trigger-scan", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (res.ok) {
        success(
          t("Gửi yêu cầu thành công", "Dispatched Successfully"),
          t("Bắt đầu tiến trình thu thập nền thành công!", "Background crawl cycle dispatched successfully!")
        );
        // Reload logs after slight delay
        setTimeout(() => loadAdminKeywordsAndSources(idToken), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  // Filter opportunities to show in feed
  const filteredFeed = opportunities.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchCost = costFilter === "all" || (costFilter === "free" && item.isFree);
    const matchLang = langFilter === "all" || item.language === langFilter;

    return matchSearch && matchCategory && matchCost && matchLang;
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* HEADER SECTION */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-emerald-500/10 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-indigo-950/10 p-8 shadow-2xl">
        <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10">
          <BookOpen className="h-44 w-44 text-emerald-400 animate-pulse" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-emerald-400">
            <Sparkles className="h-3 w-3" />
            AI-Powered Discovery Engine
          </div>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-4xl">
            Learn <span className="text-emerald-400">Hub</span>
          </h1>
          <p className="mt-2 text-sm max-w-2xl text-slate-400 leading-relaxed">
            {t(
              "Nơi tập hợp tự động mọi cơ hội tự học, học bổng phát triển, chứng chỉ quốc tế và các cuộc thi sự kiện game dev hot nhất từ các hệ thống RSS / Sitemap lớn và mô hình đánh giá AI Gemini thông minh.",
              "The automatic aggregator for free learning paths, scholarships, international game dev certifications, and events, verified with Gemini classification AI."
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT BAR: CONTROLS & API KEY MANAGER (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* SEARCH & PUBLIC FILTERS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-emerald-400" />
              {t("Tìm Kiếm & Bộ Lọc", "Search & Filters")}
            </h2>
            
            <div className="flex flex-col gap-4">
              {/* Query search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder={t("Nhập từ khóa, tag công nghệ...", "Enter keywords, tags...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 pl-9 text-xs font-semibold text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500/30 transition-all font-mono"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {t("Danh Mục", "Category")}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-300 outline-none cursor-pointer"
                >
                  <option value="all">👉 {t("Tất cả danh mục", "All Categories")}</option>
                  <option value="course">🎓 {t("Khóa học / Tutorial", "Courses & Tutorials")}</option>
                  <option value="certificate">📜 {t("Chứng chỉ đào tạo", "Certifications")}</option>
                  <option value="scholarship">💎 {t("Dự án học bổng / Kinh phí", "Scholarships & Grants")}</option>
                  <option value="event">📅 {t("Sự kiện / Game Jam", "Events & Game Jams")}</option>
                  <option value="other">📦 {t("Tài nguyên khác", "Other Resources")}</option>
                </select>
              </div>

              {/* Cost selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {t("Học Phí", "Tuition Fee")}
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCostFilter("all")}
                    className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer border ${
                      costFilter === "all"
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t("Tất Cả", "All")}
                  </button>
                  <button
                    onClick={() => setCostFilter("free")}
                    className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer border ${
                      costFilter === "free"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    🌿 {t("Miễn Phí", "Free Only")}
                  </button>
                </div>
              </div>

              {/* Language selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {t("Ngôn Ngữ", "Language")}
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLangFilter("all")}
                    className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer border ${
                      langFilter === "all"
                        ? "bg-slate-800 border-slate-700 text-white"
                        : "bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t("Tất Cả", "All")}
                  </button>
                  <button
                    onClick={() => setLangFilter("vi")}
                    className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer border ${
                      langFilter === "vi"
                        ? "bg-slate-800 border-emerald-500/30 text-white"
                        : "bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    🇻🇳 {t("Tiếng Việt", "Vietnamese")}
                  </button>
                  <button
                    onClick={() => setLangFilter("en")}
                    className={`rounded-xl py-2 text-xs font-bold transition cursor-pointer border ${
                      langFilter === "en"
                        ? "bg-slate-800 border-blue-500/30 text-white"
                        : "bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    🌐 {t("English", "English")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI CORE BYOK KEY SETTER */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-violet-400" />
              {t("AI Core (Khóa Cá Nhân)", "AI Core BYOK Key")}
            </h2>

            {currentUser ? (
              <div className="flex flex-col gap-4">
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {t(
                    "Theo chính sách bảo mật, IndieCollab cho phép bạn cấu hình Gemini API Key cá nhân để mở thêm hiệu năng và không lo giới hạn hệ thống.",
                    "IndieCollab allows configuration of personal Gemini API keys to unlock customized analysis and bypass shared model limits."
                  )}
                </p>

                {byokStatusLoading ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                    <span className="text-xs font-mono text-slate-500">Retrieving API status...</span>
                  </div>
                ) : hasUserApiKey ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      {t("Đã Cấu Hình Khóa Cá Nhân", "Your API Key is Live")}
                    </div>
                    <p className="mt-1 text-[10px] text-emerald-600 font-mono">
                      {t("Đang áp dụng mã hóa AES-256 đầu cuối.", "AES-256 end-to-end encrypted.")}
                    </p>
                    <button
                      onClick={handleRevokeApiKey}
                      disabled={byokSaving}
                      className="mt-3 inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 text-[10px] font-mono font-bold hover:underline transition bg-rose-500/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("Xóa & Hủy Khóa", "Revoke Key")}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-3 text-center">
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-slate-600 animate-pulse" />
                        {t("Đang dùng khóa hệ thống chung", "Running on shared platform token")}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        {t("Nhập Gemini API Key", "Enter Gemini API Key")}
                      </label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-violet-500/30"
                      />
                    </div>
                    <button
                      onClick={handleSaveApiKey}
                      disabled={byokSaving || !newApiKey}
                      className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/10 cursor-pointer"
                    >
                      {byokSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {t("Kích Hoạt Khóa", "Activate Key")}
                    </button>
                  </div>
                )}

                {/* Response Feedback info */}
                {byokMessage && (
                  <div className={`rounded-xl border p-3 text-center text-xs font-bold leading-relaxed ${
                    byokMessage.type === "success" 
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
                      : "border-rose-500/20 bg-rose-500/5 text-rose-400"
                  }`}>
                    {byokMessage.text}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500 mb-3">{t("Đăng nhập để liên kết Gemini API Key.", "Sign in to config your custom API key.")}</p>
                <button
                  onClick={onShowAuth}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  {t("Đăng Nhập Ngay", "Sign In")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: INTERACTIVE OPPORTUNITIES OR ADMIN AREA (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* ADMIN TOGGLE PANEL IF PRIVILEGED USER */}
          {isAdmin && (
            <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-950/5 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-emerald-500/25 pb-2.5">
                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                  IndieCollab Learn Hub Administrator Panel
                </span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-black text-emerald-400">
                  SYSTEM LEVEL
                </span>
              </div>

              {/* Sub navbar navigation triggers within administrative board */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAdminTab("moderation")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    adminTab === "moderation"
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  📥 {t("Sàng Lọc Duyệt", "Moderation Queue")} ({reviewQueue.length})
                </button>
                <button
                  onClick={() => setAdminTab("keywords")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    adminTab === "keywords"
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  🔑 {t("Từ Khóa Web", "Search Keywords")} ({keywords.length})
                </button>
                <button
                  onClick={() => setAdminTab("sources")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    adminTab === "sources"
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  🚀 {t("Nguồn Crawler", "Crawl Sources")} ({sources.length})
                </button>
                <button
                  onClick={() => setAdminTab("scan-runs")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    adminTab === "scan-runs"
                      ? "bg-emerald-500 text-slate-950 shadow-md"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  📊 {t("Lịch Sử Quét", "Crawler Logs")} ({scanRuns.length})
                </button>
              </div>

              {/* TAB OPERATIONS RENDER */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-900 p-4 min-h-[220px]">
                {adminTab === "moderation" && (
                  <div>
                    <h3 className="text-xs font-black text-slate-200 mb-3 tracking-wider uppercase font-mono">
                      🗂️ {t("Danh sách cơ hội pending_review", "Moderation Review Queue")}
                    </h3>

                    {reviewQueue.length === 0 ? (
                      <p className="text-xs text-slate-500 py-10 text-center">
                        🎉 {t("Hàng đợi sạch bóng! Toàn bộ cơ hội crawl về đã được kiểm duyệt.", "Queue is empty! All crawler opportunities reviewed.")}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {reviewQueue.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-100 block mb-1 hover:underline">
                                {item.title}
                              </span>
                              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 font-mono">
                                <span>Domain: {item.sourceDomain}</span>
                                <span className="text-slate-800">|</span>
                                <span className="bg-emerald-500/10 px-1 py-0.5 rounded text-emerald-400">{item.category}</span>
                                <span className="text-slate-800">|</span>
                                <span className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">{item.language}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <a
                                href={item.canonicalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white bg-slate-950"
                                title="Kiểm tra link gốc"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <button
                                onClick={() => handleReview(item.id, "published")}
                                className="px-2.5 py-1.5 rounded-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans cursor-pointer text-[10px]"
                              >
                                Duyệt Đăng
                              </button>
                              <button
                                onClick={() => handleReview(item.id, "rejected")}
                                className="px-2.5 py-1.5 rounded-lg font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-sans cursor-pointer text-[10px]"
                              >
                                Từ Chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {adminTab === "keywords" && (
                  <div>
                    <h3 className="text-xs font-black text-slate-200 mb-3 tracking-wider uppercase font-mono flex justify-between items-center">
                      <span>🔑 {t("Quản lý từ khóa trích xuất search_scope", "Web Search Keywords Hub")}</span>
                      <span className="text-[10px] text-slate-500 font-normal select-none">Hệ thống kích hoạt Web Custom Search API</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                      {/* Create tool */}
                      <div className="md:col-span-6">
                        <input
                          type="text"
                          placeholder={t("Ví dụ: Unity game developer certification free", "e.g. Free Unreal tutorials")}
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-sans text-white focus:border-emerald-500/30 outline-none"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <select
                          value={newKeywordCategory}
                          onChange={(e) => setNewKeywordCategory(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-bold text-slate-300 outline-none cursor-pointer"
                        >
                          <option value="course">🎓 Course / Tutorial</option>
                          <option value="certificate">📜 Certification</option>
                          <option value="scholarship">💎 Scholarship</option>
                          <option value="event">📅 Event</option>
                          <option value="other">📦 Other</option>
                        </select>
                      </div>
                      <button
                        onClick={handleAddKeyword}
                        disabled={adminLoading || !newKeyword.trim()}
                        className="md:col-span-2 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-slate-950 font-bold rounded-xl text-xs py-2 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Thêm
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-900">
                      {keywords.map(kw => (
                        <div key={kw.id} className="flex justify-between items-center py-2 text-xs">
                          <span className="font-mono text-slate-300">
                            "{kw.query}" <span className="ml-1 text-[9px] text-slate-600 bg-slate-900 rounded px-1.5 uppercase font-sans font-bold">{kw.category}</span>
                          </span>
                          <button
                            onClick={() => handleDeleteKeyword(kw.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === "sources" && (
                  <div>
                    <h3 className="text-xs font-black text-slate-200 mb-3 tracking-wider uppercase font-mono">
                      🚀 {t("Quản lý nguồn cấp dữ liệu crawler", "Crawl Domains & RSS Sources")}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          placeholder="Domain (e.g. unity.com)"
                          value={newSourceDomain}
                          onChange={(e) => setNewSourceDomain(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30 font-sans"
                        />
                      </div>
                      <div className="md:col-span-5">
                        <input
                          type="text"
                          placeholder="https://example.com/rss"
                          value={newSourceUrl}
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/30 font-mono"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <select
                          value={newSourceMode}
                          onChange={(e) => setNewSourceMode(e.target.value as any)}
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2 py-2 text-xs text-slate-300 outline-none cursor-pointer"
                        >
                          <option value="rss">RSS Xml</option>
                          <option value="sitemap">Sitemap</option>
                        </select>
                      </div>
                      <button
                        onClick={handleAddSource}
                        disabled={adminLoading || !newSourceDomain.trim() || !newSourceUrl.trim()}
                        className="md:col-span-2 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs py-2 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Thêm
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-900 font-mono text-[11px]">
                      {sources.map(src => (
                        <div key={src.id} className="flex justify-between items-center py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-300">{src.domain}</span>
                            <span className="text-[10px] text-slate-500 max-w-sm line-clamp-1">{src.entryUrl}</span>
                          </div>
                          <div className="flex items-center gap-2 font-sans font-bold">
                            <span className="text-[9px] bg-slate-900 rounded px-1 text-slate-500 uppercase">{src.sourceMode}</span>
                            <button
                              onClick={() => handleDeleteSource(src.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === "scan-runs" && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase font-mono">
                        📊 {t("Lịch sử quét mốc thời gian & Lỗi thu thập", "Discovery Scan Logs")}
                      </h3>
                      <button
                        onClick={handleTriggerCrawl}
                        disabled={adminLoading}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-slate-950" />
                        {t("Chạy Crawler Ngay", "Dispatch Discovery Run")}
                      </button>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-900 text-xs">
                      {scanRuns.length === 0 ? (
                        <p className="text-xs text-slate-500 py-10 text-center font-mono">No scan history recorded.</p>
                      ) : (
                        scanRuns.map(run => (
                          <div key={run.id} className="py-2.5 flex flex-col gap-1">
                            <div className="flex justify-between items-center font-mono text-[11px]">
                              <span className="font-bold text-slate-300">Run {run.id.slice(0, 8)}...</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                run.status === "completed" 
                                  ? "bg-emerald-500/10 text-emerald-400" 
                                  : "bg-rose-500/10 text-rose-400"
                              }`}>{run.status.toUpperCase()}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-500 mt-1">
                              <span>Started: {new Date(run.startedAt).toLocaleTimeString()}</span>
                              <span>Found Links: {run.urlsFound}</span>
                              <span className="text-emerald-500">Ingested Items: {run.itemsCreated}</span>
                            </div>
                            {run.errors && run.errors.length > 0 && (
                              <div className="mt-1.5 p-2 bg-rose-950/20 border border-rose-950 rounded text-[10px] font-mono text-rose-400 max-h-[80px] overflow-y-auto">
                                <span className="font-bold uppercase tracking-wider block mb-1">Crawl Fault Log:</span>
                                {run.errors.map((e, index) => (
                                  <div key={index} className="flex gap-1.5 py-0.5 border-t border-rose-950/40">
                                    <span className="font-bold shrink-0">[{e.source}]:</span>
                                    <span>{e.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MAIN OPPORTUNITIES INTERACTIVE RESULTS */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Trophy className="h-4.5 w-4.5 text-emerald-400" />
                {t("Cơ Hội Đang Mở", "Discovered Learning Feed")}
                <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-mono font-bold text-slate-500 font-sans">
                  {filteredFeed.length}
                </span>
              </h2>
            </div>

            {filteredFeed.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 py-16 text-center select-none col-span-full flex flex-col items-center justify-center py-20">
                <BookOpen className="mx-auto h-12 w-12 text-slate-700 mb-4" />
                <h3 className="text-sm font-bold text-slate-400">{t("Không tìm thấy kết quả phù hợp.", "No results match your filters.")}</h3>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setCostFilter("all"); setLangFilter("all"); }}
                  className="mt-4 text-xs text-emerald-400 hover:underline font-mono cursor-pointer"
                >
                  {t("Xóa bộ lọc", "Clear filters")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredFeed.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.4) }}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 p-5 shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-500/15"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 hover:text-slate-400">
                            {item.sourceDomain}
                          </span>
                          
                          {/* Cost Condition Badge */}
                          <span className={`rounded-xl px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider select-none ${
                            item.isFree 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          }`}>
                            {item.isFree ? "Free" : "Premium"}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug font-sans">
                            {item.title}
                          </h3>
                        </div>

                        {/* Tech Tag Badges */}
                        <div className="flex flex-wrap gap-1">
                          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-400 font-mono">
                            # {item.category}
                          </span>
                          {item.tags && item.tags.map(tag => (
                            <span key={tag} className="rounded bg-[#0A0A0F] px-1.5 py-0.5 text-[10px] font-bold text-slate-500 font-mono hover:text-slate-300 transition-colors">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-800/40 pt-4 flex items-center justify-between text-[11px] font-mono select-none">
                        <span className="text-slate-500 text-[10px]">
                          Crawl: {item.sourceType.toUpperCase()}
                        </span>
                        
                        <a
                          href={item.canonicalUrl}
                          target="_blank"
                          rel="noreferrer referrerPolicy"
                          className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 group-hover:border-emerald-500/30 text-slate-400 group-hover:text-emerald-400 rounded-xl px-3 py-1.5 hover:bg-emerald-500 hover:text-slate-950 font-bold transition duration-300 font-sans cursor-pointer text-[11.5px]"
                        >
                          {t("Học Ngay", "Start Course")}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Load More Pagination Trigger */}
            {nextCursor && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMoreOpportunities}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 shadow hover:bg-slate-900 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-bold px-6 py-2.5 text-xs transition duration-300 font-sans cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      {t("Đang Tải...", "Loading...")}
                    </>
                  ) : (
                    <>
                      {t("Xem Thêm Cơ Hội", "Load More Opportunities")}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
