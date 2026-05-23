import React from "react";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Users, 
  Goal, 
  Clock, 
  ArrowRight, 
  Volume2, 
  Link, 
  Plus, 
  FolderSync, 
  AlertTriangle 
} from "lucide-react";
import { Project, ProjectWorkspace, WorkspacePresence, WorkspaceVoiceParticipant } from "../../types";

interface WorkspaceDashboardProps {
  project: Project;
  workspace: ProjectWorkspace;
  presences: WorkspacePresence[];
  activeSpeakers: Record<string, boolean>;
  voiceParticipants: WorkspaceVoiceParticipant[];
  onNavigateTab: (tab: "kanban" | "goals" | "chat" | "files" | "members" | "activity" | "github" | "milestones") => void;
  onLinkGitHub: () => void;
}

export default function WorkspaceDashboard({
  project,
  workspace,
  presences,
  activeSpeakers,
  voiceParticipants,
  onNavigateTab,
  onLinkGitHub
}: WorkspaceDashboardProps) {
  const onlineCount = presences.filter(p => p.status !== "away").length;
  
  // Calculate completed metrics
  const totalTasks = workspace.tasks?.length || 0;
  const completedTasks = workspace.tasks?.filter(t => t.status === "Completed").length || 0;
  const taskRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalGoals = workspace.goals?.length || 0;
  const completedGoals = workspace.goals?.filter(g => g.status === "Done").length || 0;
  const goalRatio = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const activeMilestones = workspace.milestones?.filter(m => m.status === "open") || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl"></div>
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono border border-indigo-500/20">Bảng tin phòng chờ</span>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Chào mừng bạn quay lại dự án!</h2>
            <p className="mt-1.5 text-xs text-slate-400 max-w-xl leading-relaxed">Đây là trung tâm chỉ huy nơi bạn có thể quản lý tiến độ thiết kế sản phẩm, kết nối GitHub, thực hiện cuộc gọi nhóm và chinh phục các mục tiêu đã đề ra.</p>
          </div>
          <button 
            onClick={() => onNavigateTab("kanban")} 
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5  py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition cursor-pointer self-start md:self-auto"
          >
            Mở Kanban Tiến độ
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Stats Layout */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Thành viên Trực tuyến", val: `${onlineCount}/${workspace.memberIds.length}`, info: "Đang online trong không gian", Icon: Users, color: "text-emerald-400" },
          { label: "Mục tiêu Dự án", val: `${completedGoals}/${totalGoals}`, info: `${goalRatio}% Đã hoàn thành`, Icon: Goal, color: "text-amber-400" },
          { label: "Đầu việc Kanban", val: `${completedTasks}/${totalTasks}`, info: `${taskRatio}% Đã giải quyết`, Icon: FolderSync, color: "text-cyan-400" },
          { label: "Kênh liên lạc nhóm", val: "Hoạt động", info: "Thảo luận & Voice 24/7", Icon: Volume2, color: "text-indigo-400" }
        ].map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${item.color}`}>
              <item.Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{item.label}</p>
              <h3 className="text-xl font-black text-white mt-1">{item.val}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{item.info}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Collaboration Tools and GitHub Linking */}
        <div className="lg:col-span-2 space-y-6">
          {/* GitHub Integration Status Card */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-5">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-855 text-slate-300">
                  <GitBranch className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Liên kết Kho mã nguồn GitHub</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Đồng bộ branch, commits & PRs</p>
                </div>
              </div>
              {workspace.githubRepoUrl ? (
                <button 
                  onClick={() => onNavigateTab("github")} 
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  Xem Repo
                </button>
              ) : (
                <button 
                  onClick={onLinkGitHub} 
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600/20 transition cursor-pointer"
                >
                  <Link className="h-3.5 w-3.5" />
                  Kết nối ngay
                </button>
              )}
            </div>

            <div className="mt-4">
              {workspace.githubRepoUrl ? (
                <div className="rounded-xl border border-slate-850 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-slate-300 text-xs">
                    <div>
                      <span className="font-bold text-white block">Repository đang sấy:</span>
                      <a href={workspace.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-slate-400 hover:text-indigo-400 break-all underline-offset-2 hover:underline">
                        {workspace.githubRepoUrl}
                      </a>
                    </div>
                    {workspace.githubLinkedAt && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Từ ngày {new Date(workspace.githubLinkedAt).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <AlertTriangle className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-xs max-w-xs font-sans">Chưa có mã nguồn GitHub nào được liên kết với Không gian này. Hãy tích hợp để tự động rà soát PR và đồng bộ Kanban.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Milestones Indicator */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-5">
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-400" />
                Mốc hành trình quan trọng ({activeMilestones.length})
              </h3>
              <button 
                onClick={() => onNavigateTab("milestones")} 
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Quản lý lộ trình
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {activeMilestones.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500 font-sans">Không có cột mốc hành trình nào đang mở.</p>
              ) : (
                activeMilestones.map((milestone) => {
                  const isOverdue = new Date(milestone.deadline) < new Date();
                  const totalLinked = milestone.taskIds.length + milestone.goalIds.length;
                  return (
                    <div key={milestone.id} className="rounded-xl border border-slate-850 bg-slate-950/40 p-4 flex flex-col justify-between sm:flex-row sm:items-center gap-3">
                      <div>
                        <h4 className="text-xs font-extrabold text-white">{milestone.title}</h4>
                        {milestone.description && <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mt-0.5">{milestone.description}</p>}
                        <div className="mt-2.5 flex flex-wrap gap-2 text-[9.5px] text-slate-500 font-mono">
                          <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5">{milestone.taskIds.length} thẻ Kanban</span>
                          <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5">{milestone.goalIds.length} Mục tiêu</span>
                        </div>
                      </div>
                      <div className="text-right sm:self-start self-auto">
                        <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono rounded px-2 py-0.5 border ${
                          isOverdue ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold" : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}>
                          Hạn chót: {new Date(milestone.deadline).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Live Presence and Voice Loungers */}
        <div className="space-y-6">
          {/* Active Voice Lounge */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-slate-400 mb-4 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Phòng đàm thoại ({voiceParticipants.length})
            </h3>

            <div className="space-y-3">
              {voiceParticipants.length === 0 ? (
                <div 
                  onClick={() => onNavigateTab("chat")} 
                  className="rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/40 p-5 text-center cursor-pointer transition"
                >
                  <p className="text-xs text-slate-500">Không có ai trong phòng voice.</p>
                  <p className="text-[10px] text-indigo-400 mt-1 font-bold">Bấm tham gia kênh Voice ngay →</p>
                </div>
              ) : (
                voiceParticipants.map((p) => {
                  const isUserSpeaking = activeSpeakers[p.userId];
                  return (
                    <div key={p.userId} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40 border border-slate-850">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img 
                            src={p.userAvatar} 
                            alt={p.userName} 
                            className={`h-8 w-8 rounded-xl object-cover transition-all duration-300 ${
                              isUserSpeaking ? "ring-2 ring-indigo-500 scale-105" : ""
                            }`} 
                          />
                          {isUserSpeaking && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 border border-slate-950 text-[8px] font-bold text-white animate-pulse">
                              🎙️
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{p.userName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {p.muted ? "Muted" : "Active Listener"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 text-xs text-slate-400 font-mono">
                        {p.muted && <span className="text-rose-400 text-[10px] px-1.5 bg-rose-500/10 rounded">Mic off</span>}
                        {p.deafened && <span className="text-amber-400 text-[10px] px-1.5 bg-amber-500/10 rounded">Deaf</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Members Presence Section */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/30 p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-slate-400 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Thành viên online ({onlineCount})
            </h3>

            <div className="space-y-3">
              {presences.length === 0 ? (
                <p className="text-xs text-slate-500 font-sans">Nơi đây đang vắng bóng các dev...</p>
              ) : (
                presences.map((p) => (
                  <div key={p.userId} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img src={p.userAvatar} alt={p.userName} className="h-8 w-8 rounded-xl object-cover border border-slate-800" />
                        <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-slate-900 ${
                          p.status === "online" ? "bg-emerald-500" : p.status === "busy" ? "bg-rose-500" : "bg-amber-500"
                        }`}></span>
                      </div>
                      <div>
                        <span className="font-bold text-white block">{p.userName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {p.currentTab ? `Tại: ${p.currentTab}` : "Browsing"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {p.status === "online" ? "Sẵn sàng" : p.status === "busy" ? "Đừng phiền" : "Vắng mặt"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
