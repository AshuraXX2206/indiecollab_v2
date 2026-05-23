import React, { useState, useEffect } from "react";
import { User, JobType, MyWork, UserConnection, StudioJoinRequest, GameStudio, Education, Certificate, UserPoint, JamBadge, Project, ProjectApplication } from "../types";
import GameStudios from "./GameStudios";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Sparkles, Loader2, Save, Plus, Trash, ExternalLink, ShieldCheck, Mail, Cpu, PlusCircle, Check, FileUp, Facebook, Instagram, Users, UserCheck, UserMinus, X, CheckCircle2, Trophy, Zap, Star, Award } from "lucide-react";

interface ProfileViewProps {
  currentUser: User | null;
  users: User[];
  onUpdateProfile: (u: Partial<User>) => void;
  portfolioItems: MyWork[];
  onAddPortfolio: (item: Omit<MyWork, "id" | "userId">) => void;
  onDeletePortfolio: (id: string) => void;
  connections: UserConnection[];
  onSendConnectionRequest: (toUserId: string, message?: string) => void;
  onRespondConnection: (connectionId: string, response: "accepted" | "declined") => void;
  onCancelConnection: (connectionId: string) => void;
  studioJoinRequests: StudioJoinRequest[];
  onRespondStudioJoin: (requestId: string, response: "accepted" | "declined") => void;
  pendingConnectionCount: number;
  pendingStudioJoinCount: number;
  studios: GameStudio[];
  onCreateStudio: (studioPayload: Omit<GameStudio, "id" | "ownerId" | "ownerName" | "createdAt">) => void;
  onUpdateStudio: (studioId: string, updatedPayload: Partial<GameStudio>) => void;
  onDeleteStudio: (studioId: string) => void;
  onRequestJoinStudio: (studioId: string, message?: string) => void;
  projects: Project[];
  projectApplications: ProjectApplication[];
  onRespondProjectApplication: (applicationId: string, response: "approved" | "rejected") => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const PORTFOLIO_CATEGORIES = [
  { value: "game_demo", label: "Game Demo / Dự án thực tế" },
  { value: "art", label: "Tác phẩm Nghệ thuật / Art" },
  { value: "certificate", label: "Chứng chỉ chuyên môn" },
  { value: "degree", label: "Bằng cấp / Học vị" },
  { value: "audio", label: "Âm thanh / Nhạc nền" },
  { value: "video", label: "Gameplay Video / Trailer" },
] as const;

const compressAndGetBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; // Limit size for lightweight local storage
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const POPULAR_SKILLS = [
  "C++ Assembly", "C# Scripting", "3D Low-Poly", "Pixel Art", "Orchestral Score", "Fluid Simulation",
  "FMOD Integration", "Retro PBR shaders", "Level Design", "Combat Balancer", "Narrative Branching"
];

const POPULAR_TOOLS = [
  "Unity", "Godot", "Unreal Engine", "Blender", "Aseprite", "REAPER", "FMOD Studio", "Spine 2D", "Git", "C++", "C#"
];

const PRESETS_AVATARS = [
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
];

const PRESET_PORTFOLIOS = [
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&auto=format&fit=crop&q=80"
];

export default function ProfileView({
  currentUser,
  users = [],
  onUpdateProfile,
  portfolioItems,
  onAddPortfolio,
  onDeletePortfolio,
  connections = [],
  onRespondConnection,
  onCancelConnection,
  studioJoinRequests,
  onRespondStudioJoin,
  pendingConnectionCount,
  pendingStudioJoinCount,
  studios,
  onCreateStudio,
  onUpdateStudio,
  onDeleteStudio,
  onRequestJoinStudio,
  projects = [],
  projectApplications = [],
  onRespondProjectApplication,
  showToast
}: ProfileViewProps) {
  // If user doesn't exist, we run onboarding mode. Otherwise edit mode.
  const [isEditing, setIsEditing] = useState(!currentUser);
  const [profileTab, setProfileTab] = useState<"details" | "portfolio" | "studios" | "connections" | "achievements">("details");
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || PRESETS_AVATARS[0]);
  const [jobTitle, setJobTitle] = useState<JobType>(currentUser?.jobTitle || JobType.GameplayProgrammer);
  
  // CV/Resume fields (optional - for credibility)
  const [location, setLocation] = useState(currentUser?.location || "");
  const [languages, setLanguages] = useState<string[]>(currentUser?.languages || []);
  const [experienceYears, setExperienceYears] = useState(currentUser?.experienceYears || 0);
  const [education, setEducation] = useState<Education[]>(currentUser?.education || []);
  const [certificates, setCertificates] = useState<Certificate[]>(currentUser?.certificates || []);
  const [showCVSection, setShowCVSection] = useState(false);
  const [skills, setSkills] = useState<string[]>(currentUser?.skills || ["C# Scripting", "Level Design"]);
  const [tools, setTools] = useState<string[]>(currentUser?.tools || ["Unity", "Godot"]);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [howToReachMe, setHowToReachMe] = useState(currentUser?.howToReachMe || "");
  const [openToWork, setOpenToWork] = useState(currentUser?.openToWork ?? true);
  const [facebookUrl, setFacebookUrl] = useState(currentUser?.facebookUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(currentUser?.instagramUrl || "");

  // AI bio help state
  const [isImprovingBio, setIsImprovingBio] = useState(false);
  const [bioHelpError, setBioHelpError] = useState<string | null>(null);

  // Portfolio addition state
  const [newPortTitle, setNewPortTitle] = useState("");
  const [newPortUrl, setNewPortUrl] = useState(PRESET_PORTFOLIOS[0]);
  const [newPortType, setNewPortType] = useState<"image" | "audio" | "video" | "link">("image");
  const [newPortCategory, setNewPortCategory] = useState<(typeof PORTFOLIO_CATEGORIES)[number]["value"]>("game_demo");
  const [newPortDesc, setNewPortDesc] = useState("");
  const [showAddPort, setShowAddPort] = useState(false);
  const [isUploadingPort, setIsUploadingPort] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Points & Badges state
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointBreakdown, setPointBreakdown] = useState<Record<string, number>>({});
  const [jamBadges, setJamBadges] = useState<JamBadge[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pinnedBadges, setPinnedBadges] = useState<string[]>([]);

  // Secure Auditing States
  const [showSecurityConsole, setShowSecurityConsole] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [simStatus, setSimStatus] = useState<"idle" | "testing" | "success" | "blocked">("idle");
  const adminUserIds = ["user-1"];
  const isSecurityAdmin = !!currentUser && adminUserIds.includes(currentUser.id);

  const triggerToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    if (showToast) {
      showToast(msg, type);
    } else {
      alert(msg);
    }
  };

  const handleCloseAddPort = () => {
    setNewPortTitle("");
    setNewPortDesc("");
    setNewPortUrl(PRESET_PORTFOLIOS[0]);
    setNewPortType("image");
    setShowAddPort(false);
  };

  const processFileUpload = async (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");
    const isGif = file.type === "image/gif";

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_MEDIA_SIZE = 1.5 * 1024 * 1024; // 1.5MB

    if (isImage && !isGif) {
      if (file.size > MAX_IMAGE_SIZE) {
        triggerToast("Ảnh tĩnh tải lên không được vượt quá 5MB để tránh quá tải bộ nhớ.", "error");
        return;
      }
    } else {
      if (file.size > MAX_MEDIA_SIZE) {
        triggerToast("Ảnh GIF, Video hoặc Audio không được vượt quá 1.5MB để tránh sự cố crash trình duyệt di động.", "error");
        return;
      }
    }

    setIsUploadingPort(true);
    try {
      let base64 = "";
      if (isImage && !isGif) {
        base64 = await compressAndGetBase64(file);
      } else {
        base64 = await getRawBase64(file);
      }

      setNewPortUrl(base64);
      if (isVideo) {
        setNewPortType("video");
      } else if (isAudio) {
        setNewPortType("audio");
      } else {
        setNewPortType("image");
      }
    } catch (err) {
      triggerToast("Không thể giải mã file tuyển chọn.", "error");
    } finally {
      setIsUploadingPort(false);
    }
  };

  const getRawBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
    });
  };

  const getSocialLabel = (url: string, prefix: "FB" | "IG") => {
    if (!url) return "";
    try {
      if (!url.includes("/") && !url.includes(".")) {
        return `${prefix}: ${url.startsWith("@") ? url : "@" + url}`;
      }
      const clean = url.replace(/(^\w+:|^)\/\//, '').replace("www.", "");
      const parts = clean.split("/");
      const handle = parts[parts.length - 1] || parts[parts.length - 2] || url;
      return `${prefix}: @${handle}`;
    } catch (err) {
      return `${prefix}: Custom`;
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    setPointsLoading(true);
    const load = async () => {
      try {
        // Load user_points ledger
        const pSnap = await getDocs(query(collection(db, "user_points"), where("userId", "==", currentUser.id)));
        const pts = pSnap.docs.map(d => d.data() as UserPoint);
        const total = pts.reduce((s, p) => s + p.amount, 0);
        setTotalPoints(total);
        // Breakdown by category
        const breakdown: Record<string, number> = {};
        pts.forEach(p => {
          const cat = p.source.startsWith("jam") ? "jams" :
                      p.source === "new_connection" ? "connections" :
                      p.source === "create_project" ? "projects" : "other";
          breakdown[cat] = (breakdown[cat] || 0) + p.amount;
        });
        setPointBreakdown(breakdown);
        // Load jam badges from jam_registrations with rank
        const regSnap = await getDocs(query(collection(db, "jam_registrations"), where("userId", "==", currentUser.id)));
        const badges: JamBadge[] = regSnap.docs
          .map(d => d.data())
          .filter(r => r.rank && r.rank <= 3)
          .map(r => ({
            id: `${r.jamId}_rank_${r.rank}`,
            name: `#${r.rank} Place`,
            description: `Top ${r.rank} in a Game Jam`,
            icon: r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : "🥉",
            color: r.rank === 1 ? "#F59E0B" : r.rank === 2 ? "#94A3B8" : "#B45309",
            earnedAt: r.registeredAt,
            jamId: r.jamId,
            jamTitle: r.title || "Game Jam",
            badgeType: `rank_${r.rank}`,
            placement: r.rank as 1 | 2 | 3,
          }));
        setJamBadges(badges);
      } catch (e) {
        console.warn("Points/badges load error:", e);
      } finally {
        setPointsLoading(false);
      }
    };
    load();
  }, [currentUser?.id]);

  React.useEffect(() => {
    if (currentUser) {
      if (isSecurityAdmin) loadAuditTrail();
      setDisplayName(currentUser.displayName || "");
      setAvatarUrl(currentUser.avatarUrl || PRESETS_AVATARS[0]);
      setJobTitle(currentUser.jobTitle as JobType || JobType.GameplayProgrammer);
      setSkills(currentUser.skills || []);
      setTools(currentUser.tools || []);
      setBio(currentUser.bio || "");
      setHowToReachMe(currentUser.howToReachMe || "");
      setOpenToWork(currentUser.openToWork ?? true);
      setFacebookUrl(currentUser.facebookUrl || "");
      setInstagramUrl(currentUser.instagramUrl || "");
      // Load CV fields
      setLocation(currentUser.location || "");
      setLanguages(currentUser.languages || []);
      setExperienceYears(currentUser.experienceYears || 0);
      setEducation(currentUser.education || []);
      setCertificates(currentUser.certificates || []);
    }
  }, [currentUser, isSecurityAdmin]);

  const loadAuditTrail = async () => {
    setIsRefreshingLogs(true);
    try {
      // Build auth headers — audit trail now requires authentication
      const headers: Record<string, string> = {};
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
        } catch (e) { /* token unavailable */ }
      }

      const res = await fetch("/api/security/audit-trail", { headers });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Failed fetching audit trail:", err);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const simulateIntrusionThreat = async () => {
    setSimStatus("testing");
    setSimMessage("Testing a request without a valid Firebase token...");
    
    setTimeout(async () => {
      try {
        // Mock a spoofed update to project-1 to test backend ownership checks
        const payload = {
          title: "🚨 HACKED TRANG CHỦ!",
          pitch: "Attempting privilege bypass",
          description: "Malicious insertion attempt"
        };
        const res = await fetch("/api/projects/project-1", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (res.status === 403 || res.status === 401 || res.status === 410) {
          const errData = await res.json();
          setSimStatus("blocked");
          setSimMessage(`🛡️ BỊ CHẶN BỞI BACKEND! Mã lỗi: ${res.status}. Nội dung: "${errData.error}"`);
          loadAuditTrail(); // Auto-reload to immediately display server audit event log
        } else {
          setSimStatus("success");
          setSimMessage("⚠️ Cảnh báo: Spoofing thành công. Lỗi logic bảo mật phía máy chủ.");
        }
      } catch (e: any) {
        setSimStatus("blocked");
        setSimMessage("🛡️ Tường lửa hệ thống đã tự động chặn kết nối!");
      }
    }, 1200);
  };

  const handleToggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleToggleTool = (tool: string) => {
    if (tools.includes(tool)) {
      setTools(tools.filter(t => t !== tool));
    } else {
      setTools([...tools, tool]);
    }
  };

  const handleAIBioGeneration = async () => {
    if (skills.length === 0 || tools.length === 0) {
      triggerToast("Hãy chọn ít nhất một vài kỹ năng và công cụ để AI có dữ liệu viết Bio!", "error");
      return;
    }
    setIsImprovingBio(true);
    setBioHelpError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
        } catch (e) { /* fallback */ }
      }

      const res = await fetch("/api/ai/generate-bio", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobTitle: jobTitle,
          skills,
          tools
        })
      });
      const data = await res.json();
      if (data.success) {
        setBio(data.bio);
      } else {
        setBioHelpError(data.error || "Có lỗi từ server AI.");
      }
    } catch (e) {
      setBioHelpError("Không thể kết nối API AI.");
    } finally {
      setIsImprovingBio(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !howToReachMe) {
      triggerToast("Vui lòng điền Tên hiển thị và Cách liên lạc nhé!", "error");
      return;
    }
    onUpdateProfile({
      displayName,
      avatarUrl,
      jobTitle,
      skills,
      tools,
      bio,
      howToReachMe,
      openToWork,
      facebookUrl,
      instagramUrl,
      // CV fields (optional but increase credibility)
      location,
      languages,
      experienceYears,
      education,
      certificates
    });
    setIsEditing(false);
  };

  const handleAddPortItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortTitle || !newPortUrl) {
      triggerToast("Hãy cung cấp tiêu đề và đường dẫn ảnh demo.", "error");
      return;
    }
    onAddPortfolio({
      title: newPortTitle,
      mediaUrl: newPortUrl,
      mediaType: newPortType,
      category: newPortCategory,
      description: newPortDesc
    });
    setNewPortTitle("");
    setNewPortDesc("");
    setNewPortUrl(PRESET_PORTFOLIOS[0]);
    setNewPortType("image");
    setNewPortCategory("game_demo");
    setShowAddPort(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {currentUser && (
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-800 pb-3">
          {[
            { id: "details", label: "Thông tin cá nhân" },
            { id: "portfolio", label: "Hồ sơ năng lực & Art" },
            { id: "studios", label: "Game Studios" },
            { id: "connections", label: "Đồng đội & Yêu cầu" },
            { id: "achievements", label: isSecurityAdmin ? "Thành tích & Bảo mật" : "Thành tích" },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProfileTab(tab.id as typeof profileTab)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                profileTab === tab.id
                  ? "border-indigo-500/40 bg-indigo-600/15 text-indigo-200"
                  : "border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {(!currentUser || profileTab === "details") && (
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="absolute top-0 right-0 h-44 w-44 bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        {currentUser && !isEditing ? (
          // RENDER GUILD CARD SHEETS SCREEN
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center gap-5 sm:flex-row text-center sm:text-left">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-xl"
              />
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-extrabold text-white">{currentUser.displayName}</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider font-mono ${
                    currentUser.openToWork 
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                      : "bg-slate-800/80 text-slate-400 border border-slate-700/60"
                  }`}>
                    {currentUser.openToWork ? "🔥 Đang rảnh Jam" : "💤 Đã có team"}
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-indigo-400 mt-1">
                  Vai trò: {currentUser.jobTitle}
                </div>
                <p className="mt-2.5 text-sm max-w-xl italic leading-relaxed text-slate-300">
                  "{currentUser.bio || "Chưa cập nhật tiểu sử. Bạn có thể tự viết hoặc nhờ AI gợi ý trong phần Sửa Hồ Sơ nhé!"}"
                </p>
                
                {/* Contacts details */}
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-3.5 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-xl">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-slate-350">Liên lạc:</span> {currentUser.howToReachMe}
                  </span>

                  {currentUser.facebookUrl && (
                    <a 
                      href={currentUser.facebookUrl.startsWith("http") ? currentUser.facebookUrl : `https://facebook.com/${currentUser.facebookUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/30 hover:border-blue-500/50 px-2.5 py-1 rounded-xl text-blue-300 transition"
                    >
                      <Facebook className="h-3.5 w-3.5" />
                      <span>{getSocialLabel(currentUser.facebookUrl, "FB")}</span>
                    </a>
                  )}

                  {currentUser.instagramUrl && (
                    <a 
                      href={currentUser.instagramUrl.startsWith("http") ? currentUser.instagramUrl : `https://instagram.com/${currentUser.instagramUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-pink-950/20 hover:bg-pink-950/40 border border-pink-900/30 hover:border-pink-500/50 px-2.5 py-1 rounded-xl text-pink-305 transition"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      <span>{getSocialLabel(currentUser.instagramUrl, "IG")}</span>
                    </a>
                  )}
                </div>
                
                {/* Points & pinned badges — quick display in header */}
                {(totalPoints > 0 || jamBadges.length > 0) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {totalPoints > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-950/50 border border-violet-700/40 px-2.5 py-1 text-[11px] font-bold text-violet-300">
                        <Zap className="h-3 w-3" />
                        {totalPoints.toLocaleString()} pts
                      </span>
                    )}
                    {jamBadges.filter(b => pinnedBadges.includes(b.id)).map(badge => (
                      <span
                        key={badge.id}
                        title={`${badge.name} — ${badge.jamTitle}`}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold border"
                        style={{ background: `${badge.color}15`, borderColor: `${badge.color}44`, color: badge.color }}
                      >
                        {badge.icon} {badge.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* CV/Resume Section Toggle */}
                {(currentUser.education?.length || currentUser.certificates?.length || currentUser.location || currentUser.experienceYears) ? (
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <button
                      onClick={() => setShowCVSection(!showCVSection)}
                      className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 transition"
                    >
                      <span>{showCVSection ? "▼" : "▶"}</span>
                      <span>CV / Professional Background</span>
                      {currentUser.credibilityScore && (
                        <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px]">
                          Credibility: {currentUser.credibilityScore}/100
                        </span>
                      )}
                    </button>
                    
                    {showCVSection && (
                      <div className="mt-3 space-y-3 text-xs">
                        {/* Location & Experience */}
                        <div className="flex flex-wrap gap-3">
                          {currentUser.location && (
                            <span className="flex items-center gap-1 text-slate-400">
                              📍 {currentUser.location}
                            </span>
                          )}
                          {currentUser.experienceYears ? (
                            <span className="flex items-center gap-1 text-slate-400">
                              💼 {currentUser.experienceYears}+ years experience
                            </span>
                          ) : null}
                          {currentUser.languages?.length ? (
                            <span className="flex items-center gap-1 text-slate-400">
                              🌐 {currentUser.languages.join(", ")}
                            </span>
                          ) : null}
                        </div>
                        
                        {/* Education */}
                        {currentUser.education?.length ? (
                          <div>
                            <h4 className="font-bold text-slate-300 mb-1">🎓 Education</h4>
                            <div className="space-y-1.5">
                              {currentUser.education.map((edu) => (
                                <div key={edu.id} className="bg-slate-900/50 p-2 rounded-lg">
                                  <div className="font-medium text-slate-200">{edu.degree} in {edu.fieldOfStudy}</div>
                                  <div className="text-slate-500">{edu.institution} • {edu.startYear}-{edu.current ? "Present" : edu.endYear}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        
                        {/* Certificates */}
                        {currentUser.certificates?.length ? (
                          <div>
                            <h4 className="font-bold text-slate-300 mb-1">🏆 Certificates</h4>
                            <div className="flex flex-wrap gap-2">
                              {currentUser.certificates.map((cert) => (
                                <a
                                  key={cert.id}
                                  href={cert.credentialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-indigo-950/30 border border-indigo-500/20 px-2 py-1 rounded-lg text-indigo-300 hover:bg-indigo-900/40 transition"
                                >
                                  {cert.name}
                                  <span className="text-slate-500 ml-1">@{cert.issuer}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[10px] text-slate-500 hover:text-indigo-400 transition flex items-center gap-1"
                    >
                      <span>💡 Tip:</span>
                      <span>Add education & certificates to increase your credibility score</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="relative z-20 pointer-events-auto mt-4 md:mt-0 self-center md:self-auto flex items-center gap-2">
              {isSecurityAdmin && <button
                type="button"
                onClick={() => setShowSecurityConsole(prev => !prev)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setShowSecurityConsole(prev => !prev);
                }}
                className={`relative z-35 cursor-pointer pointer-events-auto p-2.5 rounded-xl border border-slate-800 transition ${
                  showSecurityConsole 
                    ? "bg-indigo-950/40 text-indigo-400 border-indigo-500/35" 
                    : "bg-slate-900 text-slate-500 hover:text-indigo-400"
                }`}
                title="Quản trị Bảo Mật & Kiểm Toán Giao Dịch"
              >
                <ShieldCheck className="h-[18px] w-[18px]" />
              </button>}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setIsEditing(true);
                }}
                className="relative z-35 cursor-pointer pointer-events-auto rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition duration-200 active:scale-95"
              >
                Sửa Thẻ năng lực cá nhân
              </button>
            </div>
          </div>
        ) : (
          // FORM FOR PROFILE EDIT / ONBOARDING
          <div className="relative z-10">
            <h1 className="text-xl font-black text-white tracking-tight">
              {currentUser ? "Cập Nhật Thẻ Năng Lực Cá Nhân" : "Khởi Tạo Thẻ Năng Lực Cá Nhân (Onboarding)"}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Hãy đặt các chỉ số kỹ năng, chọn game class để đồng đội phù hợp dễ dàng tìm kiếm thấy bạn rộng rãi trên hệ thống!
            </p>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Tên hiển thị / Nickname</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="e.g. Ashura"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Phương thức liên hệ (Discord/Email)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discord: @AshuraXX"
                    value={howToReachMe}
                    onChange={(e) => setHowToReachMe(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Đường dẫn Facebook (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://facebook.com/username hoặc username"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Đường dẫn Instagram / Portfolio Link (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://instagram.com/username hoặc username"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  Chọn Avatar Nhân Vật <span className="text-[10px] text-indigo-400 font-normal normal-case">(Xử lý nén tại chỗ từ PC)</span>
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {PRESETS_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative h-14 w-14 rounded-xl overflow-hidden border-2 transition ${
                        avatarUrl === url ? "border-indigo-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt="preset avi" className="h-full w-full object-cover" />
                      {avatarUrl === url && (
                        <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}

                  {/* PC Avatar upload container */}
                  <label className="relative h-14 w-32 cursor-pointer flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/40 hover:border-indigo-500 hover:bg-slate-900 transition duration-200">
                    {avatarUploading ? (
                      <Loader2 className="h-4 w-4 text-indigo-450 animate-spin" />
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 text-indigo-400 mb-0.5" />
                        <span className="text-[9.5px] font-extrabold text-indigo-300 font-mono">Tải Lên từ PC</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
                          if (file.size > MAX_IMAGE_SIZE) {
                            triggerToast("Ảnh đại diện tải lên không được vượt quá 5MB.", "error");
                            return;
                          }
                          setAvatarUploading(true);
                          try {
                            const b64 = await compressAndGetBase64(file);
                            setAvatarUrl(b64);
                          } catch (err) {
                            triggerToast("Không thể đọc và tải avatar.", "error");
                          } finally {
                            setAvatarUploading(false);
                          }
                        }
                      }}
                    />
                  </label>

                  {/* Live Render selected Avatar if Base 64 custom uploaded */}
                  {avatarUrl.startsWith("data:") && (
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-indigo-500 scale-105">
                      <img src={avatarUrl} alt="custom uploaded" className="h-full w-full object-cover" />
                      <div className="absolute top-0 right-0 rounded-bl bg-indigo-600 px-1 py-0.5 text-[8px] font-bold text-white uppercase font-mono">
                        PC
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Bạn làm gì trong game dev? (Vai trò chính)</label>
                  <select
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value as JobType)}
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                  >
                    <optgroup label="💻 Programming & Engineering">
                      <option value="Gameplay Programmer">Gameplay Programmer</option>
                      <option value="Engine Programmer">Engine Programmer</option>
                      <option value="AI Programmer">AI Programmer</option>
                      <option value="Network/Multiplayer Programmer">Network/Multiplayer Programmer</option>
                      <option value="Graphics Programmer">Graphics Programmer</option>
                      <option value="Tools Programmer">Tools Programmer</option>
                      <option value="UI Programmer">UI Programmer</option>
                      <option value="Technical Director">Technical Director</option>
                    </optgroup>
                    <optgroup label="🎨 Art & Visual Design">
                      <option value="Concept Artist">Concept Artist</option>
                      <option value="2D Character Artist">2D Character Artist</option>
                      <option value="3D Character Artist">3D Character Artist</option>
                      <option value="2D Environment Artist">2D Environment Artist</option>
                      <option value="3D Environment Artist">3D Environment Artist</option>
                      <option value="Pixel Artist">Pixel Artist</option>
                      <option value="VFX Artist">VFX Artist</option>
                      <option value="Technical Artist">Technical Artist</option>
                      <option value="2D Animator">2D Animator</option>
                      <option value="3D Animator">3D Animator</option>
                      <option value="Rigger">Rigger</option>
                      <option value="UI/UX Artist">UI/UX Artist</option>
                      <option value="Art Director">Art Director</option>
                    </optgroup>
                    <optgroup label="🔊 Audio">
                      <option value="Sound Designer">Sound Designer</option>
                      <option value="Music Composer">Music Composer</option>
                      <option value="Audio Programmer">Audio Programmer</option>
                      <option value="Voice Director">Voice Director</option>
                      <option value="Foley Artist">Foley Artist</option>
                      <option value="Audio Director">Audio Director</option>
                    </optgroup>
                    <optgroup label="🎮 Design">
                      <option value="Game Designer">Game Designer</option>
                      <option value="Level Designer">Level Designer</option>
                      <option value="Systems Designer">Systems Designer</option>
                      <option value="Combat Designer">Combat Designer</option>
                      <option value="Economy Designer">Economy Designer</option>
                      <option value="Narrative Designer">Narrative Designer</option>
                      <option value="UX Designer">UX Designer</option>
                      <option value="Creative Director">Creative Director</option>
                    </optgroup>
                    <optgroup label="📖 Writing & Narrative">
                      <option value="Narrative Writer">Narrative Writer</option>
                      <option value="Quest Writer">Quest Writer</option>
                      <option value="World Builder">World Builder</option>
                      <option value="Dialogue Writer">Dialogue Writer</option>
                      <option value="Lore/Backstory Writer">Lore/Backstory Writer</option>
                    </optgroup>
                    <optgroup label="📊 Production & Management">
                      <option value="Producer">Producer</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Scrum Master">Scrum Master</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Live Ops Manager">Live Ops Manager</option>
                    </optgroup>
                    <optgroup label="🐛 QA & Testing">
                      <option value="QA Tester">QA Tester</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="QA Automation Engineer">QA Automation Engineer</option>
                      <option value="Playtester">Playtester</option>
                    </optgroup>
                    <optgroup label="📣 Marketing & Community">
                      <option value="Community Manager">Community Manager</option>
                      <option value="Social Media Manager">Social Media Manager</option>
                      <option value="Marketing Manager">Marketing Manager</option>
                      <option value="Content Creator">Content Creator</option>
                      <option value="Influencer/Streamer">Influencer/Streamer</option>
                    </optgroup>
                    <optgroup label="🚀 Specialized & Emerging">
                      <option value="Shader Artist">Shader Artist</option>
                      <option value="VR/AR Developer">VR/AR Developer</option>
                      <option value="AI Game Developer">AI Game Developer</option>
                      <option value="Procedural Content Developer">Procedural Content Developer</option>
                      <option value="Blockchain Game Developer">Blockchain Game Developer</option>
                      <option value="Localization Specialist">Localization Specialist</option>
                      <option value="Accessibility Designer">Accessibility Designer</option>
                      <option value="Esports Designer">Esports Designer</option>
                      <option value="Game Economist">Game Economist</option>
                      <option value="Data Analyst">Data Analyst</option>
                      <option value="Monetization Designer">Monetization Designer</option>
                    </optgroup>
                    <optgroup label="💡 Indie & Freelance">
                      <option value="Solo Developer (Generalist)">Solo Developer (Generalist)</option>
                      <option value="Indie Developer">Indie Developer</option>
                      <option value="Freelance Artist">Freelance Artist</option>
                      <option value="Freelance Programmer">Freelance Programmer</option>
                      <option value="Modder">Modder</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Trạng thái rảnh</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenToWork(true)}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition ${
                        openToWork 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40" 
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      }`}
                    >
                      🔥 Tìm đồng đội / Jamming
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenToWork(false)}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition ${
                        !openToWork 
                          ? "bg-slate-800 text-slate-300 border-slate-700" 
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      }`}
                    >
                      💤 Đang bận dự án riêng
                    </button>
                  </div>
                </div>
              </div>

              {/* CV/Resume Section - Optional but recommended */}
              <div className="border border-slate-800/50 rounded-xl p-4 bg-slate-900/30">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
                    📋 CV / Professional Background
                    <span className="text-[10px] font-normal text-emerald-400 normal-case">(Optional - Increases credibility)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCVSection(!showCVSection)}
                    className="text-xs text-slate-500 hover:text-indigo-400 transition"
                  >
                    {showCVSection ? "Hide ▲" : "Show ▼"}
                  </button>
                </div>
                
                {showCVSection && (
                  <div className="space-y-4">
                    {/* Location & Experience */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Ho Chi Minh City, VN"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Years Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          placeholder="e.g. 5"
                          value={experienceYears || ""}
                          onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Languages</label>
                        <input
                          type="text"
                          placeholder="e.g. English, Vietnamese"
                          value={languages.join(", ")}
                          onChange={(e) => setLanguages(e.target.value.split(",").map(l => l.trim()).filter(Boolean))}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Education List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Education</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newEdu: Education = {
                              id: "edu-" + Date.now(),
                              institution: "",
                              degree: "",
                              fieldOfStudy: "",
                              startYear: new Date().getFullYear().toString(),
                              current: false
                            };
                            setEducation([...education, newEdu]);
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Education
                        </button>
                      </div>
                      <div className="space-y-2">
                        {education.map((edu, idx) => (
                          <div key={edu.id} className="grid grid-cols-1 gap-2 sm:grid-cols-4 items-end bg-slate-950/50 p-2 rounded-lg">
                            <input
                              placeholder="Institution"
                              value={edu.institution}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[idx].institution = e.target.value;
                                setEducation(updated);
                              }}
                              className="rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                            />
                            <input
                              placeholder="Degree (e.g. Bachelor's)"
                              value={edu.degree}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[idx].degree = e.target.value;
                                setEducation(updated);
                              }}
                              className="rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                            />
                            <input
                              placeholder="Field of Study"
                              value={edu.fieldOfStudy}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[idx].fieldOfStudy = e.target.value;
                                setEducation(updated);
                              }}
                              className="rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                            />
                            <div className="flex gap-2">
                              <input
                                placeholder="Year"
                                value={edu.startYear}
                                onChange={(e) => {
                                  const updated = [...education];
                                  updated[idx].startYear = e.target.value;
                                  setEducation(updated);
                                }}
                                className="w-20 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                                className="p-1.5 text-red-400 hover:bg-red-950/30 rounded"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certificates List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Certificates</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newCert: Certificate = {
                              id: "cert-" + Date.now(),
                              name: "",
                              issuer: "",
                              issueDate: new Date().toISOString().split("T")[0]
                            };
                            setCertificates([...certificates, newCert]);
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Certificate
                        </button>
                      </div>
                      <div className="space-y-2">
                        {certificates.map((cert, idx) => (
                          <div key={cert.id} className="grid grid-cols-1 gap-2 sm:grid-cols-4 items-end bg-slate-950/50 p-2 rounded-lg">
                            <input
                              placeholder="Certificate Name"
                              value={cert.name}
                              onChange={(e) => {
                                const updated = [...certificates];
                                updated[idx].name = e.target.value;
                                setCertificates(updated);
                              }}
                              className="rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                            />
                            <input
                              placeholder="Issuer (e.g. Unity, Google)"
                              value={cert.issuer}
                              onChange={(e) => {
                                const updated = [...certificates];
                                updated[idx].issuer = e.target.value;
                                setCertificates(updated);
                              }}
                              className="rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                            />
                            <input
                              type="date"
                              value={cert.issueDate}
                              onChange={(e) => {
                                const updated = [...certificates];
                                updated[idx].issueDate = e.target.value;
                                setCertificates(updated);
                              }}
                              className="rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                            />
                            <div className="flex gap-2">
                              <input
                                placeholder="Credential URL (optional)"
                                value={cert.credentialUrl || ""}
                                onChange={(e) => {
                                  const updated = [...certificates];
                                  updated[idx].credentialUrl = e.target.value || undefined;
                                  setCertificates(updated);
                                }}
                                className="flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={() => setCertificates(certificates.filter((_, i) => i !== idx))}
                                className="p-1.5 text-red-400 hover:bg-red-950/30 rounded"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills Multi selection tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Chuyên Môn Kỹ Thuật (Skills)</label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {POPULAR_SKILLS.map((skill) => {
                    const selected = skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium font-mono transition ${
                          selected 
                            ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm" 
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        {selected ? "✓ " : "+ "} {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tools Multi selection tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Công Cụ / Engines Ưa Thích (Tools)</label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {POPULAR_TOOLS.map((tool) => {
                    const selected = tools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => handleToggleTool(tool)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium font-mono transition ${
                          selected 
                            ? "bg-pink-600/20 text-pink-300 border-pink-500/50 shadow-sm" 
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        {selected ? "✓ " : "+ "} {tool}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Bio Generation optimization tools */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Tiểu Sử Nhân Vật (Bio)
                  </label>
                  <button
                    type="button"
                    onClick={handleAIBioGeneration}
                    disabled={isImprovingBio}
                    className="flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                  >
                    {isImprovingBio ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        AI đang viết...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Tự Động Viết Bio Bằng AI
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Chia sẻ ngắn gọn về bản thân hoặc dùng tính năng 'Gợi Ý Bio Bằng AI' để tạo nhanh mô tả dựa trên kỹ năng của bạn nhé!"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                />
                {bioHelpError && (
                  <p className="mt-1 text-xs text-red-400">{bioHelpError}</p>
                )}
              </div>

              {/* Save onboarding */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setIsEditing(false);
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
                  >
                    Hủy bỏ
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:bg-indigo-500 transition active:scale-95"
                >
                  <Save className="h-4 w-4" />
                  {currentUser ? "Lưu Cấu Hình" : "Hoàn Tất Onboarding"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      )}

      {/* PORTFOLIO SHOWCASE GALLERY GRID */}
      {currentUser && profileTab === "portfolio" && (
        <section className="mt-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-black text-white">Hồ Sơ Năng Lực & Dự Án Demo</h2>
              <p className="text-xs text-slate-400 mt-1">Nơi phô diễn những gameplay screenshot, concept art chất lượng nhất của bạn.</p>
            </div>
            <button
              onClick={() => setShowAddPort(!showAddPort)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowAddPort(!showAddPort);
              }}
              className="flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs font-bold text-indigo-400 hover:bg-slate-800 transition"
            >
              <PlusCircle className="h-4 w-4" /> Trưng bày tác phẩm
            </button>
          </div>

          {/* Form to append new piece */}
          {showAddPort && (
            <form onSubmit={handleAddPortItemSubmit} className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono">Tên Tác Phẩm / Screenshot</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Pixel Cyberpunk Bar Design"
                    value={newPortTitle}
                    onChange={(e) => setNewPortTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono">Hoặc chọn nhanh mẫu sẵn (Presets)</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {PRESET_PORTFOLIOS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewPortUrl(url)}
                        className={`h-10 w-16 rounded overflow-hidden border-2 transition ${
                          newPortUrl === url ? "border-indigo-500 scale-105" : "border-slate-800 opacity-60"
                        }`}
                      >
                        <img src={url} alt="presets visual" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload from PC section with Drag-and-Drop capability */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono mb-1.5 flex items-center justify-between">
                  <span>Tải Tác Phẩm Lên Từ Máy Tính Cá Nhân</span>
                  {newPortUrl.startsWith("data:") && (
                    <span className="text-[10px] text-emerald-400 font-normal normal-case">✓ Đã nạp file từ máy tính ({newPortType})</span>
                  )}
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      await processFileUpload(file);
                    }
                  }}
                  className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/80 p-5 text-center hover:border-indigo-500 hover:bg-slate-900 transition cursor-pointer"
                >
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await processFileUpload(file);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    {isUploadingPort ? (
                      <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                    ) : newPortUrl.startsWith("data:") ? (
                      <div className="relative">
                        {newPortType === "video" ? (
                          <div className="h-14 w-24 bg-slate-950 flex items-center justify-center rounded-md border border-indigo-500/50 text-[10px] text-indigo-300 font-mono">
                            ▶ Video Clip
                          </div>
                        ) : newPortType === "audio" ? (
                          <div className="h-14 w-24 bg-slate-950 flex items-center justify-center rounded-md border border-indigo-500/50 text-[10px] text-pink-300 font-mono">
                            🎵 Audio Track
                          </div>
                        ) : (
                          <img src={newPortUrl} className="h-14 w-24 object-cover rounded-md border border-indigo-500/50" />
                        )}
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-indigo-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">✓</span>
                      </div>
                    ) : (
                      <FileUp className="h-5 w-5 text-slate-500" />
                    )}
                    <span className="text-[11px] text-slate-350 font-semibold">Kéo & thả file tác phẩm vào đây hoặc click để duyệt từ PC</span>
                    <span className="text-[9.5px] text-slate-500">Hỗ trợ Ảnh tĩnh, ảnh động GIF, Video ngắn, Nhạc nén. Tối ưu thông minh!</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono">Chú thích ngắn gọn (Description)</label>
                <input
                  type="text"
                  placeholder="e.g. Environment spritesheet made in Aseprite with dark retro palette."
                  value={newPortDesc}
                  onChange={(e) => setNewPortDesc(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-700 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase font-mono">Phân loại năng lực</label>
                <select
                  value={newPortCategory}
                  onChange={(e) => setNewPortCategory(e.target.value as typeof newPortCategory)}
                  className="mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {PORTFOLIO_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddPort}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleCloseAddPort();
                  }}
                  className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPort}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  Thêm vào Hồ Sơ Năng Lực
                </button>
              </div>
            </form>
          )}

           {/* Renders gallery pieces */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {portfolioItems.filter(p => p.userId === currentUser.id).length === 0 ? (
              <div className="sm:col-span-2 md:col-span-3 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                Bạn chưa trưng tuyển tác phẩm nào. Hãy nhấn nút phía trên để bắt đầu tải lên!
              </div>
            ) : (
              portfolioItems.filter(p => p.userId === currentUser.id).map((item) => {
                const isDuplicate = portfolioItems.some(
                  p => p.id !== item.id && p.userId !== item.userId && p.mediaUrl === item.mediaUrl
                );
                return (
                  <div key={item.id} className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 p-2.5 transition duration-300 hover:border-slate-700 relative">
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-black flex items-center justify-center">
                      <div className="absolute left-2 top-2 z-10 rounded-full border border-indigo-400/30 bg-slate-950/80 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-indigo-200 shadow">
                        {PORTFOLIO_CATEGORIES.find(category => category.value === item.category)?.label || "Game Demo / Dự án thực tế"}
                      </div>
                      {isDuplicate && (
                        <div className="absolute top-2 left-2 rounded bg-gradient-to-r from-red-650 to-amber-605 border border-red-500/30 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow-lg animate-pulse z-10 font-mono">
                          ⚠️ Trùng lặp / Copied Asset
                        </div>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => onDeletePortfolio(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-950/70 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 transition duration-200 z-10 opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                        title="Xóa tác phẩm"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>

                      {item.mediaType === "video" || item.mediaUrl.startsWith("data:video/") ? (
                        <video 
                          src={item.mediaUrl} 
                          controls 
                          autoPlay 
                          muted 
                          loop 
                          playsInline
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover" 
                        />
                      ) : item.mediaType === "audio" || item.mediaUrl.startsWith("data:audio/") ? (
                        <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-3">
                          <audio src={item.mediaUrl} controls className="w-full" style={{ maxHeight: "36px" }} />
                          <span className="text-[9px] text-indigo-400 font-mono mt-1.5 uppercase tracking-tight">🎵 Audio Soundrack</span>
                        </div>
                      ) : (
                        <img 
                          src={item.mediaUrl} 
                          alt={item.title} 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105" 
                        />
                      )}
                    </div>
                    <div className="mt-2.5 px-1.5">
                      <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{item.title}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {currentUser && profileTab === "studios" && (
        <GameStudios
          users={users}
          studios={studios}
          currentUser={currentUser}
          onCreateStudio={onCreateStudio}
          onUpdateStudio={onUpdateStudio}
          onDeleteStudio={onDeleteStudio}
          onRequestJoinStudio={onRequestJoinStudio}
        />
      )}

      {/* Teammate Network & Requests Section */}
      {currentUser && profileTab === "connections" && (
        <section className="mt-10 border-t border-slate-800 pt-10">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Mạng Lưới Đồng Đội & Lời Mời</h2>
              <p className="text-xs text-slate-400 mt-1">Kết nối với các nhà làm game khác để cùng hợp tác xây dựng dự án.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main column for Teammates list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                Đồng đội của bạn ({
                  (connections || []).filter(c => c.status === "accepted" && (c.fromUserId === currentUser.id || c.toUserId === currentUser.id)).length
                })
              </h3>
              
              {(() => {
                const activeConns = (connections || []).filter(
                  c => c.status === "accepted" && (c.fromUserId === currentUser.id || c.toUserId === currentUser.id)
                );
                
                if (activeConns.length === 0) {
                  return (
                    <div className="rounded-2xl border border-dashed border-slate-850 bg-slate-950/20 p-8 text-center text-slate-500 text-xs font-mono">
                      Bạn chưa có kết nối đồng đội nào. Hãy sang thẻ "Tìm Đồng Đội" để kết nối nhé!
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeConns.map((conn) => {
                      const isFromMe = conn.fromUserId === currentUser.id;
                      const otherUserId = isFromMe ? conn.toUserId : conn.fromUserId;
                      const otherUser = (users || []).find(u => u.id === otherUserId);
                      
                      const name = otherUser?.displayName || (isFromMe ? conn.toUserName : conn.fromUserName) || "Nhà làm game";
                      const avatar = otherUser?.avatarUrl || (isFromMe ? conn.toUserAvatar : conn.fromUserAvatar) || PRESETS_AVATARS[0];
                      const jobTitle = otherUser?.jobTitle || "Thành viên";
                      const contact = otherUser?.howToReachMe || "Chưa cập nhật";
                      const fb = otherUser?.facebookUrl;
                      const ig = otherUser?.instagramUrl;

                      return (
                        <div key={conn.id} className="group relative overflow-hidden rounded-2xl border border-slate-850 bg-slate-950/40 p-4 transition hover:border-slate-800 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <img
                                src={avatar}
                                alt={name}
                                className="h-11 w-11 rounded-xl object-cover ring-2 ring-indigo-500/10"
                              />
                              <div>
                                <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{name}</h4>
                                <span className="inline-block mt-0.5 text-[9.5px] font-mono text-indigo-400 bg-indigo-950/20 border border-indigo-900/35 px-1.5 py-0.5 rounded">
                                  {jobTitle}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3.5 space-y-1.5 text-[10.5px] font-mono text-slate-400 border-t border-slate-900/60 pt-3">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3 text-slate-500" />
                                <span className="text-slate-500">Liên hệ:</span>
                                <span className="text-slate-300 line-clamp-1">{contact}</span>
                              </div>
                              
                              {(fb || ig) && (
                                <div className="flex gap-2.5 pt-1">
                                  {fb && (
                                    <a 
                                      href={fb.startsWith("http") ? fb : `https://facebook.com/${fb}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                                    >
                                      <Facebook className="h-3 w-3" />
                                      <span>FB</span>
                                    </a>
                                  )}
                                  {ig && (
                                    <a 
                                      href={ig.startsWith("http") ? ig : `https://instagram.com/${ig}`}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition"
                                    >
                                      <Instagram className="h-3 w-3" />
                                      <span>IG</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-900/50 flex justify-end">
                            <button
                              onClick={() => onCancelConnection(conn.id)}
                              className="text-[9.5px] bg-red-950/20 hover:bg-red-900/35 border border-red-900/30 text-red-400 px-2.5 py-1 rounded font-bold cursor-pointer transition hover:text-white"
                            >
                              Hủy kết nối
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Right column for incoming & outgoing requests */}
            <div className="space-y-6">
              {/* Incoming Requests */}
              <div className="space-y-3">
                {(() => {
                  const incomingReqs = (connections || []).filter(
                    c => c.toUserId === currentUser.id && c.status === "pending"
                  );
                  
                  return (
                    <>
                      <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                        Lời mời nhận được ({incomingReqs.length})
                      </h3>

                      {incomingReqs.length === 0 ? (
                        <div className="rounded-2xl border border-slate-850 bg-slate-950/10 p-4 text-center text-slate-500 text-[10.5px] font-mono">
                          Không có lời mời chờ duyệt.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {incomingReqs.map((req) => {
                            const otherUser = (users || []).find(u => u.id === req.fromUserId);
                            const name = otherUser?.displayName || req.fromUserName || "Nhà làm game";
                            const avatar = otherUser?.avatarUrl || req.fromUserAvatar || PRESETS_AVATARS[0];
                            const jobTitle = otherUser?.jobTitle || "Thành viên";

                            return (
                              <div key={req.id} className="rounded-2xl border border-slate-850 bg-slate-950/40 p-4 space-y-3.5">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={avatar}
                                    alt={name}
                                    className="h-10 w-10 rounded-xl object-cover"
                                  />
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{name}</h4>
                                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/20 px-1 py-0.5 rounded">
                                      {jobTitle}
                                    </span>
                                  </div>
                                </div>
                                
                                {req.message && (
                                  <p className="text-[11px] text-slate-355 bg-slate-950/60 border border-slate-900 rounded-lg p-2 italic leading-normal text-slate-300">
                                    "{req.message}"
                                  </p>
                                )}

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => onRespondConnection(req.id, "accepted")}
                                    className="flex-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded cursor-pointer transition text-center"
                                  >
                                    Chấp nhận
                                  </button>
                                  <button
                                    onClick={() => onRespondConnection(req.id, "declined")}
                                    className="flex-1 text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white py-1.5 rounded cursor-pointer transition text-center"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Outgoing Requests */}
              <div className="space-y-3">
                {(() => {
                  const outgoingReqs = (connections || []).filter(
                    c => c.fromUserId === currentUser.id && c.status === "pending"
                  );
                  
                  return (
                    <>
                      <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                        Yêu cầu đã gửi ({outgoingReqs.length})
                      </h3>

                      {outgoingReqs.length === 0 ? (
                        <div className="rounded-2xl border border-slate-850 bg-slate-950/10 p-4 text-center text-slate-500 text-[10.5px] font-mono">
                          Không có yêu cầu đang chờ.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {outgoingReqs.map((req) => {
                            const otherUser = (users || []).find(u => u.id === req.toUserId);
                            const name = otherUser?.displayName || req.toUserName || "Nhà làm game";
                            const avatar = otherUser?.avatarUrl || req.toUserAvatar || PRESETS_AVATARS[0];
                            const jobTitle = otherUser?.jobTitle || "Thành viên";

                            return (
                              <div key={req.id} className="rounded-2xl border border-slate-850 bg-slate-950/20 p-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={avatar}
                                    alt={name}
                                    className="h-8.5 w-8.5 rounded-lg object-cover flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-205 truncate text-slate-200">{name}</h4>
                                    <p className="text-[9px] font-mono text-slate-500 truncate">{jobTitle}</p>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => onCancelConnection(req.id)}
                                  className="text-[9.5px] bg-red-950/20 hover:bg-red-900/35 border border-red-900/30 text-red-400 hover:text-white px-2 py-1 rounded font-bold cursor-pointer transition flex-shrink-0"
                                >
                                  Hủy yêu cầu
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Project Applications */}
              <div className="space-y-3">
                {(() => {
                  const ownedProjectIds = new Set((projects || []).filter(project => project.ownerId === currentUser.id).map(project => project.id));
                  const pendingApplications = (projectApplications || []).filter(
                    application => ownedProjectIds.has(application.projectId) && application.status === "pending"
                  );

                  return (
                    <>
                      <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                        Đơn ứng tuyển dự án ({pendingApplications.length})
                      </h3>
                      {pendingApplications.length === 0 ? (
                        <div className="rounded-2xl border border-slate-850 bg-slate-950/10 p-4 text-center text-slate-500 text-[10.5px] font-mono">
                          Chưa có đơn ứng tuyển workspace nào chờ duyệt.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingApplications.map((application) => (
                            <div key={application.id} className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <img src={application.userAvatar} alt={application.userName} className="h-10 w-10 rounded-xl object-cover" />
                                <div>
                                  <h4 className="text-xs font-bold text-slate-200">{application.userName}</h4>
                                  <p className="text-[9.5px] font-mono text-indigo-300">{application.roleApplied} - {application.projectTitle}</p>
                                </div>
                              </div>
                              {application.message && (
                                <p className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-300">{application.message}</p>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => onRespondProjectApplication(application.id, "approved")} className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-500">
                                  Chấp nhận
                                </button>
                                <button onClick={() => onRespondProjectApplication(application.id, "rejected")} className="flex-1 rounded-lg border border-slate-800 bg-slate-900 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white">
                                  Từ chối
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* POINTS & BADGES SECTION */}
      {currentUser && profileTab === "achievements" && (
        <section className="mt-10 border-t border-slate-800 pt-10">
          <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Điểm cống hiến & Huy hiệu</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Reputation trên IndieCollab</p>
            </div>
          </div>

          {isSecurityAdmin && <button
            type="button"
            onClick={() => setShowSecurityConsole(prev => !prev)}
            className={`mb-6 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
              showSecurityConsole
                ? "border-indigo-500/40 bg-indigo-600/15 text-indigo-200"
                : "border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-300"
            }`}
          >
            Console bảo mật
          </button>}

          {pointsLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Points widget */}
              <div className="lg:col-span-1 rounded-2xl border border-white/[0.07] bg-[#111118] p-5 flex flex-col gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Total Points</p>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-cyan-400 tabular-nums">
                    {totalPoints.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">pts</p>
                </div>
                {/* Breakdown */}
                <div className="space-y-2 pt-3 border-t border-white/[0.05]">
                  <p className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest">Nguồn tích lũy</p>
                  {[
                    { key: "jams",        label: "Game Jams",   icon: <Trophy className="h-3 w-3" />,  color: "text-violet-400" },
                    { key: "connections", label: "Connections",  icon: <Users className="h-3 w-3" />,  color: "text-cyan-400"   },
                    { key: "projects",    label: "Projects",     icon: <Zap className="h-3 w-3" />,    color: "text-emerald-400" },
                    { key: "other",       label: "Khác",         icon: <Star className="h-3 w-3" />,   color: "text-amber-400"  },
                  ].map(({ key, label, icon, color }) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className={`flex items-center gap-1.5 ${color}`}>{icon}{label}</span>
                      <span className="font-mono text-slate-300">{(pointBreakdown[key] || 0).toLocaleString()} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges grid */}
              <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-[#111118] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-widest">Badges đã đạt được</p>
                  {pinnedBadges.length > 0 && (
                    <span className="text-[10px] text-violet-400 font-mono">{pinnedBadges.length} pinned</span>
                  )}
                </div>
                {jamBadges.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                    <div className="h-12 w-12 rounded-xl bg-violet-950/30 border border-violet-800/20 flex items-center justify-center">
                      <Award className="h-6 w-6 text-violet-600/50" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400">Chưa có badge nào</p>
                      <p className="text-xs text-slate-600 mt-0.5">Tham gia Game Jam và đạt top 3 để nhận badge!</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {jamBadges.map(badge => {
                      const isPinned = pinnedBadges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          title={`${badge.name} — ${badge.jamTitle}`}
                          className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                            isPinned
                              ? "border-violet-500/50 bg-violet-950/30 shadow-md shadow-violet-950/30"
                              : "border-white/[0.07] bg-[#0A0A0F] hover:border-white/20"
                          }`}
                          onClick={() =>
                            setPinnedBadges(prev =>
                              prev.includes(badge.id)
                                ? prev.filter(id => id !== badge.id)
                                : prev.length < 3 ? [...prev, badge.id] : prev
                            )
                          }
                        >
                          {/* Shield shape badge */}
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                            style={{
                              background: `${badge.color}18`,
                              border: `1px solid ${badge.color}44`,
                              boxShadow: isPinned ? `0 0 12px ${badge.color}33` : undefined,
                            }}
                          >
                            {badge.icon}
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] font-bold text-white">{badge.name}</p>
                            <p className="text-[9px] text-slate-500 font-mono truncate max-w-[80px]">{badge.jamTitle}</p>
                          </div>
                          {isPinned && (
                            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-violet-600 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </span>
                          )}
                          {/* Tooltip */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-[#0A0A0F] border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-10">
                            <p className="font-bold">{badge.name}</p>
                            <p className="text-slate-500">{badge.jamTitle}</p>
                            <p className="text-violet-400 font-mono">{new Date(badge.earnedAt).toLocaleDateString("vi-VN")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {pinnedBadges.length > 0 && (
                  <p className="mt-3 text-[10px] text-slate-500 font-mono">
                    💡 Click badge để pin/unpin — tối đa 3 badge hiển thị nổi bật trên profile card
                  </p>
                )}
                {jamBadges.length === 0 && (
                  <p className="mt-4 text-[10px] text-slate-600 font-mono text-center">
                    Điểm và badge từ Game Jam sẽ hiển thị ở đây sau khi organizer confirm kết quả.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Real-time backend security audit trail console */}
      {currentUser && isSecurityAdmin && profileTab === "achievements" && showSecurityConsole && (
        <section className="mt-12 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/60 pb-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <ShieldCheck className="h-5.5 w-5.5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Bảng Giám Sát Bảo Mật & Nhật Ký Hệ Thống</h2>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 block">
                    HỆ THỐNG GIÁM SÁT AN TOÀN DỮ LIỆU DỰ ÁN
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={loadAuditTrail}
                disabled={isRefreshingLogs}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/25 bg-indigo-950/20 px-4 py-2 text-[11px] font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
              >
                {isRefreshingLogs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "F5 Cập Nhật Nhật Ký"}
              </button>
            </div>

            {/* Defense trackers */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
                <div className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-500">LỌC DỮ LIỆU ĐẦU VÀO (XSS)</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-400">ĐANG HOẠT ĐỘNG (Chống Injection)</span>
                </div>
                <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-slate-400">Tự động xử lý ký tự đặc biệt ở mọi đầu vào để bảo vệ dữ liệu cộng đồng.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
                <div className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-500">GIỚI HẠN TẦN SUẤT GỬI YÊU CẦU</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-indigo-400 font-mono">ĐANG BẬT (Tối đa 100 req/phút)</span>
                </div>
                <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-slate-400 font-mono">Ngăn chặn spam và giảm tải cho hệ thống khi có lưu lượng truy cập bất thường.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
                <div className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-500">XÁC THỰC QUYỀN SỞ HỮU</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span className="text-xs font-bold text-cyan-400">XÁC THỰC CHẶT CHẼ</span>
                </div>
                <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-slate-400 font-mono">Yêu cầu xác thực tài khoản chính chủ trước khi cho phép chỉnh sửa dự án.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
                <div className="font-mono text-[9px] font-black uppercase tracking-wider text-slate-500">TỐI ƯU HÓA QUOTA AI</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-bold text-purple-400">BỘ NHỚ ĐỆM TỰ ĐỘNG</span>
                </div>
                <p className="mt-1.5 font-sans text-[11px] leading-relaxed text-slate-400 font-mono">Lưu tạm dữ liệu gợi ý của Gemini để tiết kiệm tài nguyên và tăng tốc độ xử lý.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Terminal display */}
              <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-800 bg-[#0d1117] overflow-hidden shadow-lg">
                <div className="flex items-center justify-between bg-slate-900/40 px-4 py-2.5 border-b border-slate-900">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                    <span className="font-mono text-[10.5px] text-slate-400 font-bold ml-2">nhat_ky_bao_mat.log</span>
                  </div>
                  <div className="font-mono text-[9px] text-indigo-400 animate-pulse">● LUỒNG NHẬT KÝ KIỂM TRA</div>
                </div>
                <div className="p-4 font-mono text-[10.5px] text-slate-300 h-64 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                  {auditLogs.length === 0 ? (
                    <div className="text-slate-600 italic">Nhấp Cập Nhật Nhật Ký hoặc cập nhật hồ sơ để nạp thông tin nhật ký...</div>
                  ) : (
                    [...auditLogs].reverse().map((log, idx) => {
                      let logColor = "text-slate-400";
                      if (log.includes("[Status: BLOCKED]")) logColor = "text-red-400 font-bold bg-red-950/20 px-1.5 py-0.5 rounded border border-red-500/10";
                      else if (log.includes("[Status: WARN]")) logColor = "text-yellow-400 font-semibold";
                      else if (log.includes("AI_") || log.includes("_CACHE_")) logColor = "text-purple-300";
                      else if (log.includes("CREATE_") || log.includes("UPDATE_")) logColor = "text-emerald-400";

                      return (
                        <div key={idx} className={`${logColor} hover:bg-slate-900/40 py-0.5 rounded px-1 transition`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Threat simulator card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    ⚔️ Trình Giả Lập Tấn Công Trái Phép
                  </h4>
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                    Chạy thử nghiệm gửi yêu cầu cập nhật dự án khi không có Firebase token hợp lệ để kiểm tra hệ thống bảo mật phía máy chủ.
                  </p>
                  
                  {simMessage && (
                    <div className={`mt-4 rounded-xl px-3.5 py-3 text-[11px] font-semibold leading-relaxed ${
                      simStatus === "testing" 
                        ? "bg-slate-950 text-slate-400 animate-pulse border border-slate-800" 
                        : simStatus === "blocked" 
                        ? "bg-emerald-950/35 text-emerald-300 border border-emerald-500/20" 
                        : "bg-red-950/20 text-red-300 border border-red-500/25"
                    }`}>
                      {simMessage}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={simulateIntrusionThreat}
                    disabled={simStatus === "testing"}
                    className="w-full text-center rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 duration-200 disabled:opacity-50 cursor-pointer shadow-lg shadow-red-950/20"
                  >
                    {simStatus === "testing" ? "⚡ Đang chạy thử nghiệm..." : "Chạy Thử Nghiệm Tấn Công"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
    </div>
  );
}
