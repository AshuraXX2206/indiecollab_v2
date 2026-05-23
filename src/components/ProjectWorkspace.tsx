import React, { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, setDoc } from "firebase/firestore";
import { 
  ArrowLeft, 
  Check, 
  FileText, 
  Goal, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Users, 
  Flame, 
  Clock, 
  ExternalLink, 
  Image, 
  Video, 
  Music, 
  Code, 
  FolderArchive,
  HelpCircle,
  LayoutGrid,
  GitBranch,
  Award,
  Binary,
  Compass,
  BookOpen
} from "lucide-react";
import { db } from "../firebase";
import { Project, ProjectGoal, ProjectTask, ProjectWorkspace, ProjectWorkspaceFile, User, WorkspaceMessage } from "../types";
import ProjectKanbanBoard from "./ProjectKanbanBoard";

// Sub-modules
import WorkspaceDashboard from "./workspace/WorkspaceDashboard";
import ChannelSystem from "./workspace/ChannelSystem";
import GitHubAdvancedPipeline from "./workspace/GitHubAdvancedPipeline";
import MilestoneTracker from "./workspace/MilestoneTracker";
import AssetInteractiveHub from "./workspace/AssetInteractiveHub";
import GuideHandbook from "./workspace/GuideHandbook";

// Presence Hooks
import { usePresence } from "../hooks/usePresence";

interface ProjectWorkspaceProps {
  project: Project;
  workspace: ProjectWorkspace;
  currentUser: User;
  onBack: () => void;
  onUpdateWorkspace: (workspaceId: string, updatedFields: Partial<ProjectWorkspace>) => Promise<void>;
}

export default function ProjectWorkspaceView({
  project,
  workspace,
  currentUser,
  onBack,
  onUpdateWorkspace
}: ProjectWorkspaceProps) {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<
    "overview" | "kanban" | "goals" | "chat" | "github" | "milestones" | "files" | "members" | "assets_hub" | "tutorial"
  >("overview");

  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState<ProjectWorkspaceFile["fileType"]>("document");
  const [fileDesc, setFileDesc] = useState("");

  const isOwner = workspace.ownerId === currentUser.id;
  const isMember = isOwner || workspace.memberIds.includes(currentUser.id);

  // Derive human-readable tab label for live presences tracking
  const getTabPresenceLabel = (tabId: string) => {
    switch (tabId) {
      case "overview": return "Xem Tổng quan";
      case "kanban": return "Bảng tiến độ";
      case "goals": return "Cột mốc thiết lập";
      case "chat": return "Kênh Thảo luận Chat/Voice";
      case "github": return "Pipeline & GitHub";
      case "milestones": return "Lộ trình Sprints";
      case "files": return "Tệp của Workspace";
      case "members": return "Xem Đội ngũ";
      case "assets_hub": return "Duyệt Assets Họa Sĩ";
      case "tutorial": return "Sổ tay Hướng dẫn";
      default: return "Hợp tác sảnh";
    }
  };

  // Sync users real-time presences using the core hook
  const presences = usePresence(workspace.id, currentUser, getTabPresenceLabel(activeTab));

  const workspaceProject: Project = {
    ...project,
    tasks: workspace.tasks || []
  };

  const updateTasks = async (_projectId: string, updatedFields: Partial<Project>) => {
    await onUpdateWorkspace(workspace.id, { tasks: updatedFields.tasks || workspace.tasks || [] });
  };

  // Helper system logging channels messages
  const postSystemActivityMessage = async (content: string) => {
    try {
      const id = "sysmsg-" + Date.now();
      const message = {
        id,
        channelId: "general",
        senderId: "system",
        senderName: "Hệ thống liên thông",
        senderAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=sys",
        content,
        type: "system",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "project_workspaces", workspace.id, "channels", "general", "messages", id), message);
    } catch (err) {
      console.warn("[SystemActivity] Failed to write event log message:", err);
    }
  };

  const addFile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;
    const file: ProjectWorkspaceFile = {
      id: "file-" + Date.now(),
      name: fileName.trim(),
      fileUrl: fileUrl.trim(),
      fileType,
      description: fileDesc.trim() || undefined,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.displayName,
      createdAt: new Date().toISOString()
    };
    await onUpdateWorkspace(workspace.id, { files: [...(workspace.files || []), file] });
    setFileName("");
    setFileUrl("");
    setFileType("document");
    setFileDesc("");

    await postSystemActivityMessage(`📁 ${currentUser.displayName} vừa đăng tài nguyên mới lên Workspace: "${file.name}"`);
  };

  const removeFile = async (fileId: string) => {
    await onUpdateWorkspace(workspace.id, {
      files: (workspace.files || []).filter((file) => file.id !== fileId)
    });
  };

  const leaveWorkspace = async () => {
    if (isOwner) return;
    if (!confirm("Bạn có chắc muốn rời workspace này?")) return;
    await onUpdateWorkspace(workspace.id, {
      memberIds: workspace.memberIds.filter((id) => id !== currentUser.id),
      memberProfiles: workspace.memberProfiles.filter((member) => member.userId !== currentUser.id)
    });
    onBack();
  };

  const kickMember = async (userId: string) => {
    if (!isOwner || userId === workspace.ownerId) return;
    await onUpdateWorkspace(workspace.id, {
      memberIds: workspace.memberIds.filter((id) => id !== userId),
      memberProfiles: workspace.memberProfiles.filter((member) => member.userId !== userId)
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header container */}
        <header className="flex flex-col gap-4 border-b border-slate-850 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white select-none cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Quay lại sảnh
            </button>
            <h1 className="text-xl font-black text-white">Không Gian Làm Việc: {workspace.projectTitle || project.title}</h1>
            <p className="mt-1 text-xs text-slate-500">Chỉ chủ dự án và thành viên được duyệt mới lọc/đồng bộ được nội dung từ không gian.</p>
          </div>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 px-4 py-2 text-xs font-bold text-indigo-200">
            {workspace.memberIds.length} thành viên
          </div>
        </header>

        {/* Dynamic workspace tabs navigation */}
        <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-850 pb-3">
          {[
            { id: "overview", label: "Tổng quan", Icon: LayoutGrid },
            { id: "kanban", label: "Bảng tiến độ", Icon: Check },
            { id: "goals", label: "Mục tiêu", Icon: Goal },
            { id: "chat", label: "Kênh Chat/Voice", Icon: MessageSquare },
            { id: "github", label: "Live Pipeline & GitHub", Icon: GitBranch },
            { id: "milestones", label: "Mốc RoadMap", Icon: Award },
            { id: "assets_hub", label: "Thư viện Assets", Icon: Compass },
            { id: "files", label: "Tài nguyên", Icon: FileText },
            { id: "members", label: "Hội viên", Icon: Users },
            { id: "tutorial", label: "Sổ tay HD", Icon: BookOpen },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition select-none cursor-pointer ${
                activeTab === id ? "border-indigo-500/40 bg-indigo-600/15 text-indigo-200" : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Tabs Renderer router */}
        {activeTab === "overview" && (
          <div className="mt-6 animation-fade-in">
            <WorkspaceDashboard 
              project={project}
              workspace={workspace}
              presences={presences}
              activeSpeakers={{}}
              voiceParticipants={[]}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onLinkGitHub={() => setActiveTab("github")}
            />
          </div>
        )}

        {activeTab === "kanban" && (
          <section className="mt-6">
            <ProjectKanbanBoard project={workspaceProject} currentUser={currentUser} onUpdateProject={updateTasks} isMember={isMember} />
          </section>
        )}

        {activeTab === "goals" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
            {/* Reuse standard Goal Form logic cleanly for modular purposes */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const titleInput = target.elements.namedItem("title") as HTMLInputElement;
              const descInput = target.elements.namedItem("description") as HTMLTextAreaElement;
              const typeInput = target.elements.namedItem("type") as HTMLSelectElement;
              const dlInput = target.elements.namedItem("deadline") as HTMLInputElement;

              const titleValue = titleInput?.value;
              if (!titleValue?.trim()) return;

              const goal: ProjectGoal = {
                id: "goal-" + Date.now(),
                title: titleValue.trim(),
                description: descInput?.value.trim() || "",
                type: typeInput?.value as any,
                status: "Todo",
                deadline: dlInput?.value || undefined,
                createdAt: new Date().toISOString()
              };

              await onUpdateWorkspace(workspace.id, { goals: [...(workspace.goals || []), goal] });
              target.reset();

              await postSystemActivityMessage(`🎯 ${currentUser.displayName} vừa bổ sung một Mục tiêu hành trình mới: "${goal.title}"`);
            }} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 h-fit">
              <h2 className="text-sm font-black text-white">Thêm mục tiêu</h2>
              <input name="title" placeholder="Tên mục tiêu" className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" required />
              <textarea name="description" placeholder="Mô tả mục tiêu..." rows={3} className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Thời kỳ</label>
                  <select name="type" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none">
                    <option value="short_term">Ngắn hạn</option>
                    <option value="long_term">Dài hạn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Ngày tới hạn</label>
                  <input type="date" name="deadline" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.8 text-xs text-white outline-none focus:border-indigo-500" />
                </div>
              </div>

              <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 cursor-pointer">
                <Plus className="h-4 w-4" />
                Lưu mục tiêu
              </button>
            </form>
            
            <div className="space-y-4">
              {/* Progress bar info */}
              {(() => {
                const total = (workspace.goals || []).length;
                const completed = (workspace.goals || []).filter(g => g.status === "Done").length;
                const ratio = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Tiến trình mục tiêu ({completed}/{total} Hoàn thành)</span>
                      <span className="text-xs font-bold text-indigo-400 font-mono">{ratio}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid gap-3 md:grid-cols-2">
                {(workspace.goals || []).map((goal) => {
                  const isOverdue = goal.status !== "Done" && goal.deadline && new Date(goal.deadline) < new Date();
                  return (
                    <div key={goal.id} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-300">
                              {goal.type === "short_term" ? "Ngắn hạn" : "Dài hạn"}
                            </span>
                            {goal.deadline && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-mono rounded px-1.5 py-0.5 border ${isOverdue ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(goal.deadline).toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                          <button onClick={async () => {
                            await onUpdateWorkspace(workspace.id, {
                              goals: (workspace.goals || []).filter((g) => g.id !== goal.id)
                            });
                          }} className="text-rose-400 hover:text-rose-300 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-white">{goal.title}</h3>
                        {goal.description && <p className="mt-1 text-xs text-slate-400 leading-relaxed">{goal.description}</p>}
                      </div>
                      <select 
                        value={goal.status} 
                        onChange={async (e) => {
                          const status = e.target.value as any;
                          await onUpdateWorkspace(workspace.id, {
                            goals: (workspace.goals || []).map((g) => g.id === goal.id ? { ...g, status } : g)
                          });
                        }} 
                        className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="Todo">Đang chuẩn bị</option>
                        <option value="In_Progress">Đang thực hiện</option>
                        <option value="Done">Đã hoàn thành</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Channels communications integration */}
        {activeTab === "chat" && (
          <div className="mt-6">
            <ChannelSystem 
              workspace={workspace}
              currentUser={currentUser}
              onPostSysMessage={postSystemActivityMessage}
            />
          </div>
        )}

        {/* GitHub integration integration */}
        {activeTab === "github" && (
          <div className="mt-6 animation-fade-in">
            <GitHubAdvancedPipeline 
              workspace={workspace}
              onUpdateWorkspace={onUpdateWorkspace}
              onPostSysMessage={postSystemActivityMessage}
            />
          </div>
        )}

        {/* Roadmaps Sprints integration */}
        {activeTab === "milestones" && (
          <div className="mt-6 animation-fade-in">
            <MilestoneTracker 
              workspace={workspace}
              onUpdateWorkspace={onUpdateWorkspace}
              onPostSysMessage={postSystemActivityMessage}
            />
          </div>
        )}

        {activeTab === "files" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
            <form onSubmit={addFile} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 h-fit">
              <h2 className="text-sm font-black text-white">Thêm tệp/link</h2>
              <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Tên tệp/tài nguyên" className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" required />
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="URL Google Drive, Figma, GitHub..." className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" required />
              
              <div className="mt-3">
                <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Loại tệp</label>
                <select value={fileType} onChange={(e) => setFileType(e.target.value as ProjectWorkspaceFile["fileType"])} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none">
                  {["document", "image", "audio", "video", "code", "archive", "other"].map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="mt-3">
                <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Mô tả tài nguyên</label>
                <textarea rows={2} value={fileDesc} onChange={(e) => setFileDesc(e.target.value)} placeholder="Mô tả công dụng..." className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              </div>

              <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 cursor-pointer">
                <Plus className="h-4 w-4" />
                Thêm Tài nguyên mới
              </button>
            </form>

            <div className="grid gap-3 md:grid-cols-2">
              {(workspace.files || []).map((file) => {
                const getSourceBadge = (url: string) => {
                  const lowercase = url.toLowerCase();
                  if (lowercase.includes("drive.google.com") || lowercase.includes("docs.google.com")) {
                    return { name: "Google Drive", style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
                  }
                  if (lowercase.includes("figma.com")) {
                    return { name: "Figma", style: "bg-pink-500/10 text-pink-400 border-pink-500/20" };
                  }
                  if (lowercase.includes("github.com")) {
                    return { name: "GitHub", style: "bg-slate-300/10 text-slate-300 border-slate-300/20" };
                  }
                  return { name: "Web Web", style: "bg-slate-800 text-slate-400 border-slate-705" };
                };

                const getFileIcon = (type: string) => {
                  switch (type) {
                    case "image": return <Image className="h-4 w-4 text-pink-400" />;
                    case "audio": return <Music className="h-4 w-4 text-emerald-400" />;
                    case "video": return <Video className="h-4 w-4 text-rose-400" />;
                    case "code": return <Code className="h-4 w-4 text-cyan-400" />;
                    case "archive": return <FolderArchive className="h-4 w-4 text-amber-400" />;
                    default: return <FileText className="h-4 w-4 text-indigo-400" />;
                  }
                };

                const source = getSourceBadge(file.fileUrl);

                return (
                  <div key={file.id} className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4 hover:border-slate-700 transition duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase py-0.5 rounded text-slate-400">
                            {getFileIcon(file.fileType)} {file.fileType}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded border text-[8.5px] uppercase font-bold tracking-wider font-mono ${source.style}`}>
                            {source.name}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{file.name}</h3>
                        {file.description && (
                          <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">{file.description}</p>
                        )}
                        <p className="text-[9.5px] text-slate-500 font-mono">Đăng bởi {file.uploadedByName}</p>
                      </div>
                      {(isOwner || file.uploadedBy === currentUser.id) && (
                        <button onClick={() => removeFile(file.id)} className="text-rose-450 hover:text-rose-450 cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-4 pt-1 flex justify-end">
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-indigo-500/25 px-3.5 py-1.8 text-xs font-bold text-indigo-300 hover:text-indigo-200 transition bg-slate-950/40">
                        Mở liên kết <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "members" && (
          <section className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(workspace.memberProfiles || []).map((member) => (
              <div key={member.userId} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                <div className="flex items-center gap-3">
                  <img src={member.userAvatar} alt={member.userName} className="h-12 w-12 rounded-xl object-cover border border-slate-800" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-white">{member.userName}</h3>
                    <p className="text-[10px] font-mono text-indigo-300">{member.role}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  {isOwner && member.userId !== workspace.ownerId && <button onClick={() => kickMember(member.userId)} className="rounded-xl border border-rose-500/25 px-3 py-1.5 text-[10px] font-bold text-rose-300">Loại bỏ</button>}
                  {!isOwner && member.userId === currentUser.id && <button onClick={leaveWorkspace} className="rounded-xl border border-rose-500/25 px-3 py-1.5 text-[10px] font-bold text-rose-300">Rời nhóm</button>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Asset Interactive Hub tab */}
        {activeTab === "assets_hub" && (
          <div className="mt-6 animation-fade-in">
            <AssetInteractiveHub 
              workspace={workspace}
              currentUser={currentUser}
              onPostSysMessage={postSystemActivityMessage}
              onAddWorkspaceFile={async (file) => {
                await onUpdateWorkspace(workspace.id, { files: [...(workspace.files || []), file] });
              }}
            />
          </div>
        )}

        {/* Tutorial and Help guide book tab */}
        {activeTab === "tutorial" && (
          <div className="mt-6 animation-fade-in">
            <GuideHandbook />
          </div>
        )}
      </div>
    </div>
  );
}
