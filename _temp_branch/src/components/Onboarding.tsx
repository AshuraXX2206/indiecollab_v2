import React, { useState } from "react";
import { User, JobType } from "../types";
import { auth } from "../firebase";
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  Cpu, 
  Gamepad2, 
  Palette, 
  Box, 
  Music, 
  HelpCircle, 
  Compass, 
  FileText, 
  UserPlus, 
  Bot, 
  Activity, 
  Mail, 
  Phone, 
  MessageSquare,
  Wand2
} from "lucide-react";

interface OnboardingProps {
  currentUser: User;
  onComplete: (updatedProfile: Partial<User>) => void;
  onLogout: () => void;
}

// Preset visual role cards - matching JobType enum values
const ROLE_OPTIONS = [
  {
    role: "Gameplay Programmer",
    title: "🎮 Gameplay Programmer",
    description: "Implement core mechanics, player controllers, combat systems, physics & game loops",
    icon: Gamepad2,
    color: "text-blue-400 border-blue-500/30 bg-blue-950/10",
    skills: ["Gameplay Systems", "C# Scripting", "Physics Engine", "State Machines"],
    tools: ["Unity", "Godot", "C#", "Git"]
  },
  {
    role: "Pixel Artist",
    title: "👾 Pixel Artist",
    description: "Craft retro worlds, character sprites, tilesets, and pixel-perfect UI designs",
    icon: Palette,
    color: "text-pink-400 border-pink-500/30 bg-pink-950/10",
    skills: ["Pixel Art", "Sprite Animation", "Tileset Design", "Character Design"],
    tools: ["Aseprite", "Photoshop", "GraphicsGale"]
  },
  {
    role: "Concept Artist",
    title: "✏️ Concept Artist",
    description: "Design characters, environments, props and visual identity for game worlds",
    icon: Palette,
    color: "text-rose-400 border-rose-500/30 bg-rose-950/10",
    skills: ["Concept Art", "Character Design", "Environment Design", "Visual Development"],
    tools: ["Photoshop", "Procreate", "Clip Studio"]
  },
  {
    role: "3D Character Artist",
    title: "🎭 3D Character / Environment Artist",
    description: "Build low-poly models, sculpt characters, create environments with optimized meshes",
    icon: Box,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/10",
    skills: ["3D Modeling", "UV Unwrapping", "Rigging", "PBR Texturing"],
    tools: ["Blender", "Unreal Engine", "Substance Painter"]
  },
  {
    role: "Sound Designer",
    title: "🔊 Sound Designer / Composer",
    description: "Compose adaptive soundtracks, design SFX, integrate audio systems (FMOD/Wwise)",
    icon: Music,
    color: "text-purple-400 border-purple-500/30 bg-purple-950/10",
    skills: ["Music Composition", "Sound Effects", "FMOD Integration", "Audio Mixing"],
    tools: ["REAPER", "FMOD Studio", "Ableton", "Wwise"]
  },
  {
    role: "Game Designer",
    title: "🎮 Game & Level Designer",
    description: "Design engaging levels, balance systems, craft core loops and player experiences",
    icon: Compass,
    color: "text-amber-400 border-amber-500/30 bg-amber-950/10",
    skills: ["Level Design", "Systems Balancing", "Core Loop Design", "Prototyping"],
    tools: ["Godot", "Unity", "Figma", "Miro"]
  },
  {
    role: "Narrative Writer",
    title: "📖 Narrative Designer & Writer",
    description: "Build lore, write branching dialogue, design quests, and breathe life into characters",
    icon: FileText,
    color: "text-teal-400 border-teal-500/30 bg-teal-950/10",
    skills: ["World Building", "Dialogue Writing", "Quest Design", "Narrative Branching"],
    tools: ["Twine", "Notion", "Ink/Inkle"]
  },
  {
    role: "AI Game Developer",
    title: "� AI Game Developer",
    description: "Build smart NPCs with behavior trees, integrate LLMs for dynamic dialogue systems",
    icon: Bot,
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-950/10",
    skills: ["Behavior Trees", "LLM Integration", "Procedural Generation", "NPC AI"],
    tools: ["Python", "Node.js", "Unity ML-Agents", "LLM APIs"]
  },
  {
    role: "VFX Artist",
    title: "✨ VFX & Technical Artist",
    description: "Create stunning visual effects, shaders, particle systems and post-processing",
    icon: Activity,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/10",
    skills: ["Particle Systems", "Shader Graph", "VFX Animation", "Post Processing"],
    tools: ["Unity VFX Graph", "Blender", "Shader Graph"]
  },
  {
    role: "Solo Developer (Generalist)",
    title: "🚀 Solo / Indie Developer",
    description: "Jack of all trades - code, art, design, audio. Ship complete games independently",
    icon: Cpu,
    color: "text-orange-400 border-orange-500/30 bg-orange-950/10",
    skills: ["Full-Stack Gamedev", "Rapid Prototyping", "Project Management", "Multi-discipline"],
    tools: ["Godot", "Unity", "Aseprite", "FMOD"]
  },
  {
    role: "CUSTOM",
    title: "✨ Custom Role - Define Your Own",
    description: "Package your unique skill combo into a personalized role that stands out",
    icon: Wand2,
    color: "text-slate-400 border-slate-500/30 bg-slate-950/10",
    skills: ["Rapid Prototyping"],
    tools: ["Web APIs"]
  }
];

// Presets click-to-choose BIOs
const PRESET_BIOS = [
  "🔥 Sẵn sàng gánh team tại tất cả sự kiện Game Jams ngắn ngày, chiến không quản đêm ngày!",
  "💼 Tìm kiếm dự án game dài hạn, nghiêm túc, hoạt động chuyên nghiệp và có chia sẻ doanh thu (Rev-share).",
  "🎮 Đam mê làm game Indie retro phong cách hoài niệm cổ điển, thổi hồn cho các ý tưởng tuổi thơ.",
  "💡 Thích học hỏi, tích luỹ kinh nghiệm dày dặn thông qua portfolio thực tế và bám sát deadline tuyệt đối!",
  "🚀 Chuyên gia dọn bug, tối ưu hiệu năng để game chạy mượt mà 60 FPS trên máy cùi bắp.",
  "🎨 Đam mê phối màu độc đáo, tạo ra thế giới đồ họa khiến người xem khó lòng rời mắt."
];

export default function Onboarding({ currentUser, onComplete, onLogout }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // States
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const [customRoleName, setCustomRoleName] = useState("");
  const [bioText, setBioText] = useState(PRESET_BIOS[0]);
  const [customBioActive, setCustomBioActive] = useState(false);
  const [skills, setSkills] = useState<string[]>(ROLE_OPTIONS[0].skills);
  const [tools, setTools] = useState<string[]>(ROLE_OPTIONS[0].tools);
  const [contactType, setContactType] = useState<"discord" | "facebook" | "email">("discord");
  const [contactVal, setContactVal] = useState("");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  const selectedRoleOption = ROLE_OPTIONS[selectedRoleIndex];

  // Adjust pre-filled skills when role changes
  const handleSelectRoleOption = (idx: number) => {
    setSelectedRoleIndex(idx);
    const chosen = ROLE_OPTIONS[idx];
    if (chosen.role !== "CUSTOM") {
      setSkills(chosen.skills);
      setTools(chosen.tools);
    }
  };

  const handleToggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleToggleTool = (tool: string) => {
    if (tools.includes(tool)) {
      setTools(tools.filter(t => t !== tool));
    } else {
      setTools([...tools, tool]);
    }
  };

  const handleAIGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const finalRole = selectedRoleOption.role === "CUSTOM" 
        ? (customRoleName || "Nhà làm game tự do") 
        : selectedRoleOption.role;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
        } catch (e) { /* token unavailable */ }
      }

      const res = await fetch("/api/ai/generate-bio", {
        method: "POST",
        headers,
        body: JSON.stringify({
          jobTitle: finalRole,
          skills: skills.length > 0 ? skills : ["Chinh chiến Game Jam"],
          tools: tools.length > 0 ? tools : ["Godot"]
        })
      });
      const data = await res.json();
      if (data.success && data.bio) {
        setBioText(data.bio);
        setCustomBioActive(true);
      } else {
        alert("Lỗi AI: " + (data.error || "Không thể tạo bio lúc này."));
      }
    } catch (err) {
      console.error(err);
      alert("Không kết nối được máy chủ AI.");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleCompleteSetup = () => {
    const finalRole = selectedRoleOption.role === "CUSTOM" 
      ? (customRoleName || "Nhà làm game tự do") 
      : selectedRoleOption.role;

    const contactStr = contactVal 
      ? `${contactType === "discord" ? "Discord" : contactType === "facebook" ? "Facebook" : "Email"}: ${contactVal}`
      : `Email: ${currentUser.displayName}@indiecollab.gg`;

    const payload: Partial<User> = {
      jobTitle: finalRole,
      bio: bioText,
      skills: skills.length > 0 ? skills : ["Chinh chiến Game Jam", "Thử thách lập trình"],
      tools: tools.length > 0 ? tools : ["Godot", "Unity"],
      howToReachMe: contactStr,
      profileComplete: true,
      openToWork: true
    };

    onComplete(payload);
  };

  const handleSkipContactAndComplete = () => {
    const finalRole = selectedRoleOption.role === "CUSTOM" 
      ? (customRoleName || "Nhà làm game tự do") 
      : selectedRoleOption.role;

    const payload: Partial<User> = {
      jobTitle: finalRole,
      bio: bioText,
      skills: skills.length > 0 ? skills : ["Chinh chiến Game Jam", "Thử thách lập trình"],
      tools: tools.length > 0 ? tools : ["Godot", "Unity"],
      howToReachMe: "Chưa trực tuyến (Bản nháp)",
      profileComplete: true,
      openToWork: true
    };

    onComplete(payload);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background neon light glow effects */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-pink-500/5 blur-[140px] pointer-events-none" />

      {/* Embedded Top bar for logging out during setup */}
      <header className="border-b border-slate-900 bg-slate-950/95 backdrop-blur-md px-6 py-4 flex items-center justify-between z-50 sticky top-0">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-indigo-400" />
          <span className="font-bold text-sm tracking-tight text-white uppercase font-mono">Thiết Lập Hồ Sơ Game Dev</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 hidden sm:block">Chào mừng, <b className="text-indigo-300">{currentUser.displayName}</b></span>
          <button 
            onClick={onLogout}
            className="text-[10px] font-mono font-bold text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-950 bg-slate-900 hover:bg-red-950/20 px-3 py-1.5 rounded-lg transition"
          >
            Đăng xuất
          </button>
        </div>
      </header>
 
      {/* Main Form content */}
      <main className="flex-1 flex items-center justify-center py-10 px-4 z-10">
        <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-850 p-6 md:p-8 rounded-3xl shadow-3xl backdrop-blur-md">
          
          {/* Stepper Progress bar */}
          <div className="flex items-center justify-between mb-8 max-w-md mx-auto relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -translate-y-1/2 -z-10" />
            
            <button 
              onClick={() => step > 1 && setStep(1)}
              className={`h-8 px-4 rounded-full flex items-center justify-center font-bold text-xs font-mono transition duration-200 border ${
                step === 1 
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : step > 1 
                    ? "bg-indigo-950 border-indigo-900 text-indigo-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
              }`}
            >
              1. Vai trò
            </button>
 
            <button 
              onClick={() => step > 2 && setStep(2)}
              disabled={step < 2}
              className={`h-8 px-4 rounded-full flex items-center justify-center font-bold text-xs font-mono transition duration-200 border ${
                step === 2 
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : step > 2 
                    ? "bg-indigo-950 border-indigo-900 text-indigo-400"
                    : "bg-slate-900 border-slate-800 text-slate-500 disabled:opacity-50"
              }`}
            >
              2. Kỹ năng & Mô tả
            </button>
 
            <button 
              disabled={step < 3}
              className={`h-8 px-4 rounded-full flex items-center justify-center font-bold text-xs font-mono transition duration-200 border ${
                step === 3 
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : "bg-slate-900 border-slate-800 text-slate-500 disabled:opacity-50"
              }`}
            >
              3. Liên hệ
            </button>
          </div>

          {/* STEP 1: CHOOSE CLASS GRID */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold font-sans text-white">Bạn Đóng Vai Trò Gì Trong Dự Án?</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Chọn một class phù hợp nhất với tài năng của bạn. Chúng tôi cung cấp vai trò đa dạng và cả tùy chọn custom.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {ROLE_OPTIONS.map((item, idx) => {
                  const IconComp = item.icon;
                  const isSelected = selectedRoleIndex === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectRoleOption(idx)}
                      className={`text-left p-4 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between cursor-pointer focus:outline-none min-h-[170px] ${
                        isSelected 
                          ? "bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20" 
                          : "bg-slate-950/40 border-slate-850 hover:border-slate-800 hover:bg-slate-950/80"
                      }`}
                    >
                      <div>
                        <div className={`p-2 rounded-xl border ${item.color} w-fit`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-200 mt-3 group-hover:text-white transition">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 h-4 w-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white stroke-[3px]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Class inputs if CUSTOM selected */}
              {selectedRoleOption.role === "CUSTOM" && (
                <div className="bg-slate-950/80 p-4 border border-slate-850 rounded-2xl max-w-md mx-auto animate-fade-in text-left space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Tự Viết Vai Trò Của Bạn:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Producer & PM, 2.5D Pixel Shaders Expert..."
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 focus:border-indigo-500 focus:outline-none transition"
                  />
                  <p className="text-[10px] text-slate-500 italic">Ví dụ: Vai trò này sẽ hiển thị công khai trên hồ sơ của bạn và trong danh sách tìm kiếm thành viên.</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-550/15 cursor-pointer"
                >
                  Tiếp tục bước 2 <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BIO PRESETS AND SKILLS/TOOLS TOGGLES */}
          {step === 2 && (
            <div className="space-y-6 text-left">
              <div className="text-center">
                <h2 className="text-xl font-bold font-sans text-white">Lựa Chọn Mô Tả (Bio) & Kỹ Năng</h2>
                <p className="text-xs text-slate-400 mt-1">Nhanh chóng tạo hồ sơ bằng cách click chọn các mẫu chuẩn bị sẵn, không cần nhập gõ tốn thời gian.</p>
              </div>

              {/* Bio Preset Selection */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">1. Lựa chọn Slogan / Mô tả nhanh chuẩn:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {PRESET_BIOS.map((preset, i) => {
                    const isSelected = bioText === preset && !customBioActive;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBioText(preset);
                          setCustomBioActive(false);
                        }}
                        className={`text-left p-3 rounded-xl border text-[11px] leading-relaxed transition ${
                          isSelected 
                            ? "bg-indigo-600/10 border-indigo-500 text-slate-100 font-medium" 
                            : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-300 hover:border-slate-800 cursor-pointer"
                        }`}
                      >
                        "{preset}"
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-xl space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Hoặc Tự soạn thảo bio cá nhân:</span>
                    <button
                      type="button"
                      onClick={() => setCustomBioActive(true)}
                      className="text-[10px] font-semibold text-indigo-400 hover:underline"
                    >
                      Bật soạn tự do
                    </button>
                  </div>
                  {(customBioActive || true) && (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={bioText}
                        onChange={(e) => {
                          setBioText(e.target.value);
                          setCustomBioActive(true);
                        }}
                        placeholder="Mô tả súc tích về động lực và sở thích làm game..."
                        className="w-full text-xs text-slate-200 rounded-lg border border-slate-800 bg-slate-900 p-2.5 focus:border-indigo-500 focus:outline-none transition resize-none"
                      />
                      <div className="flex justify-start">
                        <button
                          type="button"
                          disabled={isGeneratingBio}
                          onClick={handleAIGenerateBio}
                          className="text-xs bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-550/30 hover:border-indigo-500/50 font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 duration-200 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className={`h-3.5 w-3.5 text-indigo-400 ${isGeneratingBio ? "animate-spin" : ""}`} />
                          {isGeneratingBio ? "Đang viết súc tích cùng Gemini AI..." : "Tối ưu hóa Bio bằng AI (Gemini)"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills/Tools list based on design class */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Popular Skills list */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">2. Chọn Kỹ Năng / Assets chuyên ngành:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    {[
                      "System Architecture", "C# Scripting", "Gameplay Programming", "Physics Engine",
                      "Concept Art", "Pixel Art", "2D Animation", "Character Design",
                      "3D Low-Poly", "UV Unwrapping", "Rigging", "Retro PBR shaders",
                      "Orchestral Score", "Synthwave", "FMOD Integration", "Audio Editing",
                      "Level Design", "Combat Balancer", "Core Loop Design", "Prototyping",
                      "World Building", "Narrative Branching", "Dialogue Writing", "Quest Design",
                      "Gemini Integration", "Dynamic Prompting", "Interactive Dialogue"
                    ].map((skill, i) => {
                      const active = skills.includes(skill);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] transition cursor-pointer font-mono ${
                            active 
                              ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                              : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {active ? "✓ " : ""}{skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Tools list */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">3. Chọn Engine / Công Cụ Sử dụng thạo:</label>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                    {[
                      "Unity", "Godot", "Unreal Engine", "Blender", "Aseprite", "REAPER", "FMOD Studio", 
                      "Spine 2D", "Git", "C#", "C++", "Python", "Node.js", "Web APIs", "Notion"
                    ].map((tool, i) => {
                      const active = tools.includes(tool);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleToggleTool(tool)}
                          className={`px-2.5 py-1 rounded-lg border text-[10px] transition cursor-pointer font-mono ${
                            active 
                              ? "bg-pink-600/15 border-pink-500 text-pink-300"
                              : "bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {active ? "✓ " : ""}{tool}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="flex justify-between pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-slate-800 hover:bg-slate-900 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Quay lại bước 1
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-550/15 cursor-pointer"
                >
                  Tiếp tục bước 3 <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONTACT INFOS */}
          {step === 3 && (
            <div className="space-y-6 text-left">
              <div className="text-center">
                <h2 className="text-xl font-bold font-sans text-white">Chúng Tôi Có Thể Kết Nối Bạn Bằng Cách Nào?</h2>
                <p className="text-xs text-slate-400 mt-1">Hồ sơ sẽ hiển thị cách thức liên hệ này trên bảng sảnh đấu để tuyển cộng tác viên nhanh.</p>
              </div>

              <div className="max-w-md mx-auto space-y-4 pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setContactType("discord")}
                    className={`flex-1 py-3 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      contactType === "discord" 
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300" 
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" /> Discord ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactType("facebook")}
                    className={`flex-1 py-3 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      contactType === "facebook" 
                        ? "bg-blue-600/10 border-blue-500 text-blue-300" 
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Phone className="h-4 w-4" /> Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactType("email")}
                    className={`flex-1 py-3 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      contactType === "email" 
                        ? "bg-red-600/10 border-red-500 text-red-300" 
                        : "bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Mail className="h-4 w-4" /> Email cá nhân
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Nhập địa chỉ của {contactType === "discord" ? "tài khoản Discord" : contactType === "facebook" ? "Trang Facebook" : "Hộp thư Email"}:
                  </label>
                  <input
                    type="text"
                    placeholder={
                      contactType === "discord" 
                        ? "e.g. game_coder#9999 (Tùy chọn)" 
                        : contactType === "facebook" 
                          ? "e.g. fb.com/longpixel (Tùy chọn)" 
                          : "longpixel@workspace.com (Tùy chọn)"
                    }
                    value={contactVal}
                    onChange={(e) => setContactVal(e.target.value)}
                    className="w-full text-xs text-white rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-3 focus:border-indigo-500 focus:outline-none transition font-sans"
                  />
                  <p className="text-[10px] text-slate-500">Giúp đồng đội dễ dàng liên hệ trao đổi kế hoạch, mã nguồn! (Bạn có thể bỏ qua bước này)</p>
                </div>

                {/* Final Review visual box */}
                <div className="bg-gradient-to-br from-indigo-950/50 to-pink-950/20 p-4 border border-indigo-500/10 rounded-2xl space-y-1.5 text-[11px] leading-relaxed mt-4">
                  <span className="font-mono text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">✓ Xem Trước Nhân Vật Của Bạn:</span>
                  <p className="text-slate-200">💎 <b>{currentUser.displayName}</b></p>
                  <p className="text-slate-350">🎭 Vai trò: <span className="text-indigo-300 font-semibold">{selectedRoleOption.role === "CUSTOM" ? (customRoleName || "Nhà làm game tự do") : selectedRoleOption.title.split(" / ").pop()}</span></p>
                  <p className="text-slate-400 text-xs">📝 Bio: "{bioText}"</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-slate-900 mt-6 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-slate-800 hover:bg-slate-900 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Quay lại bước 2
                </button>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleSkipContactAndComplete}
                    className="border border-indigo-550/35 hover:bg-indigo-950/30 text-indigo-300 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Bỏ qua & Hoàn tất sảnh
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteSetup}
                    className="bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white text-xs font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-550/20 cursor-pointer"
                  >
                    <UserPlus className="h-4.5 w-4.5" /> Hoàn Tất Ra Trận!
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/20 py-4 text-center text-[10.5px] text-slate-650 font-mono">
        Bản quyền thiết lập thuộc về sảnh kết nối game IndieCollab.
      </footer>
    </div>
  );
}
