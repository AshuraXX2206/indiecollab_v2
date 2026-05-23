import React, { useState, lazy } from "react";
import { User, BountyTask, ExclusiveAsset } from "../types";
import { 
  Plus, 
  Gift, 
  Flame, 
  Search, 
  DollarSign, 
  Check, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Tag, 
  Clock, 
  User as UserIcon, 
  HelpCircle,
  Database,
  RefreshCw,
  Code2,
  Brush,
  GitPullRequest,
  Eye,
  Archive,
  Download,
  UploadCloud
} from "lucide-react";
import { auth, storage } from "../firebase";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

const PRReviewPanel = lazy(() => import("./PRReviewPanel"));

const MAX_ASSET_ARCHIVE_BYTES = 50 * 1024 * 1024;
const ALLOWED_ASSET_ARCHIVE_EXTENSIONS = [".zip", ".rar", ".7z", ".tar", ".gz", ".tgz"];
const ALLOWED_ASSET_ARCHIVE_CONTENT_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
  "application/gzip",
  "application/x-gzip",
  "application/x-tar",
  "application/octet-stream"
];

const isValidAssetArchive = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return ALLOWED_ASSET_ARCHIVE_EXTENSIONS.some(ext => lowerName.endsWith(ext))
    && file.size > 0
    && file.size <= MAX_ASSET_ARCHIVE_BYTES
    && (!file.type || ALLOWED_ASSET_ARCHIVE_CONTENT_TYPES.includes(file.type));
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const sanitizeStorageFileName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "asset.zip";
};

const isGithubPullRequestUrl = (url: string) => {
  return /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+(?:[/?#].*)?$/i.test(url.trim());
};

interface CoopMarketProps {
  currentUser: User;
  bounties: BountyTask[];
  assets: ExclusiveAsset[];
  onAddBounty: (bounty: BountyTask) => Promise<void>;
  onClaimBounty: (bountyId: string) => Promise<void>;
  onSubmitBountyReview: (bountyId: string, githubPrUrl: string, solutionNotes: string) => Promise<void>;
  onSolveBounty: (bountyId: string) => Promise<void>;
  onRejectBountyReview: (bountyId: string) => Promise<void>;
  onApplyArbitrationVerdict: (bountyId: string, verdict: "APPROVED" | "REJECTED", explanation: string) => Promise<void>;
  onAddAsset: (asset: ExclusiveAsset) => Promise<void>;
  onBuyAsset: (assetId: string, projectId: string, projectTitle: string) => Promise<void>;
  userProjects: { id: string; title: string }[];
  connections: import("../types").UserConnection[];
  pendingConnectionCount: number;
}

export default function CoopMarket({
  currentUser,
  bounties,
  assets,
  onAddBounty,
  onClaimBounty,
  onSubmitBountyReview,
  onSolveBounty,
  onRejectBountyReview,
  onApplyArbitrationVerdict,
  onAddAsset,
  onBuyAsset,
  userProjects,
  connections,
  pendingConnectionCount
}: CoopMarketProps) {
  const [subTab, setSubTab] = useState<"bounty" | "market" | "verify">("bounty");

  // Bounty state managers
  const [showBountyForm, setShowBountyForm] = useState(false);
  const [bountyExternalProject, setBountyExternalProject] = useState(false);
  const [customProjectTitle, setCustomProjectTitle] = useState("");
  const [bountyRepositoryUrl, setBountyRepositoryUrl] = useState("");
  const [repoPrivacy, setRepoPrivacy] = useState<"public" | "private">("public");
  const [repoAccessMethod, setRepoAccessMethod] = useState<"collaborator_invite" | "snippet_only" | "fork_branch" | "nda_required">("collaborator_invite");
  const [bountyTitle, setBountyTitle] = useState("");
  const [bountyDescription, setBountyDescription] = useState("");
  const [bountyBugDetails, setBountyBugDetails] = useState("");
  const [bountyDifficulty, setBountyDifficulty] = useState<BountyTask["difficulty"]>("Medium");
  const [bountyReward, setBountyReward] = useState("");
  const [bountyProjectId, setBountyProjectId] = useState("");

  // Hunter PR Submission states
  const [submitBountyForReviewId, setSubmitBountyForReviewId] = useState<string | null>(null);
  const [submittingPrUrl, setSubmittingPrUrl] = useState("");
  const [submittingNotes, setSubmittingNotes] = useState("");

  // Dispute & AI Arbitration states
  const [arbitratingBounty, setArbitratingBounty] = useState<BountyTask | null>(null);
  const [isArbitratingLoading, setIsArbitratingLoading] = useState(false);
  const [arbitrationVerdict, setArbitrationVerdict] = useState<string | null>(null);

  // PR Review Panel states
  const [prReviewOpen, setPrReviewOpen] = useState(false);
  const [prReviewUrl, setPrReviewUrl] = useState("");

  // Asset state managers
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetTitle, setAssetTitle] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetType, setAssetType] = useState<ExclusiveAsset["mediaType"]>("Sprite Sheet");
  const [assetUrl, setAssetUrl] = useState("");
  const [assetPrice, setAssetPrice] = useState("");
  const [assetArchiveFile, setAssetArchiveFile] = useState<File | null>(null);
  const [isAssetUploading, setIsAssetUploading] = useState(false);

  // Verify state
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<{
    found: boolean;
    asset?: ExclusiveAsset;
    bounty?: BountyTask;
    searched: boolean;
  }>({ found: false, searched: false });

  // Purchase Modal State
  const [selectedAssetForBuy, setSelectedAssetForBuy] = useState<ExclusiveAsset | null>(null);
  const [targetProjectIdForBuy, setTargetProjectIdForBuy] = useState("");

  // Filter keys
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Submit Bounty Task
  const handleSubmitBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bountyExternalProject && !customProjectTitle) {
      alert("Vui lòng nhập Tên dự án ngoài!");
      return;
    }
    if (!bountyExternalProject && !bountyProjectId) {
      alert("Vui lòng chọn hoặc nhập dự án cần sửa đổi!");
      return;
    }
    if (!bountyTitle || !bountyDescription || !bountyReward) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    const resolvedProjectId = bountyExternalProject ? "ext-" + Date.now() : bountyProjectId;
    let resolvedProjectTitle = "";
    if (bountyExternalProject) {
      resolvedProjectTitle = customProjectTitle;
    } else {
      const selectedProj = userProjects.find(p => p.id === bountyProjectId);
      resolvedProjectTitle = selectedProj ? selectedProj.title : "Dự án Game Jam";
    }

    const newBounty: BountyTask = {
      id: "bounty-" + Date.now(),
      projectId: resolvedProjectId,
      projectTitle: resolvedProjectTitle,
      title: bountyTitle,
      difficulty: bountyDifficulty,
      reward: bountyReward,
      description: bountyDescription,
      bugDetails: bountyBugDetails,
      reportedBy: currentUser.displayName,
      reportedById: currentUser.id,
      status: "Open",
      createdAt: new Date().toISOString(),
      repositoryUrl: bountyRepositoryUrl.trim() || undefined,
      repoPrivacy: repoPrivacy || "public",
      repoAccessMethod: repoAccessMethod || "collaborator_invite"
    };

    await onAddBounty(newBounty);
    
    // Reset fields
    setBountyTitle("");
    setBountyDescription("");
    setBountyBugDetails("");
    setBountyReward("");
    setBountyProjectId("");
    setCustomProjectTitle("");
    setBountyRepositoryUrl("");
    setRepoPrivacy("public");
    setRepoAccessMethod("collaborator_invite");
    setShowBountyForm(false);
  };

  // Submit PR Solution and Notes for review
  const handlePerformBountyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitBountyForReviewId) return;
    if (!isGithubPullRequestUrl(submittingPrUrl)) {
      alert("Please submit a valid GitHub Pull Request URL, for example https://github.com/org/repo/pull/12.");
      return;
    }
    if (!submittingNotes || submittingNotes.length < 15) {
      alert("Vui lòng mô tả chi tiết giải pháp (tối thiểu 15 ký tự) để chủ dự án dễ dàng thẩm định!");
      return;
    }

    await onSubmitBountyReview(submitBountyForReviewId, submittingPrUrl, submittingNotes);
    setSubmitBountyForReviewId(null);
    setSubmittingPrUrl("");
    setSubmittingNotes("");
  };

  const handleArbitrateDispute = async (bounty: BountyTask) => {
    if (bounty.reportedById !== currentUser.id) {
      alert("Only the bounty owner can apply an arbitration verdict.");
      return;
    }
    if (!bounty.githubPrUrl) {
      alert("Chỉ có thể kích hoạt Trọng tài AI khi có ít nhất một GitHub Pull Request được lập trình viên gửi lên làm bằng chứng sửa lỗi!");
      return;
    }
    setArbitratingBounty(bounty);
    setIsArbitratingLoading(true);
    setArbitrationVerdict(null);

    try {
      // Build auth headers for AI API call
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
        } catch (e) { /* token unavailable */ }
      }

      const res = await fetch("/api/ai/arbitrate-bounty", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: bounty.title,
          description: bounty.description,
          bugDetails: bounty.bugDetails,
          githubPrUrl: bounty.githubPrUrl || "",
          solutionNotes: bounty.solutionNotes || "",
          creatorFeedback: bounty.rejectionReason || ""
        })
      });

      const data = await res.json();
      if (data.success) {
        setArbitrationVerdict(data.reasoning);
        await onApplyArbitrationVerdict(bounty.id, data.verdict as "APPROVED" | "REJECTED", data.reasoning);
      } else {
        alert("Lỗi phân định: " + (data.error || "Không thể kết nối với Warden AI"));
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi vận hành Trọng tài AI.");
    } finally {
      setIsArbitratingLoading(false);
    }
  };

  // 2. Submit Asset Registration
  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTitle || !assetDescription || !assetPrice) {
      alert("Please fill all required asset fields.");
      return;
    }
    if (!assetArchiveFile) {
      alert("Asset package is required. Upload a compressed .zip/.rar/.7z/.tar/.gz/.tgz file.");
      return;
    }
    if (!isValidAssetArchive(assetArchiveFile)) {
      alert("Invalid asset package. Use a compressed archive up to 50MB.");
      return;
    }
    if (auth.currentUser?.uid !== currentUser.id) {
      alert("Your Firebase session does not match the active profile. Please sign in again.");
      return;
    }

    const resolvedUrl = assetUrl.trim() || (
      assetType === "Sprite Sheet"
        ? "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80"
        : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"
    );

    const assetId = "asset-" + Date.now();
    const archiveFileName = sanitizeStorageFileName(assetArchiveFile.name);
    const archiveStoragePath = `exclusive-assets/${currentUser.id}/${assetId}/${Date.now()}-${archiveFileName}`;

    setIsAssetUploading(true);
    try {
      await uploadBytes(ref(storage, archiveStoragePath), assetArchiveFile, {
        contentType: assetArchiveFile.type || "application/octet-stream",
        customMetadata: {
          assetId,
          artistId: currentUser.id,
          originalName: archiveFileName
        }
      });

      const newAsset: ExclusiveAsset = {
        id: assetId,
        title: assetTitle,
        artistId: currentUser.id,
        artistName: currentUser.displayName,
        mediaType: assetType,
        description: assetDescription,
        mediaUrl: resolvedUrl,
        price: assetPrice,
        sold: false,
        createdAt: new Date().toISOString(),
        archiveStoragePath,
        archiveFileName,
        archiveFileSize: assetArchiveFile.size,
        archiveContentType: assetArchiveFile.type || "application/octet-stream"
      };

      try {
        await onAddAsset(newAsset);
      } catch (err) {
        await deleteObject(ref(storage, archiveStoragePath)).catch(() => undefined);
        throw err;
      }

      setAssetTitle("");
      setAssetDescription("");
      setAssetUrl("");
      setAssetPrice("");
      setAssetArchiveFile(null);
      setShowAssetForm(false);
    } finally {
      setIsAssetUploading(false);
    }
  };

  const handleDownloadAssetArchive = async (asset: ExclusiveAsset) => {
    if (!asset.archiveStoragePath) {
      alert("This asset does not have a downloadable archive package.");
      return;
    }
    if (currentUser.id !== asset.artistId && currentUser.id !== asset.buyerId) {
      alert("Only the artist or confirmed buyer can download this archive.");
      return;
    }

    const url = await getDownloadURL(ref(storage, asset.archiveStoragePath));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // 3. Complete Purchase of Exclusive Asset
  const handleConfirmPurchase = async () => {
    if (!selectedAssetForBuy || !targetProjectIdForBuy) {
      alert("Vui lòng lựa chọn dự án sẽ áp dụng tài nguyên này!");
      return;
    }

    const matchedProj = userProjects.find(p => p.id === targetProjectIdForBuy);
    const projTitle = matchedProj ? matchedProj.title : "Dự án mới";

    await onBuyAsset(selectedAssetForBuy.id, targetProjectIdForBuy, projTitle);
    setSelectedAssetForBuy(null);
    setTargetProjectIdForBuy("");
    alert(`🎉 Chúc mừng! Bạn đã sở hữu độc bản tác phẩm "${selectedAssetForBuy.title}". Tác phẩm đã được mã hóa vào dự án của bạn và khóa bán vĩnh viễn trên toàn cầu!`);
  };

  // 4. Verify original assets or transaction codes
  const handleVerifyLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const query = verifyId.trim().toLowerCase();
    if (!query) return;

    // Search in assets by ID or transaction ID
    const foundAsset = assets.find(
      a => a.id.toLowerCase() === query || (a.transactionId && a.transactionId.toLowerCase() === query)
    );

    // Search in bounties by ID
    const foundBounty = bounties.find(
      b => b.id.toLowerCase() === query
    );

    if (foundAsset) {
      setVerifyResult({
        found: true,
        asset: foundAsset,
        searched: true
      });
    } else if (foundBounty) {
      setVerifyResult({
        found: true,
        bounty: foundBounty,
        searched: true
      });
    } else {
      setVerifyResult({
        found: false,
        searched: true
      });
    }
  };

  // Filters
  const filteredBounties = bounties.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssets = assets.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 relative">
      
      {/* Dynamic Tab Headers */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Gift className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-white uppercase tracking-tight font-mono">Săn Bug & Chợ Asset Game</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Nơi đăng nhiệm vụ tìm bug game nhận phần thưởng hấp dẫn, đồng thời mua bán các asset Sprite Sheet & 3D Model độc bản cho dự án của bạn.
          </p>
        </div>
 
        {/* Action controllers */}
        <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setSubTab("bounty"); setSearchTerm(""); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${subTab === "bounty" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Code2 className="h-3.5 w-3.5" /> Săn Bug
          </button>
          <button
            onClick={() => { setSubTab("market"); setSearchTerm(""); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${subTab === "market" ? "bg-pink-600 text-white shadow-md shadow-pink-500/10" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Brush className="h-3.5 w-3.5" /> Chợ Asset Độc Bản
          </button>
          <button
            onClick={() => { setSubTab("verify"); setVerifyResult({ found: false, searched: false }); setVerifyId(""); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer ${subTab === "verify" ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10" : "text-slate-400 hover:text-slate-200"}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Xác Minh Bản Quyền
          </button>
        </div>
      </div>

      {/* SEARCH AND CONTROL LINE */}
      {subTab !== "verify" && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-6">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder={subTab === "bounty" ? "Tìm theo tên Bug, dự án..." : "Tìm Sprite, 3D Model, Tác giả..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs text-white rounded-xl border border-slate-800 bg-slate-900/50 pl-9 pr-4 py-2.5 focus:border-indigo-500 focus:outline-none transition font-mono"
            />
          </div>

          <div className="w-full sm:w-auto flex justify-end">
            {subTab === "bounty" ? (
              <button
                onClick={() => {
                  setShowBountyForm(true);
                  if (userProjects.length === 0) {
                    setBountyExternalProject(true);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Plus className="h-4 w-4" /> Đăng Bounty Tìm Bug
              </button>
            ) : (
              <button
                onClick={() => setShowAssetForm(true)}
                className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-pink-500/20"
              >
                <Plus className="h-4 w-4" /> Đăng Bán Asset Game
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTAINER VIEWPORT */}

      {/* 1. BOUNTY BOARD */}
      {subTab === "bounty" && (
        <div className="mt-8 space-y-6">
          {/* Form Modal */}
          {showBountyForm && (
            <div className="bg-slate-900/80 border border-slate-850 p-6 rounded-2xl max-w-2xl mx-auto space-y-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-indigo-400 font-mono uppercase">🎯 Treo Thưởng Săn Bug</h3>
                <button 
                  onClick={() => setShowBountyForm(false)} 
                  className="text-slate-400 hover:text-white text-xs underline font-mono"
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={handleSubmitBounty} className="space-y-4 text-left">
                {/* Visual Choice between Sảnh projects or External project */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Dự Án Sửa Lỗi</label>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                    <button
                      type="button"
                      onClick={() => setBountyExternalProject(false)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${!bountyExternalProject ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                      disabled={userProjects.length === 0}
                    >
                      Dự án của bạn ({userProjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBountyExternalProject(true)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${bountyExternalProject ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      Dự án ngoài / GitHub Repository
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!bountyExternalProject ? (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Lựa Chọn Dự Án</label>
                      <select
                        value={bountyProjectId}
                        onChange={(e) => setBountyProjectId(e.target.value)}
                        required={!bountyExternalProject}
                        className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Lựa chọn dự án của bạn --</option>
                        {userProjects.map(proj => (
                          <option key={proj.id} value={proj.id}>{proj.title}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Tên Dự Án Ngoài</label>
                      <input
                        type="text"
                        placeholder="e.g. Flappy Bird Go, Samurai Battle Jam..."
                        value={customProjectTitle}
                        onChange={(e) => setCustomProjectTitle(e.target.value)}
                        required={bountyExternalProject}
                        className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Mức Phần Thưởng</label>
                    <input
                      type="text"
                      placeholder="vd: 50 XP + $200 Coin, Chia 2% Rev-Share..."
                      value={bountyReward}
                      onChange={(e) => setBountyReward(e.target.value)}
                      required
                      className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {bountyExternalProject && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-indigo-400 uppercase font-mono">Link Code / GitHub Repository (Tùy chọn)</label>
                      <input
                        type="url"
                        placeholder="https://github.com/username/your-game-repo"
                        value={bountyRepositoryUrl}
                        onChange={(e) => setBountyRepositoryUrl(e.target.value)}
                        className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Repository Privacy Settings */}
                    {bountyRepositoryUrl && (
                      <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Repository Privacy</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setRepoPrivacy("public")}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition ${
                                repoPrivacy === "public"
                                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              🔓 Public Repo
                            </button>
                            <button
                              type="button"
                              onClick={() => setRepoPrivacy("private")}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium transition ${
                                repoPrivacy === "private"
                                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              🔒 Private Repo
                            </button>
                          </div>
                        </div>

                        {repoPrivacy === "private" && (
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Access Method for Hunter</label>
                            <select
                              value={repoAccessMethod}
                              onChange={(e) => setRepoAccessMethod(e.target.value as any)}
                              className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="collaborator_invite">📧 GitHub Collaborator Invite (Recommended)</option>
                              <option value="snippet_only">📎 Share Code Snippet Only</option>
                              <option value="fork_branch">🌿 Create Fork/Branch Access</option>
                              <option value="nda_required">🤝 Require NDA + Direct Access</option>
                            </select>
                            <p className="text-[9px] text-slate-500">
                              {repoAccessMethod === "collaborator_invite" && "You'll invite the hunter as a GitHub collaborator when they claim the bounty."}
                              {repoAccessMethod === "snippet_only" && "Share only the relevant code sections via private message, not full repo access."}
                              {repoAccessMethod === "fork_branch" && "Create a separate branch or fork for the hunter to work on."}
                              {repoAccessMethod === "nda_required" && "Require signed NDA before granting full repository access."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Tiêu Đề / Tên Lỗi Bug</label>
                  <input
                    type="text"
                    placeholder="vd: Crash Game khi click vào màn hình load, Lỗi rách vân bề mặt..."
                    value={bountyTitle}
                    onChange={(e) => setBountyTitle(e.target.value)}
                    required
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Mô Tả Khái Quát Lỗi</label>
                  <textarea
                    placeholder="Mô tả tóm tắt sự cố đang cản trở tiến độ của đội..."
                    rows={2}
                    value={bountyDescription}
                    onChange={(e) => setBountyDescription(e.target.value)}
                    required
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Chi tiết kỹ thuật / Logs / Code lỗi (Để các nhà phát triển khác tìm phương án sửa)</label>
                  <textarea
                    placeholder="Dán Logs lỗi hoặc chi tiết môi trường test (Engine Godot, Unity, WebGL...)..."
                    rows={4}
                    value={bountyBugDetails}
                    onChange={(e) => setBountyBugDetails(e.target.value)}
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Độ Khó Đánh Giá</label>
                  <div className="flex gap-2">
                    {["Easy", "Medium", "Hard", "Legendary"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setBountyDifficulty(lvl as any)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold font-mono transition border cursor-pointer ${bountyDifficulty === lvl ? "bg-indigo-600/20 text-indigo-400 border-indigo-500" : "bg-slate-950 border-slate-800 text-slate-500"}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-xs font-bold transition font-mono uppercase tracking-wide cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  Treo Thưởng Toàn Sảnh Game Jam
                </button>
              </form>
            </div>
          )}

          {/* Bounty Item List */}
          {filteredBounties.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-900 rounded-3xl bg-slate-950/20">
              <Package className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-400 font-mono">Chưa tìm thấy lỗi Bug Bounty nào phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">Đăng ký dự án game của bạn và đăng báo lỗi treo thưởng để kêu cứu các cao thủ sảnh game hỗ trợ giải cứu code lỗi!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBounties.map((bounty) => (
                <div 
                  key={bounty.id}
                  className={`bg-slate-900/40 border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${bounty.status === "Solved" ? "border-emerald-950/40 bg-emerald-950/5 opacity-70" : bounty.status === "Claimed" ? "border-amber-900/30 bg-amber-950/5" : "border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70 shadow-lg"}`}
                >
                  {/* Difficulty Tag */}
                  <div className="absolute top-5 right-5 flex gap-1.5 items-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-widest ${
                      bounty.difficulty === "Legendary" ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" :
                      bounty.difficulty === "Hard" ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" :
                      bounty.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {bounty.difficulty}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                      bounty.status === "Solved" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                      bounty.status === "Claimed" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                      "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}>
                      {bounty.status === "Solved" ? "Đã sửa hoàn toàn" : bounty.status === "Claimed" ? "Đang xử lý" : "SẴN SÀNG SĂN"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-indigo-400 font-mono block mb-1">🎯 Dự án: {bounty.projectTitle}</span>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition font-mono tracking-tight">{bounty.title}</h3>
                    <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">{bounty.description}</p>
                    
                    {bounty.bugDetails && (
                      <div className="mt-3.5 bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap text-left">
                        {bounty.bugDetails}
                      </div>
                    )}

                    {/* Repository link if provided */}
                    {bounty.repositoryUrl && (
                      <div className="mt-3.5 flex items-center gap-1.5 text-[10.5px] font-mono text-indigo-400">
                        <span>📁 Repo gốc:</span>
                        <a href={bounty.repositoryUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-300 truncate max-w-xs">{bounty.repositoryUrl}</a>
                      </div>
                    )}

                    {/* Escrow Guarantee alert */}
                    <div className="mt-3 bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl text-[10.5px] text-slate-400 flex items-center justify-between gap-2 text-left">
                      <span className="flex items-center gap-1.5">
                        <span className="text-emerald-500 animate-pulse">🔒</span>
                        <span>Quỹ thưởng đã được Ký Quỹ (Escrow locked)</span>
                      </span>
                      <span className="text-[9px] bg-slate-950 text-indigo-400 px-1.5 py-0.5 rounded font-mono uppercase">Vault Protected</span>
                    </div>

                    {/* Show PR solution details if in review or solved */}
                    {bounty.githubPrUrl && (
                      <div className="mt-4 bg-slate-950/90 p-4 rounded-xl border border-indigo-500/20 text-left space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider flex items-center gap-1">
                            <span>🛠️ PR VAULT SOLUTION</span>
                          </span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10 font-mono">Bằng chứng thực tế</span>
                        </div>
                        <div className="text-xs flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-400 font-mono text-[10.5px]">Pull Request:</span>{" "}
                            <a href={bounty.githubPrUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-mono hover:underline break-all">{bounty.githubPrUrl}</a>
                          </div>
                          <button
                            onClick={() => {
                              setPrReviewUrl(bounty.githubPrUrl!);
                              setPrReviewOpen(true);
                            }}
                            className="ml-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 rounded-lg text-[10px] font-medium transition border border-indigo-500/30"
                          >
                            <Eye className="h-3 w-3" />
                            Xem chi tiết
                          </button>
                        </div>
                        {bounty.solutionNotes && (
                          <div className="text-[11px] text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
                            <strong className="block text-[9px] text-slate-500 font-mono uppercase mb-1">Giải trình kỹ thuật:</strong>
                            <p className="whitespace-pre-wrap">{bounty.solutionNotes}</p>
                          </div>
                        )}
                        {bounty.arbitrationResult && (
                          <div className="text-[11px] text-amber-300 bg-indigo-950/20 p-2.5 rounded-lg border border-amber-500/20">
                            <strong>⚖️ Trực tiếp Trọng tài AI:</strong>
                            <div className="mt-1 whitespace-pre-wrap text-slate-300 antialiased leading-relaxed text-[10px]">{bounty.arbitrationResult}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer Action of Card */}
                  <div className="mt-5 pt-4 border-t border-slate-850/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-pink-400 font-mono text-xs font-black">
                      <Gift className="h-4 w-4 shrink-0" />
                      Thưởng: {bounty.reward}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {bounty.status === "Open" && bounty.reportedById !== currentUser.id && bounty.reportedBy !== currentUser.displayName && (
                        <button
                          onClick={() => onClaimBounty(bounty.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] font-mono tracking-wider uppercase py-1.5 px-3 rounded-lg transition shrink-0 cursor-pointer"
                        >
                          Nhận Sửa Lỗi
                        </button>
                      )}

                      {bounty.status === "Open" && (bounty.reportedById === currentUser.id || bounty.reportedBy === currentUser.displayName) && (
                        <span className="text-[10px] text-indigo-400 font-mono italic">Bounty của bạn đang tuyển...</span>
                      )}

                      {bounty.status === "Claimed" && bounty.assignedTo === currentUser.id && (
                        <button
                          onClick={() => {
                            setSubmitBountyForReviewId(bounty.id);
                            setSubmittingPrUrl("");
                            setSubmittingNotes("");
                          }}
                          className="bg-amber-600 hover:bg-amber-100/10 hover:text-amber-300 border border-amber-500/40 text-white font-bold text-[10px] font-mono tracking-wider uppercase py-1.5 px-3 rounded-lg transition shrink-0 cursor-pointer"
                        >
                          ⚡ Gửi báo cáo sửa lỗi
                        </button>
                      )}

                      {bounty.status === "Claimed" && bounty.assignedTo !== currentUser.id && (
                        <span className="text-[10px] text-slate-500 font-mono">Đang sửa lỗi bởi: {bounty.assignedToName}</span>
                      )}

                      {bounty.status === "InReview" && (bounty.reportedById === currentUser.id || bounty.reportedBy === currentUser.displayName || userProjects.some(up => up.id === bounty.projectId)) ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSolveBounty(bounty.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[9px] font-black uppercase tracking-tight py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                            title="Xác nhận sửa lỗi thành công và thanh toán phần thưởng cho người sửa"
                          >
                            ✓ Duyệt & Trả thưởng
                          </button>
                          <button
                            onClick={() => onRejectBountyReview(bounty.id)}
                            className="bg-red-950/60 hover:bg-red-900 border border-red-500/20 text-slate-350 font-mono text-[9px] font-bold uppercase tracking-tight py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                            title="Bản sửa lỗi chưa hoàn chỉnh, yêu cầu làm lại"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : bounty.status === "InReview" && (
                        <span className="text-[10.5px] text-amber-400 font-mono flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 animate-spin text-amber-500" /> Đang đợi nghiệm thu...
                        </span>
                      )}

                      {/* AI Dispute Arbitration Button (For hunter or owner, to protect against quỵt tiền) */}
                      {bounty.githubPrUrl && bounty.status !== "Solved" && currentUser.id === bounty.reportedById && (
                        <button
                          onClick={() => handleArbitrateDispute(bounty)}
                          className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white font-bold text-[9px] font-mono uppercase py-1.5 px-2.5 rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1"
                          title="Trường hợp chủ lỗi quỵt thưởng không duyệt mặc dù đã sửa xong"
                        >
                          ⚖️ Trọng Tài AI
                        </button>
                      )}

                      {bounty.status === "Solved" && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 font-bold">
                          <CheckCircle className="h-3.5 w-3.5 animate-bounce" /> Săn xong (Bounty Hoàn Tất)
                        </span>
                      )}

                      <span className="text-[9px] text-slate-600 font-mono shrink-0">{bounty.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. EXCLUSIVE MARKETPLACE */}
      {subTab === "market" && (
        <div className="mt-8 space-y-6">
          {/* Create exclusive asset modal */}
          {showAssetForm && (
            <div className="bg-slate-900/80 border border-slate-850 p-6 rounded-2xl max-w-2xl mx-auto space-y-4 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-pink-400 font-mono uppercase">💎 ĐĂNG BÁN ASSET GAME ĐỘC BẢN</h3>
                <button 
                  onClick={() => setShowAssetForm(false)} 
                  className="text-slate-400 hover:text-white text-xs underline font-mono"
                >
                  Đóng
                </button>
              </div>

              <form onSubmit={handleSubmitAsset} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Loại Tài Nguyên</label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value as any)}
                      required
                      className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Sprite Sheet">Sprite Sheet Animation (2D Art)</option>
                      <option value="3D Model (FBX/OBJ)">3D Model / Concept FBX, OBJ</option>
                      <option value="Voxel Art">Voxel Modular Asset</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Giá Độc Bản (Gold/USD)</label>
                    <input
                      type="text"
                      placeholder="vd: $75, 120 Collab Credits..."
                      value={assetPrice}
                      onChange={(e) => setAssetPrice(e.target.value)}
                      required
                      className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Tiêu Đề Tác Phẩm</label>
                  <input
                    type="text"
                    placeholder="vd: Samurai 2D Sprite Sheet 16-frames, Lowpoly Cyberpunk Car Obj..."
                    value={assetTitle}
                    onChange={(e) => setAssetTitle(e.target.value)}
                    required
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Link Ảnh Minh Họa / Thumbnail (Tùy chọn)</label>
                  <input
                    type="url"
                    placeholder="Dán link Unsplash hoặc Imgur... (Bỏ trống để tự lựa ảnh mặc định)"
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2 rounded-xl border border-dashed border-pink-500/25 bg-pink-950/10 p-3">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-pink-300 uppercase font-mono">
                    <UploadCloud className="h-3.5 w-3.5" />
                    Compressed asset package (.zip/.rar/.7z/.tar/.gz/.tgz)
                  </label>
                  <input
                    type="file"
                    accept=".zip,.rar,.7z,.tar,.gz,.tgz,application/zip,application/x-zip-compressed,application/x-7z-compressed,application/vnd.rar,application/x-rar-compressed,application/gzip,application/x-gzip,application/x-tar"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && !isValidAssetArchive(file)) {
                        alert("Invalid asset package. Use a compressed archive up to 50MB.");
                        e.target.value = "";
                        setAssetArchiveFile(null);
                        return;
                      }
                      setAssetArchiveFile(file);
                    }}
                    className="w-full cursor-pointer rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-300 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-pink-600 file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:text-white hover:file:bg-pink-500"
                  />
                  {assetArchiveFile && (
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[10px] font-mono text-slate-300">
                      <span className="truncate">{assetArchiveFile.name}</span>
                      <span className="shrink-0 text-pink-300">{formatFileSize(assetArchiveFile.size)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Mô Tả & Điều Khoản Bản Quyền</label>
                  <textarea
                    placeholder="Mô tả số lượng frame hoạt cảnh, định dạng, cam kết tác phẩm tự làm chính chủ không trùng lặp..."
                    rows={4}
                    value={assetDescription}
                    onChange={(e) => setAssetDescription(e.target.value)}
                    required
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-pink-950/15 border border-pink-500/20 rounded-xl text-[11px] text-pink-300 leading-relaxed font-mono flex gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-pink-400 shrink-0 mt-0.5" />
                  <span>
                    <b>⚠️ ĐIỀU KHOẢN BẢN QUYỀN:</b> Khi đăng tác phẩm, hệ thống sẽ lưu mã số giao dịch. Tài nguyên này chỉ được bán và chuyển giao quyền sử dụng duy nhất một lần để đảm bảo quyền sở hữu cho người mua.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isAssetUploading}
                  className="w-full bg-pink-600 hover:bg-pink-500 text-white rounded-xl py-3 text-xs font-bold transition font-mono uppercase tracking-wide cursor-pointer shadow-lg shadow-pink-500/20 disabled:cursor-wait disabled:opacity-60"
                >
                  {isAssetUploading ? "Uploading package..." : "Xac Nhan Dang Ban"}
                </button>
              </form>
            </div>
          )}

          {/* Exclusive Purchase Modal */}
          {selectedAssetForBuy && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
                <div className="text-center">
                  <span className="p-2 bg-pink-500/10 text-pink-400 rounded-full inline-block border border-pink-500/20">
                    <DollarSign className="h-6 w-6" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-white font-mono uppercase">Mua Quyền Sở Hữu Độc Bản</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bạn đang mua quyền sử dụng độc bản cho tác phẩm: <b>{selectedAssetForBuy.title}</b>.
                  </p>
                </div>

                <div className="space-y-2 border-t border-b border-slate-800 py-3 text-xs">
                  <div className="flex justify-between font-mono text-slate-400">
                    <span>Tác giả:</span>
                    <span className="text-slate-200">{selectedAssetForBuy.artistName}</span>
                  </div>
                  <div className="flex justify-between font-mono text-slate-400">
                    <span>Mức giá:</span>
                    <span className="text-pink-400 font-bold">{selectedAssetForBuy.price}</span>
                  </div>
                  <div className="flex justify-between font-mono text-slate-400">
                    <span>Phương thức:</span>
                    <span className="text-emerald-400 font-bold">Thanh toán & Đóng khóa vĩnh viễn</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Dự án game jam sẽ nhận tài nguyên</label>
                  {userProjects.length === 0 ? (
                    <p className="text-xs text-red-400 font-mono">⚠️ Bạn chưa tạo dự án nào ở sảnh! Hãy ra sảnh tạo dự án để nhận tệp độc bản này.</p>
                  ) : (
                    <select
                      value={targetProjectIdForBuy}
                      onChange={(e) => setTargetProjectIdForBuy(e.target.value)}
                      required
                      className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-pink-500 focus:outline-none"
                    >
                      <option value="">-- Lựa chọn dự án nhận --</option>
                      {userProjects.map(proj => (
                        <option key={proj.id} value={proj.id}>{proj.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setSelectedAssetForBuy(null)}
                    className="flex-1 border border-slate-800 hover:bg-slate-950 text-slate-400 rounded-lg py-2 text-xs transition cursor-pointer font-mono"
                  >
                    Bỏ Qua
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    disabled={userProjects.length === 0 || !targetProjectIdForBuy}
                    className="flex-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg py-2 text-xs font-bold transition cursor-pointer font-mono uppercase tracking-wide disabled:opacity-50"
                  >
                    Xác Nhận Mua
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List of exclusive assets */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-900 rounded-3xl bg-slate-950/20">
              <Package className="mx-auto h-10 w-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-400 font-mono">Chưa tìm thấy tài nguyên độc bản nào</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">Hãy đăng ký tải tài nguyên hoạt ảnh, mô hình 3D do chính bạn thiết kế sảnh game thu lợi nhuận cao!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className={`bg-slate-900/40 border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${asset.sold ? "border-red-950/40 bg-red-950/5 opacity-60" : "border-slate-800/80 hover:border-slate-700/80 hover:shadow-xl shadow-md"}`}
                >
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={asset.mediaUrl}
                      alt={asset.title}
                      referrerPolicy="no-referrer"
                      className={`h-full w-full object-cover transition duration-500 ${asset.sold ? "grayscale filter" : "hover:scale-105"}`}
                    />
                    
                    {/* Media Type Overlay */}
                    <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {asset.mediaType}
                    </div>

                    {/* Sold Overlay Banner */}
                    {asset.sold && (
                      <div className="absolute inset-0 bg-red-950/70 flex flex-col items-center justify-center p-4">
                        <span className="bg-red-600 text-white font-mono text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest animate-pulse border border-red-400 shadow-lg">
                          VÔ ĐỊNH KHÓA - BÁN SẠCH
                        </span>
                        <p className="text-[10px] text-red-200 mt-2 text-center font-mono bg-slate-950/80 px-2 py-1 rounded">
                          Sở hữu cho: {asset.buyerProjectTitle}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 font-mono">Mã lực: {asset.id}</span>
                        <span className="text-xs text-pink-400 font-mono font-black">{asset.price}</span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-white mt-1 font-mono tracking-tight">{asset.title}</h3>
                      <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">{asset.description}</p>
                      {asset.archiveStoragePath && (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2 text-[10px] font-mono text-slate-400">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Archive className="h-3.5 w-3.5 shrink-0 text-pink-400" />
                            <span className="truncate">{asset.archiveFileName || "asset-package"}</span>
                          </span>
                          <span className="shrink-0 text-pink-300">{formatFileSize(asset.archiveFileSize)}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer segment */}
                    <div className="mt-4 pt-3.5 border-t border-slate-850/60 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <UserIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">Tác giả: <b>{asset.artistName}</b></span>
                      </div>

                      {(asset.artistId === currentUser.id || asset.buyerId === currentUser.id) && asset.archiveStoragePath && (
                        <button
                          type="button"
                          onClick={() => handleDownloadAssetArchive(asset)}
                          className="border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/50 rounded-lg shrink-0 flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      )}

                      {!asset.sold ? (
                        <button
                          onClick={() => {
                            if (currentUser.id === asset.artistId) {
                              alert("Mẹo: Bạn không thể tự mua sản phẩm ký gửi của chính mình!");
                              return;
                            }
                            setSelectedAssetForBuy(asset);
                          }}
                          className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-[10px] font-mono tracking-wider uppercase py-1.5 px-3 rounded-lg transition cursor-pointer text-center-shrink-0 shrink-0"
                        >
                          Mua Độc Bản
                        </button>
                      ) : (
                        <div className="text-[9px] text-slate-500 font-mono flex flex-col items-end">
                          <span>Verify Mã ID:</span>
                          <span className="text-red-400 truncate w-24 text-right font-bold">{asset.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ANTI-FAKE VERIFY COMPONENT */}
      {subTab === "verify" && (
        <div className="mt-8 space-y-6 max-w-3xl mx-auto">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <div className="text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="text-base font-bold text-white mt-3 font-mono uppercase">Hệ Thống Tra Cứu Sự Kiện & Chống Hàng Nhái</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                Bảo vệ tài sản bản quyền trí tuệ của các nghệ sĩ game. Hãy dán <b>Mã tài nguyên (Asset ID)</b> hoặc <b>Mã giao dịch khóa (Tx ID)</b> vào ô tìm kiếm bên dưới để xác định tính chính gốc của sản phẩm một cách công khai.
              </p>
            </div>

            <form onSubmit={handleVerifyLookup} className="flex gap-2">
              <input
                type="text"
                placeholder="vd: asset-17163000... hoặc tx-exclusive_1234..."
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                className="flex-grow text-xs text-white rounded-xl border border-slate-800 bg-slate-950 p-3 focus:border-emerald-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 text-xs font-bold rounded-xl transition font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                Tra cứu
              </button>
            </form>

            {verifyResult.searched && (
              <div className="mt-6 pt-5 border-t border-slate-850">
                {verifyResult.found ? (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 text-left space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                      <h4 className="text-sm font-bold text-emerald-200 font-mono uppercase">KẾT QUẢ: TÀI SẢN CHÍNH HÃNG HỢP PHÁP</h4>
                    </div>

                    {verifyResult.asset && (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Tên sản phẩm:</span>
                          <span className="text-slate-200 font-bold">{verifyResult.asset.title}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Nghệ sĩ phát hành:</span>
                          <span className="text-slate-200">{verifyResult.asset.artistName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Xếp hạng loại:</span>
                          <span className="text-slate-200">{verifyResult.asset.mediaType}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Mã Độc Bản chống sao chép:</span>
                          <span className="text-emerald-400 font-bold">{verifyResult.asset.id}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Tình trạng giao dịch:</span>
                          <span className={verifyResult.asset.sold ? "text-red-400 font-bold animate-pulse" : "text-emerald-400 font-bold"}>
                            {verifyResult.asset.sold ? "VÔ ĐỊNH KHÓA (Sold and Blocked)" : "SẴN SÀNG KÝ GỬI (Unsold)"}
                          </span>
                        </div>
                        {verifyResult.asset.sold && (
                          <>
                            <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                              <span>Mã giao dịch gốc (Tx ID):</span>
                              <span className="text-pink-400 font-bold break-all">{verifyResult.asset.transactionId}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                              <span>Game thụ hưởng:</span>
                              <span className="text-slate-200 font-bold">{verifyResult.asset.buyerProjectTitle}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {verifyResult.bounty && (
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Thử thách sửa lỗi:</span>
                          <span className="text-slate-200 font-bold">{verifyResult.bounty.title}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Dự án game liên quan:</span>
                          <span className="text-slate-200">{verifyResult.bounty.projectTitle}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Mã nhiệm vụ:</span>
                          <span className="text-indigo-400">{verifyResult.bounty.id}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-850 py-1.5 text-slate-400">
                          <span>Tình trạng điều phối:</span>
                          <span className="text-slate-200 font-bold">{verifyResult.bounty.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                      <h4 className="text-sm font-bold text-red-200 font-mono uppercase">CẢNH BÁO: TÀI SẢN KHÔNG TỒN TẠI HOẶC CHƯA KHAI BÁO</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-normal">
                      Mã số bạn nhập không thuộc bất kỳ sự kiện giao dịch độc bản hay có mặt trên hệ thống chống sao chép của IndieCollab Hub. Vui lòng cảnh giác cao độ với các sản phẩm copycat sao chép trái phép không chính hãng hoặc sản phẩm kém chất lượng!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. HUNTER CODE SUBMISSION DIALOG */}
      {submitBountyForReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                <span>⚡ BÁO CÁO GIẢI PHÁP & CHỨNG MINH CODE</span>
              </h3>
              <button
                onClick={() => setSubmitBountyForReviewId(null)}
                className="text-xs text-slate-500 hover:text-white underline font-mono cursor-pointer animate-pulse"
              >
                Hủy bỏ
              </button>
            </div>

            <form onSubmit={handlePerformBountyReview} className="space-y-4 text-left text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-dashed border-amber-500/20 text-slate-450 leading-relaxed text-[10.5px]">
                <strong className="text-amber-400 text-[10.5px] block mb-1">🔒 Bảo Vệ Chống Quỵt Thưởng (PR Escrow Check):</strong>
                Nhập link Pull Request / Commit GitHub làm bằng chứng. Nếu chủ dự án cố tình không duyệt dù code chạy tốt, bạn có thể trigger <b>⚖️ Trọng tài AI</b> để tự động giải ngân quỹ ký quỹ.
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Link GitHub Pull Request (Bắt buộc)</label>
                <input
                  type="url"
                  placeholder="https://github.com/organization/repo/pull/12"
                  value={submittingPrUrl}
                  onChange={(e) => setSubmittingPrUrl(e.target.value)}
                  required
                  className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Giải trình kỹ thuật cách sửa đổi (Logs/Code logic)</label>
                <textarea
                  placeholder="Mô tả tóm tắt giải thuật bạn đã dùng để vá bug này (vd: Sửa rò rỉ bộ nhớ, tối ưu hoá vòng lặp spawn_enemy...)"
                  rows={4}
                  value={submittingNotes}
                  onChange={(e) => setSubmittingNotes(e.target.value)}
                  required
                  className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950 p-2.5 focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-3 text-xs font-bold transition font-mono uppercase cursor-pointer"
              >
                Gửi Báo Cáo Nghiệm Thu
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. AI ARBITRATION VIEWPORT DIALOG */}
      {arbitratingBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-indigo-400 font-mono uppercase flex items-center gap-1.5">
                <span>⚖️ TRỌNG TÀI AI CHỐNG GIAN LẬN BOUNTY</span>
              </h3>
              <button
                onClick={() => setArbitratingBounty(null)}
                className="text-xs text-slate-500 hover:text-white underline font-mono cursor-pointer"
                disabled={isArbitratingLoading}
              >
                Đóng
              </button>
            </div>

            {isArbitratingLoading ? (
              <div className="text-center py-12 space-y-4">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mx-auto"></div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white font-mono uppercase">AI Arbiter đang truy quét giải thuật...</h4>
                  <p className="text-[11px] text-slate-450 max-w-xs mx-auto">
                    Kiểm tra và giả lập Pull Request, phân tích sandbox, đối chiếu với mô tả của bug lỗi để đưa ra kết luận trung thực nhất...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1 text-slate-400 font-mono text-[10.5px]">
                  <div><strong>Nhiệm vụ:</strong> {arbitratingBounty.title}</div>
                  <div><strong>Người sửa nộp:</strong> {arbitratingBounty.assignedToName}</div>
                  <div><strong>Mức treo thưởng:</strong> <span className="text-pink-400 font-bold">{arbitratingBounty.reward}</span></div>
                </div>

                <div className="border border-indigo-950/50 p-4 bg-slate-950 rounded-xl max-h-80 overflow-y-auto text-slate-300 tracking-wide text-xs">
                  {arbitrationVerdict ? (
                    <div className="whitespace-pre-wrap font-sans antialiased text-[11px] leading-relaxed prose prose-invert">{arbitrationVerdict}</div>
                  ) : (
                    <p className="text-red-400">Không có kết quả phán xử trả về từ Warden Server.</p>
                  )}
                </div>

                <button
                  onClick={() => setArbitratingBounty(null)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-xs font-bold transition font-mono uppercase cursor-pointer"
                >
                  Đồng ý và Đóng phiên tòa AI
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PR Review Panel */}
      <React.Suspense fallback={null}>
        <PRReviewPanel
          prUrl={prReviewUrl}
          isOpen={prReviewOpen}
          onClose={() => setPrReviewOpen(false)}
          readonly={false}
        />
      </React.Suspense>
    </div>
  );
}
