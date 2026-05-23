// ============================================================================
// GameJamTab.tsx — Game Jam feature inside Studio page
// Dark mode, Linear/Vercel-inspired design
// ============================================================================
import React, { useState, useEffect, useCallback } from "react";
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  doc, getDocs, serverTimestamp, Timestamp, limit
} from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";
import {
  GameJam, JamRegistration, JamTeam, JamVote, UserPoint,
  GameStudio, User, JamStatus, JamPrizeTier, JamTeamMember
} from "../types";
import {
  Trophy, Plus, Calendar, Users, Clock, ChevronRight,
  Download, Edit2, Trash2, Search, Crown, Check, X,
  Zap, Star, Award, Flag, ExternalLink, MoreHorizontal,
  ChevronLeft, Info, Shield, Upload
} from "lucide-react";

// ============================================================================
// HELPERS
// ============================================================================
function formatCountdown(targetDate: string): string {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return "00:00:00:00";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function getJamStatusMeta(status: JamStatus) {
  switch (status) {
    case "draft":    return { label: "DRAFT",    color: "text-slate-400", bg: "bg-slate-800/60",  border: "border-slate-700" };
    case "open":     return { label: "OPEN",     color: "text-emerald-400", bg: "bg-emerald-950/50", border: "border-emerald-700/60" };
    case "closed":   return { label: "CLOSED",   color: "text-amber-400", bg: "bg-amber-950/50",  border: "border-amber-700/60" };
    case "voting":   return { label: "VOTING",   color: "text-violet-400", bg: "bg-violet-950/50", border: "border-violet-700/60" };
    case "finished": return { label: "FINISHED", color: "text-slate-500", bg: "bg-slate-900/60",  border: "border-slate-800" };
    default:         return { label: "UNKNOWN",  color: "text-slate-500", bg: "bg-slate-900",     border: "border-slate-800" };
  }
}

function getJamCTA(status: JamStatus, isRegistered: boolean) {
  if (isRegistered) return { label: "Đã đăng ký", disabled: true };
  switch (status) {
    case "open":     return { label: "Đăng ký ngay", disabled: false };
    case "voting":   return { label: "Vote ngay", disabled: false };
    case "finished": return { label: "Xem kết quả", disabled: false };
    default:         return { label: "Xem chi tiết", disabled: false };
  }
}

function progressPercent(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

// ============================================================================
// AWARD POINTS HELPER
// ============================================================================
async function awardPoints(userId: string, amount: number, source: UserPoint["source"], sourceId: string, description: string) {
  await addDoc(collection(db, "user_points"), {
    userId, amount, source, sourceId, description,
    createdAt: new Date().toISOString()
  });
}

// ============================================================================
// JAM CARD
// ============================================================================
interface JamCardProps {
  jam: GameJam;
  isOwner: boolean;
  isRegistered: boolean;
  onView: (jam: GameJam) => void;
  onEdit: (jam: GameJam) => void;
  onDelete: (jamId: string) => void;
  onRegister: (jam: GameJam) => void;
}

function JamCard({ jam, isOwner, isRegistered, onView, onEdit, onDelete, onRegister }: JamCardProps) {
  const [countdown, setCountdown] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const statusMeta = getJamStatusMeta(jam.status);
  const cta = getJamCTA(jam.status, isRegistered);

  useEffect(() => {
    const target = jam.status === "open" ? jam.endDate : jam.startDate;
    const tick = () => setCountdown(formatCountdown(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [jam.status, jam.endDate, jam.startDate]);

  const pct = progressPercent(jam.startDate, jam.endDate);

  return (
    <div className="relative group rounded-2xl border border-white/[0.07] bg-[#111118] overflow-hidden flex flex-col hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 shadow-xl shadow-black/40">
      {/* Banner */}
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-violet-950 to-indigo-950 shrink-0">
        {jam.bannerUrl ? (
          <img src={jam.bannerUrl} alt={jam.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="h-12 w-12 text-violet-500/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/40 to-transparent" />
        {/* Status badge */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-widest border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${jam.status === "open" ? "bg-emerald-400 animate-pulse" : jam.status === "voting" ? "bg-violet-400 animate-pulse" : "bg-current opacity-70"}`} />
          {statusMeta.label}
        </span>
        {/* Owner menu */}
        {isOwner && (
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="p-1.5 rounded-lg bg-black/50 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute top-8 right-0 z-20 w-40 rounded-xl border border-white/10 bg-[#0A0A0F] shadow-2xl overflow-hidden">
                <button onClick={() => { onEdit(jam); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/5 cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5" /> Chỉnh sửa
                </button>
                <button onClick={() => { onDelete(jam.id); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" /> Xóa Game Jam
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        <div>
          <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{jam.title}</h3>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{jam.shortDescription}</p>
        </div>

        {/* Theme tags */}
        {jam.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {jam.tags.slice(0, 3).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-violet-950/50 border border-violet-800/40 text-violet-300 text-[10px] font-mono">{t}</span>
            ))}
          </div>
        )}

        {/* Countdown */}
        {(jam.status === "open" || jam.status === "draft") && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Clock className="h-3.5 w-3.5 text-violet-400 shrink-0" />
            <span>{jam.status === "open" ? "Kết thúc sau:" : "Bắt đầu sau:"}</span>
            <span className="text-violet-300 font-bold">{countdown}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{new Date(jam.startDate).toLocaleDateString("vi-VN")}</span>
            <span>{new Date(jam.endDate).toLocaleDateString("vi-VN")}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-cyan-400" />{jam.participantCount} solo</span>
          <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-indigo-400" />{jam.teamCount} team</span>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-2 flex gap-2">
          <button
            onClick={() => onView(jam)}
            className="flex-1 py-2 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/5 hover:text-white transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            Chi tiết <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {!isOwner && (
            <button
              onClick={() => !cta.disabled && (jam.status === "open" ? onRegister(jam) : onView(jam))}
              disabled={cta.disabled}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                cta.disabled
                  ? "bg-emerald-950/30 border border-emerald-800/40 text-emerald-500"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-950/40"
              }`}
            >
              {cta.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE / EDIT JAM MODAL — 5-step flow
// ============================================================================
interface CreateJamModalProps {
  studio: GameStudio;
  currentUser: User;
  existingJam?: GameJam | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_PRIZE: JamPrizeTier = { rank: 1, label: "1st Place", points: 200, badgeType: "gold", badgeColor: "#F59E0B", description: "" };

function CreateJamModal({ studio, currentUser, existingJam, onClose, onSaved }: CreateJamModalProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [title, setTitle] = useState(existingJam?.title ?? "");
  const [theme, setTheme] = useState(existingJam?.theme ?? "");
  const [shortDesc, setShortDesc] = useState(existingJam?.shortDescription ?? "");
  const [description, setDescription] = useState(existingJam?.description ?? "");
  const [bannerUrl, setBannerUrl] = useState(existingJam?.bannerUrl ?? "");
  const [tags, setTags] = useState<string[]>(existingJam?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  // Step 2
  const [regOpen, setRegOpen] = useState(existingJam?.registrationOpenAt ?? "");
  const [regDeadline, setRegDeadline] = useState(existingJam?.registrationDeadline ?? "");
  const [startDate, setStartDate] = useState(existingJam?.startDate ?? "");
  const [endDate, setEndDate] = useState(existingJam?.endDate ?? "");
  const [votingStart, setVotingStart] = useState(existingJam?.votingStartAt ?? "");
  const [votingEnd, setVotingEnd] = useState(existingJam?.votingEndAt ?? "");

  // Step 3
  const [partType, setPartType] = useState<GameJam["participationType"]>(existingJam?.participationType ?? "both");
  const [minTeam, setMinTeam] = useState(existingJam?.minTeamSize ?? 2);
  const [maxTeam, setMaxTeam] = useState(existingJam?.maxTeamSize ?? 5);
  const [formats, setFormats] = useState<GameJam["submissionFormats"]>(existingJam?.submissionFormats ?? ["github_repo"]);
  const [customRules, setCustomRules] = useState<string[]>(existingJam?.customRules ?? [""]);

  // Step 4
  const [prizes, setPrizes] = useState<JamPrizeTier[]>(existingJam?.prizes ?? [
    { rank: 1, label: "1st Place", points: 200, badgeType: "gold",   badgeColor: "#F59E0B", description: "" },
    { rank: 2, label: "2nd Place", points: 150, badgeType: "silver", badgeColor: "#94A3B8", description: "" },
    { rank: 3, label: "3rd Place", points: 100, badgeType: "bronze", badgeColor: "#B45309", description: "" },
  ]);

  const totalSteps = 5;

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const toggleFormat = (f: GameJam["submissionFormats"][number]) => {
    setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const payload: Omit<GameJam, "id"> = {
        studioId: studio.id,
        studioName: studio.name,
        studioAvatar: studio.avatarUrl,
        organizerId: currentUser.id,
        organizerName: currentUser.displayName,
        title, theme, shortDescription: shortDesc, description,
        rules: customRules.join("\n"),
        tags, bannerUrl: bannerUrl || undefined,
        status: publish ? "open" : "draft",
        participationType: partType,
        minTeamSize: minTeam, maxTeamSize: maxTeam,
        submissionFormats: formats,
        customRules: customRules.filter(Boolean),
        prizes,
        registrationOpenAt: regOpen,
        registrationDeadline: regDeadline,
        startDate, endDate,
        votingStartAt: votingStart,
        votingEndAt: votingEnd,
        participantCount: existingJam?.participantCount ?? 0,
        teamCount: existingJam?.teamCount ?? 0,
        createdAt: existingJam?.createdAt ?? new Date().toISOString(),
        publishedAt: publish ? new Date().toISOString() : existingJam?.publishedAt,
      };
      if (existingJam) {
        await updateDoc(doc(db, "game_jams", existingJam.id), payload as any);
      } else {
        await addDoc(collection(db, "game_jams"), payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error("Save jam error:", e);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 1) return title.trim().length >= 3 && shortDesc.trim().length >= 5;
    if (step === 2) return startDate && endDate && votingStart && votingEnd;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0A0A0F] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-bold text-white">{existingJam ? "Chỉnh sửa Game Jam" : "Tạo Game Jam mới"}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{studio.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-1.5">
            {["Thông tin", "Timeline", "Quy tắc", "Giải thưởng", "Xác nhận"].map((label, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-1.5">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                    step > i + 1 ? "bg-violet-600 border-violet-600 text-white" :
                    step === i + 1 ? "bg-violet-600/20 border-violet-500 text-violet-300" :
                    "bg-transparent border-white/10 text-slate-600"
                  }`}>
                    {step > i + 1 ? <Check className="h-2.5 w-2.5" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-mono hidden sm:block ${step === i + 1 ? "text-violet-300" : "text-slate-600"}`}>{label}</span>
                </div>
                {i < 4 && <div className={`flex-1 h-px transition-all ${step > i + 1 ? "bg-violet-600" : "bg-white/[0.05]"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Tên Game Jam <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <input
                    maxLength={60}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Pixel Odyssey Jam 2025"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">{title.length}/60</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Theme chính <span className="text-rose-400">*</span></label>
                <input
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  placeholder="e.g. Survival Horror, Low-poly, Retro 8-bit..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Mô tả ngắn <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={shortDesc}
                    onChange={e => setShortDesc(e.target.value)}
                    placeholder="Tóm tắt nhanh về Game Jam này..."
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none resize-none"
                  />
                  <span className="absolute right-3 bottom-2 text-[10px] text-slate-500 font-mono">{shortDesc.length}/200</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Mô tả chi tiết</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả đầy đủ về Game Jam, concept, yêu cầu..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Banner URL</label>
                <input
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Tags</label>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Nhập tag, Enter để thêm"
                    className="flex-1 rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2 text-sm text-white focus:border-violet-500/60 focus:outline-none"
                  />
                  <button onClick={addTag} className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-600/40 text-violet-300 text-xs font-bold hover:bg-violet-600/30 cursor-pointer">+ Add</button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-950/50 border border-violet-800/40 text-violet-300 text-[11px] font-mono">
                        {t}
                        <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-violet-500 hover:text-violet-200 cursor-pointer"><X className="h-2.5 w-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Mở đăng ký", value: regOpen, set: setRegOpen },
                  { label: "Hạn đăng ký", value: regDeadline, set: setRegDeadline },
                  { label: "Ngày bắt đầu Jam *", value: startDate, set: setStartDate },
                  { label: "Ngày kết thúc Jam *", value: endDate, set: setEndDate },
                  { label: "Bắt đầu Voting *", value: votingStart, set: setVotingStart },
                  { label: "Kết thúc Voting *", value: votingEnd, set: setVotingEnd },
                ].map(({ label, value, set }) => (
                  <div key={label}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">{label}</label>
                    <input
                      type="datetime-local"
                      value={value}
                      onChange={e => set(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              {/* Timeline visualization */}
              {startDate && endDate && (
                <div className="mt-2 p-4 rounded-xl border border-white/[0.06] bg-[#111118]">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Timeline Preview</p>
                  <div className="relative h-2 w-full rounded-full bg-white/5">
                    <div className="absolute left-0 h-full w-1/4 rounded-l-full bg-cyan-600/60" />
                    <div className="absolute left-1/4 h-full w-1/2 bg-violet-600/80" />
                    <div className="absolute left-3/4 h-full w-1/4 rounded-r-full bg-amber-500/60" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
                    <span>Đăng ký</span><span>Jam diễn ra</span><span>Voting</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">Hình thức tham gia</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["solo", "team", "both"] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setPartType(opt)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer capitalize ${
                        partType === opt
                          ? "bg-violet-600/20 border-violet-500/60 text-violet-300"
                          : "bg-transparent border-white/[0.07] text-slate-500 hover:border-white/20 hover:text-slate-300"
                      }`}
                    >
                      {opt === "both" ? "Solo & Team" : opt}
                    </button>
                  ))}
                </div>
              </div>
              {(partType === "team" || partType === "both") && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">Team size: {minTeam} – {maxTeam} người</label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Min</span>
                    <input type="range" min={2} max={maxTeam} value={minTeam} onChange={e => setMinTeam(+e.target.value)} className="flex-1 accent-violet-500" />
                    <span className="text-xs text-violet-300 font-bold w-4">{minTeam}</span>
                    <span className="text-xs text-slate-400 ml-2">Max</span>
                    <input type="range" min={minTeam} max={10} value={maxTeam} onChange={e => setMaxTeam(+e.target.value)} className="flex-1 accent-violet-500" />
                    <span className="text-xs text-violet-300 font-bold w-4">{maxTeam}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">Hình thức nộp bài</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["github_repo", "itchio_link", "video_demo", "apk"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFormat(f)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition cursor-pointer ${
                        formats.includes(f)
                          ? "bg-cyan-950/40 border-cyan-600/50 text-cyan-300"
                          : "bg-transparent border-white/[0.07] text-slate-500 hover:border-white/20"
                      }`}
                    >
                      <span className={`h-3.5 w-3.5 rounded flex items-center justify-center border ${formats.includes(f) ? "border-cyan-500 bg-cyan-600" : "border-white/20"}`}>
                        {formats.includes(f) && <Check className="h-2.5 w-2.5 text-white" />}
                      </span>
                      {{ github_repo: "GitHub Repo", itchio_link: "Itch.io Link", video_demo: "Video Demo", apk: "APK File" }[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">Luật riêng</label>
                {customRules.map((rule, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={rule}
                      onChange={e => setCustomRules(prev => prev.map((r, j) => j === i ? e.target.value : r))}
                      placeholder={`Quy tắc ${i + 1}`}
                      className="flex-1 rounded-xl border border-white/[0.08] bg-[#111118] px-3 py-2 text-sm text-white focus:border-violet-500/60 focus:outline-none"
                    />
                    <button onClick={() => setCustomRules(prev => prev.filter((_, j) => j !== i))} className="p-2 rounded-xl border border-white/[0.07] text-slate-500 hover:text-rose-400 cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setCustomRules(prev => [...prev, ""])} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer mt-1">
                  <Plus className="h-3.5 w-3.5" /> Thêm quy tắc
                </button>
              </div>
            </>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <>
              <div className="space-y-3">
                {prizes.map((prize, i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/[0.07] bg-[#111118] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: prize.badgeColor + "22", color: prize.badgeColor, border: `1px solid ${prize.badgeColor}44` }}>
                          {prize.rank}
                        </div>
                        <span className="text-xs font-bold text-white">{prize.label}</span>
                      </div>
                      {prizes.length > 1 && (
                        <button onClick={() => setPrizes(prev => prev.filter((_, j) => j !== i))} className="text-slate-600 hover:text-rose-400 cursor-pointer">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono mb-1">Tên giải</label>
                        <input value={prize.label} onChange={e => setPrizes(prev => prev.map((p, j) => j === i ? { ...p, label: e.target.value } : p))}
                          className="w-full rounded-lg border border-white/[0.07] bg-[#0A0A0F] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono mb-1">Points</label>
                        <input type="number" value={prize.points} onChange={e => setPrizes(prev => prev.map((p, j) => j === i ? { ...p, points: +e.target.value } : p))}
                          className="w-full rounded-lg border border-white/[0.07] bg-[#0A0A0F] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono mb-1">Badge type</label>
                        <input value={prize.badgeType} onChange={e => setPrizes(prev => prev.map((p, j) => j === i ? { ...p, badgeType: e.target.value } : p))}
                          placeholder="gold / silver / best_art..."
                          className="w-full rounded-lg border border-white/[0.07] bg-[#0A0A0F] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-mono mb-1">Badge màu</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={prize.badgeColor} onChange={e => setPrizes(prev => prev.map((p, j) => j === i ? { ...p, badgeColor: e.target.value } : p))}
                            className="h-8 w-10 rounded cursor-pointer border-0 bg-transparent" />
                          <span className="text-xs font-mono text-slate-400">{prize.badgeColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setPrizes(prev => [...prev, { ...EMPTY_PRIZE, rank: prev.length + 1, label: `${prev.length + 1}th Place` }])}
                  className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-xs text-slate-500 hover:text-slate-300 hover:border-white/20 flex items-center justify-center gap-1.5 cursor-pointer transition">
                  <Plus className="h-3.5 w-3.5" /> Thêm giải thưởng
                </button>
              </div>
            </>
          )}

          {/* STEP 5 — REVIEW */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/[0.07] bg-[#111118] space-y-2 text-xs">
                <p className="font-bold text-white text-sm">{title}</p>
                <p className="text-slate-400">{shortDesc}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {tags.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-violet-950/50 border border-violet-800/40 text-violet-300 text-[10px] font-mono">{t}</span>)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl border border-white/[0.06] bg-[#111118]">
                  <p className="text-slate-500 font-mono text-[10px] mb-1">TIMELINE</p>
                  <p className="text-slate-300">{startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "-"} → {endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "-"}</p>
                </div>
                <div className="p-3 rounded-xl border border-white/[0.06] bg-[#111118]">
                  <p className="text-slate-500 font-mono text-[10px] mb-1">VOTING</p>
                  <p className="text-slate-300">{votingStart ? new Date(votingStart).toLocaleDateString("vi-VN") : "-"} → {votingEnd ? new Date(votingEnd).toLocaleDateString("vi-VN") : "-"}</p>
                </div>
                <div className="p-3 rounded-xl border border-white/[0.06] bg-[#111118]">
                  <p className="text-slate-500 font-mono text-[10px] mb-1">HÌNH THỨC</p>
                  <p className="text-slate-300 capitalize">{partType === "both" ? "Solo & Team" : partType}</p>
                </div>
                <div className="p-3 rounded-xl border border-white/[0.06] bg-[#111118]">
                  <p className="text-slate-500 font-mono text-[10px] mb-1">GIẢI THƯỞNG</p>
                  <p className="text-slate-300">{prizes.length} hạng — top {prizes[0]?.points ?? 0} pts</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-amber-800/30 bg-amber-950/20 text-xs text-amber-300 flex items-start gap-2">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Sau khi publish, tất cả member theo dõi studio sẽ nhận được thông báo về Game Jam này.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] text-xs text-slate-400 hover:text-white hover:border-white/20 transition cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> {step === 1 ? "Hủy" : "Quay lại"}
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => canNext() && setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tiếp theo <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-white/[0.08] text-xs text-slate-300 hover:text-white hover:border-white/20 transition cursor-pointer disabled:opacity-40"
              >
                Lưu nháp
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                <Flag className="h-3.5 w-3.5" />
                {saving ? "Đang lưu..." : "Publish"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REGISTRATION MODAL
// ============================================================================
interface RegisterModalProps {
  jam: GameJam;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onRegistered: () => void;
}

function RegisterModal({ jam, currentUser, allUsers, onClose, onRegistered }: RegisterModalProps) {
  const [mode, setMode] = useState<"solo" | "team">("solo");
  const [teamName, setTeamName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [invitedMembers, setInvitedMembers] = useState<User[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactDiscord, setContactDiscord] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<"online" | "offline" | "both">("online");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const filteredUsers = allUsers.filter(u =>
    u.id !== currentUser.id &&
    !invitedMembers.find(m => m.id === u.id) &&
    (u.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (u.jobTitle as string).toLowerCase().includes(memberSearch.toLowerCase()))
  ).slice(0, 8);

  const handleRegister = async () => {
    setSaving(true);
    try {
      // Guard: check for existing registration server-side before writing
      const dupCheck = await getDocs(
        query(collection(db, "jam_registrations"),
          where("jamId", "==", jam.id),
          where("userId", "==", currentUser.id),
          limit(1))
      );
      if (!dupCheck.empty) {
        setDone(true);
        return;
      }

      if (mode === "solo") {
        await addDoc(collection(db, "jam_registrations"), {
          jamId: jam.id, userId: currentUser.id,
          userName: currentUser.displayName, userAvatar: currentUser.avatarUrl,
          userJobTitle: currentUser.jobTitle,
          type: "solo",
          contactInfo: { email: contactEmail, discord: contactDiscord },
          attendanceMode,
          voteCount: 0, registeredAt: new Date().toISOString()
        });
        await updateDoc(doc(db, "game_jams", jam.id), { participantCount: (jam.participantCount || 0) + 1 });
      } else {
        // Create team
        const teamMembers: JamTeamMember[] = invitedMembers.map(u => ({
          userId: u.id, userName: u.displayName, userAvatar: u.avatarUrl,
          userJobTitle: u.jobTitle as string, status: "pending",
          invitedAt: new Date().toISOString()
        }));
        const teamRef = await addDoc(collection(db, "jam_teams"), {
          jamId: jam.id, leaderId: currentUser.id,
          leaderName: currentUser.displayName, leaderAvatar: currentUser.avatarUrl,
          teamName, members: teamMembers, voteCount: 0,
          createdAt: new Date().toISOString()
        });
        await addDoc(collection(db, "jam_registrations"), {
          jamId: jam.id, userId: currentUser.id,
          userName: currentUser.displayName, userAvatar: currentUser.avatarUrl,
          userJobTitle: currentUser.jobTitle,
          type: "team", teamId: teamRef.id,
          contactInfo: { email: contactEmail, discord: contactDiscord },
          attendanceMode,
          voteCount: 0, registeredAt: new Date().toISOString()
        });
        await updateDoc(doc(db, "game_jams", jam.id), { teamCount: (jam.teamCount || 0) + 1 });
        // Send notifications to invited members
        for (const member of invitedMembers) {
          await addDoc(collection(db, "notifications"), {
            userId: member.id,
            type: "jam_team_invite",
            title: `Lời mời tham gia team "${teamName}"`,
            message: `${currentUser.displayName} mời bạn vào team cho Game Jam "${jam.title}"`,
            read: false,
            actorId: currentUser.id, actorName: currentUser.displayName, actorAvatar: currentUser.avatarUrl,
            metadata: { jamId: jam.id, teamId: teamRef.id, teamName },
            createdAt: new Date().toISOString()
          });
        }
      }
      // Award points
      await awardPoints(currentUser.id, 20, "jam_register", jam.id, `Đăng ký Game Jam "${jam.title}"`);
      setDone(true);
      onRegistered();
    } catch (e) {
      console.error("Register error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0A0A0F] shadow-2xl overflow-hidden">
        {done ? (
          <div className="p-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Đăng ký thành công!</h3>
              <p className="text-sm text-slate-400 mt-1">{jam.title}</p>
              <p className="text-xs text-emerald-400 mt-2 font-mono">+20 points earned</p>
            </div>
            <button onClick={onClose} className="px-6 py-2 rounded-xl bg-violet-600 text-sm font-bold text-white hover:bg-violet-500 cursor-pointer">
              Xem Game Jam
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white">Đăng ký Game Jam</h3>
                <p className="text-[11px] text-slate-500">{jam.title}</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Mode selector */}
              {(jam.participationType === "both" || jam.participationType === "solo" || jam.participationType === "team") && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">Hình thức tham gia</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(jam.participationType !== "team" ? ["solo"] : []).concat(jam.participationType !== "solo" ? ["team"] : []).length === 0
                      ? ["solo", "team"].map(m => (
                        <button key={m} onClick={() => setMode(m as any)}
                          className={`py-3 rounded-xl border text-xs font-bold transition cursor-pointer capitalize ${mode === m ? "bg-violet-600/20 border-violet-500/60 text-violet-300" : "border-white/[0.07] text-slate-500 hover:border-white/20"}`}>
                          {m === "solo" ? "🎮 Solo" : "🛡️ Team"}
                        </button>
                      ))
                      : ["solo", "team"].map(m => {
                        const allowed = jam.participationType === "both" || jam.participationType === m;
                        return (
                          <button key={m} disabled={!allowed} onClick={() => allowed && setMode(m as any)}
                            className={`py-3 rounded-xl border text-xs font-bold transition cursor-pointer capitalize ${mode === m ? "bg-violet-600/20 border-violet-500/60 text-violet-300" : allowed ? "border-white/[0.07] text-slate-500 hover:border-white/20 hover:text-slate-300" : "border-white/[0.04] text-slate-700 cursor-not-allowed"}`}>
                            {m === "solo" ? "🎮 Solo" : "🛡️ Team"}
                          </button>
                        );
                      })
                    }
                  </div>
                </div>
              )}

              {mode === "team" && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Tên team <span className="text-rose-400">*</span></label>
                    <input value={teamName} onChange={e => setTeamName(e.target.value)}
                      placeholder="e.g. Pixel Warriors"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Mời thành viên</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                        placeholder="Tìm theo tên hoặc role..."
                        className="w-full rounded-xl border border-white/[0.08] bg-[#111118] pl-9 pr-4 py-2.5 text-sm text-white focus:border-violet-500/60 focus:outline-none" />
                    </div>
                    {memberSearch && (
                      <div className="mt-1.5 rounded-xl border border-white/[0.07] bg-[#111118] overflow-hidden divide-y divide-white/[0.04]">
                        {filteredUsers.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-slate-500">Không tìm thấy user</p>
                        ) : filteredUsers.map(u => (
                          <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03]">
                            <img src={u.avatarUrl} alt={u.displayName} className="h-8 w-8 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">{u.displayName}</p>
                              <p className="text-[10px] text-slate-500 truncate">{u.jobTitle as string}</p>
                            </div>
                            <button onClick={() => { setInvitedMembers(prev => [...prev, u]); setMemberSearch(""); }}
                              className="text-xs text-violet-400 hover:text-violet-300 font-bold cursor-pointer">Mời</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {invitedMembers.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {invitedMembers.map(u => (
                          <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-950/20 border border-violet-800/30">
                            <img src={u.avatarUrl} alt={u.displayName} className="h-6 w-6 rounded-full" />
                            <span className="flex-1 text-xs text-slate-300">{u.displayName}</span>
                            <span className="text-[10px] text-amber-400 font-mono">Pending</span>
                            <button onClick={() => setInvitedMembers(prev => prev.filter(m => m.id !== u.id))} className="text-slate-600 hover:text-rose-400 cursor-pointer">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Email liên lạc</label>
                  <input value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-3 py-2 text-sm text-white focus:border-violet-500/60 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-1.5">Discord</label>
                  <input value={contactDiscord} onChange={e => setContactDiscord(e.target.value)}
                    placeholder="username#0000"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#111118] px-3 py-2 text-sm text-white focus:border-violet-500/60 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mb-2">Hình thức tham dự</label>
                <div className="flex gap-2">
                  {(["online", "offline", "both"] as const).map(m => (
                    <button key={m} onClick={() => setAttendanceMode(m)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold transition cursor-pointer capitalize ${attendanceMode === m ? "bg-cyan-950/40 border-cyan-600/50 text-cyan-300" : "border-white/[0.07] text-slate-500 hover:border-white/20"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-xs text-slate-400 hover:text-white transition cursor-pointer">Hủy</button>
              <button
                onClick={handleRegister}
                disabled={saving || (mode === "team" && !teamName.trim())}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Đang xử lý..." : "Xác nhận đăng ký"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// GAME JAM DETAIL PAGE
// ============================================================================
interface JamDetailProps {
  jam: GameJam;
  currentUser: User | null;
  allUsers: User[];
  onBack: () => void;
  onRegister: (jam: GameJam) => void;
  isRegistered: boolean;
}

function JamDetail({ jam, currentUser, allUsers, onBack, onRegister, isRegistered }: JamDetailProps) {
  const [activeTab, setActiveTab] = useState<"brief" | "participants" | "voting" | "leaderboard" | "rules">("brief");
  const [registrations, setRegistrations] = useState<JamRegistration[]>([]);
  const [teams, setTeams] = useState<JamTeam[]>([]);
  const [votes, setVotes] = useState<JamVote[]>([]);
  const [countdown, setCountdown] = useState("");
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const isOwner = currentUser?.id === jam.organizerId;
  const statusMeta = getJamStatusMeta(jam.status);

  useEffect(() => {
    const target = jam.status === "open" ? jam.endDate : jam.status === "voting" ? jam.votingEndAt : jam.startDate;
    const tick = () => setCountdown(formatCountdown(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [jam.status, jam.endDate, jam.votingEndAt, jam.startDate]);

  useEffect(() => {
    const q = query(collection(db, "jam_registrations"), where("jamId", "==", jam.id));
    const unsub = onSnapshot(q, snap => setRegistrations(snap.docs.map(d => d.data() as JamRegistration)));
    return () => unsub();
  }, [jam.id]);

  useEffect(() => {
    const q = query(collection(db, "jam_teams"), where("jamId", "==", jam.id));
    const unsub = onSnapshot(q, snap => setTeams(snap.docs.map(d => ({ ...d.data(), id: d.id } as JamTeam))));
    return () => unsub();
  }, [jam.id]);

  useEffect(() => {
    const q = query(collection(db, "jam_votes"), where("jamId", "==", jam.id));
    const unsub = onSnapshot(q, snap => setVotes(snap.docs.map(d => d.data() as JamVote)));
    return () => unsub();
  }, [jam.id]);

  const myVote = votes.find(v => v.voterId === currentUser?.id);

  const handleVote = async (targetId: string, targetType: "solo" | "team") => {
    if (!currentUser || myVote || votingFor) return;
    setVotingFor(targetId);
    try {
      await addDoc(collection(db, "jam_votes"), {
        jamId: jam.id, voterId: currentUser.id,
        targetId, targetType, createdAt: new Date().toISOString()
      });
      await awardPoints(currentUser.id, 5, "jam_vote", jam.id, `Voted trong Game Jam "${jam.title}"`);
    } catch (e) {
      console.error("Vote error:", e);
    } finally {
      setVotingFor(null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const rows = registrations.map(r => {
        const team = r.teamId ? teams.find(t => t.id === r.teamId) : null;
        return {
          "Tên": r.userName,
          "Vai trò": r.userJobTitle,
          "Loại": r.type === "solo" ? "Solo" : `Team: ${team?.teamName ?? r.teamId}`,
          "Email": r.contactInfo?.email ?? "",
          "Discord": r.contactInfo?.discord ?? "",
          "Tham dự": r.attendanceMode,
          "Ngày đăng ký": new Date(r.registeredAt).toLocaleDateString("vi-VN"),
          "Votes": r.voteCount ?? 0,
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Participants");
      XLSX.writeFile(wb, `${jam.title.replace(/\s+/g, "_")}_participants.xlsx`);
    } finally {
      setExportLoading(false);
    }
  };

  const sortedByVotes = [...registrations].sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0));

  return (
    <div className="space-y-0">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer mb-4">
        <ChevronLeft className="h-3.5 w-3.5" /> Quay lại
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#111118] mb-6">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-gradient-to-br from-violet-950 to-indigo-950">
          {jam.bannerUrl ? (
            <img src={jam.bannerUrl} alt={jam.title} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="h-20 w-20 text-violet-500/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/50 to-transparent" />
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-widest border mb-2 ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${jam.status === "open" ? "bg-emerald-400 animate-pulse" : "bg-current opacity-70"}`} />
                {statusMeta.label}
              </span>
              <h1 className="text-xl font-black text-white">{jam.title}</h1>
              <p className="text-sm text-slate-400 mt-1">by {jam.studioName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOwner && (
                <button onClick={handleExport} disabled={exportLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-700/40 bg-emerald-950/30 text-emerald-400 text-xs font-bold hover:bg-emerald-950/50 transition cursor-pointer disabled:opacity-50">
                  <Download className="h-3.5 w-3.5" />
                  {exportLoading ? "..." : "Export Excel"}
                </button>
              )}
              {!isOwner && !isRegistered && jam.status === "open" && (
                <button onClick={() => onRegister(jam)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition cursor-pointer">
                  Đăng ký ngay
                </button>
              )}
              {isRegistered && (
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/30 border border-emerald-700/40 text-emerald-400 text-xs font-bold">
                  <Check className="h-3.5 w-3.5" /> Đã đăng ký
                </span>
              )}
            </div>
          </div>

          {/* Countdown */}
          {(jam.status === "open" || jam.status === "voting") && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-300 font-mono">
              <Clock className="h-4 w-4 text-violet-400" />
              <span className="text-slate-500">{jam.status === "voting" ? "Voting kết thúc sau:" : "Jam kết thúc sau:"}</span>
              <span className="text-violet-300 font-bold tracking-widest">{countdown}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-cyan-400" />{registrations.filter(r => r.type === "solo").length} solo</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-indigo-400" />{teams.length} team</span>
            <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-amber-400" />{jam.prizes.length} hạng thưởng</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-500" />{new Date(jam.startDate).toLocaleDateString("vi-VN")} – {new Date(jam.endDate).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/[0.06] mb-5 overflow-x-auto">
        {(["brief", "participants", jam.status === "voting" || jam.status === "finished" ? "voting" : null, jam.status === "finished" ? "leaderboard" : null, "rules"] as const).filter(Boolean).map(tab => (
          <button
            key={tab!}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition border-b-2 cursor-pointer capitalize ${
              activeTab === tab ? "border-violet-500 text-violet-300" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {{ brief: "Giới thiệu", participants: "Người tham gia", voting: "Bình chọn", leaderboard: "Bảng xếp hạng", rules: "Luật" }[tab!]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "brief" && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#111118]">
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{jam.description || jam.shortDescription}</p>
          </div>
          {/* Prizes */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-widest mb-3">Giải thưởng</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {jam.prizes.map((prize, i) => (
                <div key={i} className="p-4 rounded-xl border bg-[#111118] text-center" style={{ borderColor: prize.badgeColor + "33" }}>
                  <div className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-black" style={{ background: prize.badgeColor + "22", color: prize.badgeColor }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅"}
                  </div>
                  <p className="text-xs font-bold text-white">{prize.label}</p>
                  <p className="text-[11px] text-violet-300 font-mono mt-1">+{prize.points} pts</p>
                  {prize.description && <p className="text-[10px] text-slate-500 mt-1">{prize.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "participants" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">{registrations.length} người tham gia · {teams.length} team</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {registrations.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-[#111118]">
                <img src={r.userAvatar} alt={r.userName} className="h-9 w-9 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{r.userName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{r.userJobTitle}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border ${
                  r.type === "solo" ? "bg-cyan-950/40 border-cyan-800/40 text-cyan-400" : "bg-violet-950/40 border-violet-800/40 text-violet-400"
                }`}>{r.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "voting" && (
        <div className="space-y-4">
          {myVote && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 text-xs">
              <Check className="h-3.5 w-3.5" /> Bạn đã bình chọn rồi!
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {registrations.map(r => {
              const isOwn = r.userId === currentUser?.id;
              const isVoted = myVote?.targetId === r.id;
              const voteCount = votes.filter(v => v.targetId === r.id).length;
              return (
                <div key={r.id} className={`p-4 rounded-xl border bg-[#111118] space-y-3 ${isVoted ? "border-violet-500/50" : "border-white/[0.07]"}`}>
                  <div className="flex items-center gap-2">
                    <img src={r.userAvatar} alt={r.userName} className="h-9 w-9 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{r.userName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{r.type === "team" ? teams.find(t => t.id === r.teamId)?.teamName : "Solo"}</p>
                    </div>
                  </div>
                  {jam.status === "finished" && (
                    <p className="text-xs text-violet-300 font-mono">{voteCount} votes</p>
                  )}
                  {isOwn ? (
                    <span className="block text-center text-[10px] text-slate-600 font-mono py-1.5 border border-white/[0.04] rounded-lg">Your Submission</span>
                  ) : isVoted ? (
                    <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-violet-300 py-1.5 rounded-lg bg-violet-950/30 border border-violet-700/40">
                      <Check className="h-3.5 w-3.5" /> Voted
                    </span>
                  ) : (
                    <button
                      disabled={!!myVote || votingFor === r.id}
                      onClick={() => handleVote(r.id, r.type)}
                      className="w-full py-1.5 rounded-lg bg-violet-600/20 border border-violet-600/40 text-violet-300 text-xs font-bold hover:bg-violet-600/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {votingFor === r.id ? "..." : "Vote"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="space-y-2">
          {sortedByVotes.map((r, i) => (
            <div key={r.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${i === 0 ? "border-amber-600/40 bg-amber-950/20" : i === 1 ? "border-slate-500/40 bg-slate-900/30" : i === 2 ? "border-orange-700/40 bg-orange-950/20" : "border-white/[0.05] bg-[#111118]"}`}>
              <span className={`text-sm font-black w-6 text-center ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-slate-600"}`}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <img src={r.userAvatar} alt={r.userName} className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{r.userName}</p>
                <p className="text-[10px] text-slate-500">{r.userJobTitle}</p>
              </div>
              <span className="text-xs font-bold text-violet-300 font-mono">{(r.voteCount ?? 0)} votes</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "rules" && (
        <div className="p-5 rounded-2xl border border-white/[0.07] bg-[#111118]">
          {jam.customRules.length > 0 ? (
            <ul className="space-y-2">
              {jam.customRules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-violet-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                  {rule}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Không có luật đặc biệt.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN GameJamTab COMPONENT
// ============================================================================
interface GameJamTabProps {
  studio: GameStudio;
  currentUser: User | null;
  allUsers: User[];
}

export default function GameJamTab({ studio, currentUser, allUsers }: GameJamTabProps) {
  const [jams, setJams] = useState<GameJam[]>([]);
  const [registrations, setRegistrations] = useState<JamRegistration[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJam, setEditingJam] = useState<GameJam | null>(null);
  const [selectedJam, setSelectedJam] = useState<GameJam | null>(null);
  const [registeringJam, setRegisteringJam] = useState<GameJam | null>(null);
  const [filterStatus, setFilterStatus] = useState<JamStatus | "all">("all");
  const isOwner = currentUser?.id === studio.ownerId;

  useEffect(() => {
    const q = query(collection(db, "game_jams"), where("studioId", "==", studio.id));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as GameJam));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJams(list);
    });
    return () => unsub();
  }, [studio.id]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "jam_registrations"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(q, snap => setRegistrations(snap.docs.map(d => d.data() as JamRegistration)));
    return () => unsub();
  }, [currentUser]);

  const handleDeleteJam = async (jamId: string) => {
    if (!confirm("Xóa Game Jam này vĩnh viễn?")) return;
    await updateDoc(doc(db, "game_jams", jamId), { status: "draft" });
  };

  const isRegistered = (jamId: string) => registrations.some(r => r.jamId === jamId);

  const filteredJams = filterStatus === "all" ? jams : jams.filter(j => j.status === filterStatus);

  if (selectedJam) {
    return (
      <JamDetail
        jam={selectedJam}
        currentUser={currentUser}
        allUsers={allUsers}
        onBack={() => setSelectedJam(null)}
        onRegister={(jam) => { setSelectedJam(null); setRegisteringJam(jam); }}
        isRegistered={isRegistered(selectedJam.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-violet-400" />
            Game Jams
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Tổ chức và tham gia các cuộc thi phát triển game</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex bg-[#111118] border border-white/[0.07] rounded-xl p-0.5 gap-0.5">
            {(["all", "open", "voting", "finished"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer capitalize ${filterStatus === s ? "bg-violet-600/30 text-violet-300 border border-violet-600/40" : "text-slate-500 hover:text-slate-300"}`}>
                {s === "all" ? "Tất cả" : s}
              </button>
            ))}
          </div>
          {isOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-violet-950/40 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Tạo Game Jam
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {filteredJams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/[0.07] bg-[#111118]/50 gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-violet-950/40 border border-violet-800/30 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-violet-500/50" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-300">{isOwner ? "Chưa có Game Jam nào" : "Chưa có Game Jam nào từ studio này"}</p>
            <p className="text-xs text-slate-500 mt-1">{isOwner ? "Tạo Game Jam đầu tiên để cộng đồng tham gia!" : "Hãy theo dõi studio để được thông báo khi có Game Jam mới."}</p>
          </div>
          {isOwner && (
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600/20 border border-violet-600/40 text-violet-300 text-xs font-bold hover:bg-violet-600/30 transition cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Tạo Game Jam đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Jam grid */}
      {filteredJams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJams.map(jam => (
            <div key={jam.id}>
            <JamCard
              jam={jam}
              isOwner={isOwner && jam.organizerId === currentUser?.id}
              isRegistered={isRegistered(jam.id)}
              onView={setSelectedJam}
              onEdit={(j) => { setEditingJam(j); setShowCreateModal(true); }}
              onDelete={handleDeleteJam}
              onRegister={setRegisteringJam}
            />
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && currentUser && (
        <CreateJamModal
          studio={studio}
          currentUser={currentUser}
          existingJam={editingJam}
          onClose={() => { setShowCreateModal(false); setEditingJam(null); }}
          onSaved={() => {}}
        />
      )}

      {registeringJam && currentUser && (
        <RegisterModal
          jam={registeringJam}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setRegisteringJam(null)}
          onRegistered={() => {}}
        />
      )}
    </div>
  );
}
