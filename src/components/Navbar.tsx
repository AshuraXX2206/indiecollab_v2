import React from "react";
import { Gamepad2, Compass, Users, User, Gift, LogOut, Trophy, BookOpen } from "lucide-react";
import { useLanguage } from "../utils/i18n";
import NotificationCenter from "./NotificationCenter";
import LanguageSelector from "./LanguageSelector";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { id: string; displayName: string; avatarUrl: string; jobTitle: string } | null;
  onLogout?: () => void;
  pendingConnectionCount?: number;
  pendingStudioJoinCount?: number;
  unreadNotificationCount?: number;
  setUnreadNotificationCount?: (count: number) => void;
}

const NAV_ITEMS = [
  { id: "explore",      labelVi: "Dự Án",       labelEn: "Projects",    Icon: Compass,  accent: "violet" },
  { id: "gamejams",     labelVi: "Game Jams",   labelEn: "Game Jams",   Icon: Trophy,   accent: "amber"  },
  { id: "partners",     labelVi: "Đồng Đội",    labelEn: "Teammates",   Icon: Users,    accent: "cyan"   },
  { id: "bountymarket", labelVi: "Bug & Asset",  labelEn: "Bug & Asset", Icon: Gift,     accent: "pink"   },
  { id: "learnhub",     labelVi: "Learn Hub",   labelEn: "Learn Hub",   Icon: BookOpen, accent: "emerald" },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  pendingConnectionCount = 0,
  pendingStudioJoinCount = 0,
  unreadNotificationCount = 0,
  setUnreadNotificationCount = () => {},
}: NavbarProps) {
  const { t } = useLanguage();

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ background: "rgba(10,10,15,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* ── Logo ── */}
        <div
          className="flex cursor-pointer items-center gap-3 select-none transition-opacity hover:opacity-90 active:scale-[0.97]"
          onClick={() => setActiveTab("explore")}
          role="button"
          aria-label="Về trang chủ"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("explore")}
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-violet-900/40"
               style={{ background: "linear-gradient(135deg,#7C3AED 0%,#06B6D4 100%)" }}>
            <Gamepad2 className="h-4 w-4 text-white" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
          </div>
          <div className="leading-none">
            <span className="text-[15px] font-black tracking-tight text-white">
              indie<span style={{ color: "#7C3AED" }}>collab</span>
            </span>
            <div className="text-[8.5px] font-bold tracking-[0.18em] uppercase font-mono" style={{ color: "#06B6D4", opacity: 0.7 }}>
              AI · Indie · Collaborate
            </div>
          </div>
        </div>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-0.5 rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {NAV_ITEMS.map(({ id, labelVi, labelEn, Icon, accent }) => {
            const isActive = activeTab === id;
            const hasBadge = id === "partners" && pendingConnectionCount > 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                style={isActive ? {
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.1)",
                } : { border: "1px solid transparent" }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t(labelVi, labelEn)}
                {hasBadge && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white px-1 shadow-md shadow-rose-900/50">
                    {pendingConnectionCount > 9 ? "9+" : pendingConnectionCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <NotificationCenter
              currentUserId={currentUser.id}
              unreadCount={unreadNotificationCount}
              setUnreadCount={setUnreadNotificationCount}
            />
          )}

          <LanguageSelector />

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-xl transition cursor-pointer"
              style={{ color: "#f87171", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              title={t("Đăng xuất", "Log out")}
            >
              <LogOut className="h-3 w-3" />
              {t("Xuất", "Out")}
            </button>
          )}

          {currentUser ? (
            <button
              onClick={() => setActiveTab("profile")}
              className="group flex items-center gap-2 rounded-xl p-1 pr-2.5 text-left transition-all cursor-pointer"
              style={activeTab === "profile"
                ? { background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.35)" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="h-7 w-7 rounded-lg object-cover transition"
                  style={{ boxShadow: "0 0 0 2px rgba(124,58,237,0.4)" }}
                />
                {(pendingConnectionCount > 0 || pendingStudioJoinCount > 0) && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 border border-[#0A0A0F] shadow" />
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-[11px] font-bold text-slate-200 line-clamp-1 group-hover:text-white transition leading-tight">
                  {currentUser.displayName}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "#06B6D4", opacity: 0.75 }}>
                  {currentUser.jobTitle}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95 cursor-pointer shadow-lg shadow-violet-900/30"
              style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
            >
              <User className="h-3.5 w-3.5" />
              {t("Tạo Hồ Sơ", "Create Profile")}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <div
        className="flex md:hidden justify-around py-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,15,0.97)" }}
      >
        {NAV_ITEMS.map(({ id, labelVi, labelEn, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 text-[10px] font-semibold transition-colors cursor-pointer ${
                isActive ? "text-violet-400" : "text-slate-600 hover:text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t(labelVi, labelEn)}</span>
            </button>
          );
        })}
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 text-[10px] font-semibold transition cursor-pointer ${
            activeTab === "profile" ? "text-violet-400" : "text-slate-600 hover:text-slate-400"
          }`}
        >
          <img
            src={currentUser?.avatarUrl || "https://api.dicebear.com/7.x/pixel-art/svg?seed=guest"}
            alt="profile"
            className="h-4 w-4 rounded-full object-cover"
          />
          <span>{t("Hồ Sơ", "Profile")}</span>
        </button>
      </div>
    </header>
  );
}
