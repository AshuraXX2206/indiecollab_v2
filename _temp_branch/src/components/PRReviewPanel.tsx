import React, { useState, useEffect } from "react";
import {
  X,
  GitPullRequest,
  GitCommit,
  FileCode,
  MessageSquare,
  CheckCircle,
  XCircle,
  GitMerge,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { GitHubPR, GitHubCommit, GitHubFile, GitHubReview, GitHubComment, fetchPullRequest, fetchPRCommits, fetchPRFiles, fetchPRReviews, fetchPRComments, parseRepoUrl } from "../services/github";
import { getAccessToken } from "../firebase";

interface PRReviewPanelProps {
  prUrl: string;
  isOpen: boolean;
  onClose: () => void;
  readonly?: boolean;
}

export default function PRReviewPanel({
  prUrl,
  isOpen,
  onClose,
  readonly = false
}: PRReviewPanelProps) {
  const [pr, setPR] = useState<GitHubPR | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [reviews, setReviews] = useState<GitHubReview[]>([]);
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "commits" | "files">("overview");
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !prUrl) return;
    loadPRData();
  }, [isOpen, prUrl]);

  const loadPRData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Cần đăng nhập GitHub");
        setIsLoading(false);
        return;
      }

      const parsed = parseRepoUrl(prUrl);
      if (!parsed) {
        setError("URL không hợp lệ");
        setIsLoading(false);
        return;
      }

      const prMatch = prUrl.match(/\/pull\/(\d+)/);
      if (!prMatch) {
        setError("Không tìm thấy PR");
        setIsLoading(false);
        return;
      }

      const prNumber = parseInt(prMatch[1], 10);
      const { owner, repo } = parsed;

      const [prData, commitsData, filesData, reviewsData, commentsData] = await Promise.all([
        fetchPullRequest(token, owner, repo, prNumber),
        fetchPRCommits(token, owner, repo, prNumber),
        fetchPRFiles(token, owner, repo, prNumber),
        fetchPRReviews(token, owner, repo, prNumber),
        fetchPRComments(token, owner, repo, prNumber)
      ]);

      setPR(prData);
      setCommits(commitsData);
      setFiles(filesData);
      setReviews(reviewsData);
      setComments(commentsData);
    } catch (err) {
      setError("Lỗi tải PR: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFile = (filename: string) => {
    const newSet = new Set(expandedFiles);
    if (newSet.has(filename)) newSet.delete(filename);
    else newSet.add(filename);
    setExpandedFiles(newSet);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = () => {
    if (!pr) return null;
    if (pr.merged) return <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full">Merged</span>;
    if (pr.state === "closed") return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full">Closed</span>;
    if (pr.draft) return <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-[10px] rounded-full">Draft</span>;
    return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">Open</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <GitPullRequest className={`h-5 w-5 ${pr?.merged ? "text-purple-500" : pr?.state === "open" ? "text-green-500" : "text-red-500"}`} />
            <div>
              <h2 className="text-sm font-bold text-slate-200 line-clamp-1">{pr?.title || "Loading..."}</h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>#{pr?.number}</span>
                <span>by {pr?.user?.login}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <a href={pr?.html_url || prUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200">
              <ExternalLink className="h-4 w-4" />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {pr && (
          <div className="flex items-center gap-4 px-5 py-2 border-b border-slate-800 bg-slate-950/50 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <GitCommit className="h-3.5 w-3.5" /> {commits.length} commits
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <FileCode className="h-3.5 w-3.5" /> {files.length} files
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Plus className="h-3.5 w-3.5" /> +{pr.additions}
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <Minus className="h-3.5 w-3.5" /> -{pr.deletions}
            </span>
            <span className="ml-auto text-slate-500">{formatDate(pr.updated_at)}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {(["overview", "commits", "files"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-[11px] font-medium transition ${
                activeTab === tab
                  ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "overview" && "Tổng quan"}
              {tab === "commits" && `Commits (${commits.length})`}
              {tab === "files" && `Files (${files.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-rose-400">
              <XCircle className="h-6 w-6 mr-2" /> {error}
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {pr?.body && (
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Mô tả</h3>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{pr.body}</p>
                    </div>
                  )}

                  {reviews.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Reviews</h3>
                      {reviews.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 py-1">
                          <img src={r.user.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                          <span className="text-xs text-slate-300">{r.user.login}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            r.state === "APPROVED" ? "bg-emerald-500/20 text-emerald-400" :
                            r.state === "CHANGES_REQUESTED" ? "bg-amber-500/20 text-amber-400" :
                            "bg-slate-500/20 text-slate-400"
                          }`}>{r.state}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {comments.length > 0 && (
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Comments</h3>
                      {comments.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex gap-2 py-1.5 border-b border-slate-800/50 last:border-0">
                          <img src={c.user.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-300">{c.user.login}</span>
                              <span className="text-[9px] text-slate-500">{formatDate(c.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "commits" && (
                <div className="space-y-1">
                  {commits.map((commit) => (
                    <div key={commit.sha} className="flex items-center gap-2 p-2 bg-slate-900/30 rounded-lg border border-slate-800/50">
                      <img src={commit.author?.avatar_url || ""} alt="" className="h-5 w-5 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 truncate">{commit.commit.message.split("\n")[0]}</p>
                        <p className="text-[9px] text-slate-500">{commit.sha.slice(0, 7)} • {formatDate(commit.commit.author.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "files" && (
                <div className="space-y-1">
                  {files.map((file) => (
                    <div key={file.filename} className="border border-slate-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFile(file.filename)}
                        className="w-full flex items-center justify-between p-2 bg-slate-900/50 hover:bg-slate-800/50 transition"
                      >
                        <div className="flex items-center gap-2">
                          {expandedFiles.has(file.filename) ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
                          <span className="text-xs text-slate-300 font-mono truncate">{file.filename}</span>
                          <span className={`text-[9px] px-1.5 rounded ${
                            file.status === "added" ? "bg-emerald-500/20 text-emerald-400" :
                            file.status === "removed" ? "bg-red-500/20 text-red-400" :
                            "bg-amber-500/20 text-amber-400"
                          }`}>{file.status}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-emerald-400">+{file.additions}</span>
                          <span className="text-rose-400">-{file.deletions}</span>
                        </div>
                      </button>
                      {expandedFiles.has(file.filename) && file.patch && (
                        <div className="p-2 bg-slate-950 overflow-x-auto">
                          <pre className="text-[10px] font-mono leading-tight">
                            {file.patch.split("\n").slice(0, 50).map((line, i) => {
                              let color = "text-slate-400";
                              if (line.startsWith("+")) color = "text-emerald-400";
                              else if (line.startsWith("-")) color = "text-rose-400";
                              else if (line.startsWith("@@")) color = "text-amber-400";
                              return <div key={i} className={color}>{line.slice(0, 100)}</div>;
                            })}
                            {file.patch.split("\n").length > 50 && (
                              <div className="text-slate-500 italic">... {file.patch.split("\n").length - 50} more lines</div>
                            )}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
