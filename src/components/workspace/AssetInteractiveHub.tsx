import React, { useState, useEffect, useRef } from "react";
import { 
  Box, 
  Layers, 
  Upload, 
  MessageSquare, 
  RotateCw, 
  Play, 
  Pause, 
  Sliders, 
  Check, 
  MessageCircle, 
  File, 
  Plus, 
  Sun, 
  Grid, 
  Maximize2,
  Trash2,
  Bookmark,
  Calendar,
  Sparkles,
  CheckCircle2,
  Send,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectWorkspace, ProjectWorkspaceFile, User } from "../../types";
import { playClickSound, playSuccessSound } from "../../utils/audio";

interface AssetHubProps {
  workspace: ProjectWorkspace;
  currentUser: User;
  onPostSysMessage?: (content: string) => void;
  onAddWorkspaceFile: (file: ProjectWorkspaceFile) => Promise<void>;
}

interface HubAsset {
  id: string;
  name: string;
  type: "3D" | "2D";
  format: "fbx" | "obj" | "png" | "aseprite" | "gltf";
  uploader: string;
  uploaderRole: string;
  uploaderAvatar: string;
  uploadedAt: string;
  description: string;
  // Dynamic parameters for simulated rendering
  spriteSheetUrl?: string;
  framesCount?: number;
  comments: { id: string; user: string; avatar: string; role: string; content: string; time: string }[];
}

const PRELOADED_ASSETS: HubAsset[] = [
  {
    id: "asset-1",
    name: "🚀 Sci-Fi Guardian Battleship (Modular hull)",
    type: "3D",
    format: "fbx",
    uploader: "HoangTran",
    uploaderRole: "Lead 3D Artist",
    uploaderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    uploadedAt: "Hôm qua lúc 14:30",
    description: "Modun vỏ tàu chiến tuần tra không gian hoàn thiện. Thích hợp gán ghép súng máy la-ze và khiên chắn bảo hộ.",
    comments: [
      { id: "c1", user: "KietNguyen", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop", role: "Game Designer", content: "Mô hình low-poly tối ưu vật lý va chạm rất tốt! Tôi sẽ test thử hố nén đen va đập tối nay.", time: "Hôm qua lúc 15:10" },
      { id: "c2", user: "HungDev", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", role: "Lead Dev", content: "Hãy nới rộng rãnh ống xả động cơ thêm 0.2 đơn vị để gán hạt lửa phun mượt hơn nhé.", time: "Hôm nay lúc 09:22" }
    ]
  },
  {
    id: "asset-2",
    name: "🏃 Cyberpunk Neon Runner (Dynamic loop)",
    type: "2D",
    format: "png",
    uploader: "ChiNguyen",
    uploaderRole: "2D Animator",
    uploaderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    uploadedAt: "Hôm nay lúc 08:15",
    description: "Khung hoạt họa chạy điền sảnh pixel-art tỉ lệ 64x64. Gom nén 8 khung chuyển động mượt mà liên tục.",
    spriteSheetUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=200&fit=crop", // Simulated texture pattern
    framesCount: 8,
    comments: [
      { id: "c3", user: "HoangTran", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", role: "Lead 3D Artist", content: "Phối màu phản quang neon tím xanh rất ăn rơ với tông Cyber của sảnh chúng ta!", time: "Hôm nay lúc 08:40" }
    ]
  },
  {
    id: "asset-3",
    name: "💎 Mythic Crystal Chest of Valor",
    type: "3D",
    format: "obj",
    uploader: "HoangTran",
    uploaderRole: "Lead 3D Artist",
    uploaderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    uploadedAt: "3 ngày trước",
    description: "Hòm kho báu thần thoại chứa ngọc lục bảo phát sáng. Tạo điểm nhấn cho nhiệm vụ thử thách Game Jam.",
    comments: []
  }
];

export default function AssetInteractiveHub({
  workspace,
  currentUser,
  onPostSysMessage,
  onAddWorkspaceFile
}: AssetHubProps) {
  const [assets, setAssets] = useState<HubAsset[]>(PRELOADED_ASSETS);
  const [activeAssetId, setActiveAssetId] = useState<string>("asset-1");
  
  // Custom Create states
  const [tabFilter, setTabFilter] = useState<"all" | "3D" | "2D">("all");
  const [newCommentText, setNewCommentText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Form upload
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState<"3D" | "2D">("3D");
  const [uploadFormat, setUploadFormat] = useState<"fbx" | "obj" | "png" | "aseprite">("fbx");
  const [uploadDesc, setUploadDesc] = useState("");

  // Visual Interactive Controllers
  const [rotX, setRotX] = useState(45);
  const [rotY, setRotY] = useState(45);
  const [rotZ, setRotZ] = useState(0);
  const [showWireframe, setShowWireframe] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  const [showLightSource, setShowLightSource] = useState(true);

  // 2D Animation Loops Controls
  const [isPlaying2D, setIsPlaying2D] = useState(true);
  const [animationFps, setAnimationFps] = useState(12);
  const [spriteScale, setSpriteScale] = useState(4);
  const [activeFrame, setActiveFrame] = useState(0);

  // HTML5 Canvas for simulated 3D rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeAsset = assets.find(a => a.id === activeAssetId) || assets[0];

  // Tick active frame of 2D Sprite Loop
  useEffect(() => {
    if (activeAsset.type !== "2D" || !isPlaying2D) return;
    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % (activeAsset.framesCount || 8));
    }, 1000 / animationFps);
    return () => clearInterval(interval);
  }, [activeAssetId, isPlaying2D, animationFps, activeAsset.type]);

  // Orbit rotation animation when not dragging
  useEffect(() => {
    if (activeAsset.type !== "3D") return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 1) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, [activeAssetId, activeAsset.type]);

  // Render simulated low-poly 3D on Canvas using math vectors
  useEffect(() => {
    if (activeAsset.type !== "3D") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Rotate vectors around axes
      const radX = (rotX * Math.PI) / 180;
      const radY = (rotY * Math.PI) / 180;
      const radZ = (rotZ * Math.PI) / 180;

      // Geometry vertices generator depending on selected object
      let vertices: {x:number, y:number, z:number}[] = [];
      let faces: number[][] = [];

      if (activeAsset.format === "fbx") {
        // Tàu vũ trụ Rocket/Ship vertices
        vertices = [
          { x: 0, y: -70, z: 0 },    // Mũi tàu mũi sườn
          { x: -35, y: 30, z: -20 }, // Cánh trái trước
          { x: 35, y: 30, z: -20 },  // Cánh phải trước
          { x: 35, y: 30, z: 20 },   // Cánh phải sau
          { x: -35, y: 30, z: 20 },  // Cánh trái sau
          { x: 0, y: 40, z: 0 },     // Đuôi ống xả động cơ
          { x: 0, y: 15, z: -35 }    // Buồng lái kính phản quang
        ];
        faces = [
          [0, 1, 6], [0, 6, 2], [0, 2, 3], [0, 3, 5], [0, 5, 4], [0, 4, 1],
          [1, 5, 4], [2, 3, 5], [1, 6, 2], [3, 4, 5]
        ];
      } else {
        // Hòm báu vàng (Cube/Chest geometry)
        vertices = [
          { x: -40, y: -30, z: -30 }, // Nắp trên
          { x: 40, y: -30, z: -30 },
          { x: 40, y: 10, z: -30 },
          { x: -40, y: 10, z: -30 },
          { x: -40, y: -30, z: 30 },  // Nắp dưới sườn sau
          { x: 40, y: -30, z: 30 },
          { x: 40, y: 10, z: 30 },
          { x: -40, y: 10, z: 30 }
        ];
        faces = [
          [0, 1, 2, 3], // Front
          [4, 5, 6, 7], // Back
          [0, 1, 5, 4], // Top
          [2, 3, 7, 6], // Bottom
          [0, 3, 7, 4], // Left
          [1, 2, 6, 5]  // Right
        ];
      }

      // Project vertices to 2D screen coordinate
      const projected = vertices.map(v => {
        // Rotate Z
        let x1 = v.x * Math.cos(radZ) - v.y * Math.sin(radZ);
        let y1 = v.x * Math.sin(radZ) + v.y * Math.cos(radZ);
        let z1 = v.z;

        // Rotate Y
        let x2 = x1 * Math.cos(radY) + z1 * Math.sin(radY);
        let y2 = y1;
        let z2 = -x1 * Math.sin(radY) + z1 * Math.cos(radY);

        // Rotate X
        let x3 = x2;
        let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
        let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

        // Simple perspective projection with scaling
        const dist = 240;
        const scale = dist / (dist + z3);
        return {
          x: cx + x3 * scale * 1.5,
          y: cy + y3 * scale * 1.5,
          z: z3
        };
      });

      // Render faces
      faces.forEach((face, idx) => {
        ctx.beginPath();
        ctx.moveTo(projected[face[0]].x, projected[face[0]].y);
        for (let i = 1; i < face.length; i++) {
          ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
        }
        ctx.closePath();

        // Shading / Flat Coloring depending on lightning coordinates
        if (showLightSource) {
          const colorIntensity = Math.floor(100 + (idx * 15) % 80);
          ctx.fillStyle = `rgba(79, 70, 229, 0.${colorIntensity})`;
        } else {
          ctx.fillStyle = "rgba(30, 41, 59, 0.4)";
        }
        ctx.fill();

        // Draw Wireframe grid outlines
        if (showWireframe) {
          ctx.strokeStyle = "rgba(129, 140, 248, 0.55)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // Draw bounding box if enabled
      if (showBoundingBox) {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.35)";
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 75, cy - 85, 150, 170);
        ctx.setLineDash([]);
        
        ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
        ctx.font = "8px monospace";
        ctx.fillText("BOX LIMIT: 1.5m x 1.2m x 2.1m", cx - 70, cy - 95);
      }

      // Draw light indicator
      if (showLightSource) {
        ctx.beginPath();
        ctx.arc(cx + 80, cy - 80, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(253, 224, 71, 0.8)";
        ctx.fill();
        ctx.strokeStyle = "rgba(253, 224, 71, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Simple crosshair center
      ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy); ctx.lineTo(cx + 100, cy);
      ctx.moveTo(cx, cy - 100); ctx.lineTo(cx, cy + 100);
      ctx.stroke();
    };

    render();
  }, [activeAssetId, rotX, rotY, rotZ, showWireframe, showBoundingBox, showLightSource, activeAsset.format]);

  // Handle send feedback review comment
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: "comment-" + Date.now(),
      user: currentUser.displayName || "Bạn",
      avatar: currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      role: "Team Collaborator",
      content: newCommentText.trim(),
      time: "Vừa xong"
    };

    setAssets(current => current.map((item) => {
      if (item.id === activeAsset.id) {
        return {
          ...item,
          comments: [...item.comments, newComment]
        };
      }
      return item;
    }));

    setNewCommentText("");
    playSuccessSound();

    if (onPostSysMessage) {
      onPostSysMessage(`✍️ Hội viên ${currentUser.displayName} vừa gửi nhận xét góp ý tài sản game: "${activeAsset.name}"`);
    }
  };

  // Handle custom manual asset submit integration
  const handleAddNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !uploadDesc.trim()) return;

    setIsUploading(true);
    playClickSound();

    // Formulate asset details
    const newAsset: HubAsset = {
      id: "asset-custom-" + Date.now(),
      name: uploadName,
      type: uploadType,
      format: uploadFormat as any,
      uploader: currentUser.displayName || "Bạn",
      uploaderRole: "Creator",
      uploaderAvatar: currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      uploadedAt: "Vừa xong",
      description: uploadDesc,
      spriteSheetUrl: uploadType === "2D" ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=200&fit=crop" : undefined,
      framesCount: uploadType === "2D" ? 6 : undefined,
      comments: []
    };

    // Store in Workspace files as well
    const freshWorkspaceFile: ProjectWorkspaceFile = {
      id: "file-asset-" + Date.now(),
      name: `${uploadName.toLowerCase().replace(/\s+/g, "_")}.${uploadFormat}`,
      description: uploadDesc,
      fileUrl: uploadType === "3D" ? "https://github.com/AshuraXX2206/indiecollab" : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=200&fit=crop",
      fileType: uploadType === "3D" ? "archive" : "image",
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.displayName || "Bạn",
      createdAt: new Date().toISOString()
    };

    setTimeout(async () => {
      setAssets([newAsset, ...assets]);
      setActiveAssetId(newAsset.id);
      setIsUploading(false);
      setShowUploadForm(false);
      setUploadName("");
      setUploadDesc("");
      playSuccessSound();

      await onAddWorkspaceFile(freshWorkspaceFile);

      if (onPostSysMessage) {
        onPostSysMessage(`🎨 Họa sĩ ${currentUser.displayName} vừa tải một Asset mới lên Sảnh duyệt: [${uploadFormat.toUpperCase()}] ${uploadName}`);
      }
    }, 1500);
  };

  const filteredAssets = assets.filter((it) => {
    return tabFilter === "all" || it.type === tabFilter;
  });

  return (
    <div className="space-y-6">

      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/10 bg-gradient-to-br from-indigo-950/20 via-slate-900 to-slate-950 p-6 text-left">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono border border-indigo-500/20">Asset Hub & Sân Duyệt</span>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Trung Tâm Kiểm Duyệt & Kéo Thả Assets</h2>
            <p className="mt-1.5 text-xs text-slate-400 max-w-xl leading-relaxed">
              Dành riêng cho các Artist và Designer: Kéo thả các mô hình 3D (FBX/OBJ) hoặc ảnh hoạt họa Sprite (PNG/Aseprite). Sảnh hỗ trợ xoay chụp 3D trực quan và chạy thử chuỗi anim ngay trên web giúp cả nhóm thảo luận hiệu năng game mượt mà.
            </p>
          </div>
          
          <button
            onClick={() => { playClickSound(); setShowUploadForm(!showUploadForm); }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition select-none cursor-pointer"
          >
            <Upload className="h-4 w-4" /> Đăng Tải Asset Mới
          </button>
        </div>
      </div>

      {/* RENDER DYNAMIC UPLOAD MODAL/FORM */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-3xl border border-indigo-500/20 bg-[#09090b]/90 p-6 text-left space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-black text-white">Khung Đăng Ký Kiểm Duyệt Asset</h3>
            </div>

            <form onSubmit={handleAddNewAsset} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-400 block uppercase">Tên tài sản game *</label>
                  <input
                    type="text"
                    required
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Ví dụ: Cánh cổng hố đen ma thuật hoặc Hero Walkcycle..."
                    className="w-full px-3 py-2 bg-black/60 border border-white/[0.04] rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-mono text-slate-400 block uppercase">Loại Asset</label>
                    <select
                      value={uploadType}
                      onChange={(e) => {
                        const val = e.target.value as "3D" | "2D";
                        setUploadType(val);
                        setUploadFormat(val === "3D" ? "fbx" : "png");
                      }}
                      className="w-full px-3 py-2 bg-black/80 border border-white/[0.04] rounded-xl text-xs text-slate-300 outline-none"
                    >
                      <option value="3D">Mô hình 3D (FBX/OBJ)</option>
                      <option value="2D">Họa ảnh 2D (Sprite Sheets)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-mono text-slate-400 block uppercase">Đuôi tệp (Format)</label>
                    <select
                      value={uploadFormat}
                      onChange={(e) => setUploadFormat(e.target.value as any)}
                      className="w-full px-3 py-2 bg-black/80 border border-white/[0.04] rounded-xl text-xs text-slate-300 outline-none"
                    >
                      {uploadType === "3D" ? (
                        <>
                          <option value="fbx">.fbx (Autodesk)</option>
                          <option value="obj">.obj (Wavefront)</option>
                        </>
                      ) : (
                        <>
                          <option value="png">.png (Transparent Grid)</option>
                          <option value="aseprite">.aseprite (Sprite file)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-400 block uppercase">Miêu tả thiết kế & Polygon/Polycount *</label>
                  <textarea
                    required
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    placeholder="Mô tả kỹ số lượng lưới nén, cấu hình xương bones, hoặc fps đề xuất để lập trình viên gán ráp code mượt nhất..."
                    rows={3}
                    className="w-full px-3 py-2 bg-black/60 border border-white/[0.04] rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 border border-white/[0.04] rounded-xl text-xs text-slate-400 hover:text-white transition select-none cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition select-none cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải lên...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Lưu Lên CDN & Duyệt
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER BUTTONS ROW */}
      <div className="flex gap-2 justify-start pb-1">
        {[
          { id: "all", label: "Tất cả sảnh duyệt" },
          { id: "3D", label: "Khối Mô hình 3D" },
          { id: "2D", label: "Họa ảnh 2D Sprite Sheets" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { playClickSound(); setTabFilter(t.id as any); }}
            className={`px-3.5 py-1.8 rounded-xl border text-xs font-bold transition select-none cursor-pointer ${
              tabFilter === t.id 
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                : "bg-white/[0.01] border-white/[0.03] text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MAIN LAYOUT (LEFT LIST, MIDDLE PREVIEW ORBIT, RIGHT NOTES COMMENTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        
        {/* ASSET LIST COLUMN (1 part) */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Danh sách Asset</span>
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredAssets.map((as) => {
              const isSelected = as.id === activeAssetId;
              return (
                <div
                  key={as.id}
                  onClick={() => { playClickSound(); setActiveAssetId(as.id); }}
                  className={`p-3.5 rounded-2xl border transition duration-150 cursor-pointer text-left ${
                    isSelected 
                      ? "bg-slate-950/80 border-indigo-500/30 shadow-md"
                      : "bg-[#09090b]/40 border-white/[0.03] hover:border-white/[0.06] hover:bg-[#09090b]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wide border ${
                      as.type === "3D" 
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                        : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                    }`}>
                      {as.type} ({as.format.toUpperCase()})
                    </span>
                    <span className="text-[9.5px] text-slate-600 font-mono">{as.uploadedAt.includes(":") ? "Hôm nay" : "Gần đây"}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{as.name}</h4>
                  <p className="text-[11px] text-slate-550 mt-1 line-clamp-2 leading-relaxed">{as.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* WORKSPACE PREVIEW ENGINE (2 parts) */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Kính thử Sandbox Tương tác</span>
          
          <div className="rounded-3xl border border-white/[0.04] bg-[#0c0c0e] p-5 relative min-h-[380px] flex flex-col justify-between">
            
            {/* TOP BAR WITH META AND BUTTONS */}
            <div className="flex justify-between items-start gap-4">
              <div className="text-left">
                <span className="text-[9px] font-mono text-zinc-500 uppercase leading-none block">ACTIVE DISPLAY SYSTEM</span>
                <strong className="text-sm font-black text-white block mt-0.5">{activeAsset.name}</strong>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <span className="bg-[#030303] border border-white/[0.05] p-2 rounded-xl text-[10.5px] font-mono text-slate-400 flex items-center gap-1.5 leading-none">
                  <Bookmark className="h-3.5 w-3.5" /> {activeAsset.format.toUpperCase()}
                </span>
              </div>
            </div>

            {/* INTERACTIVE CANVAS OR LOOP RUNNER */}
            <div className="flex-1 my-4 flex items-center justify-center relative bg-black/25 rounded-2xl border border-white/[0.01]">
              
              {activeAsset.type === "3D" ? (
                /* 3D RENDER BOX */
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={220}
                  className="max-w-full drop-shadow-[0_10px_35px_rgba(79,70,229,0.15)] cursor-grab active:cursor-grabbing"
                />
              ) : (
                /* 2D CANVAS SPRITE LOOP GENERATOR */
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div 
                    className="border border-white/[0.04] p-3 rounded-2xl bg-slate-950 overflow-hidden relative group"
                    style={{
                      width: "128px",
                      height: "128px",
                      backgroundImage: `radial-gradient(ellipse at center, rgba(79, 70, 229, 0.1) 0%, rgba(0, 0, 0, 0) 70%)`
                    }}
                  >
                    {/* Simulated Pixelated Zoom Screen */}
                    <div 
                      className="w-full h-full bg-cover bg-center transition-all duration-200"
                      style={{
                        backgroundImage: `url(${activeAsset.spriteSheetUrl})`,
                        imageRendering: "pixelated",
                        transform: `scale(${spriteScale})`,
                        backgroundPosition: `${(activeFrame * 12.5)}% center`
                      }}
                    />
                    
                    <span className="absolute bottom-2 right-2 text-[8px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-indigo-400">
                      Frame {activeFrame + 1}/{activeAsset.framesCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { playClickSound(); setIsPlaying2D(!isPlaying2D); }}
                      className="p-2 border border-white/[0.05] bg-black/40 text-white rounded-lg hover:text-indigo-400 transition"
                    >
                      {isPlaying2D ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <span className="text-[11px] font-mono text-slate-500">
                      Đang {isPlaying2D ? "chạy vòng lặp" : "tạm dừng"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM ADJUSTMENT SLIDERS */}
            <div className="bg-black/40 border border-white/[0.03] p-4 rounded-2xl space-y-3.5">
              
              {activeAsset.type === "3D" ? (
                /* 3D controllers */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
                  
                  {/* Slider rot Y */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-zinc-500 font-mono flex justify-between">
                      <span>Camera Yaw (Y):</span>
                      <strong className="text-white">{rotY}°</strong>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={rotY}
                      onChange={(e) => setRotY(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Slider rot X */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-zinc-500 font-mono flex justify-between">
                      <span>Camera Pitch (X):</span>
                      <strong className="text-white">{rotX}°</strong>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={rotX}
                      onChange={(e) => setRotX(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Toggle switches */}
                  <div className="flex gap-2.5 flex-wrap col-span-2 sm:col-span-1 justify-start sm:justify-end">
                    <button
                      onClick={() => { playClickSound(); setShowWireframe(!showWireframe); }}
                      title="Toggle Wireframe Grid"
                      className={`p-1.8 border rounded-lg transition ${showWireframe ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-white/[0.04] text-slate-500"}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { playClickSound(); setShowLightSource(!showLightSource); }}
                      title="Toggle Direct lighting"
                      className={`p-1.8 border rounded-lg transition ${showLightSource ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-white/[0.04] text-slate-500"}`}
                    >
                      <Sun className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { playClickSound(); setShowBoundingBox(!showBoundingBox); }}
                      title="Toggle Collision limits"
                      className={`p-1.8 border rounded-lg transition ${showBoundingBox ? "border-red-500 bg-red-500/10 text-red-400" : "border-white/[0.04] text-slate-500"}`}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              ) : (
                /* 2D controllers sliders */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Slider FPS */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-zinc-500 font-mono flex justify-between">
                      <span>Tốc độ chuyển động:</span>
                      <strong className="text-white">{animationFps} FPS</strong>
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={animationFps}
                      onChange={(e) => setAnimationFps(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  {/* Slider Zoom Scale */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-zinc-500 font-mono flex justify-between">
                      <span>Độ phóng to điểm ảnh (Zoom):</span>
                      <strong className="text-white">{spriteScale}x Pixel scale</strong>
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={spriteScale}
                      onChange={(e) => setSpriteScale(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>

        {/* FEEDBACK & GÓP Ý CHUYÊN MÔN (1 part) */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Ý kiến gác sảnh đề xuất ({activeAsset.comments.length})</span>
          
          <div className="rounded-2xl border border-white/[0.03] bg-[#09090b]/45 p-4 flex flex-col justify-between min-h-[380px] max-h-[500px]">
            
            {/* SCROLLABLE COMMENTS FLOW */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left">
              {activeAsset.comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 mt-12">
                  <MessageCircle className="h-8 w-8 text-slate-700 animate-bounce" />
                  <p className="text-[11px] text-slate-550 leading-relaxed">Hãy gõ dòng chữ góp ý, đặt feedback kỹ thuật cho asset để bên họa sĩ sửa chữa!</p>
                </div>
              ) : (
                activeAsset.comments.map((cm) => (
                  <div key={cm.id} className="space-y-1.5 border-b border-white/[0.02] pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <img src={cm.avatar} alt={cm.user} className="h-5 w-5 rounded-full border border-white/10" />
                      <div className="text-left">
                        <strong className="text-[11px] text-white block leading-tight">{cm.user}</strong>
                        <span className="text-[8.5px] text-slate-500 font-mono block leading-none">{cm.role}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-350 leading-relaxed">{cm.content}</p>
                    <span className="text-[8px] text-slate-600 block text-right">{cm.time}</span>
                  </div>
                ))
              )}
            </div>

            {/* SEND FEEDBACK BOX */}
            <form onSubmit={handleSendComment} className="flex gap-1.5 mt-3 pt-3 border-t border-white/[0.03]">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Nhận xét texture/vertices..."
                className="flex-1 px-3 py-2 bg-black/60 border border-white/[0.04] rounded-xl text-xs text-white outline-none focus:border-indigo-500"
              />
              <button className="p-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition shrink-0 select-none cursor-pointer">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        </div>

      </div>

    </div>
  );
}
