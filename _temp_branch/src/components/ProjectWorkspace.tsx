import React, { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, setDoc } from "firebase/firestore";
import { ArrowLeft, Check, FileText, Goal, MessageSquare, Plus, Send, Trash2, Users } from "lucide-react";
import { db } from "../firebase";
import { Project, ProjectGoal, ProjectTask, ProjectWorkspace, ProjectWorkspaceFile, User, WorkspaceMessage } from "../types";
import ProjectKanbanBoard from "./ProjectKanbanBoard";

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
  const [activeTab, setActiveTab] = useState<"kanban" | "goals" | "chat" | "files" | "members">("kanban");
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalType, setGoalType] = useState<ProjectGoal["type"]>("short_term");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState<ProjectWorkspaceFile["fileType"]>("document");

  const isOwner = workspace.ownerId === currentUser.id;
  const isMember = isOwner || workspace.memberIds.includes(currentUser.id);

  useEffect(() => {
    if (!isMember) return;
    const messagesRef = collection(db, "project_workspaces", workspace.id, "messages");
    return onSnapshot(
      query(messagesRef),
      (snapshot) => {
        const list = snapshot.docs.map((item) => item.data() as WorkspaceMessage);
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(list);
      },
      (err) => console.warn("Workspace messages subscriber error:", err)
    );
  }, [workspace.id, isMember]);

  const workspaceProject: Project = {
    ...project,
    tasks: workspace.tasks || []
  };

  const updateTasks = async (_projectId: string, updatedFields: Partial<Project>) => {
    await onUpdateWorkspace(workspace.id, { tasks: updatedFields.tasks || workspace.tasks || [] });
  };

  const addGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!goalTitle.trim()) return;
    const goal: ProjectGoal = {
      id: "goal-" + Date.now(),
      title: goalTitle.trim(),
      description: goalDesc.trim(),
      type: goalType,
      status: "Todo",
      createdAt: new Date().toISOString()
    };
    await onUpdateWorkspace(workspace.id, { goals: [...(workspace.goals || []), goal] });
    setGoalTitle("");
    setGoalDesc("");
    setGoalType("short_term");
  };

  const updateGoalStatus = async (goalId: string, status: ProjectGoal["status"]) => {
    await onUpdateWorkspace(workspace.id, {
      goals: (workspace.goals || []).map((goal) => goal.id === goalId ? { ...goal, status } : goal)
    });
  };

  const deleteGoal = async (goalId: string) => {
    await onUpdateWorkspace(workspace.id, {
      goals: (workspace.goals || []).filter((goal) => goal.id !== goalId)
    });
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!messageText.trim()) return;
    const id = "msg-" + Date.now();
    const message: WorkspaceMessage = {
      id,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatarUrl,
      content: messageText.trim(),
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "project_workspaces", workspace.id, "messages", id), message);
    setMessageText("");
  };

  const addFile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;
    const file: ProjectWorkspaceFile = {
      id: "file-" + Date.now(),
      name: fileName.trim(),
      fileUrl: fileUrl.trim(),
      fileType,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.displayName,
      createdAt: new Date().toISOString()
    };
    await onUpdateWorkspace(workspace.id, { files: [...(workspace.files || []), file] });
    setFileName("");
    setFileUrl("");
    setFileType("document");
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

  const deleteMessage = async (messageId: string) => {
    await deleteDoc(doc(db, "project_workspaces", workspace.id, "messages", messageId));
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-850 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Quay lại sảnh
            </button>
            <h1 className="text-xl font-black text-white">Không Gian Làm Việc: {workspace.projectTitle || project.title}</h1>
            <p className="mt-1 text-xs text-slate-500">Chỉ chủ dự án và thành viên được duyệt mới đọc/ghi được nội dung này.</p>
          </div>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 px-4 py-2 text-xs font-bold text-indigo-200">
            {workspace.memberIds.length} thành viên
          </div>
        </header>

        <nav className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-850 pb-3">
          {[
            { id: "kanban", label: "Bảng tiến độ", Icon: Check },
            { id: "goals", label: "Mục tiêu", Icon: Goal },
            { id: "chat", label: "Thảo luận", Icon: MessageSquare },
            { id: "files", label: "Tệp tin", Icon: FileText },
            { id: "members", label: "Thành viên", Icon: Users },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                activeTab === id ? "border-indigo-500/40 bg-indigo-600/15 text-indigo-200" : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "kanban" && (
          <section className="mt-6">
            <ProjectKanbanBoard project={workspaceProject} currentUser={currentUser} onUpdateProject={updateTasks} />
          </section>
        )}

        {activeTab === "goals" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
            <form onSubmit={addGoal} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 className="text-sm font-black text-white">Thêm mục tiêu</h2>
              <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Tên mục tiêu" className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              <textarea value={goalDesc} onChange={(e) => setGoalDesc(e.target.value)} placeholder="Mô tả" rows={3} className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              <select value={goalType} onChange={(e) => setGoalType(e.target.value as ProjectGoal["type"])} className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none">
                <option value="short_term">Ngắn hạn</option>
                <option value="long_term">Dài hạn</option>
              </select>
              <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white">
                <Plus className="h-4 w-4" />
                Thêm
              </button>
            </form>
            <div className="grid gap-3 md:grid-cols-2">
              {(workspace.goals || []).map((goal) => (
                <div key={goal.id} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-300">{goal.type === "short_term" ? "Ngắn hạn" : "Dài hạn"}</span>
                      <h3 className="mt-3 text-sm font-bold text-white">{goal.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">{goal.description}</p>
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <select value={goal.status} onChange={(e) => updateGoalStatus(goal.id, e.target.value as ProjectGoal["status"])} className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white">
                    <option value="Todo">Đang chuẩn bị</option>
                    <option value="In_Progress">Đang thực hiện</option>
                    <option value="Done">Đã hoàn thành</option>
                  </select>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "chat" && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30">
            <div className="max-h-[520px] space-y-3 overflow-y-auto p-4">
              {messages.length === 0 ? <p className="py-10 text-center text-xs text-slate-500">Chưa có thảo luận nội bộ.</p> : messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.senderId === currentUser.id ? "justify-end" : ""}`}>
                  {message.senderId !== currentUser.id && <img src={message.senderAvatar} alt={message.senderName} className="h-8 w-8 rounded-xl object-cover" />}
                  <div className="max-w-[78%] rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-indigo-300">{message.senderName}</span>
                      {message.senderId === currentUser.id && <button onClick={() => deleteMessage(message.id)} className="text-slate-600 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-slate-200">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-800 p-3">
              <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Nhắn cho team..." className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white"><Send className="h-4 w-4" /></button>
            </form>
          </section>
        )}

        {activeTab === "files" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
            <form onSubmit={addFile} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <h2 className="text-sm font-black text-white">Thêm tệp/link</h2>
              <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="Tên tệp" className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="URL Google Drive, Figma, GitHub..." className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500" />
              <select value={fileType} onChange={(e) => setFileType(e.target.value as ProjectWorkspaceFile["fileType"])} className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none">
                {["document", "image", "audio", "video", "code", "archive", "other"].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Thêm</button>
            </form>
            <div className="grid gap-3 md:grid-cols-2">
              {(workspace.files || []).map((file) => (
                <div key={file.id} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-500">{file.fileType}</span>
                      <h3 className="mt-1 text-sm font-bold text-white">{file.name}</h3>
                      <p className="mt-1 text-[10px] text-slate-500">Bởi {file.uploadedByName}</p>
                    </div>
                    {(isOwner || file.uploadedBy === currentUser.id) && <button onClick={() => removeFile(file.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-xl border border-indigo-500/25 px-3 py-2 text-xs font-bold text-indigo-300 hover:text-indigo-200">Mở tệp</a>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "members" && (
          <section className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(workspace.memberProfiles || []).map((member) => (
              <div key={member.userId} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                <div className="flex items-center gap-3">
                  <img src={member.userAvatar} alt={member.userName} className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-white">{member.userName}</h3>
                    <p className="text-[10px] font-mono text-indigo-300">{member.role}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  {isOwner && member.userId !== workspace.ownerId && <button onClick={() => kickMember(member.userId)} className="rounded-xl border border-rose-500/25 px-3 py-1.5 text-[10px] font-bold text-rose-300">Loại</button>}
                  {!isOwner && member.userId === currentUser.id && <button onClick={leaveWorkspace} className="rounded-xl border border-rose-500/25 px-3 py-1.5 text-[10px] font-bold text-rose-300">Rời nhóm</button>}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
