import React, { useState } from "react";
import { Project, ProjectTask, TaskComment } from "../types";
import { 
  Plus, 
  User, 
  Users, 
  ClipboardList, 
  Check, 
  ArrowRight, 
  Briefcase, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Code,
  Palette,
  Music,
  FileText,
  HelpCircle
} from "lucide-react";
import { playClickSound, playHoverSound } from "../utils/audio";

interface ProjectKanbanBoardProps {
  project: Project;
  currentUser: any;
  onUpdateProject: (projectId: string, updatedFields: Partial<Project>) => Promise<void>;
  isMember?: boolean;
}

export default function ProjectKanbanBoard({ project, currentUser, onUpdateProject, isMember }: ProjectKanbanBoardProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskCat, setNewTaskCat] = useState<ProjectTask["category"]>("Code");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});

  // Application note state per task
  const [applyingTaskId, setApplyingTaskId] = useState<string | null>(null);
  const [applyNote, setApplyNote] = useState("");

  const isOwner = currentUser && currentUser.id === project.ownerId;
  const checkIsMember = !!(isMember || isOwner);
  const tasks = project.tasks || [];

  const toggleExpandedComments = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleAddComment = async (taskId: string) => {
    const text = (commentTexts[taskId] || "").trim();
    if (!text) return;

    if (!currentUser) {
      alert("Bạn cần đăng nhập để bình luận!");
      return;
    }

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const newComment: TaskComment = {
      id: "comment-" + Date.now(),
      userId: currentUser.id,
      userName: currentUser.displayName || "User",
      userAvatar: currentUser.avatarUrl || "",
      content: text,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...task,
      comments: [...(task.comments || []), newComment]
    };

    await onUpdateProject(project.id, { tasks: updatedTasks });
    setCommentTexts(prev => ({ ...prev, [taskId]: "" }));
  };

  const getCategoryIcon = (category: ProjectTask["category"]) => {
    switch (category) {
      case "Code": return <Code className="h-3.5 w-3.5" />;
      case "Art": return <Palette className="h-3.5 w-3.5" />;
      case "Sound": return <Music className="h-3.5 w-3.5" />;
      case "Design": return <Briefcase className="h-3.5 w-3.5" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getCategoryColor = (category: ProjectTask["category"]) => {
    switch (category) {
      case "Code": return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
      case "Art": return "bg-pink-500/10 text-pink-300 border-pink-500/20";
      case "Sound": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "Design": return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      default: return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  // Add a task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: "task-" + Date.now(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      category: newTaskCat,
      status: "Todo",
      applicants: [],
      priority: newTaskPriority,
      deadline: newTaskDeadline || undefined,
      comments: []
    };

    const updatedTasks = [...tasks, newTask];
    await onUpdateProject(project.id, { tasks: updatedTasks });

    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskCat("Code");
    setNewTaskPriority("medium");
    setNewTaskDeadline("");
    setShowAddTask(false);
  };

  // Apply to a task
  const handleApplyToTask = async (taskId: string) => {
    if (!currentUser) {
      alert("Bạn cần đăng nhập để ứng tuyển nhiệm vụ!");
      return;
    }

    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const alreadyApplied = task.applicants?.some(a => a.userId === currentUser.id);

    if (alreadyApplied) {
      alert("Bạn đã ứng tuyển nhiệm vụ này rồi!");
      return;
    }

    const newApplicant = {
      userId: currentUser.id,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatarUrl,
      userJobTitle: currentUser.jobTitle || "Game Creator",
      note: applyNote.trim() || "Tôi rất muốn tham gia phần việc này!"
    };

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...task,
      applicants: [...(task.applicants || []), newApplicant]
    };

    await onUpdateProject(project.id, { tasks: updatedTasks });
    setApplyingTaskId(null);
    setApplyNote("");
    alert("Đã gửi yêu cầu ứng tuyển nhiệm vụ thành công!");
  };

  // Assign a task to an applicant
  const handleAssignTask = async (taskId: string, applicant: any) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...task,
      status: "In Progress",
      assignedTo: applicant.userId,
      assignedToName: applicant.userName,
      assignedToAvatar: applicant.userAvatar,
      applicants: [] // clear applicant list after assignment
    };

    await onUpdateProject(project.id, { tasks: updatedTasks });
    alert(`Đã giao nhiệm vụ cho ${applicant.userName}!`);
  };

  // Update status of a task (usable by Owner or Assigned developer)
  const handleUpdateStatus = async (taskId: string, newStatus: ProjectTask["status"]) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const isAssigned = currentUser && currentUser.id === task.assignedTo;

    if (!isOwner && !isAssigned) {
      alert("Chỉ chủ dự án hoặc lập trình viên được giao việc mới có quyền đổi trạng thái!");
      return;
    }

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...task,
      status: newStatus
    };

    await onUpdateProject(project.id, { tasks: updatedTasks });
  };

  // Delete a task (Owner only)
  const handleDeleteTask = async (taskId: string) => {
    if (!isOwner) return;
    if (!confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) return;

    const updatedTasks = tasks.filter(t => t.id !== taskId);
    await onUpdateProject(project.id, { tasks: updatedTasks });
  };

  // Helper to filter and sort tasks by status & priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...tasks].sort((a, b) =>
    (priorityOrder[a.priority ?? "medium"]) - (priorityOrder[b.priority ?? "medium"])
  );

  const todoTasks = sortedTasks.filter(t => t.status === "Todo");
  const inProgressTasks = sortedTasks.filter(t => t.status === "In Progress");
  const completedTasks = sortedTasks.filter(t => t.status === "Completed");

  const renderTaskCard = (task: ProjectTask) => {
    const hasApplied = currentUser && task.applicants?.some(a => a.userId === currentUser.id);
    const isAssignedToMe = currentUser && task.assignedTo === currentUser.id;

    return (
      <div 
        key={task.id} 
        className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 relative group/task hover:border-slate-700 transition duration-200"
      >
        {/* Title and Category */}
        <div className="flex justify-between items-start gap-2">
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider font-mono ${getCategoryColor(task.category)}`}>
            {getCategoryIcon(task.category)}
            {task.category}
          </span>
          {isOwner && (
            <button 
              onClick={() => { playClickSound(); handleDeleteTask(task.id); }}
              className="opacity-0 group-hover/task:opacity-100 text-[10px] text-red-400 hover:text-red-300 font-bold transition font-mono cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <h4 className="text-xs font-bold text-slate-100 leading-snug flex-1">{task.title}</h4>
            <button
              type="button"
              onClick={() => toggleExpandedComments(task.id)}
              className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400 font-bold font-mono transition cursor-pointer"
              title="Xem thảo luận"
            >
              💬 {task.comments?.length || 0}
            </button>
          </div>
          {task.description && (
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{task.description}</p>
          )}
        </div>

        {/* Priority & Deadline Badge Section */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority badge */}
          {(() => {
            const priority = task.priority || "medium";
            let colorClasses = "bg-slate-800 text-slate-350 border-slate-700";
            let label = "Trung bình";
            if (priority === "high") {
              colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              label = "Cao";
            } else if (priority === "low") {
              colorClasses = "bg-slate-500/10 text-slate-405 border-slate-500/20";
              label = "Thấp";
            }
            return (
              <span className={`px-2 py-0.5 rounded border text-[9px] font-semibold tracking-wider font-mono uppercase ${colorClasses}`}>
                {label}
              </span>
            );
          })()}

          {/* Deadline */}
          {task.deadline && (() => {
            const isCompleted = task.status === "Completed";
            const isOverdue = !isCompleted && new Date(task.deadline!) < new Date();
            const dateStr = new Date(task.deadline!).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "short",
              day: "numeric"
            });
            return (
              <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono leading-none ${isOverdue ? "text-rose-500 font-semibold" : "text-slate-400"}`}>
                <Clock className="h-3 w-3" /> {dateStr}
              </span>
            );
          })()}
        </div>

        {/* Assignment info */}
        {task.assignedTo ? (
          <div className="flex items-center gap-2 border-t border-slate-900/60 pt-2.5">
            <img 
              src={task.assignedToAvatar} 
              alt={task.assignedToName} 
              className="h-5.5 w-5.5 rounded-full object-cover ring-1 ring-slate-800"
            />
            <div className="text-[10px] text-left">
              <div className="font-bold text-slate-300">{task.assignedToName}</div>
              <div className="text-slate-500 text-[8.5px] font-mono leading-none">Đã nhận nhiệm vụ</div>
            </div>
          </div>
        ) : (
          <div className="text-[9.5px] font-mono text-slate-500">Chưa giao cho ai</div>
        )}

        {/* Task controller */}
        <div className="border-t border-slate-900/65 pt-2.5 flex items-center justify-between gap-1.5 flex-wrap">
          {/* Status buttons */}
          {(isOwner || isAssignedToMe) && (
            <div className="flex gap-1.5">
              {task.status !== "Todo" && (
                <button
                  onClick={() => { playClickSound(); handleUpdateStatus(task.id, "Todo"); }}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 text-[9px] font-bold font-mono transition cursor-pointer"
                  title="Chuyển về Cần làm"
                >
                  Cần làm
                </button>
              )}
              {task.status !== "In Progress" && (
                <button
                  onClick={() => { playClickSound(); handleUpdateStatus(task.id, "In Progress"); }}
                  className="px-2 py-1 rounded bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 hover:bg-indigo-950/80 text-[9px] font-bold font-mono transition cursor-pointer"
                  title="Chuyển sang Đang làm"
                >
                  Đang làm
                </button>
              )}
              {task.status !== "Completed" && (
                <button
                  onClick={() => { playClickSound(); handleUpdateStatus(task.id, "Completed"); }}
                  className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/80 text-[9px] font-bold font-mono transition cursor-pointer"
                  title="Hoàn thành nhiệm vụ"
                >
                  Xong ✓
                </button>
              )}
            </div>
          )}

          {/* Apply actions */}
          {!task.assignedTo && !isOwner && currentUser && (
            hasApplied ? (
              <span className="text-[10px] text-indigo-400 font-bold font-mono py-1">Đã ứng tuyển</span>
            ) : (
              applyingTaskId === task.id ? (
                <div className="w-full space-y-1.5 mt-1 text-left">
                  <input
                    type="text"
                    placeholder="Lời nhắn ngắn ứng tuyển..."
                    value={applyNote}
                    onChange={(e) => setApplyNote(e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-200 px-2 py-1 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => setApplyingTaskId(null)}
                      className="text-[9px] font-bold text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => { playClickSound(); handleApplyToTask(task.id); }}
                      className="text-[9px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2.5 py-1 cursor-pointer"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { playClickSound(); setApplyingTaskId(task.id); }}
                  className="text-[9.5px] font-bold text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-0.5 cursor-pointer ml-auto"
                >
                  Ứng tuyển <ChevronRight className="h-3 w-3" />
                </button>
              )
            )
          )}
        </div>

        {/* Applicant list for Owner to view and assign */}
        {isOwner && !task.assignedTo && task.applicants && task.applicants.length > 0 && (
          <div className="mt-3 border-t border-slate-900 pt-2.5 space-y-2 text-left">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-650" /> Danh sách ứng tuyển ({task.applicants.length}):
            </div>
            <div className="space-y-1.5">
              {task.applicants.map((applicant, aIdx) => (
                <div key={aIdx} className="rounded-lg bg-slate-900/60 p-2 border border-slate-850 space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <img src={applicant.userAvatar} alt={applicant.userName} className="h-5 w-5 rounded-full object-cover" />
                      <div className="text-[9.5px] font-bold text-slate-350">{applicant.userName}</div>
                    </div>
                    <button
                      onClick={() => { playClickSound(); handleAssignTask(task.id, applicant); }}
                      className="text-[9px] font-bold bg-indigo-650/40 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded cursor-pointer"
                    >
                      Giao việc
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal italic font-sans pl-1">
                    "{applicant.note}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        {expandedTasks[task.id] && (
          <div className="mt-3 border-t border-slate-900 pt-3 space-y-2.5 text-left">
            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Bình luận ({task.comments?.length || 0})</span>
              <button
                type="button"
                onClick={() => toggleExpandedComments(task.id)}
                className="text-[9px] text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                Thu gọn ✕
              </button>
            </div>

            {/* List of comments */}
            {task.comments && task.comments.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {(() => {
                  const sortedComments = [...task.comments].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                  );
                  const showAll = showAllComments[task.id];
                  const displayComments = showAll ? sortedComments : sortedComments.slice(-3);

                  return (
                    <>
                      {sortedComments.length > 3 && !showAll && (
                        <button
                          type="button"
                          onClick={() => setShowAllComments(prev => ({ ...prev, [task.id]: true }))}
                          className="w-full text-center text-[9px] text-indigo-400 hover:underline font-bold cursor-pointer font-sans mb-1"
                        >
                          Xem thêm {sortedComments.length - 3} bình luận khác...
                        </button>
                      )}

                      {displayComments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 items-start text-xs rounded bg-slate-900/40 p-2 border border-slate-900/60">
                          {comment.userAvatar ? (
                            <img src={comment.userAvatar} alt={comment.userName} className="h-5 w-5 rounded-full object-cover" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-indigo-950 flex items-center justify-center text-[9px] text-indigo-300 font-bold border border-indigo-900">
                              {comment.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-350 text-[10px] truncate">{comment.userName}</span>
                              <span className="text-[8.5px] text-slate-500 font-mono">
                                {new Date(comment.createdAt).toLocaleDateString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 break-words leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic pl-1 leading-normal">Chưa có bình luận nào cho nhiệm vụ này.</p>
            )}

            {/* Input comment */}
            {checkIsMember && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Nhập ý kiến bình luận..."
                  value={commentTexts[task.id] || ""}
                  onChange={(e) => setCommentTexts(prev => ({ ...prev, [task.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddComment(task.id);
                    }
                  }}
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-900 text-[10.5px] text-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => { playClickSound(); handleAddComment(task.id); }}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-1.5 transition cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-slate-850 bg-slate-900/25 rounded-2xl p-4 sm:p-5 mt-4 space-y-4">
      <div className="flex justify-between items-center gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4.5 w-4.5 text-indigo-400" />
          <div className="text-left">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">Bảng tiến độ công việc</h3>
            <p className="text-[10px] text-slate-500">Phân rã các đầu việc cần lập trình, art hoặc thiết kế âm thanh để thúc đẩy dự án.</p>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => { playClickSound(); setShowAddTask(!showAddTask); }}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.8 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm Nhiệm Vụ
          </button>
        )}
      </div>

      {/* Add Task Form modal/inline */}
      {showAddTask && (
        <form onSubmit={handleAddTask} className="bg-slate-950 rounded-xl border border-indigo-500/20 p-4 space-y-3.5 text-left">
          <h4 className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-wider">Tạo Nhiệm Vụ Mới</h4>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Tiêu đề nhiệm vụ</label>
              <input
                type="text"
                required
                placeholder="e.g. Vẽ Sprite Sheet nhân vật chính"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phân loại / Category</label>
              <select
                value={newTaskCat}
                onChange={(e) => setNewTaskCat(e.target.value as any)}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 focus:outline-none"
              >
                <option value="Code">Lập trình (Code)</option>
                <option value="Art">Đồ họa / Mỹ thuật (Art)</option>
                <option value="Sound">Nhạc & Âm thanh (Sound)</option>
                <option value="Design">Thiết kế game (Design)</option>
                <option value="Other">Khác (Other)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mức độ ưu tiên</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Thấp (Low)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="high">Cao (High)</option>
              </select>
            </div>

            <div>
              <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Hạn chót (Deadline)</label>
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="mt-1 w-full rounded bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mô tả nhiệm vụ</label>
            <textarea
              rows={2}
              placeholder="Chi tiết công việc cần hoàn thiện, timeline, hoặc yêu cầu chất lượng..."
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              className="mt-1 w-full rounded bg-slate-900 border border-slate-800 text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddTask(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="text-xs bg-indigo-650 hover:bg-indigo-650 text-white rounded-lg px-4.5 py-1.8 font-bold cursor-pointer transition"
            >
              Tạo mới
            </button>
          </div>
        </form>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TODO Column */}
        <div className="space-y-3.5 bg-slate-950/40 rounded-xl p-3.5 border border-slate-900">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" /> Cần Làm ({todoTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {todoTasks.length === 0 ? (
              <div className="text-[10px] text-slate-600 py-6 text-center italic border border-dashed border-slate-900 rounded-lg">Không có nhiệm vụ</div>
            ) : (
              todoTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="space-y-3.5 bg-slate-950/40 rounded-xl p-3.5 border border-slate-900">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400 animate-spin" /> Đang Làm ({inProgressTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {inProgressTasks.length === 0 ? (
              <div className="text-[10px] text-slate-600 py-6 text-center italic border border-dashed border-slate-900 rounded-lg">Không có nhiệm vụ</div>
            ) : (
              inProgressTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* COMPLETED Column */}
        <div className="space-y-3.5 bg-slate-950/40 rounded-xl p-3.5 border border-slate-900">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" /> Hoàn Thành ({completedTasks.length})
            </span>
          </div>
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="text-[10px] text-slate-600 py-6 text-center italic border border-dashed border-slate-900 rounded-lg">Không có nhiệm vụ</div>
            ) : (
              completedTasks.map(renderTaskCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
