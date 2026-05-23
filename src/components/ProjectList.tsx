import React, { useState } from "react";
import { Project, ProjectApplication, ProjectWorkspace } from "../types";
import ProjectCard from "./ProjectCard";
import { Search, Plus, ClipboardList, ArrowRight } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface ProjectListProps {
  projects: Project[];
  onOpenCreateForm: () => void;
  onAnalyzeMatch: (project: Project, setMatchResult: (res: any) => void) => void;
  analyzingProjectId: string | null;
  matchResults: Record<string, { text: string; matchedUsers: string[] }>;
  setMatchResultForProject: (projId: string, result: any) => void;
  currentUser: any;
  onCreateMeet: (targetName: string) => Promise<string | null>;
  onUpdateMeetLink: (projectId: string, link: string) => Promise<void>;
  onUpdateProject: (projectId: string, updatedFields: Partial<Project>) => Promise<void>;
  projectApplications: ProjectApplication[];
  projectWorkspaces: ProjectWorkspace[];
  onApplyForProject: (projectId: string, roleApplied: string, message: string) => Promise<void>;
  onOpenWorkspace: (projectId: string) => void;
}

export default function ProjectList({
  projects,
  onOpenCreateForm,
  onAnalyzeMatch,
  analyzingProjectId,
  matchResults,
  setMatchResultForProject,
  currentUser,
  onCreateMeet,
  onUpdateMeetLink,
  onUpdateProject,
  projectApplications,
  projectWorkspaces,
  onApplyForProject,
  onOpenWorkspace
}: ProjectListProps) {
  const [search, setSearch] = useState("");
  const [selectedEngine, setSelectedEngine] = useState("all");
  const [selectedCollab, setSelectedCollab] = useState("all");

  const engines = ["all", "Godot", "Unity", "Unreal Engine", "Phaser / WebGL", "GameMaker"];
  const myWorkspaces = currentUser
    ? projectWorkspaces
        .filter((workspace) => workspace.ownerId === currentUser.id || workspace.memberIds.includes(currentUser.id))
        .map((workspace) => ({
          workspace,
          project: projects.find((project) => project.id === workspace.id)
        }))
        .filter((item) => item.project)
    : [];

  const filtered = projects.filter((project) => {
    const keyword = search.toLowerCase();
    const matchesSearch =
      (project.title || "").toLowerCase().includes(keyword) ||
      (project.pitch || "").toLowerCase().includes(keyword) ||
      (project.description || "").toLowerCase().includes(keyword);
    const matchesEngine = selectedEngine === "all" || project.engine === selectedEngine;
    const matchesCollab = selectedCollab === "all" || (project.collabType || "").includes(selectedCollab);

    return matchesSearch && matchesEngine && matchesCollab;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-600" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/70">
              IndieCollab Platform
            </span>
          </div>
          <h1 className="text-xl font-black leading-tight tracking-tight text-white">
            Dự án &amp; Hợp tác phát triển
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Tìm đồng đội bằng AI - mô phỏng họp tiến độ nhóm - quản lý tiến độ dự án
          </p>
        </div>
        <button
          onClick={onOpenCreateForm}
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95"
          style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
        >
          <Plus className="h-3.5 w-3.5" /> Tạo Dự Án
        </button>
      </div>

      {myWorkspaces.length > 0 && (
        <section className="mt-6 rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] p-4">
          <div className="mb-3">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-200">
              <ClipboardList className="h-4 w-4" />
              Workspace của team
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Các không gian làm việc sẽ xuất hiện ở đây sau khi bạn được duyệt vào dự án.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {myWorkspaces.map(({ workspace, project }) => (
              <button
                key={workspace.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenWorkspace(workspace.id);
                }}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-cyan-500/40 hover:bg-slate-900/80"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{workspace.projectTitle || project?.title}</p>
                  <p className="mt-1 text-[10px] font-mono text-slate-500">
                    {workspace.memberIds.length} thành viên - {workspace.ownerId === currentUser?.id ? "Chủ dự án" : "Thành viên đã duyệt"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300" />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            placeholder="Tìm dự án, pitch, từ khóa..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-xs text-slate-200 transition focus:border-violet-500/40 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedEngine}
            onChange={(event) => setSelectedEngine(event.target.value)}
            className="cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="all">Tất cả Engine</option>
            {engines.filter((engine) => engine !== "all").map((engine) => (
              <option key={engine} value={engine}>{engine}</option>
            ))}
          </select>
          <select
            value={selectedCollab}
            onChange={(event) => setSelectedCollab(event.target.value)}
            className="cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="all">Mọi hình thức</option>
            <option value="Rev-Share">Rev-Share</option>
            <option value="Hobby">Hobby</option>
            <option value="Paid">Trả phí</option>
            <option value="Learning">Learning</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-white/[0.08] p-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-600/10">
            <Search className="h-6 w-6 text-violet-400/50" />
          </div>
          <p className="text-sm font-bold text-slate-400">Không tìm thấy dự án nào</p>
          <p className="mt-1 text-xs text-slate-600">Thử đổi bộ lọc hoặc tự tạo dự án mới</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isAnalyzing={analyzingProjectId === project.id}
              matchResult={matchResults[project.id] || null}
              onAnalyzeMatch={(item) => {
                onAnalyzeMatch(item, (result) => {
                  setMatchResultForProject(item.id, result);
                });
              }}
              currentUser={currentUser}
              onCreateMeet={onCreateMeet}
              onUpdateMeetLink={onUpdateMeetLink}
              onUpdateProject={onUpdateProject}
              projectApplications={projectApplications.filter((application) => application.projectId === project.id)}
              projectWorkspace={projectWorkspaces.find((workspace) => workspace.id === project.id)}
              onApplyForProject={onApplyForProject}
              onOpenWorkspace={onOpenWorkspace}
            />
          ))}
        </div>
      )}
    </div>
  );
}
