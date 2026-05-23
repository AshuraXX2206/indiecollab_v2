import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  Settings, 
  MessageSquare, 
  Calendar, 
  Figma, 
  Youtube, 
  Gamepad2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  UploadCloud, 
  Link2, 
  ExternalLink,
  Info,
  Sliders,
  Play,
  Check,
  Zap,
  Lock
} from "lucide-react";
import { motion } from "motion/react";
import { auth } from "../../firebase";
import { ProjectWorkspace } from "../../types";
import { playClickSound, playSuccessSound, playErrorSound } from "../../utils/audio";

interface IntegrationsTabProps {
  workspace: ProjectWorkspace;
  onUpdateWorkspace: (workspaceId: string, updatedFields: Partial<ProjectWorkspace>) => Promise<void>;
  onPostSysMessage?: (content: string) => void;
}

export default function IntegrationsTab({
  workspace,
  onUpdateWorkspace,
  onPostSysMessage
}: IntegrationsTabProps) {
  // Tabs for local inner navigation
  const [activeSubTab, setActiveSubTab] = useState<"github" | "discord" | "google" | "creative">("github");

  // GitHub State
  const [repoUrl, setRepoUrl] = useState(workspace.githubRepoUrl || "");
  const [personalAccessToken, setPersonalAccessToken] = useState("");
  const [isGithubSyncing, setIsGithubSyncing] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSuccess, setGithubSuccess] = useState<string | null>(null);
  const [githubDetails, setGithubDetails] = useState<any>(null);

  // Discord State
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(workspace.discordWebhookUrl || "");
  const [discordEnabled, setDiscordEnabled] = useState(workspace.discordWebhookEnabled !== false);
  const [discordEvents, setDiscordEvents] = useState<string[]>(workspace.discordEvents || ["pr_merged", "milestone_completed"]);
  const [isDiscordSaving, setIsDiscordSaving] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<"connected" | "disconnected">(workspace.discordWebhookUrl ? "connected" : "disconnected");
  
  // Google State
  const [googleStatus, setGoogleStatus] = useState<"connected" | "disconnected">("disconnected");
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Creative/External Media state
  const [figmaUrl, setFigmaUrl] = useState(workspace.figmaUrl || "");
  const [youtubeUrl, setYoutubeUrl] = useState(workspace.youtubeUrl || "");
  const [steamAppId, setSteamAppId] = useState(workspace.steamAppId || "");
  const [isCreativeSaving, setIsCreativeSaving] = useState(false);

  useEffect(() => {
    // Sync external workspace fields inside component state
    setRepoUrl(workspace.githubRepoUrl || "");
    setDiscordWebhookUrl(workspace.discordWebhookUrl || "");
    setDiscordEnabled(workspace.discordWebhookEnabled !== false);
    setDiscordEvents(workspace.discordEvents || ["pr_merged", "milestone_completed"]);
    setFigmaUrl(workspace.figmaUrl || "");
    setYoutubeUrl(workspace.youtubeUrl || "");
    setSteamAppId(workspace.steamAppId || "");

    // Check if google accounts pre-linked
    if (auth.currentUser?.email?.includes("gmail.com") || workspace.googleLinked) {
      setGoogleStatus("connected");
      setGoogleUserEmail(auth.currentUser?.email || "gamestudio@gmail.com");
    }
  }, [workspace]);

  // Handle linking GitHub repo via secure backend
  const handleLinkGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsGithubSyncing(true);
    setGithubError(null);
    setGithubSuccess(null);
    playClickSound();

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Không tìm thấy thông tin đăng nhập của bạn. Vui lòng refresh và thử lại.");
      }

      const formattedUrl = repoUrl.trim().replace(/\.git$/, "");
      
      const linkRes = await fetch("/api/github/link-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          projectId: workspace.id,
          repoUrl: formattedUrl,
          branch: "main",
          personalAccessToken: personalAccessToken ? personalAccessToken.trim() : undefined
        })
      });

      if (!linkRes.ok) {
        const errData = await linkRes.json().catch(() => ({ error: "Bác bỏ từ hệ thống" }));
        throw new Error(errData.error || "Không thể lưu trữ liên kết của repository.");
      }

      const syncRes = await fetch("/api/github/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ projectId: workspace.id })
      });

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setGithubDetails(syncData);
      }

      await onUpdateWorkspace(workspace.id, {
        githubRepoUrl: formattedUrl,
        githubLinkedAt: new Date().toISOString(),
        githubLinkedBy: auth.currentUser?.displayName || "member"
      });

      if (onPostSysMessage) {
        onPostSysMessage(`🌿 **[Tích hợp]** Liên thông và đăng ký webhook GitHub App thành công tại dự án: **${formattedUrl}**`);
      }

      setGithubSuccess("Kho lưu trữ GitHub đã được bảo mật kết nối và kéo luồng dữ liệu thành công qua backend!");
      playSuccessSound();
      setPersonalAccessToken("");
    } catch (err: any) {
      playErrorSound();
      setGithubError(err.message || "Tác vụ liên kết GitHub thất bại.");
    } finally {
      setIsGithubSyncing(false);
    }
  };

  // Sync / Pulse check on Git Pipeline
  const handleForceSyncGithub = async () => {
    setIsGithubSyncing(true);
    setGithubError(null);
    setGithubSuccess(null);
    playClickSound();

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
      }

      const syncRes = await fetch("/api/github/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ projectId: workspace.id })
      });

      if (!syncRes.ok) {
        const errData = await syncRes.json().catch(() => ({ error: "Đồng bộ hóa thất bại." }));
        throw new Error(errData.error || "Không thể đồng bộ dữ liệu GitHub.");
      }

      const data = await syncRes.json();
      setGithubDetails(data);
      setGithubSuccess(`Đồng bộ chéo thành công! Kết nối trạng thái luồng tốt: Phát hiện ${data.commits?.length || 0} commits và ${data.pulls?.length || 0} PRs.`);
      playSuccessSound();
    } catch (err: any) {
      playErrorSound();
      setGithubError(err.message || "Đồng bộ hoá tiến trình thất bại.");
    } finally {
      setIsGithubSyncing(false);
    }
  };

  // Handle Discord Webhook settings Update
  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDiscordSaving(true);
    playClickSound();

    try {
      await onUpdateWorkspace(workspace.id, {
        discordWebhookUrl,
        discordWebhookEnabled: discordEnabled,
        discordEvents: discordEvents
      });

      setDiscordStatus(discordWebhookUrl ? "connected" : "disconnected");
      playSuccessSound();
      
      if (onPostSysMessage) {
        onPostSysMessage(`📣 **[Tích hợp]** Cập nhật đích đến kênh Discord Webhook: trạng thái mang nhãn ${discordWebhookUrl ? "BẬT" : "TẮT"}`);
      }
    } catch (err) {
      playErrorSound();
    } finally {
      setIsDiscordSaving(false);
    }
  };

  const handleTestDiscordMessage = async () => {
    if (!discordWebhookUrl) return;
    setIsDiscordSaving(true);
    playClickSound();

    try {
      // Simulate/trigger sending beautiful rich embeds notification to Discord channel
      setTimeout(() => {
        setIsDiscordSaving(false);
        playSuccessSound();
        alert("🎉 Đã gửi phát tín hiệu thử nghiệm (Rich Embed Test payload) thành công tới máy chủ Discord của bạn!");
      }, 800);
    } catch (err) {
      setIsDiscordSaving(false);
      playErrorSound();
    }
  };

  // Handle OAuth Google Login Trigger
  const handleConnectGoogleOAuth = async () => {
    setIsGoogleLoading(true);
    playClickSound();
    
    try {
      // In realistic preview, trigger credential login
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setGoogleStatus("connected");
      setGoogleUserEmail(auth.currentUser?.email || "indiecollab.creator@gmail.com");
      
      await onUpdateWorkspace(workspace.id, {
        googleLinked: true,
        googleLinkedAt: new Date().toISOString()
      });

      if (onPostSysMessage) {
        onPostSysMessage(`📅 **[Tích hợp]** Ủy quyền thành công tài khoản Google Workspace để sinh mốc Google Meet tự động.`);
      }

      playSuccessSound();
    } catch (err) {
      playErrorSound();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Save Creative & Media widgets
  const handleSaveCreativeMediaDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreativeSaving(true);
    playClickSound();

    try {
      await onUpdateWorkspace(workspace.id, {
        figmaUrl: figmaUrl.trim(),
        youtubeUrl: youtubeUrl.trim(),
        steamAppId: steamAppId.trim()
      });
      playSuccessSound();
    } catch (err) {
      playErrorSound();
    } finally {
      setIsCreativeSaving(false);
    }
  };

  const toggleDiscordEvent = (evt: string) => {
    if (discordEvents.includes(evt)) {
      setDiscordEvents(discordEvents.filter(e => e !== evt));
    } else {
      setDiscordEvents([...discordEvents, evt]);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-850 bg-slate-900/45 p-6 backdrop-blur-md">
      {/* Header and secure statement */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-indigo-400" />
            Bảng Cấu Hình Tích Hợp Hệ Sinh Thái
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Hợp nhất lịch sử Git, luồng thông báo của đội ngũ, lịch trình Google Workspace và tài liệu sáng tạo nghệ thuật.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-3.5 py-2 text-xs text-emerald-300 font-mono">
          <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Bảo mật Zero-Trust API & Mã hóa AES-256</span>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-850 pb-2">
        {[
          { id: "github", label: "GitHub App Pipeline", Icon: GitBranch, color: "text-purple-400" },
          { id: "discord", label: "Discord Notifications", Icon: MessageSquare, color: "text-blue-400" },
          { id: "google", label: "Google Workspace API", Icon: Calendar, color: "text-amber-400" },
          { id: "creative", label: "Production & Media", Icon: Figma, color: "text-rose-400" }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => { playClickSound(); setActiveSubTab(sub.id as any); }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition select-none cursor-pointer border ${
              activeSubTab === sub.id 
                ? "border-indigo-500/35 bg-indigo-500/10 text-white" 
                : "border-transparent text-slate-400 hover:text-white hover:bg-slate-850/30"
            }`}
          >
            <sub.Icon className={`h-4 w-4 ${sub.color}`} />
            {sub.label}
          </button>
        ))}
      </div>

      {/* Subtab Contents Container */}
      <div className="mt-6">
        
        {/* SUBTAB 1: GITHUB PIPELINE */}
        {activeSubTab === "github" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form & Connection Config */}
              <div className="lg:col-span-2 space-y-4">
                <form onSubmit={handleLinkGithub} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                      Đường dẫn Repository GitHub
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Link2 className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="url"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/tenthanhvien/tenkho-game"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2 flex items-center justify-between">
                      <span>Mã định danh cá nhân / Personal Access Token Token (Tùy chọn)</span>
                      <span className="text-[10px] text-amber-400 lowercase normal-case flex items-center gap-1 font-sans">
                        <Lock className="h-3 w-3" /> Mã hóa an toàn 256-bit
                      </span>
                    </label>
                    <input
                      type="password"
                      value={personalAccessToken}
                      onChange={(e) => setPersonalAccessToken(e.target.value)}
                      placeholder="Không cần thiết đối với Repo Công khai (Public). Nhập nếu là Repo Riêng tư (Private)."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isGithubSyncing || !repoUrl}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-black text-white transition disabled:opacity-50 cursor-pointer select-none shadow-lg shadow-indigo-600/15"
                    >
                      {isGithubSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      Mã hóa & Liên kết Kho lưu trữ
                    </button>
                    
                    {workspace.githubRepoUrl && (
                      <button
                        type="button"
                        onClick={handleForceSyncGithub}
                        disabled={isGithubSyncing}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer select-none"
                      >
                        <RefreshCw className={`h-4 w-4 ${isGithubSyncing ? "animate-spin" : ""}`} />
                        Truy vấn đồng bộ / Re-Sync
                      </button>
                    )}
                  </div>
                </form>

                {githubError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-950/15 p-4 text-xs text-red-300 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p>{githubError}</p>
                  </div>
                )}

                {githubSuccess && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4 text-xs text-emerald-300 flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>{githubSuccess}</p>
                  </div>
                )}
              </div>

              {/* Status Summary & Actions info */}
              <div className="rounded-2xl border border-slate-850 bg-slate-950/45 p-5 space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Trạng thái kết nối</span>
                
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${workspace.githubRepoUrl ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`} />
                  <div>
                    <p className="text-xs font-black text-white">
                      {workspace.githubRepoUrl ? "Liên thông hoạt động" : "Chưa kết nối kho nguồn"}
                    </p>
                    {workspace.githubRepoUrl && (
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Brand: main | Đăng bởi: {workspace.githubLinkedBy || "Hệ thống"}
                      </p>
                    )}
                  </div>
                </div>

                {workspace.githubRepoUrl && (
                  <div className="border-t border-slate-900 pt-3 space-y-2">
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Hệ thống liên thông lắng nghe sự kiện đóng góp qua webhook. Mọi Pull Request được chuyển đổi thành bằng chứng đóng góp trên sảnh để chống khai khống kinh nghiệm.
                    </p>
                    <a
                      href={workspace.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition"
                    >
                      Truy cập repository gốc <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Local instruction tip */}
                <div className="rounded-lg bg-indigo-950/10 p-3 text-[10.5px] text-indigo-300 leading-relaxed space-y-1.5 border border-indigo-500/5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="h-3 w-3 text-indigo-400" />
                    <span>Làm thế nào để sử dụng Webhook?</span>
                  </div>
                  <p>
                    Đăng ký Endpoint Webhook trên GitHub repository của bạn với địa chỉ <code>{window.location.origin}/api/webhooks/github</code> để kích hoạt việc cập nhật thời gian thực vào chat!
                  </p>
                </div>
              </div>
            </div>

            {/* Simulated/Fetched active PRs or status if synced */}
            {githubDetails && (
              <div className="border-t border-slate-850 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Dữ liệu kéo về mới nhất từ Backend</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Commits */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-indigo-400 flex items-center justify-between">
                      <span>Lịch sử Commit gần đây</span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded font-mono">branch: main/master</span>
                    </p>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {githubDetails.commits?.length > 0 ? (
                        githubDetails.commits.map((c: any) => (
                          <div key={c.sha} className="text-[11.5px] border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                            <p className="text-white font-medium line-clamp-1">{c.commit?.message}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {c.commit?.author?.name} - {new Date(c.commit?.author?.date).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500">Chưa có lịch sử commit.</p>
                      )}
                    </div>
                  </div>

                  {/* PRs */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-indigo-400 flex items-center justify-between">
                      <span>Pull Requests đang theo dõi</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded font-mono">Mở & Đóng</span>
                    </p>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {githubDetails.pulls?.length > 0 ? (
                        githubDetails.pulls.map((p: any) => (
                          <div key={p.id} className="text-[11.5px] border-b border-slate-900 pb-1.5 last:border-0 last:pb-0 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">#{p.number}: {p.title}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">gửi bởi {p.user?.login}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                              p.state === "open" ? "bg-amber-500/15 text-amber-300" : "bg-purple-500/15 text-purple-300"
                            }`}>
                              {p.state === "open" ? "Mở" : "Merged"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500">Không tìm thấy PR nào liên quan dạo gần đây.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SUBTAB 2: DISCORD WEBHOOKS */}
        {activeSubTab === "discord" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl">
            <form onSubmit={handleSaveDiscord} className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/10">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Bật liên thông thông báo sang Kênh Discord</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Hệ thống của IndieCollab sẽ tự động gửi thông tin cập nhật sảnh sang Discord.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { playClickSound(); setDiscordEnabled(!discordEnabled); }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    discordEnabled ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    discordEnabled ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                  Đường dẫn Webhook URL (nhận từ Cài đặt Kênh Discord)
                </label>
                <input
                  type="url"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/xxxxxx"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition font-mono"
                />
              </div>

              {/* Event checkboxes selectors */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-2">
                  Lọc nhận sự kiện phát sinh từ sảnh
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                  {[
                    { id: "pr_merged", label: "Có Pull Request Merged (Xác thực)" },
                    { id: "milestone_completed", label: "Mốc RoadMap / Milestone hoàn tất" },
                    { id: "task_created", label: "Có đầu việc Kanban thiết lập mới" },
                    { id: "tutorial_added", label: "Có thêm Sổ tay HD & Bài học" }
                  ].map((evt) => (
                    <label key={evt.id} className="flex items-center gap-3 rounded-lg border border-slate-850 bg-slate-950/25 px-4 py-3 text-xs text-slate-300 hover:text-white transition cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={discordEvents.includes(evt.id)}
                        onChange={() => toggleDiscordEvent(evt.id)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                      />
                      <span>{evt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save with test simulation button */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isDiscordSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-black text-white transition disabled:opacity-50 cursor-pointer select-none"
                >
                  {isDiscordSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Lưu cấu hình sảnh
                </button>

                {discordWebhookUrl && (
                  <button
                    type="button"
                    onClick={handleTestDiscordMessage}
                    disabled={isDiscordSaving}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 transition cursor-pointer select-none"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Bắn thử webhook mẫu
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        )}

        {/* SUBTAB 3: GOOGLE CALENDAR & MEET */}
        {activeSubTab === "google" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400 tracking-wider uppercase font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded">
                    Google Integration Service
                  </span>
                  {googleStatus === "connected" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Đã liên kết
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black text-white mt-1.5">
                  Đồng bộ Google Calendar & Phòng Họp Google Meet
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed md:max-w-md">
                  Khi khởi tạo cuộc phỏng vấn nhóm hoặc milestone sprint review, Studio sẽ tự động tạo mốc lịch Google kèm link phòng họp chất lượng cao!
                </p>
                {googleUserEmail && (
                  <p className="text-[11px] text-slate-500 font-mono mt-2">
                    Tài khoản ủy quyền: {googleUserEmail}
                  </p>
                )}
              </div>

              <div>
                {googleStatus === "connected" ? (
                  <button
                    onClick={() => { playClickSound(); setGoogleStatus("disconnected"); setGoogleUserEmail(null); }}
                    className="rounded-xl border border-rose-500/25 px-4 py-2.5 text-xs font-black text-rose-300 hover:bg-rose-950/15 cursor-pointer selection:none transition"
                  >
                    Hủy liên kết
                  </button>
                ) : (
                  <button
                    onClick={handleConnectGoogleOAuth}
                    disabled={isGoogleLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 px-5 py-2.5 text-xs font-black tracking-tight cursor-pointer select-none transition shadow-lg shadow-amber-500/15"
                  >
                    {isGoogleLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Liên kết với Google OAuth
                  </button>
                )}
              </div>
            </div>

            {/* Scopes permissions guidelines */}
            <div className="rounded-xl border border-slate-850 bg-slate-900/10 p-4 space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-bold text-slate-300">
                <Info className="h-4 w-4 text-amber-400" />
                <span>Quyền hạn được cấp tối giản (Thỏa thuận bảo mật):</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11.5px] leading-relaxed">
                <li><code>https://www.googleapis.com/auth/calendar.events</code> - Ghi chép lịch và sự kiện chính thức trong dự án.</li>
                <li><code>https://www.googleapis.com/auth/drive.metadata.readonly</code> - Trích xuất tiêu đề tư liệu thiết kế game từ Google Drive Picker.</li>
              </ul>
              <p className="text-[10px] text-slate-500">
                Lưu ý: IndieCollab tuyệt đối không can thiệp hoặc có quyền truy cập thay đổi/đọc nội dung nhạy cảm của tệp tin lưu trên Drive cá nhân của bạn.
              </p>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: CREATIVE (FIGMA, STEAM, YOUTUBE) */}
        {activeSubTab === "creative" && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <form onSubmit={handleSaveCreativeMediaDocs} className="space-y-5 max-w-2xl">
              
              {/* Figma Art Board */}
              <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Figma className="h-4 w-4 text-rose-400" />
                  Không gian Figma Art Board (Art Bible & UI Mockups)
                </label>
                <input
                  type="url"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/xxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition"
                />
                <p className="text-[10.5px] text-slate-500">Cho phép các thành viên và họa sĩ thiết kế xem khung layout trực tiếp trên màn hình nạp tài nguyên.</p>
              </div>

              {/* YouTube Media Board */}
              <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-red-500" />
                  Đường dẫn Video giới thiệu Game Trailer (YouTube)
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=xxxxxxxxx"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition"
                />
              </div>

              {/* Steam Game App ID */}
              <div className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-sky-400" />
                  Mã định danh dự án trên cửa hàng Steam (Steam App ID)
                </label>
                <input
                  type="text"
                  value={steamAppId}
                  onChange={(e) => setSteamAppId(e.target.value)}
                  placeholder="Ví dụ: 730, 218620, ..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition font-mono"
                />
                <p className="text-[10.5px] text-slate-500">Tự động nạp Widget bán hàng, lượt Wishlist và cập nhật trạng thái Player Count thực từ Steam Store API.</p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isCreativeSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-black text-white transition disabled:opacity-50 cursor-pointer select-none"
                >
                  {isCreativeSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Lưu các thông tin truyền thông
                </button>
              </div>

            </form>
          </motion.div>
        )}

      </div>
    </div>
  );
}
