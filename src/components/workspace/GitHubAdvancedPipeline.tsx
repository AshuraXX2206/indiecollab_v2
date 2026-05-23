import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Link2, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Plus, 
  ChevronRight, 
  RefreshCw,
  Loader2,
  Cpu,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Layers,
  ArrowRight,
  Download,
  Share2,
  Trash2,
  Radio,
  FileCheck,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GitHubPR, 
  GitHubCommit, 
  parseRepoUrl, 
  fetchRepoCommits, 
  fetchRepoBranches, 
  fetchRepoPulls 
} from "../../services/github";
import { auth } from "../../firebase";
import { ProjectWorkspace, ProjectTask } from "../../types";
import { playClickSound, playSuccessSound } from "../../utils/audio";

interface GitHubAdvancedPipelineProps {
  workspace: ProjectWorkspace;
  onUpdateWorkspace: (workspaceId: string, updatedFields: Partial<ProjectWorkspace>) => Promise<void>;
  onPostSysMessage?: (content: string) => void;
}

// Simulated High-Fidelity Build Action Data
interface BuildWorkflow {
  id: string;
  name: string;
  branch: string;
  triggerBy: string;
  triggerAvatar: string;
  status: "success" | "running" | "failed" | "queued";
  duration: string;
  createdAt: string;
  commitMsg: string;
  commitSha: string;
  steps: { name: string; status: "success" | "running" | "pending" | "failed"; time: string }[];
  artifactName?: string;
  artifactSize?: string;
}

const INITIAL_WORKFLOWS: BuildWorkflow[] = [
  {
    id: "wf-1",
    name: "🎮 WebGL Release Playtest & Shader Compiler",
    branch: "main",
    triggerBy: "HoangTran (Artist)",
    triggerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    status: "success",
    duration: "2m 45s",
    createdAt: "10 phút trước",
    commitMsg: "chore: compile final sprite atlas & retro pixel screen shaders #309",
    commitSha: "e9df18a",
    steps: [
      { name: "Checkout code & Submodules", status: "success", time: "12s" },
      { name: "Validate Game Sprite Sheet Resolution (Power of 2)", status: "success", time: "28s" },
      { name: "Unity WebGL Build Pipeline (Emscripten compiler)", status: "success", time: "1m 32s" },
      { name: "Deploy to Netlify Playtest Sandbox URL & Update Lobby", status: "success", time: "33s" }
    ],
    artifactName: "webgl-retro-playtest-build.zip",
    artifactSize: "28.4 MB"
  },
  {
    id: "wf-2",
    name: "📱 Android App bundle signing & Audio compress",
    branch: "feature/reverb-spatial-audio",
    triggerBy: "MinhNguyet (Composer)",
    triggerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    status: "running",
    duration: "1m 15s",
    createdAt: "Đang chạy...",
    commitMsg: "feat: add 3D positional audio and ambient cave reverb tracks",
    commitSha: "b3901a5",
    steps: [
      { name: "Fetch WAV files & run FFMPEG adaptive balance", status: "success", time: "42s" },
      { name: "Sign APK key credentials with Android store secret key", status: "success", time: "33s" },
      { name: "Optimize Gradle caching engine & build release binaries", status: "running", time: "Đang xử lý..." },
      { name: "Upload APK bundle play-store testing", status: "pending", time: "--" }
    ],
  },
  {
    id: "wf-3",
    name: "🖥️ Windows x86_64 Direct3D12 Physics Build",
    branch: "dev",
    triggerBy: "KietNguyen (Game Design)",
    triggerAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
    status: "failed",
    duration: "45s",
    createdAt: "1 giờ trước",
    commitMsg: "fix: solve boss blackhole gravitation crash state machine",
    commitSha: "a998b2c",
    steps: [
      { name: "C# script verification & semantic check", status: "success", time: "15s" },
      { name: "D3D12 Graphic context validation", status: "failed", time: "30s" },
      { name: "Pack textures and binary assets", status: "pending", time: "--" }
    ]
  },
  {
    id: "wf-4",
    name: "🌐 Desktop Mac/Linux Headless build server",
    branch: "main",
    triggerBy: "HungDev (Backend)",
    triggerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    status: "success",
    duration: "1m 58s",
    createdAt: "3 giờ trước",
    commitMsg: "merge pull request #11 from backend/room-ping-issue",
    commitSha: "89dfbc1",
    steps: [
      { name: "Node environment setup & lint", status: "success", time: "15s" },
      { name: "TypeScript compiling validation", status: "success", time: "22s" },
      { name: "Deploy Docker Container to Cloud Run Sandbox on Port 3000", status: "success", time: "1m 21s" }
    ],
    artifactName: "linux-headless-server-docker.tar.gz",
    artifactSize: "185.2 MB"
  }
];

export default function GitHubAdvancedPipeline({
  workspace,
  onUpdateWorkspace,
  onPostSysMessage
}: GitHubAdvancedPipelineProps) {
  const [repoUrlInput, setRepoUrlInput] = useState(workspace.githubRepoUrl || "");
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [pulls, setPulls] = useState<GitHubPR[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Link Dialog
  const [linkingPr, setLinkingPr] = useState<GitHubPR | null>(null);
  
  // High-fidelity local telemetry & action workflows state
  const [workflows, setWorkflows] = useState<BuildWorkflow[]>(INITIAL_WORKFLOWS);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>("wf-1");
  const [isBuildingMock, setIsBuildingMock] = useState(false);

  useEffect(() => {
    if (workspace.githubRepoUrl) {
      loadGitHubData();
    }
  }, [workspace.githubRepoUrl]);

  const loadGitHubData = async () => {
    if (!workspace.githubRepoUrl) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setErrorMsg("Thông tin Repo cục bộ được thiết lập. Hãy đăng nhập lại để đồng bộ nhánh trực tuyến.");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ projectId: workspace.id })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Đồng bộ hóa thất bại." }));
        throw new Error(errData.error || "Lỗi đồng bộ hóa.");
      }

      const data = await res.json();
      setCommits(data.commits || []);
      setBranches(data.branches || []);
      setPulls(data.pulls || []);
    } catch (err: any) {
      console.warn("GitHub integration error:", err);
      setErrorMsg(err.message || "Không thể đồng bộ tự động dữ liệu nhánh GitHub. Hãy kiểm tra quyền truy cập Token hoặc Repo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrlInput.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const parsed = parseRepoUrl(repoUrlInput);
      if (!parsed) {
        setErrorMsg("Chỉ hỗ trợ đường dẫn repository GitHub hợp lệ.");
        setIsLoading(false);
        return;
      }

      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Không thể liên kết: Vui lòng đăng nhập lại.");
      }

      const formattedUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
      
      const linkRes = await fetch("/api/github/link-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          projectId: workspace.id,
          repoUrl: formattedUrl,
          branch: "main"
        })
      });

      if (!linkRes.ok) {
        const errData = await linkRes.json().catch(() => ({ error: "Bác bỏ từ backend" }));
        throw new Error(errData.error);
      }

      await onUpdateWorkspace(workspace.id, {
        githubRepoUrl: formattedUrl,
        githubLinkedAt: new Date().toISOString(),
        githubLinkedBy: auth.currentUser?.displayName || "member"
      });

      if (onPostSysMessage) {
        onPostSysMessage(`🔗 Sảnh vừa tích hợp cổng theo dõi GitHub nâng cao: ${formattedUrl}`);
      }
      playSuccessSound();
      loadGitHubData();
    } catch (err: any) {
      setErrorMsg(err.message || "Tác vụ thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectRepo = async () => {
    if (!confirm("Bạn có muốn ngắt kết nối cổng theo dõi mã nguồn?")) return;
    setIsLoading(true);
    try {
      await onUpdateWorkspace(workspace.id, {
        githubRepoUrl: undefined,
        githubLinkedAt: undefined,
        githubLinkedBy: undefined
      });
      setRepoUrlInput("");
      setCommits([]);
      setBranches([]);
      setPulls([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPrToTask = async (task: ProjectTask, prUrl: string) => {
    if (!task || !prUrl) return;

    const updatedTasks = (workspace.tasks || []).map((t) => {
      if (t.id === task.id) {
        return { ...t, githubPrUrl: prUrl, status: "In Progress" as const };
      }
      return t;
    });

    await onUpdateWorkspace(workspace.id, { tasks: updatedTasks });
    setLinkingPr(null);

    if (onPostSysMessage) {
      onPostSysMessage(`🌿 Đã liên kết Pull Request (${prUrl}) vào công việc: ${task.title}`);
    }
    playSuccessSound();
  };

  const triggerNewManualBuild = () => {
    if (isBuildingMock) return;
    playClickSound();
    setIsBuildingMock(true);

    const newBuildId = "wf-manual-" + Date.now();
    const newBuild: BuildWorkflow = {
      id: newBuildId,
      name: "⚙️ Playtest Hotfix & Asset Packaging Job",
      branch: selectedBranch || "main",
      triggerBy: "Bạn (Manual Trigger)",
      triggerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      status: "queued",
      duration: "0s",
      createdAt: "Vừa xong",
      commitMsg: "ci: manual checkout and build trigger to refresh visual workspace artifacts",
      commitSha: "f83a" + Math.floor(Math.random() * 999),
      steps: [
        { name: "Pull latest git tracking checkout", status: "running", time: "Đang chạy..." },
        { name: "Verify sprite compression constraints", status: "pending", time: "--" },
        { name: "Build WebGL runtime client", status: "pending", time: "--" },
        { name: "Publish test bundle and notify team channels", status: "pending", time: "--" }
      ]
    };

    setWorkflows([newBuild, ...workflows]);
    setActiveWorkflowId(newBuildId);

    // Let's emulate step progress
    setTimeout(() => {
      setWorkflows(current => current.map(w => {
        if (w.id === newBuildId) {
          return {
            ...w,
            status: "running",
            steps: [
              { name: "Pull latest git tracking checkout", status: "success", time: "4s" },
              { name: "Verify sprite compression constraints", status: "running", time: "Đang chạy..." },
              { name: "Build WebGL runtime client", status: "pending", time: "--" },
              { name: "Publish test bundle and notify team channels", status: "pending", time: "--" }
            ]
          };
        }
        return w;
      }));
    }, 1500);

    setTimeout(() => {
      setWorkflows(current => current.map(w => {
        if (w.id === newBuildId) {
          return {
            ...w,
            status: "success",
            duration: "18s",
            steps: [
              { name: "Pull latest git tracking checkout", status: "success", time: "4s" },
              { name: "Verify sprite compression constraints", status: "success", time: "6s" },
              { name: "Build WebGL runtime client", status: "success", time: "5s" },
              { name: "Publish test bundle and notify team channels", status: "success", time: "3s" }
            ],
            artifactName: "instant-hotfix-playtest-bundle.zip",
            artifactSize: "16.8 MB"
          };
        }
        return w;
      }));
      setIsBuildingMock(false);
      playSuccessSound();
      if (onPostSysMessage) {
        onPostSysMessage("⚡ Bản dựng WebGL Hotfix Playtest tự động từ xa đã biên dịch thành công! Toàn bộ Artist và Musician có thể truy cập để kiểm thử.");
      }
    }, 4500);
  };

  const selectedWf = workflows.find(w => w.id === activeWorkflowId) || workflows[0];

  return (
    <div className="space-y-6">
      
      {/* HEADER PIPELINE HUD */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 p-6 text-left">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono border border-blue-500/20 flex items-center gap-1.5 animate-pulse">
                <Radio className="h-3 w-3" /> Live Pipeline Hub
              </span>
              <span className="rounded-full bg-slate-800/60 px-2.5 py-0.5 text-[9px] font-mono text-slate-400">CI/CD Verificator</span>
            </div>
            <h2 className="mt-2.5 text-xl font-black text-white sm:text-2xl">Bản Đồ Kết Nối GitHub & Pipelines Độc Lập</h2>
            <p className="mt-1 text-xs text-slate-400 max-w-xl leading-relaxed">
              Theo dõi tự động các luồng nhánh (Branch), các gói Pull Request (PR) đang rà soát, và các bản cài Builds tự động (GitHub Actions) để phối hợp mượt mà giữa Lập trình viên, Thiết kế hình ảnh Game và Nhạc sĩ.
            </p>
          </div>
          
          <div className="flex gap-2">
            {!workspace.githubRepoUrl ? (
              <span className="bg-[#09090b]/80 border border-amber-500/15 py-2 px-3 rounded-2xl text-[11px] text-amber-400 font-mono flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Đang dùng bản mô phỏng
              </span>
            ) : (
              <span className="bg-[#09090b]/80 border border-emerald-550/15 py-2 px-3 rounded-2xl text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Đồng bộ GitHub Live
              </span>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Repo Connection Setup and Switchers */}
      {!workspace.githubRepoUrl ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-[#09090b]/40 p-6 text-left">
          <div className="max-w-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Link2 className="h-4.5 w-4.5 text-indigo-400" />
              Gắn Đường Dẫn GitHub Repo Để Đồng Bộ Tuyến Làm Việc
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nhập link dự án và cấp quyền rà soát Git để quản lý tối ưu các nhánh phát triển. Toàn bộ kịch bản nhánh sẽ cập nhật ngay khi lập trình viên máy cục bộ gõ lệnh đẩy `git push` lên đám mây.
            </p>
            <form onSubmit={handleLinkRepo} className="flex gap-2 pt-2">
              <input 
                value={repoUrlInput} 
                onChange={(e) => setRepoUrlInput(e.target.value)} 
                placeholder="Ví dụ: https://github.com/AshuraXX2206/indiecollab" 
                className="flex-1 rounded-xl border border-white/[0.04] bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/55" 
                required
              />
              <button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer select-none transition">
                <Plus className="h-4 w-4" />
                Gắn Cổng Git
              </button>
            </form>
            {errorMsg && (
              <p className="text-[10px] text-amber-400 font-mono flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {errorMsg}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.04] bg-[#09090b]/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">ĐANG ĐỒNG BỘ TRỰC TUYẾN</span>
              <a href={workspace.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-indigo-400 text-xs font-bold font-mono tracking-tight flex items-center gap-1.5">
                {workspace.githubRepoUrl}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { playClickSound(); loadGitHubData(); }} 
              disabled={isLoading}
              className="px-3.5 py-1.8 bg-white/[0.01] border border-white/[0.04] rounded-lg text-xs font-mono text-slate-300 hover:text-white cursor-pointer select-none flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              F5 Sync
            </button>
            <button 
              onClick={handleDisconnectRepo}
              className="px-3.5 py-1.8 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-lg text-xs font-mono text-read-400 text-red-400 cursor-pointer select-none flex items-center gap-1.5 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hủy Kết Nối
            </button>
          </div>
        </div>
      )}

      {/* PIPELINE TELEMETRY WORKFLOW BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* LEFT COLUMN: PIPELINE WORKFLOW RUNS */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" /> Luồng Builds (CI/CD)
            </h3>
            
            <button 
              onClick={triggerNewManualBuild}
              disabled={isBuildingMock}
              className="px-2.5 py-1 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-650/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition select-none cursor-pointer"
            >
              <Play className="h-3 w-3 fill-indigo-400" /> Trigger Build
            </button>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {workflows.map((wf) => {
              const isActive = wf.id === activeWorkflowId;
              return (
                <div 
                  key={wf.id}
                  onClick={() => { playClickSound(); setActiveWorkflowId(wf.id); }}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    isActive 
                      ? "bg-slate-950/80 border-indigo-500/40 shadow-sm" 
                      : "bg-[#09090b]/40 border-white/[0.04] hover:border-white/[0.08] hover:bg-[#09090b]/60"
                  }`}
                >
                  {/* Status marker */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-tight block">Branch: {wf.branch}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                      wf.status === "success" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : wf.status === "running"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        : wf.status === "failed"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {wf.status}
                    </span>
                  </div>

                  <h4 className="mt-2 text-xs font-black text-white line-clamp-1">{wf.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 italic truncate">"{wf.commitMsg}"</p>

                  <div className="flex items-center justify-between gap-1.5 mt-4 pt-3 border-t border-white/[0.03] text-[9.5px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <img src={wf.triggerAvatar} alt={wf.triggerBy} className="h-4.5 w-4.5 rounded-full border border-white/10" />
                      <span>{wf.triggerBy}</span>
                    </div>
                    <span className="font-mono">{wf.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE COLUMN: LIVE PIPELINE GRAPH / EXECUTION LOGS */}
        <div className="space-y-4 lg:col-span-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" /> Sơ đồ biên dịch & Trạng thái hoạt động
          </h3>

          <div className="rounded-3xl border border-white/[0.04] bg-[#09090b]/80 p-5 sm:p-6 space-y-6">
            
            {/* BUILD WORKFLOW SUMMARY CARD */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">CI/CD PIPELINE REPORT</span>
                <h3 className="text-base font-black text-white">{selectedWf.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 text-[11px] font-mono">Commit: <span className="text-slate-350">{selectedWf.commitSha}</span></span>
                  <span className="text-slate-500 text-xs select-none">·</span>
                  <span className="text-slate-500 text-[11px] font-mono">Thời gian Build: <span className="text-slate-350">{selectedWf.duration}</span></span>
                </div>
              </div>

              {/* Action output check */}
              {selectedWf.status === "success" && selectedWf.artifactName && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-2xl flex items-center gap-3 shrink-0">
                  <div className="h-8.5 w-8.5 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <FileCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <strong className="text-[11.5px] text-white block font-sans tracking-tight truncate max-w-[150px]">{selectedWf.artifactName}</strong>
                    <span className="text-[9.5px] text-slate-500 block font-mono">{selectedWf.artifactSize} · Sẵn sàng kiểm thử</span>
                  </div>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); playSuccessSound(); alert(`Sẵn sàng nạp gói game chơi thử! File đang được phân mảnh lưu trữ tại CDN: ${selectedWf.artifactName}`); }}
                    className="p-1.8 bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* FLOW PIPELINE STAGES VISUAL GRAPH */}
            <div className="space-y-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Tiến độ chạy kịch bản tự động (Autoclick runner):</div>
              
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2.5 before:bottom-2 before:w-0.5 before:bg-white/[0.04]">
                {selectedWf.steps.map((step, idx) => {
                  return (
                    <div key={idx} className="relative flex items-start gap-4">
                      
                      {/* Node circle state */}
                      <div className="absolute -left-5 top-0.5 z-10">
                        {step.status === "success" ? (
                          <div className="h-4 w-4 rounded-full bg-emerald-500/30 border border-emerald-500 flex items-center justify-center text-[8px] text-white">✓</div>
                        ) : step.status === "running" ? (
                          <div className="h-4 w-4 rounded-full bg-amber-500/20 border border-amber-500 animate-pulse flex items-center justify-center text-[8px] text-golden animate-spin">⟳</div>
                        ) : step.status === "failed" ? (
                          <div className="h-4 w-4 rounded-full bg-red-500/30 border border-red-500 flex items-center justify-center text-[8px] text-white">✗</div>
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-slate-900 border border-slate-705" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 bg-[#09090b]/70 p-3 border border-white/[0.02] rounded-xl flex items-center justify-between gap-3">
                        <div className="text-left space-y-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">Stage #{idx + 1}</span>
                          <h5 className="text-[11.5px] font-bold text-white tracking-wide">{step.name}</h5>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/[0.03]">{step.time}</span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* LIVE CONSOLE LOG STREAM PREVIEW */}
            <div className="bg-[#030303] border border-white/[0.04] p-4 rounded-2xl font-mono text-[10.5px] text-emerald-400 space-y-1 block text-left overflow-x-auto select-all max-h-[160px] overflow-y-auto">
              <div>[2026-05-23T08:41:00Z] [CI-ENGINE] Fetching workflow artifacts for branch={selectedWf.branch}</div>
              <div>[2026-05-23T08:41:01Z] [CI-ENGINE] Running integrity checks. Found 0 compiling warnings inside assets/sprites</div>
              {selectedWf.status === "success" && (
                <>
                  <div className="text-slate-500">// Asset mapping finished correctly</div>
                  <div>[2026-05-23T08:41:03Z] [DEPLOY] Success compiled WebGL Emscripten Bundle! Compression ratio has been saved.</div>
                  <div className="text-emerald-300">[2026-05-23T08:41:05Z] [OK] Sandbox ready: https://indiecollab-sandbox.io/playtest/{selectedWf.commitSha}</div>
                </>
              )}
              {selectedWf.status === "running" && (
                <div className="text-amber-400 animate-pulse">// Waiting for APK compilers. Output chunk is loading... [92/100]</div>
              )}
              {selectedWf.status === "failed" && (
                <div className="text-red-400 font-bold">[ERR_SHADER_COMPILE_D3D12] Line 105: Shaders precision is wrong. Vertex output buffer mismatch! Build stopped.</div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ONLINE PR TRACKING & SYNC CHANNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Pull request Synchronizer Board */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-purple-400" /> Pull Requests cần phê duyệt ({pulls.length})
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {pulls.length === 0 ? (
              <div className="p-10 rounded-2xl border border-white/[0.03] bg-[#09090b]/40 text-center space-y-2">
                <GitPullRequest className="h-6 w-6 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-550">Không phát hiện Pull Request rà soát nào trực tuyến trong Repo này.</p>
              </div>
            ) : (
              pulls.map((pr) => (
                <div key={pr.id} className="rounded-2xl border border-white/[0.03] bg-slate-900/10 p-4 flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 block">PR #{pr.number} By {pr.user.login}</span>
                      <h4 className="text-xs font-bold text-white mt-1">{pr.title}</h4>
                    </div>
                    <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-950/60 border border-white/[0.04] text-slate-400 hover:text-white rounded-lg transition shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/[0.03]">
                    <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
                      pr.state === "open" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}>
                      {pr.state}
                    </span>
                    
                    <button 
                      onClick={() => { playClickSound(); setLinkingPr(pr); }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition select-none cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Gắn thẻ Kanban
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Git commits timeline */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-emerald-400" /> Commits đã đồng bộ sảnh ({commits.length})
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {commits.length === 0 ? (
              <div className="p-10 rounded-2xl border border-white/[0.03] bg-[#09090b]/40 text-center space-y-2">
                <GitCommit className="h-6 w-6 text-slate-700 mx-auto animate-pulse" />
                <p className="text-xs text-slate-550">Chưa ghi nhận commit nào được đồng bộ thầm lặng.</p>
              </div>
            ) : (
              commits.map((ref) => (
                <div key={ref.sha} className="p-3.5 rounded-2xl border border-white/[0.02] bg-slate-950/20 flex gap-3 items-start">
                  {ref.author && (
                    <img src={ref.author.avatar_url} alt={ref.author.login} className="h-7 w-7 rounded-lg object-cover border border-white/5" />
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-white truncate">{ref.commit.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>{ref.commit.author.name} (Local push)</span>
                      <span className="text-[8.5px] px-1.5 py-0.5 bg-slate-900 rounded text-slate-400 border border-white/[0.03]">{ref.sha.substring(0, 7)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Linking Modal to Kanban Cards */}
      {linkingPr && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-slate-900 p-5">
            <h3 className="text-sm font-black text-white">Liên kết PR #{linkingPr.number} vào Kanban</h3>
            <p className="text-xs text-slate-400 leading-relaxed mt-1">Chọn thẻ công việc tương ứng để gán PR rà soát này trực tiếp trên Kanban board.</p>

            <div className="mt-4 space-y-2.5 max-h-[220px] overflow-y-auto">
              {(workspace.tasks || []).length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-500 font-sans">Không tìm thấy thẻ công việc nào trong dự án.</p>
              ) : (
                workspace.tasks?.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => handleMapPrToTask(task, linkingPr.html_url)}
                    className="group border border-slate-850 hover:border-indigo-500/40 hover:bg-indigo-650/5 rounded-xl p-3 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{task.category} · {task.status}</span>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition">{task.title}</h4>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 border-t border-slate-850 pt-4 flex justify-end">
              <button 
                onClick={() => setLinkingPr(null)} 
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer select-none"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
