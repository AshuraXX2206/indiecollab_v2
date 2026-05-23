import React, { useState } from "react";
import { Project, CollabType, ProjectApplication, ProjectWorkspace } from "../types";
import {
  Gamepad2, 
  CheckCircle2, 
  MessageSquare, 
  Briefcase, 
  Cpu, 
  Award, 
  Sparkles, 
  Loader2, 
  Video, 
  ExternalLink,
  Copy,
  ClipboardList,
  DoorOpen,
  Send
} from "lucide-react";
import { playClickSound } from "../utils/audio";

interface ProjectCardProps {
  key?: string;
  project: Project;
  onAnalyzeMatch: (project: Project) => void;
  isAnalyzing: boolean;
  matchResult: { text: string; matchedUsers: string[] } | null;
  currentUser: any;
  onCreateMeet: (targetName: string) => Promise<string | null>;
  onUpdateMeetLink: (projectId: string, link: string) => Promise<void>;
  onUpdateProject: (projectId: string, updatedFields: Partial<Project>) => Promise<void>;
  projectApplications: ProjectApplication[];
  projectWorkspace?: ProjectWorkspace;
  onApplyForProject: (projectId: string, roleApplied: string, message: string) => Promise<void>;
  onOpenWorkspace: (projectId: string) => void;
}

export default function ProjectCard({ 
  project, 
  onAnalyzeMatch, 
  isAnalyzing, 
  matchResult,
  currentUser,
  onCreateMeet,
  onUpdateMeetLink,
  onUpdateProject,
  projectApplications,
  projectWorkspace,
  onApplyForProject,
  onOpenWorkspace
}: ProjectCardProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applyingRole, setApplyingRole] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");

  // Extend project interface to support meetLink
  const meetLink = (project as any).meetLink || "";

  const getEmbedVideoUrl = (url: string) => {
    if (!url) return null;
    const ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const ytMatch = url.match(ytReg);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoReg = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const vimeoMatch = url.match(vimeoReg);
    if (vimeoMatch && vimeoMatch[3]) {
      return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
    }
    return null;
  };

  const embedUrl = getEmbedVideoUrl(project.videoDemoUrl || "");

  // Helper colors for collaboration type
  const getCollabColor = (type: CollabType | string) => {
    const val = type as string;
    if (val.toLowerCase().includes("rev share") || val.toLowerCase().includes("royalty") || val.toLowerCase().includes("profit"))
      return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    if (val.toLowerCase().includes("hobby") || val.toLowerCase().includes("jam") || val.toLowerCase().includes("learning") || val.toLowerCase().includes("open source"))
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    if (val.toLowerCase().includes("paid") || val.toLowerCase().includes("contract") || val.toLowerCase().includes("hourly") || val.toLowerCase().includes("retainer") || val.toLowerCase().includes("milestone"))
      return "bg-pink-500/10 text-pink-300 border-pink-500/30";
    return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
  };

  // Helper colors for specific search roles
  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("developer") || r.includes("code")) return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
    if (r.includes("artist") || r.includes("pixel") || r.includes("modeler")) return "bg-pink-500/10 text-pink-300 border-pink-500/20";
    if (r.includes("composer") || r.includes("audio") || r.includes("sound")) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    if (r.includes("writer") || r.includes("narrative")) return "bg-violet-500/10 text-violet-300 border-violet-500/20";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  const handleCreateMeetForProject = async () => {
    setIsCreatingMeet(true);
    try {
      const link = await onCreateMeet(`Sprint: ${project.title}`);
      if (link) {
        await onUpdateMeetLink(project.id, link);
      }
    } catch (err) {
      console.error(err);
      alert("Không tạo được cuộc họp. Hãy cấp quyền Google Meet và thử lại.");
    } finally {
      setIsCreatingMeet(false);
    }
  };

  const copyMeetToClipboard = () => {
    navigator.clipboard.writeText(meetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwner = currentUser && (currentUser.id === project.ownerId);
  const canOpenWorkspace = !!currentUser && (isOwner || projectWorkspace?.memberIds.includes(currentUser.id));
  const myApplication = currentUser ? projectApplications.find((application) => application.userId === currentUser.id && application.status !== "rejected") : undefined;

  const submitApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applyingRole) return;
    await onApplyForProject(project.id, applyingRole, applicationMessage);
    setApplyingRole(null);
    setApplicationMessage("");
  };

  return (
    <article
      className="group relative overflow-hidden rounded-2xl flex flex-col transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(124,58,237,0.35)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(124,58,237,0.12), 0 4px 24px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
      }}
    >
      {/* Top ambient glow */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />

      {/* ── Card body (padding) ── */}
      <div className="p-5 flex flex-col gap-0 flex-1">

      {/* Header: owner + collab badge */}
      <header className="flex items-center justify-between gap-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={project.ownerAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${project.ownerName}`}
            alt={project.ownerName}
            className="h-8 w-8 rounded-lg object-cover shrink-0"
            style={{ boxShadow: "0 0 0 1.5px rgba(124,58,237,0.3)" }}
          />
          <div className="min-w-0 text-left">
            <div className="text-[12px] font-semibold text-slate-200 truncate">{project.ownerName}</div>
            <div className="font-mono text-[9px] font-bold tracking-wider uppercase" style={{ color: "#06B6D4" }}>Project Owner</div>
          </div>
        </div>

        <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-mono ${getCollabColor(project.collabType)}`}>
          {project.collabType ? project.collabType.split(" (")[0] : "Collab"}
        </span>
      </header>

      {/* Title + Elevator Pitch */}
      <div className="mt-4 text-left">
        <h3 className="text-[15px] font-black tracking-tight text-white group-hover:text-violet-200 transition duration-200 leading-snug">
          {project.title}
        </h3>
        <p className="mt-1.5 text-[11.5px] font-semibold" style={{ color: "#06B6D4" }}>{project.pitch}</p>
      </div>

      {/* Description */}
      <div className="mt-3 text-left">
        <p className={`text-slate-400 text-[12px] leading-relaxed ${showFullDesc ? "" : "line-clamp-2"}`}>
          {project.description}
        </p>
        {project.description && project.description.length > 120 && (
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="mt-1 text-[11px] font-semibold cursor-pointer transition hover:underline"
            style={{ color: "#7C3AED" }}
          >
            {showFullDesc ? "Thu nhỏ ↑" : "Xem thêm →"}
          </button>
        )}
      </div>

      {/* Inspiration Quote */}
      {project.inspiration && (
        <div className="mt-3 relative overflow-hidden rounded-xl px-4 py-3 text-left"
             style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="absolute top-0 left-0 bottom-0 w-0.5 rounded-full"
               style={{ background: "linear-gradient(180deg,#7C3AED,#06B6D4)" }} />
          <p className="text-[11px] italic text-slate-300 leading-relaxed pl-1">
            &ldquo;{project.inspiration}&rdquo;
          </p>
          <div className="mt-1 text-[8.5px] font-mono font-bold tracking-wider text-right uppercase" style={{ color: "#7C3AED", opacity: 0.7 }}>
            — Lời truyền cảm hứng
          </div>
        </div>
      )}

      {/* Video Demo */}
      {project.videoDemoUrl && (
        <div className="mt-3.5">
          {embedUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-850">
              <iframe
                src={embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Project Video Demo"
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-850 bg-slate-950 flex items-center justify-center">
              <video
                src={project.videoDemoUrl}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Showcase Images */}
      {project.showcaseImages && project.showcaseImages.length > 0 && (
        <div className="mt-3.5">
          <div className="grid gap-2 grid-cols-3">
            {project.showcaseImages.map((img, idx) => (
              <div key={idx} className="group/img relative overflow-hidden rounded-xl border border-slate-850 bg-slate-950 aspect-[4/3] cursor-pointer">
                <img 
                  src={img} 
                  alt={`Showcase ${idx + 1}`} 
                  className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                  onClick={() => window.open(img, "_blank")}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags: engine + hiring + budget */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] font-bold" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#06B6D4" }}>
          <Cpu className="h-3 w-3" />{project.engine}
        </span>
        {project.hiringType && (
          <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] font-bold" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399" }}>
            <Briefcase className="h-3 w-3" />
            {project.hiringType === "Teammate" ? "Đồng đội" : project.hiringType === "Freelance" ? "Freelance" : "Đồng đội & Freelance"}
          </span>
        )}
        {project.budgetDescription && (
          <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] font-bold" style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", color: "#F472B6" }}>
            <Award className="h-3 w-3" />{project.budgetDescription}
          </span>
        )}
      </div>

      {/* Roles Recruiting */}
      {project.recruitments && project.recruitments.length > 0 && (
        <div className="mt-4 pt-4 text-left" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[9.5px] font-black uppercase tracking-[0.15em] font-mono mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Tuyển dụng</p>
          <div className="flex flex-wrap gap-1.5">
            {project.recruitments.map((rec, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10.5px] font-mono font-bold ${getRoleColor(rec.role)}`}>
                <span>{rec.role}</span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] font-black px-0.5"
                      style={{ background: "rgba(255,255,255,0.1)" }}>{rec.quantity}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Google Meet */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        {meetLink ? (
          <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono flex items-center gap-1.5" style={{ color: "#34D399" }}>
                <Video className="h-3.5 w-3.5 animate-pulse" /> Phòng họp tiến độ nhóm
              </span>
              <span className="text-[9px] font-mono" style={{ color: "#34D399", opacity: 0.7 }}>Mở cho team</span>
            </div>
            <div className="flex gap-2">
              <a href={meetLink} target="_blank" rel="noopener noreferrer"
                 className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                 style={{ background: "linear-gradient(135deg,#059669,#10B981)" }}>
                Vào Phòng <ExternalLink className="h-3 w-3" />
              </a>
              <button onClick={copyMeetToClipboard}
                className="px-3 py-2 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: copied ? "#34D399" : "#94A3B8" }}>
                {copied ? "✓ Chép" : "Copy"}
              </button>
            </div>
          </div>
        ) : isOwner ? (
          <button onClick={handleCreateMeetForProject} disabled={isCreatingMeet}
            className="w-full py-2.5 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#A78BFA" }}>
            <Video className="h-3.5 w-3.5" />
            {isCreatingMeet ? "Đang kết nối Google API..." : "Tạo Google Meet Sprint Room"}
          </button>
        ) : (
          <p className="text-[10px] text-center font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Liên hệ owner để nhận link Meet</p>
        )}
      </div>

      {/* Private Workspace */}
      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={() => { if (canOpenWorkspace) { playClickSound(); onOpenWorkspace(project.id); } }}
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-[11px] font-bold font-mono transition duration-200 cursor-pointer"
          style={{ background: "rgba(6,182,212,0.10)", border: "1px solid rgba(6,182,212,0.25)", color: "#67E8F9" }}
        >
          <span className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            {canOpenWorkspace ? "Vào Không Gian Làm Việc" : "Workspace riêng tư"}
          </span>
        </button>

        {!canOpenWorkspace && (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <ClipboardList className="h-3.5 w-3.5" />
              Workspace nội bộ chỉ mở cho thành viên được duyệt.
            </div>
            {myApplication ? (
              <p className="mt-2 text-[10px] font-mono text-indigo-300">
                Đơn ứng tuyển: {myApplication.status === "pending" ? "đang chờ duyệt" : "đã được duyệt"}
              </p>
            ) : currentUser && project.status === "Recruiting" && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(project.recruitments || []).filter((rec) => rec.status === "Open").map((rec) => (
                  <button
                    key={rec.role}
                    type="button"
                    onClick={() => setApplyingRole(rec.role)}
                    className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-bold text-indigo-300 hover:text-white"
                  >
                    Ứng tuyển {rec.role}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {applyingRole && (
          <form onSubmit={submitApplication} className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3">
            <p className="text-[10px] font-bold text-indigo-200">Ứng tuyển vai trò: {applyingRole}</p>
            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              rows={3}
              placeholder="Giới thiệu ngắn về kinh nghiệm và lý do bạn muốn tham gia..."
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setApplyingRole(null)} className="rounded-lg border border-slate-800 px-3 py-1.5 text-[10px] font-bold text-slate-400">Hủy</button>
              <button className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white">
                <Send className="h-3 w-3" />
                Gửi đơn
              </button>
            </div>
          </form>
        )}

      </div>

      {/* AI Result */}
      {matchResult && (
        <div className="mt-4 rounded-xl p-3.5 text-left" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center gap-1.5 text-[11px] font-bold mb-2" style={{ color: "#A78BFA" }}>
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            AI Gemini Matchmaker
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-300 whitespace-pre-wrap">{matchResult.text}</p>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-3.5 flex items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={() => onAnalyzeMatch(project)}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
          style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#A78BFA" }}
        >
          {isAnalyzing ? <><Loader2 className="h-3 w-3 animate-spin" />Phân tích...</> : <><Sparkles className="h-3 w-3" />{matchResult ? "Tính lại" : "AI Match"}</>}
        </button>

        <a
          href={`mailto:${project.ownerId}@indiecollab.net?subject=Ứng tuyển dự án: ${project.title}`}
          className="flex items-center gap-1.5 text-[11px] font-bold transition cursor-pointer"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Liên hệ
        </a>
      </div>

      </div>{/* end .p-5 wrapper */}
    </article>
  );
}
