import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ChevronRight, 
  Server, 
  ShieldAlert,
  Loader2,
  Database
} from "lucide-react";
import { parseRepoUrl } from "../../services/github";
import { ProjectWorkspace } from "../../types";
import { playClickSound, playSuccessSound, playErrorSound } from "../../utils/audio";
import { auth } from "../../firebase";

interface GitHubRepoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: ProjectWorkspace;
  onUpdateWorkspace: (workspaceId: string, updatedFields: Partial<ProjectWorkspace>) => Promise<void>;
  onPostSysMessage?: (content: string) => void;
}

interface SyncStep {
  id: number;
  label: string;
  status: "idle" | "running" | "success" | "failed";
  desc: string;
}

export default function GitHubRepoSyncModal({
  isOpen,
  onClose,
  workspace,
  onUpdateWorkspace,
  onPostSysMessage
}: GitHubRepoSyncModalProps) {
  const [repoUrl, setRepoUrl] = useState(workspace.githubRepoUrl || "");
  const [personalAccessToken, setPersonalAccessToken] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [steps, setSteps] = useState<SyncStep[]>([
    { id: 1, label: "Phân tích URL", status: "idle", desc: "Kiểm tra định dạng đường dẫn kho chứa GitHub" },
    { id: 2, label: "Kết nối Token", status: "idle", desc: "Xác minh mã truy cập tài khoản trực tuyến từ sảnh" },
    { id: 3, label: "Tải Commits & Nhánh", status: "idle", desc: "Đồng bộ hóa các dữ liệu lịch sử commit cục bộ" },
    { id: 4, label: "Đồng bộ Pull Requests", status: "idle", desc: "Sắp xếp và nạp danh sách PR đang rà soát" },
    { id: 5, label: "Cập nhật Workspace", status: "idle", desc: "Lưu lại toạ độ liên kết vào cơ sở dữ liệu" },
  ]);

  useEffect(() => {
    if (isOpen) {
      setRepoUrl(workspace.githubRepoUrl || "");
      setPersonalAccessToken("");
      setValidationError(null);
      setIsSyncing(false);
      setProgress(0);
      setCurrentStepIndex(0);
      setLogMessages([]);
      setSyncSuccess(false);
      setSteps([
        { id: 1, label: "Phân tích URL", status: "idle", desc: "Kiểm tra định dạng đường dẫn kho chứa GitHub" },
        { id: 2, label: "Kết nối Token", status: "idle", desc: "Xác minh mã truy cập tài khoản trực tuyến từ sảnh" },
        { id: 3, label: "Tải Commits & Nhánh", status: "idle", desc: "Đồng bộ hóa các dữ liệu lịch sử commit cục bộ" },
        { id: 4, label: "Đồng bộ Pull Requests", status: "idle", desc: "Sắp xếp và nạp danh sách PR đang rà soát" },
        { id: 5, label: "Cập nhật Workspace", status: "idle", desc: "Lưu lại toạ độ liên kết vào cơ sở dữ liệu" },
      ]);
    }
  }, [isOpen, workspace.githubRepoUrl]);

  // Real-time validation
  useEffect(() => {
    if (!repoUrl.trim()) {
      setValidationError(null);
      return;
    }
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setValidationError("Đường dẫn GitHub không hợp lệ. Vui lòng nhập link theo dạng: https://github.com/owner/repo");
    } else {
      setValidationError(null);
    }
  }, [repoUrl]);

  if (!isOpen) return null;

  const addLog = (msg: string) => {
    setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString("vi-VN")}] ${msg}`]);
  };

  const updateStepStatus = (index: number, status: SyncStep["status"]) => {
    setSteps((prev) =>
      prev.map((step, idx) => (idx === index ? { ...step, status } : step))
    );
  };

  const handleStartSync = async () => {
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      playErrorSound();
      setValidationError("Vui lòng sửa định dạng đường dẫn trước khi bắt đầu đồng bộ.");
      return;
    }

    playClickSound();
    setIsSyncing(true);
    setProgress(5);
    setCurrentStepIndex(0);
    setLogMessages([]);
    setSyncSuccess(false);

    const formattedUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Không tìm thấy thông tin đăng nhập của bạn. Vui lòng refresh hoặc re-login.");
      }

      // Step 1: Analysing URL
      updateStepStatus(0, "running");
      addLog(`Phân tích URL kho phát triển: ${formattedUrl}`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStepStatus(0, "success");
      setProgress(20);
      setCurrentStepIndex(1);
      addLog(`Thành công! Phát hiện Owner="${parsed.owner}", Repo="${parsed.repo}".`);

      // Step 2: Secure Token linking via Backend API
      updateStepStatus(1, "running");
      addLog("Gửi thông tin xác thực lên backend IndieCollab...");
      
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
        const errData = await linkRes.json().catch(() => ({ error: "Bác bỏ từ backend" }));
        throw new Error(`Xác thực backend thất bại: ${errData.error}`);
      }

      updateStepStatus(1, "success");
      setProgress(40);
      setCurrentStepIndex(2);
      addLog(`Backend đã cấu hình lưu trữ mã bảo mật AES-256 an toàn.`);

      // Step 3: Pull live Commits & Branches via proxy backend
      updateStepStatus(2, "running");
      addLog("Khởi chạy tiến trình kéo (Pulling) dữ liệu commits thông qua proxy backend...");
      
      const syncRes = await fetch("/api/github/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ projectId: workspace.id })
      });

      if (!syncRes.ok) {
        const errData = await syncRes.json().catch(() => ({ error: "Không thể sync các commits" }));
        throw new Error(`Đồng bộ commits thất bại: ${errData.error}`);
      }

      const syncData = await syncRes.json();
      const commitsCount = syncData.commits?.length || 0;
      updateStepStatus(2, "success");
      setProgress(65);
      setCurrentStepIndex(3);
      addLog(`Đồng bộ thành công! Tìm thấy ${commitsCount} commits mới nhất của nhánh.`);

      // Step 4: Process and count Pull Requests
      updateStepStatus(3, "running");
      addLog("Đồng bộ kéo thông tin Pull Requests trực tuyến...");
      await new Promise((resolve) => setTimeout(resolve, 305));
      
      const pullsCount = syncData.pulls?.length || 0;
      updateStepStatus(3, "success");
      setProgress(85);
      setCurrentStepIndex(4);
      addLog(`Thành công! Phát hiện ${pullsCount} Pull Requests liên quan trên sảnh.`);

      // Step 5: Save update state
      updateStepStatus(4, "running");
      addLog("Cập nhật tọa hành trực tuyến Firestore...");
      
      await onUpdateWorkspace(workspace.id, {
        githubRepoUrl: formattedUrl,
        githubLinkedAt: new Date().toISOString(),
        githubLinkedBy: auth.currentUser?.displayName || "member"
      });

      if (onPostSysMessage) {
        onPostSysMessage(`🔗 Tải liên kết kho mã nguồn mượt mà: ${formattedUrl} (Dữ liệu commits/PRs kéo trực tiếp từ backend)`);
      }

      updateStepStatus(4, "success");
      setProgress(100);
      setSyncSuccess(true);
      addLog("Chúc mừng! Toàn bộ kho mã nguồn và dữ liệu Git đã được liên thông hoàn toàn.");
      playSuccessSound();

    } catch (err: any) {
      playErrorSound();
      addLog(`[LỖI TIẾN TRÌNH] ${err.message || "Tác vụ thất bại"}`);
      setSteps((prev) => 
        prev.map((step) => step.status === "running" ? { ...step, status: "failed" } : step)
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const hasValidInput = repoUrl.trim().length > 0 && !validationError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative overflow-hidden font-sans text-left">
        {/* Decorative backdrop glow */}
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Liên Kết & Đồng Bộ Kho Mã Nguồn</h3>
              <p className="text-xs text-slate-400">Kiểm tra liên tuyến, và kéo cập nhật từ GitHub</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            disabled={isSyncing && progress < 100}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Container */}
        {!syncSuccess && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
                Đường dẫn Repository (URL)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={isSyncing}
                  placeholder="Ví dụ: https://github.com/AshuraXX2206/indiecollab"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition"
                />
              </div>
              
              {validationError && (
                <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-rose-500/10 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-450 font-sans">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {hasValidInput && (
                <div className="mt-2 text-xs text-emerald-400 font-bold flex items-center gap-1.5 ml-1">
                  <Check className="h-4 w-4" /> Định dạng URL hợp lệ. Sẵn sàng tích hợp.
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
                <span>GitHub Personal Access Token (Tùy chọn)</span>
                <span className="text-[10px] text-indigo-400 lowercase normal-case font-sans">Sẽ được bảo mật & mã hóa AES-256</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={personalAccessToken}
                  onChange={(e) => setPersonalAccessToken(e.target.value)}
                  disabled={isSyncing}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx (Nếu là repository Riêng tư / Private)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500/80 transition font-mono"
                />
              </div>
            </div>

            {/* Simulated/Real explanation detail card */}
            <div className="rounded-xl border border-slate-850 bg-slate-950/30 p-4 text-xs text-slate-400 leading-relaxed">
              <p>
                <strong>Quy trình hoạt động:</strong> Khi bạn gắn link và đồng bộ, hệ thống sẽ xác minh toạ độ để đội ngũ có thể liên kết trực tiếp Commit Hash vào thẻ Kanban, hỗ trợ rà soát chất lượng code nội bộ thời gian thực.
              </p>
            </div>
          </div>
        )}

        {/* Execution pipeline status */}
        {(isSyncing || syncSuccess || logMessages.length > 0) && (
          <div className="mt-5 space-y-4">
            {/* Status bar & progress percentage */}
            <div className="rounded-2xl border border-slate-850 bg-slate-950/50 p-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-extrabold text-indigo-300 font-mono uppercase tracking-wider">
                  {isSyncing ? "Đang chạy tiến trình đồng bộ..." : "Tiến trình đồng bộ hoàn tất"}
                </span>
                <span className="text-xs font-black text-indigo-400 font-mono">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-805">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stages Grid list */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Các giai đoạn liên lạc:</span>
              <div className="grid gap-2">
                {steps.map((step, idx) => {
                  const isCurrent = currentStepIndex === idx && isSyncing;
                  return (
                    <div 
                      key={step.id} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                        step.status === "success" 
                          ? "bg-emerald-500/5 border-emerald-550/15" 
                          : step.status === "running"
                          ? "bg-indigo-550/10 border-indigo-500/40 animate-pulse"
                          : step.status === "failed"
                          ? "bg-rose-500/5 border-rose-500/20"
                          : "bg-slate-950/20 border-slate-850/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        {step.status === "success" ? (
                          <div className="h-5 w-5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-xs">✓</div>
                        ) : step.status === "running" ? (
                          <div className="h-5 w-5 rounded-lg bg-indigo-500/15 border border-indigo-550 flex items-center justify-center text-indigo-400 text-xs animate-spin font-mono">⟳</div>
                        ) : step.status === "failed" ? (
                          <div className="h-5 w-5 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-450 text-xs">✗</div>
                        ) : (
                          <div className="h-5 w-5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-650 text-[10px] font-bold">{step.id}</div>
                        )}
                        <div>
                          <h4 className="text-xs font-extrabold text-white">{step.label}</h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{step.desc}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${
                        step.status === "success" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                          : step.status === "running"
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-bold"
                          : step.status === "failed"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold"
                          : "bg-slate-900 text-slate-600 border-slate-800"
                      }`}>
                        {step.status === "success" ? "OK" : step.status === "running" ? "BUILD" : step.status === "failed" ? "FAIL" : "WAIT"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Developer logs console output */}
            <div className="rounded-2xl border border-slate-850 bg-black/90 p-4 font-mono text-[10.5px] text-emerald-450 space-y-1 block text-left max-h-[140px] overflow-y-auto">
              <span className="text-slate-500">// Bảng điều hướng Logs sảnh:</span>
              {logMessages.map((log, index) => (
                <div key={index} className="truncate tracking-wide">{log}</div>
              ))}
              {isSyncing && <div className="text-indigo-400 animate-pulse font-bold">● Đang biên dịch mảnh ghép...</div>}
            </div>
          </div>
        )}

        {/* Buttons footer */}
        <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-end gap-2">
          {!syncSuccess ? (
            <>
              <button
                onClick={onClose}
                disabled={isSyncing}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition disabled:opacity-40 cursor-pointer select-none"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStartSync}
                disabled={isSyncing || !hasValidInput}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer select-none"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang đồng bộ...
                  </>
                ) : (
                  <>
                    <Database className="h-3.5 w-3.5" />
                    Bắt đầu đồng bộ
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition cursor-pointer select-none font-sans"
            >
              Đóng sảnh an toàn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
