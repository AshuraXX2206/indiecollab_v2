import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Award, 
  ListTodo, 
  Calendar, 
  Users, 
  AlertTriangle 
} from "lucide-react";
import { ProjectWorkspace, WorkspaceMilestone, ProjectTask, ProjectGoal } from "../../types";

interface MilestoneTrackerProps {
  workspace: ProjectWorkspace;
  onUpdateWorkspace: (workspaceId: string, updatedFields: Partial<ProjectWorkspace>) => Promise<void>;
  onPostSysMessage?: (content: string) => void;
}

export default function MilestoneTracker({
  workspace,
  onUpdateWorkspace,
  onPostSysMessage
}: MilestoneTrackerProps) {
  // Creating Form State
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const milestonesList = workspace.milestones || [];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    const newMilestone: WorkspaceMilestone = {
      id: "miles-" + Date.now(),
      title: title.trim(),
      description: desc.trim() || undefined,
      deadline,
      status: "open",
      taskIds: selectedTasks,
      goalIds: selectedGoals,
      createdBy: "member",
      createdAt: new Date().toISOString()
    };

    const nextMilestones = [...milestonesList, newMilestone];
    await onUpdateWorkspace(workspace.id, { milestones: nextMilestones });

    setTitle("");
    setDesc("");
    setDeadline("");
    setSelectedTasks([]);
    setSelectedGoals([]);
    setShowCreate(false);

    if (onPostSysMessage) {
      onPostSysMessage(`🎯 Đột phá cột mốc mới đã được đặt ra: "${newMilestone.title}" (Hạn chót: ${new Date(newMilestone.deadline).toLocaleDateString("vi-VN")})`);
    }
  };

  const handleDeleteMilestone = async (id: string, name: string) => {
    if (!confirm("Bạn có chắc muốn xóa cột mốc này?")) return;
    const nextMilestones = milestonesList.filter(m => m.id !== id);
    await onUpdateWorkspace(workspace.id, { milestones: nextMilestones });

    if (onPostSysMessage) {
      onPostSysMessage(`🗑️ Cột mốc "${name}" đã được gỡ bỏ khỏi RoadMap.`);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: "open" | "closed", name: string) => {
    const nextStatus: "open" | "closed" = currentStatus === "open" ? "closed" : "open";
    const nextMilestones = milestonesList.map((m) => {
      if (m.id === id) {
        return { ...m, status: nextStatus };
      }
      return m;
    });
    await onUpdateWorkspace(workspace.id, { milestones: nextMilestones });

    if (onPostSysMessage && nextStatus === "closed") {
      onPostSysMessage(`🏆 Cột mốc thành công! Team đã hoàn thành cột mốc hành trình: "${name}"!`);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with trigger button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-400" />
            Lộ Trình Cột Mốc Quan Trọng
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Đặt điểm trung chuyển hành trình chính nhằm đẩy nhanh tốc độ phân phối và nghiệm thu rủi ro.</p>
        </div>
        <button 
          onClick={() => setShowCreate(prev => !prev)} 
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Khai phá Mốc Sprints
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreateSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">Đặt cột mốc chính</h3>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Tên cột mốc (ví dụ: Chạy Alpha Test)" 
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white outline-none focus:border-indigo-500" 
              required
            />
            <input 
              type="date" 
              value={deadline} 
              onChange={(e) => setDeadline(e.target.value)} 
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white outline-none focus:border-indigo-500" 
              required
            />
          </div>

          <textarea 
            value={desc} 
            onChange={(e) => setDesc(e.target.value)} 
            placeholder="Mô tả tiêu chuẩn nghiệm thu cột mốc..." 
            rows={2}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white outline-none focus:border-indigo-500" 
          />

          {/* Linked scopes */}
          <div className="grid gap-4 sm:grid-cols-2 mt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">Thừa kế đầu việc Kanban</label>
              <div className="border border-slate-850 rounded-xl bg-slate-950/20 max-h-[120px] overflow-y-auto p-2 space-y-1">
                {(workspace.tasks || []).length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic p-1">Trống</p>
                ) : (
                  (workspace.tasks || []).map((t) => (
                    <label key={t.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-900 cursor-pointer text-xs text-slate-300 truncate">
                      <input 
                        type="checkbox" 
                        checked={selectedTasks.includes(t.id)} 
                        onChange={() => toggleTaskSelection(t.id)} 
                        className="rounded border-slate-800"
                      />
                      <span className="truncate">{t.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">Thừa kế Mục tiêu cốt lõi</label>
              <div className="border border-slate-850 rounded-xl bg-slate-950/20 max-h-[120px] overflow-y-auto p-2 space-y-1">
                {(workspace.goals || []).length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic p-1">Trống</p>
                ) : (
                  (workspace.goals || []).map((g) => (
                    <label key={g.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-900 cursor-pointer text-xs text-slate-300 truncate">
                      <input 
                        type="checkbox" 
                        checked={selectedGoals.includes(g.id)} 
                        onChange={() => toggleGoalSelection(g.id)} 
                        className="rounded border-slate-800"
                      />
                      <span className="truncate">{g.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button 
              type="button" 
              onClick={() => setShowCreate(false)} 
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-300 hover:text-white transition cursor-pointer"
            >
              Hủy
            </button>
            <button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 text-xs font-bold transition cursor-pointer">
              Lưu cột mốc RoadMap
            </button>
          </div>
        </form>
      )}

      {/* Milestones list displays */}
      <div className="grid gap-4 md:grid-cols-2">
        {milestonesList.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-850 p-12 text-center text-slate-500">
            <Calendar className="h-10 w-10 text-slate-600 mx-auto mb-2.5" />
            <p className="text-xs">Chưa có cột mốc sprints nào được đặt ra cho Không gian này.</p>
          </div>
        ) : (
          milestonesList.map((m) => {
            const isCompleted = m.status === "closed";
            const isOverdue = !isCompleted && new Date(m.deadline) < new Date();
            
            // Calculate detailed progresses
            const totalItems = m.taskIds.length + m.goalIds.length;
            let finishedItems = 0;
            
            m.taskIds.forEach((tid) => {
              const matchedTask = workspace.tasks?.find(t => t.id === tid);
              if (matchedTask && matchedTask.status === "Completed") {
                finishedItems++;
              }
            });
            m.goalIds.forEach((gid) => {
              const matchedGoal = workspace.goals?.find(g => g.id === gid);
              if (matchedGoal && matchedGoal.status === "Done") {
                finishedItems++;
              }
            });

            const ratio = totalItems > 0 ? Math.round((finishedItems / totalItems) * 100) : 0;

            return (
              <div key={m.id} className={`rounded-2xl border bg-slate-900/15 p-5 flex flex-col justify-between hover:border-slate-700 transition duration-200 ${
                isCompleted ? "border-emerald-500/20 bg-emerald-950/2" : "border-slate-850"
              }`}>
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-slate-850/60 pb-3">
                    <div>
                      <span className={`text-[9px] font-mono px-1.8 py-0.5 rounded border uppercase font-bold tracking-wide ${
                        isCompleted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : isOverdue ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                        {isCompleted ? "Đã cán đích" : isOverdue ? "Trễ hạn sấy" : "Đang thực hiện"}
                      </span>
                      <h3 className="text-sm font-black text-white mt-1.8">{m.title}</h3>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleToggleStatus(m.id, m.status, m.title)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isCompleted ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                        }`}
                        title={isCompleted ? "Mở lại cột mốc" : "Đánh dấu hoàn thành"}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteMilestone(m.id, m.title)} 
                        className="p-1.5 rounded-lg border border-slate-850 bg-slate-950 hover:bg-slate-900 text-rose-400 cursor-pointer"
                        title="Xóa cột mốc"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {m.description && <p className="text-xs text-slate-400 leading-relaxed mt-3.5 max-w-sm">{m.description}</p>}

                  {/* Progressive ratio */}
                  {totalItems > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[10.5px] font-mono mb-1.5">
                        <span className="text-slate-500">Mức hoàn thành ({finishedItems}/{totalItems})</span>
                        <span className="font-bold text-white">{ratio}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                        <div className={`h-full transition-all duration-400 ${isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`} style={{ width: `${ratio}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-850/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Hạn: {new Date(m.deadline).toLocaleDateString("vi-VN")}
                  </span>
                  <span>Sự kiện: {m.taskIds.length} tasks</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
