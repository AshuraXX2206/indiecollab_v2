import React, { useState } from "react";
import { Project, CollabType, JobType } from "../types";
import { auth } from "../firebase";
import { Plus, Trash, Sparkles, Info, ArrowRight, Lightbulb } from "lucide-react";

interface ProjectFormProps {
  currentUser: { displayName: string; avatarUrl: string; id: string } | null;
  onSave: (p: Partial<Project>) => void;
  onClose: () => void;
}

export default function ProjectForm({ currentUser, onSave, onClose }: ProjectFormProps) {
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [description, setDescription] = useState("");
  const [engine, setEngine] = useState("Godot");
  const [collabType, setCollabType] = useState<CollabType>(CollabType.RevShareEqual);
  
  // New features state
  const [hasVideoDemo, setHasVideoDemo] = useState(false);
  const [hasShowcaseImages, setHasShowcaseImages] = useState(false);
  const [videoDemoUrl, setVideoDemoUrl] = useState("");
  const [showcaseImages, setShowcaseImages] = useState<string[]>([]);
  const [hiringType, setHiringType] = useState<"Freelance" | "Teammate" | "Both">("Teammate");
  const [budgetDescription, setBudgetDescription] = useState("Ngân sách và thù lao do chủ dự án thỏa thuận");
  const [inspiration, setInspiration] = useState("");
  const [imageInput, setImageInput] = useState("");

  const handleAddImageUrl = () => {
    if (!imageInput) return;
    if (showcaseImages.length >= 3) {
      alert("Tối đa 3 ảnh showcase.");
      return;
    }
    setShowcaseImages([...showcaseImages, imageInput]);
    setImageInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (showcaseImages.length + files.length > 3) {
      alert("Bạn chỉ được tải lên tối đa 3 ảnh showcase.");
      return;
    }

    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith("image/")) {
        alert(`File ${file.name} không phải là hình ảnh hợp lệ.`);
        return;
      }
      if (file.size > 1024 * 1024) {
        alert(`File ${file.name} vượt quá dung lượng 1MB giới hạn.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setShowcaseImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setShowcaseImages(showcaseImages.filter((_, i) => i !== index));
  };

  // Dynamic roles addition
  const [recruitments, setRecruitments] = useState<Array<{ role: string; quantity: number }>>([
    { role: "2D Artist", quantity: 1 }
  ]);

  // AI pitch critique state
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critiqueResult, setCritiqueResult] = useState<string | null>(null);

  const handleAddRecruitment = () => {
    setRecruitments([...recruitments, { role: "Core Developer", quantity: 1 }]);
  };

  const handleRemoveRecruitment = (index: number) => {
    setRecruitments(recruitments.filter((_, i) => i !== index));
  };

  const handleRecruitmentChange = (index: number, field: string, value: any) => {
    const updated = [...recruitments];
    updated[index] = { ...updated[index], [field]: value };
    setRecruitments(updated);
  };

  // Run pitch through server-side Gemini Pitch Advisor
  const handleAICritique = async () => {
    if (!title || !pitch) {
      alert("Vui lòng nhập Tiêu đề và Elevator Pitch ngắn trước khi tối ưu!");
      return;
    }
    setIsCritiquing(true);
    setCritiqueResult(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
        } catch (e) { /* fallback */ }
      }

      const res = await fetch("/api/ai/refine-pitch", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          pitch,
          engine,
          teamNeeds: recruitments.map(r => r.role)
        })
      });
      const data = await res.json();
      if (data.success) {
        setCritiqueResult(data.critique);
      } else {
        setCritiqueResult(data.error || "Không thể tải đánh giá từ AI.");
      }
    } catch (e) {
      setCritiqueResult("Không thể kết nối đến máy chủ AI.");
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pitch || !description) {
      alert("Vui lòng điền đầy đủ thông tin dự án.");
      return;
    }

    onSave({
      title,
      pitch,
      description,
      engine,
      collabType,
      teamNeeds: recruitments.map(r => r.role),
      recruitments: recruitments.map(r => ({ ...r, status: "Open" })),
      ...(hasVideoDemo && videoDemoUrl.trim() ? { videoDemoUrl: videoDemoUrl.trim() } : {}),
      ...(hasShowcaseImages && showcaseImages.length > 0 ? { showcaseImages } : {}),
      hiringType,
      budgetDescription,
      inspiration
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white">Khởi tạo Dự án mới</h2>
        <p className="mt-1 text-sm text-slate-400">
          Điền các thông tin chi tiết dưới đây để thu hút các nhà phát triển game cùng chí hướng hoặc cộng sự phù hợp cho dự án của bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Core details */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Tên Dự Án (Title)</label>
            <input
              type="text"
              required
              placeholder="e.g. Rhythm of the Void"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Game Engine sử dụng</label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
            >
              <option value="Godot">Godot Engine (C# / GDScript)</option>
              <option value="Unity">Unity (C#)</option>
              <option value="Unreal Engine">Unreal Engine (C++ / Blueprints)</option>
              <option value="Phaser / WebGL">Phaser / Three.js (JS / TS)</option>
              <option value="GameMaker">GameMaker (GML)</option>
              <option value="Custom Engine">Custom Engine / Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Cơ chế Hợp Tác (Collaboration Model)</label>
          <select
            value={collabType}
            onChange={(e) => setCollabType(e.target.value as CollabType)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
          >
            {/* Revenue Sharing */}
            <optgroup label="💰 Revenue Sharing">
              <option value={CollabType.RevShareEqual}>{CollabType.RevShareEqual}</option>
              <option value={CollabType.RevShareTiered}>{CollabType.RevShareTiered}</option>
              <option value={CollabType.RevShareMilestone}>{CollabType.RevShareMilestone}</option>
              <option value={CollabType.EquityShare}>{CollabType.EquityShare}</option>
            </optgroup>
            
            {/* Paid Work */}
            <optgroup label="💵 Paid Work">
              <option value={CollabType.FixedPrice}>{CollabType.FixedPrice}</option>
              <option value={CollabType.HourlyRate}>{CollabType.HourlyRate}</option>
              <option value={CollabType.MilestonePayment}>{CollabType.MilestonePayment}</option>
              <option value={CollabType.RoyaltyBased}>{CollabType.RoyaltyBased}</option>
            </optgroup>
            
            {/* Hobby & Learning */}
            <optgroup label="🎮 Hobby & Learning">
              <option value={CollabType.HobbyJam}>{CollabType.HobbyJam}</option>
              <option value={CollabType.HobbyLongTerm}>{CollabType.HobbyLongTerm}</option>
              <option value={CollabType.LearningMentor}>{CollabType.LearningMentor}</option>
              <option value={CollabType.PortfolioBuilding}>{CollabType.PortfolioBuilding}</option>
            </optgroup>
            
            {/* Special Arrangements */}
            <optgroup label="✨ Special">
              <option value={CollabType.RevSharePlusPaid}>{CollabType.RevSharePlusPaid}</option>
              <option value={CollabType.OpenSource}>{CollabType.OpenSource}</option>
              <option value={CollabType.WorkForHire}>{CollabType.WorkForHire}</option>
            </optgroup>
          </select>
        </div>

        {/* Elevator Pitch input & AI refinement buttons stacked dynamically */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono"> Elevator Pitch (1 câu đắt giá nhất)</label>
            <button
              type="button"
              disabled
              title="AI Pitch Advisor đang tạm khóa để bảo trì."
              className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300 opacity-70"
            >
              <Sparkles className="h-3 w-3" />
              AI Pitch tạm khóa
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="e.g. Một tựa game rogue-lite nhịp điệu phong cách 16-bit nơi không gian phản hồi theo nhịp nhạc của bạn."
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
          />
        </div>

        {/* Critique display */}
        {critiqueResult && (
          <div className="rounded-xl border border-pink-500/15 bg-pink-950/10 p-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="mt-0.5 h-4.5 w-4.5 text-pink-400 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-pink-300 font-mono uppercase tracking-wider">Đánh giá & Bản Sửa Đổi từ AI:</span>
                <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {critiqueResult}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Chi Tiết Dự Án & Kế Hoạch Triển Khai (Description)</label>
          <textarea
            required
            rows={4}
            placeholder="Mô tả cụ thể lối chơi, định hướng phát triển, timeline dự kiến..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
          />
        </div>

        {/* Hiring type & Budget details */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Hình thức Hợp tác & Tuyển dụng</label>
            <select
              value={hiringType}
              onChange={(e) => setHiringType(e.target.value as any)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
            >
              <option value="Teammate">Đồng đội cùng tham gia dự án (Teammate)</option>
              <option value="Freelance">Hợp đồng ngắn hạn (Freelance)</option>
              <option value="Both">Cả hai hình thức (Cộng sự / Freelancer)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Ngân sách & Thù lao</label>
            <input
              type="text"
              placeholder="e.g. Thỏa thuận / 10.000.000 VND / Rev-Share..."
              value={budgetDescription}
              onChange={(e) => setBudgetDescription(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Optional media */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Media demo tùy chọn</h3>
              <p className="mt-1 text-xs text-slate-500">Nếu dự án chưa có video hoặc ảnh showcase, bạn có thể bỏ qua phần này.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 cursor-pointer hover:border-indigo-500/40">
                <input
                  type="checkbox"
                  checked={hasVideoDemo}
                  onChange={(e) => {
                    setHasVideoDemo(e.target.checked);
                    if (!e.target.checked) setVideoDemoUrl("");
                  }}
                  className="h-4 w-4 accent-indigo-500"
                />
                Có video demo
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 cursor-pointer hover:border-indigo-500/40">
                <input
                  type="checkbox"
                  checked={hasShowcaseImages}
                  onChange={(e) => {
                    setHasShowcaseImages(e.target.checked);
                    if (!e.target.checked) {
                      setShowcaseImages([]);
                      setImageInput("");
                    }
                  }}
                  className="h-4 w-4 accent-indigo-500"
                />
                Có ảnh showcase
              </label>
            </div>
          </div>

        {/* Video Demo URL */}
        {hasVideoDemo && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Link Video Demo (YouTube, Vimeo hoặc Direct MP4)</label>
          <input
            type="url"
            placeholder="e.g. https://www.youtube.com/watch?v=..."
            value={videoDemoUrl}
            onChange={(e) => setVideoDemoUrl(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
          />
        </div>
        )}

        {/* Showcase Images Manager */}
        {hasShowcaseImages && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Ảnh Showcase của dự án (Tối đa 3 ảnh, mỗi ảnh &lt; 1MB)</label>
          
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Direct Image URL input */}
            <div className="flex-1 flex gap-2">
              <input
                type="url"
                placeholder="Dán link ảnh trực tiếp (e.g. https://...)"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.2 text-xs text-white focus:border-indigo-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-350 hover:bg-slate-800 transition"
              >
                Thêm Link
              </button>
            </div>

            {/* File Upload zone */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="showcase-file-upload"
                disabled={showcaseImages.length >= 3}
              />
              <label
                htmlFor="showcase-file-upload"
                className={`flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white transition cursor-pointer select-none ${showcaseImages.length >= 3 ? "opacity-50 pointer-events-none" : ""}`}
              >
                Tải ảnh lên (&lt;1MB)
              </label>
            </div>
          </div>

          {/* Render showcaseImages thumbnails */}
          {showcaseImages.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-3">
              {showcaseImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-850 h-16 w-28 bg-slate-900">
                  <img src={img} alt={`Showcase ${idx}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-red-400 transition"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
        </div>

        {/* Project Inspiration (Passion Message) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Lời truyền cảm hứng tìm người cùng đam mê</label>
          <textarea
            rows={2}
            placeholder="Hãy viết điều gì đó truyền tải ngọn lửa nhiệt huyết và đam mê của bạn cho dự án này..."
            value={inspiration}
            onChange={(e) => setInspiration(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.8 text-sm text-white focus:border-indigo-500 focus:outline-none transition"
          />
        </div>

        {/* Recruitment roles builder list */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Nhân sự cần tìm</span>
            <button
              type="button"
              onClick={handleAddRecruitment}
              className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="h-4 w-4" /> Thêm yêu cầu
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {recruitments.map((rec, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-3 sm:space-y-0">
                <div className="flex-1 min-w-[150px]">
                  <select
                    value={rec.role}
                    onChange={(e) => handleRecruitmentChange(idx, "role", e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    {Object.values(JobType).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rec.quantity}
                    onChange={(e) => handleRecruitmentChange(idx, "quantity", parseInt(e.target.value) || 1)}
                    className="w-16 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white text-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRecruitment(idx)}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:text-red-400"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3.5 border-t border-slate-800 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.2 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition active:scale-95"
          >
            <span>Đăng dự án</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
