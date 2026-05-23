import React, { useState, useEffect } from "react";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Link2, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Plus, 
  CornerDownRight, 
  Folders, 
  Trash2, 
  ChevronRight, 
  RefreshCw,
  Loader2
} from "lucide-react";
import { 
  GitHubPR, 
  GitHubCommit, 
  parseRepoUrl, 
  fetchRepoCommits, 
  fetchRepoBranches, 
  fetchRepoPulls 
} from "../../services/github";
import { getAccessToken } from "../../firebase";
import { ProjectWorkspace, ProjectTask } from "../../types";

interface GitHubIntegrationProps {
  workspace: ProjectWorkspace;
  onUpdateWorkspace: (workspaceId: string, updatedFields: Partial<ProjectWorkspace>) => Promise<void>;
  onPostSysMessage?: (content: string) => void;
}

export default function GitHubIntegration({
  workspace,
  onUpdateWorkspace,
  onPostSysMessage
}: GitHubIntegrationProps) {
  const [repoUrlInput, setRepoUrlInput] = useState(workspace.githubRepoUrl || "");
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [pulls, setPulls] = useState<GitHubPR[]>([]);
  
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Link Dialog
  const [linkingPr, setLinkingPr] = useState<GitHubPR | null>(null);

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
      const token = await getAccessToken();
      if (!token) {
        setErrorMsg("Vui lòng kết nối tài khoản GitHub bằng cách đăng nhập lại hoặc thiết lập trong cài đặt.");
        setIsLoading(false);
        return;
      }

      const parsed = parseRepoUrl(workspace.githubRepoUrl);
      if (!parsed) {
        setErrorMsg("Định dạng URL GitHub không hợp lệ. Vui lòng nhập link chuẩn: https://github.com/owner/repo");
        setIsLoading(false);
        return;
      }

      const { owner, repo } = parsed;
      const [commitsData, branchesData, pullsData] = await Promise.all([
        fetchRepoCommits(token, owner, repo),
        fetchRepoBranches(token, owner, repo),
        fetchRepoPulls(token, owner, repo)
      ]);

      setCommits(commitsData);
      setBranches(branchesData);
      setPulls(pullsData);
    } catch (err) {
      console.warn("GitHub integration error:", err);
      setErrorMsg("Không thể đồng bộ dữ liệu GitHub. Hãy kiểm tra quyền truy cập Token hoặc Repo.");
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

      const formattedUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
      await onUpdateWorkspace(workspace.id, {
        githubRepoUrl: formattedUrl,
        githubLinkedAt: new Date().toISOString(),
        githubLinkedBy: "member"
      });

      if (onPostSysMessage) {
        onPostSysMessage(`🔗 Kho mã nguồn GitHub đã được chỉnh sửa và liên kết với: ${formattedUrl}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Tác vụ thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectRepo = async () => {
    if (!confirm("Bạn có muốn ngắt kết nối mã nguồn?")) return;
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

    // Update tasks in workspace
    const updatedTasks = (workspace.tasks || []).map((t) => {
      if (t.id === task.id) {
        return { ...t, githubPrUrl: prUrl, status: "In Progress" as const };
      }
      return t;
    });

    await onUpdateWorkspace(workspace.id, { tasks: updatedTasks });
    setLinkingPr(null);

    if (onPostSysMessage) {
      onPostSysMessage(`🌿 Đã liên kết Pull Request (${prUrl}) vào công việc Kanban: "${task.title}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Link Setup Card */}
      {!workspace.githubRepoUrl ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-indigo-400">
              <GitBranch className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Kết Nối Kho Mã Nguồn</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Đồng bộ các luồng nhánh, lịch sử commit và quản lý trực hệ các Pull Request để rà soát chất lượng code nội bộ.</p>
            </div>
          </div>

          <form onSubmit={handleLinkRepo} className="mt-5 flex gap-2 max-w-2xl">
            <input 
              value={repoUrlInput} 
              onChange={(e) => setRepoUrlInput(e.target.value)} 
              placeholder="https://github.com/ashuraxx/my-indie-game" 
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500" 
              required
            />
            <button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer">
              <Link2 className="h-4 w-4" />
              Kết Nối Repo
            </button>
          </form>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/10 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      ) : (
        /* Connected Repo Dashboard */
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Đã kết nối mã nguồn
                  <a href={workspace.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-400">
                    <ExternalLink className="h-4.5 w-4.5" />
                  </a>
                </h3>
                <span className="font-mono text-xs text-slate-400">{workspace.githubRepoUrl}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={loadGitHubData} 
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                F5 Đồng bộ
              </button>
              <button 
                onClick={handleDisconnectRepo} 
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/10 bg-rose-500/5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Ngắt liên kết
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="text-xs font-mono">Đang đồng bộ dữ liệu GitHub...</span>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column: Pull Requests Board */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-indigo-400" />
                  Pull Requests ({pulls.length})
                </h3>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {pulls.length === 0 ? (
                    <p className="text-center py-10 text-xs text-slate-500 font-sans bg-slate-900/10 rounded-2xl border border-slate-850">Không tìm thấy PR nào trong Repo.</p>
                  ) : (
                    pulls.map((pr) => (
                      <div key={pr.id} className="rounded-xl border border-slate-850 bg-slate-900/10 p-4 hover:border-slate-800 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-400">#{pr.number} By {pr.user.login}</span>
                            <h4 className="text-xs font-extrabold text-white mt-0.5">{pr.title}</h4>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold ${
                                pr.state === "open" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              }`}>
                                {pr.state}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Cập nhật: {new Date(pr.updated_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 text-right self-start shrink-0">
                            <a 
                              href={pr.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-indigo-400 hover:text-indigo-300 text-xs font-bold inline-flex items-center gap-0.5"
                            >
                              GitHub
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <button 
                              onClick={() => setLinkingPr(pr)}
                              className="inline-flex items-center gap-1 rounded bg-indigo-650/10 border border-indigo-500/20 hover:bg-indigo-650/20 text-[9.5px] font-bold text-indigo-300 px-2 py-1 transition cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              Kanban
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Commit History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-2">
                    <GitCommit className="h-4 w-4 text-emerald-400" />
                    Commits gần nhất
                  </h3>
                  
                  {branches.length > 0 && (
                    <select 
                      value={selectedBranch} 
                      onChange={(e) => setSelectedBranch(e.target.value)} 
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-slate-300 outline-none"
                    >
                      {branches.map(br => <option key={br.name} value={br.name}>{br.name}</option>)}
                    </select>
                  )}
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {commits.length === 0 ? (
                    <p className="text-center py-10 text-xs text-slate-500 font-sans bg-slate-900/10 rounded-2xl border border-slate-850">Không thể quét lịch sử Commit.</p>
                  ) : (
                    commits.map((ref) => (
                      <div key={ref.sha} className="rounded-xl border border-slate-850/60 bg-slate-950/10 p-3.5 flex items-start gap-3">
                        {ref.author && (
                          <img src={ref.author.avatar_url} alt={ref.author.login} className="h-7 w-7 rounded-lg object-cover border border-slate-800" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{ref.commit.message}</p>
                          <div className="mt-1 flex items-center justify-between text-[10.5px] text-slate-500 font-mono">
                            <span>{ref.commit.author.name} (Author)</span>
                            <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                              {ref.sha.substring(0, 7)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linking Modal */}
      {linkingPr && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-850 bg-slate-900 p-5">
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
