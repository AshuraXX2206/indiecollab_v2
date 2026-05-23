import React, { useState, useEffect, useRef } from "react";
import { 
  UserCheck, 
  Search, 
  Workflow, 
  Play, 
  Pause, 
  Sparkles, 
  Cpu, 
  Wifi, 
  Check, 
  MessageSquare, 
  Layers, 
  ChevronRight, 
  RefreshCw,
  Plus,
  Clock,
  Compass,
  ArrowRight,
  GitBranch,
  Database,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playClickSound, playHoverSound } from "../utils/audio";
import ProjectWorkspaceArchitecture from "./ProjectWorkspaceArchitecture";

interface StepItem {
  id: number;
  step: string;
  title: string;
  englishTitle: string;
  desc: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

export default function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'flow' | 'architecture'>('flow');
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Define steps
  const steps: StepItem[] = [
    {
      id: 0,
      step: "01",
      title: "Thiết lập Hồ sơ Năng lực",
      englishTitle: "Create your profile",
      desc: "Chỉ tốn 30 giây khai báo kỹ năng (C#, Unity, Pixel Art, Audio Synth...), công cụ tuyển chọn và ý định lập đội để hệ thống ghi nhận.",
      color: "#6366F1", // Indigo
      bgColor: "rgba(99, 102, 241, 0.05)",
      borderColor: "rgba(99, 102, 241, 0.2)",
      icon: <UserCheck className="h-5 w-5" />
    },
    {
      id: 1,
      step: "02",
      title: "Quét AI Match & Dự án",
      englishTitle: "Post & Discover projects",
      desc: "Sử dụng thuật toán AI Radar quét toàn bộ phòng sảnh để tìm thành viên hoặc dự án phù hợp nhất với hồ sơ của bạn đạt tỷ lệ ăn khớp tới 99%.",
      color: "#06B6D4", // Cyan
      bgColor: "rgba(6, 182, 212, 0.05)",
      borderColor: "rgba(6, 182, 212, 0.2)",
      icon: <Search className="h-5 w-5" />
    },
    {
      id: 2,
      step: "03",
      title: "Sát cánh, Lập đội & Ship",
      englishTitle: "Build & Ship together",
      desc: "Trò chuyện nhóm thời gian thực, giao nhận mã nguồn tự động, phân chia Milestone & nhiệm vụ để đưa game phiên bản hoàn thiện ra mắt thị trường.",
      color: "#10B981", // Emerald
      bgColor: "rgba(16, 185, 129, 0.05)",
      borderColor: "rgba(16, 185, 129, 0.2)",
      icon: <Workflow className="h-5 w-5" />
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);

    if (isPlaying) {
      setProgress(0);
      const stepDuration = 6500; // 6.5s per step
      const intervalMs = 50;
      const progressIncrement = (intervalMs / stepDuration) * 100;

      progressTimerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setActiveStep(current => (current + 1) % steps.length);
            return 0;
          }
          return p + progressIncrement;
        });
      }, intervalMs);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPlaying, activeStep]);

  const handleStepSelect = (index: number) => {
    playClickSound();
    setActiveStep(index);
    // Pause autoplay when user manually engages to allow playtime
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlayback = () => {
    playClickSound();
    setIsPlaying(!isPlaying);
    setProgress(0);
  };

  // ─── STATE FOR SIMULATORS ──────────────────────────────────────────────────

  // Sim 1: Profile configurations
  const [profileIndex, setProfileIndex] = useState(0);
  const profilePresets = [
    {
      name: "Phan Anh Đức",
      avatarSeed: "coder_duc",
      role: "Gameplay Programmer",
      status: "Sẵn sàng nhận dự án",
      statusColor: "#4ADE80",
      skills: ["C#", "Unity 2D/3D", "A* Pathfinding", "FMOD Studio Bridge"],
      tools: ["Unity Engine", "JetBrains Rider", "GitHub Workspace"],
      desc: "Đã làm 3 bản demo RPG. Muốn tìm cộng sự vẽ nhân vật hoạt họa pixel art 2D."
    },
    {
      name: "Trần Khánh Linh",
      avatarSeed: "artist_linh",
      role: "Pixel Artist / UI-UX",
      status: "Đang tìm đội GameJam",
      statusColor: "#F472B6",
      skills: ["Character Design", "Aseprite FX", "Tilemap Design", "Sprite Sheets"],
      tools: ["Aseprite Design", "Adobe Photoshop", "Spine 2D Animator"],
      desc: "Chuyên vẽ vẽ môi trường viễn tưởng cyberpunk hoài cổ. Yêu mến phong cách NES."
    },
    {
      name: "Hoàng Minh Sơn",
      avatarSeed: "sound_son",
      role: "Sound Designer / Composer",
      status: "Rảnh rỗi ngoài giờ",
      statusColor: "#38BDF8",
      skills: ["Epic Orchestral", "Adaptive Foley SFX", "Synthesizer Loops", "Wwise"],
      tools: ["Ableton Live 11", "Reaper DAW", "Kontakt 7 Engine"],
      desc: "Chuyên phối nhạc nền đậm tính biểu cảm. Muốn phụ trách hệ thống âm thanh thích ứng."
    }
  ];

  // Sim 2: AI Matching
  const [radarScanning, setRadarScanning] = useState(false);
  const [aiMatches, setAiMatches] = useState<any[]>([
    { name: "Neon Cyber Runner", match: 98, role: "Cần Lập trình viên C#", id: 1, applied: false },
    { name: "Symphony of the Void", match: 91, role: "Cần Hoạ sĩ Pixel Art", id: 2, applied: false },
  ]);

  const handleTriggerRadar = () => {
    playClickSound();
    setRadarScanning(true);
    setTimeout(() => {
      // shuffle matchmaking values simulation
      setAiMatches(prev => {
        return prev.map(item => ({
          ...item,
          match: Math.floor(Math.random() * 15) + 84, // keep it high
          applied: false
        }));
      });
      setRadarScanning(false);
    }, 1600);
  };

  const handleApplyMatch = (id: number) => {
    playClickSound();
    setAiMatches(prev => prev.map(m => m.id === id ? { ...m, applied: true } : m));
  };

  // Sim 3: Live Workspace & Tasks
  const [tasks, setTasks] = useState([
    { id: "task-1", text: "Viết mã nguồn chuyển động cơ bản", name: "Đức (Gameplay)", completed: true },
    { id: "task-2", text: "Vẽ xong Sprite-sheet nhân vật nhảy", name: "Linh (Artist)", completed: false },
    { id: "task-3", text: "Thiết lập âm thanh vòm nảy súng", name: "Sơn (Composer)", completed: false },
  ]);

  const handleToggleTask = (id: string) => {
    playClickSound();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const taskPercent = Math.round((completedCount / tasks.length) * 100);

  // Chat conversation looping simulator
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: "Đức", msg: "Bộ điều khiển nhân vật đã tối ưu 60fps rồi nhé!", time: "10:14" },
    { sender: "Linh", msg: "Tuyệt vời, để mình đẩy nốt đống asset hoạt họa lên", time: "10:15" },
  ]);

  useEffect(() => {
    let active = true;
    const extraMessages = [
      { sender: "Sơn", msg: "Đã up demo nhạc nền kịch tính màn đấu boss rồi đấy!", time: "10:16" },
      { sender: "Đức", msg: "Nhạc hay quá Sơn ơi, khớp từng nhịp chạy luôn 🔥", time: "10:17" },
      { sender: "Linh", msg: "Vừa đổi màu viền kiếm cho phát quang, nhìn cháy dã man!", time: "10:18" },
    ];

    let cursor = 0;
    const chatInterval = setInterval(() => {
      if (!active) return;
      if (cursor < extraMessages.length) {
        const nextMsg = extraMessages[cursor];
        setChatMessages(prev => {
          // Keep only last 4 chat messages to avoid overflow
          const next = [...prev, nextMsg];
          return next.length > 4 ? next.slice(next.length - 4) : next;
        });
        cursor++;
      } else {
        // Reset to original
        setChatMessages([
          { sender: "Đức", msg: "Bộ điều khiển nhân vật đã tối ưu 60fps rồi nhé!", time: "10:14" },
          { sender: "Linh", msg: "Tuyệt vời, để mình đẩy nốt đống asset hoạt họa lên", time: "10:15" },
        ]);
        cursor = 0;
      }
    }, 4500);

    return () => {
      active = false;
      clearInterval(chatInterval);
    };
  }, []);

  return (
    <div className="w-full relative py-2 space-y-12">
      {/* ── MASTER NAVIGATION TABS ── */}
      <div className="flex justify-center">
        <div className="flex bg-[#09090b]/80 border border-white/[0.05] p-1.5 rounded-2xl gap-2 backdrop-blur-md shadow-2xl relative z-20">
          <button
            onClick={() => { playClickSound(); setActiveTab('flow'); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              activeTab === 'flow'
                ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Workflow className="h-4 w-4" /> Luồng quy trình lập đội
          </button>
          
          <button
            onClick={() => { playClickSound(); setActiveTab('architecture'); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              activeTab === 'architecture'
                ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Database className="h-4 w-4" /> Kiến trúc hệ thống
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'flow' ? (
          <motion.div
            key="sandbox-flow"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="space-y-12"
          >
            {/* ── Progress & Play Bar ── */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl max-w-sm mx-auto">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-indigo-400 animate-pulse" /> Trình diễn tương tác
              </span>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(idx => (
                    <span 
                      key={idx} 
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeStep === idx ? "bg-indigo-400 scale-110" : "bg-slate-800"
                      }`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={togglePlayback} 
                  className="p-1 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* ── Two-Column Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              
              {/* LEFT COLUMN: INTERACTIVE TICKETS (5 Cols) */}
              <motion.div 
                className="lg:col-span-5 flex flex-col justify-between space-y-5 text-left"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.12 }
                  }
                }}
              >
                <div className="space-y-4">
                  {steps.map((item, idx) => {
                    const isActive = activeStep === idx;
                    return (
                      <motion.div 
                        key={item.id}
                        onClick={() => handleStepSelect(idx)}
                        onMouseEnter={() => playHoverSound()}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                        }}
                        className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left overflow-hidden ${
                          isActive 
                            ? "bg-white/[0.04] border-white/[0.15] shadow-xl" 
                            : "bg-[#09090b]/40 border-white/[0.03] hover:bg-white/[0.01] hover:border-white/[0.06]"
                        }`}
                        style={{
                          boxShadow: isActive ? `inset 0 1px 0 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)` : "none"
                        }}
                      >
                        {/* Glowing vertical bar indicator */}
                        <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-slate-900 overflow-hidden rounded-l">
                          {isActive && (
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: isPlaying ? "100%" : "100%" }}
                              style={{ background: item.color, width: "100%" }}
                              transition={isPlaying ? { ease: "linear", duration: 6.5 } : { duration: 0.3 }}
                            />
                          )}
                        </div>

                        <div className="flex gap-4 items-start relative z-10">
                          {/* Floating Glow Accent behind Icon */}
                          <div 
                            className={`relative w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                              isActive 
                                ? "text-white" 
                                : "text-slate-500 border-white/[0.05] bg-white/[0.01]"
                            }`}
                            style={{
                              background: isActive ? item.bgColor : "",
                              borderColor: isActive ? item.borderColor : "",
                              color: isActive ? item.color : ""
                            }}
                          >
                            {item.icon}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase">{item.step} / {item.englishTitle}</span>
                              {isActive && <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />}
                            </div>
                            <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition">
                              {item.title}
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl flex items-center gap-3 text-left">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-[11px] text-slate-500 font-mono">
                    Hơn <strong className="text-slate-300">1,400+ nhà phát triển game</strong> đã thành công kết nối và phát hành sảnh chơi.
                  </span>
                </div>
              </motion.div>

              {/* RIGHT COLUMN: INTERACTIVE SCREEN SIMULATOR (7 Cols) */}
              <motion.div 
                className="lg:col-span-7 flex flex-col justify-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: 0.1 }}
              >
                <div className="relative rounded-2xl border border-white/[0.06] bg-[#09090b]/80 shadow-2xl overflow-hidden" 
                     style={{ minHeight: "380px" }}>
                  
                  {/* Header of mock window */}
                  <div className="w-full h-11 border-b border-white/[0.06] bg-white/[0.02]/30 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                      <span className="ml-3 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                        Workspace Sandbox v2.0
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-indigo-400/90 tracking-widest">
                        {steps[activeStep].englishTitle.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Sandbox Inner Body with Transitions */}
                  <div className="p-6 relative flex flex-col justify-center" style={{ minHeight: "330px" }}>
                    <AnimatePresence mode="wait">
                      
                      {/* ─── STEP 1: RESUME PROFILE BUILDER ─── */}
                      {activeStep === 0 && (
                        <motion.div
                          key="sim-profile"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 text-left w-full"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                              <Cpu className="h-3 w-3 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                              CHỌN HỒ SƠ QUAN SÁT:
                            </div>
                            <div className="flex gap-1.5">
                              {profilePresets.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => { playClickSound(); setProfileIndex(pIdx); }}
                                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                    profileIndex === pIdx 
                                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                                      : "bg-white/[0.01] border-white/[0.05] text-slate-500 hover:text-slate-350 hover:bg-white/[0.03]"
                                  }`}
                                >
                                  Preset #{pIdx + 1}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Highly-styled Pixel Resume Card */}
                          <div className="p-5 rounded-xl border border-white/[0.05] bg-white/[0.01] relative overflow-hidden space-y-3.5 backdrop-blur shadow-2xl">
                            {/* Accent glow corner */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex gap-4 items-start relative z-10">
                              {/* Interactive Dynamic Avatar */}
                              <div className="relative">
                                <img 
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profilePresets[profileIndex].avatarSeed}`} 
                                  alt="" 
                                  className="w-14 h-14 rounded-xl border border-white/[0.1] bg-[#0c0c0e]" 
                                />
                                <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 rounded-full border-2 border-[#09090b] animate-pulse"
                                      style={{ backgroundColor: profilePresets[profileIndex].statusColor }} />
                              </div>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-black text-white">{profilePresets[profileIndex].name}</h4>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/[0.06] text-slate-400">
                                    ID: ic-dev-2206
                                  </span>
                                </div>
                                <div className="text-xs text-indigo-400 font-mono font-bold">{profilePresets[profileIndex].role}</div>
                                <div className="text-[10px] text-slate-400 italic">“ {profilePresets[profileIndex].desc} ”</div>
                              </div>
                            </div>

                            {/* Attribute strips */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/[0.04]">
                              <div className="space-y-1 text-left">
                                <span className="text-[9px] font-mono text-slate-400 font-bold block">KỸ NĂNG:</span>
                                <div className="flex flex-wrap gap-1">
                                  {profilePresets[profileIndex].skills.map((s, si) => (
                                    <span key={si} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-slate-300">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1 col-span-1 text-left">
                                <span className="text-[9px] font-mono text-slate-400 font-bold block">CÔNG CỤ PHỤ TRÁCH:</span>
                                <div className="flex flex-wrap gap-1">
                                  {profilePresets[profileIndex].tools.map((t, ti) => (
                                    <span key={ti} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/[0.04] border border-indigo-500/10 text-indigo-300">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* State overlay */}
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1.5">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: profilePresets[profileIndex].statusColor }} />
                                {profilePresets[profileIndex].status}
                              </span>
                              <span className="text-emerald-400 font-medium">✓ Đã tối ưu hóa tìm kiếm</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ─── STEP 2: AI RADAR & MATCHING ─── */}
                      {activeStep === 1 && (
                        <motion.div
                          key="sim-radar"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 text-left w-full"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                              <Compass className="h-3 w-3 text-cyan-400 animate-pulse" />
                              AI RADAR SYSTEM CONSOLE
                            </div>
                            <button
                              onClick={handleTriggerRadar}
                              disabled={radarScanning}
                              className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded text-[10px] font-mono font-bold text-cyan-400 transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                            >
                              <RefreshCw className={`h-3 w-3 ${radarScanning ? 'animate-spin' : ''}`} />
                              {radarScanning ? "ĐANG QUÉT PHÒNG..." : "AI TÁI QUÉT MẠNG LƯỚI"}
                            </button>
                          </div>

                          <div className="relative">
                            {/* Display Radar Sweep Overlay during scan */}
                            {radarScanning && (
                              <div className="absolute inset-0 bg-slate-950/90 border border-cyan-500/10 rounded-xl z-20 flex flex-col items-center justify-center space-y-3">
                                <div className="relative w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center overflow-hidden">
                                  <div className="absolute inset-0 bg-radius-gradient border-r border-cyan-500/60 origin-bottom-right animate-spin" style={{ animationDuration: '1.4s' }} />
                                </div>
                                <span className="text-[10px] font-mono text-cyan-400 tracking-widest animate-pulse">ĐANG TOÁN TOÁN CHỈ SỐ KHỚP NĂNG LỰC...</span>
                              </div>
                            )}

                            <div className="space-y-3">
                              {aiMatches.map(m => (
                                <div 
                                  key={m.id}
                                  className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]/80 hover:border-cyan-500/25 transition-all flex items-center justify-between"
                                >
                                  <div className="flex gap-3 items-center">
                                    {/* Glowing percentage badges */}
                                    <div className="w-12 h-12 rounded-lg bg-cyan-500/5 border border-cyan-500/15 flex flex-col items-center justify-center relative">
                                      <span className="text-xs font-black text-cyan-400 font-mono">{m.match}%</span>
                                      <span className="text-[7px] text-slate-500 font-mono tracking-tighter">MATCH</span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <h4 className="text-xs font-extrabold text-white">{m.name}</h4>
                                      <div className="text-[10px] text-slate-400">{m.role}</div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleApplyMatch(m.id)}
                                    disabled={m.applied}
                                    className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                      m.applied 
                                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                                        : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10"
                                    }`}
                                  >
                                    {m.applied ? "✓ ĐÃ GỬI YÊU CẦU" : "XIN GIA NHẬP"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ─── STEP 3: COLLABORATION & MILESTONES ─── */}
                      {activeStep === 2 && (
                        <motion.div
                          key="sim-collab"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-12 gap-4 text-left w-full h-full"
                        >
                          {/* Left: Interactive Todo List (7/12) */}
                          <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="text-[10px] font-mono text-slate-400 font-bold flex items-center justify-between">
                                <span>MILESTONE #1 (DRIVE ALPHA)</span>
                                <span className="text-emerald-400 font-bold">{taskPercent}% HOÀN THÀNH</span>
                              </div>

                              {/* Core progress gauge */}
                              <div className="w-full h-2 rounded bg-slate-900 border border-white/[0.04] overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded transition-all duration-500"
                                  style={{ width: `${taskPercent}%` }}
                                />
                              </div>

                              {/* Interactive List Checklist */}
                              <div className="space-y-2 pt-1">
                                {tasks.map(t => (
                                  <div 
                                    key={t.id}
                                    onClick={() => handleToggleTask(t.id)}
                                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                                      t.completed 
                                        ? "bg-emerald-500/[0.02] border-emerald-500/15" 
                                        : "bg-white/[0.01]/30 border-white/[0.04] hover:bg-white/[0.02]"
                                    }`}
                                  >
                                    <div className="flex gap-2 items-center">
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                        t.completed 
                                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                                          : "border-slate-700"
                                      }`}>
                                        {t.completed && <Check className="h-3 w-3" />}
                                      </div>
                                      <span className={`text-[11px] font-medium transition ${
                                        t.completed ? "text-slate-500 line-through" : "text-slate-200"
                                      }`}>
                                        {t.text}
                                      </span>
                                    </div>
                                    <span className="text-[8px] font-mono text-slate-500 shrink-0">{t.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Celebration tag when ready */}
                            {taskPercent === 100 ? (
                              <div className="p-2 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-300 font-bold animate-pulse font-mono flex items-center justify-center gap-1.5">
                                🔥 TIẾN TRÌNH QUY CHUẨN ĐẠT 100%! EXPORT SANBOX KHẢ THI!
                              </div>
                            ) : (
                              <p className="text-[9px] text-slate-500 italic">Nhấp vào ô vuông để thử kiểm thử quy trình.</p>
                            )}
                          </div>

                          {/* Right: Live Chat Screen Mock (5/12) */}
                          <div className="md:col-span-5 bg-white/[0.01] border border-white/[0.03] rounded-xl flex flex-col justify-between overflow-hidden">
                            <div className="p-2 border-b border-white/[0.04] bg-white/[0.02] text-[9px] font-mono text-slate-500 flex items-center gap-1.5">
                              <MessageSquare className="h-2.5 w-2.5 text-indigo-400" />
                              TRÒ CHUYỆN LÀM VIỆC CHUNG
                            </div>

                            <div className="p-3 space-y-3 flex-1 overflow-hidden flex flex-col justify-end" style={{ maxHeight: "155px" }}>
                              {chatMessages.map((msg, mIdx) => (
                                <div key={mIdx} className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-[9px] font-bold">
                                    <span className="text-slate-300 font-extrabold">{msg.sender}</span>
                                    <span className="text-slate-600 font-mono">{msg.time}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-snug break-words font-medium">
                                    {msg.msg}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="p-2 border-t border-white/[0.04] bg-[#0c0c0e]">
                              <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-md px-2 py-1 text-[9px] text-slate-600 flex items-center justify-between">
                                <span>Nhập tin nhắn...</span>
                                <span className="w-1.5 h-3 bg-indigo-500 animate-pulse" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Hint tag to let user know they can scroll down or click tab */}
            <div className="pt-6 text-center">
              <button 
                onClick={() => { playClickSound(); setActiveTab('architecture'); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/10 hover:border-indigo-500/30 bg-indigo-500/[0.02] text-xs font-mono font-bold text-indigo-400 hover:text-indigo-350 transition cursor-pointer"
              >
                Khám phá Tab Kiến Trúc Hệ Thống Workspace đầy uy lực <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="architecture-system"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
          >
            <ProjectWorkspaceArchitecture />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER COLLABORATION HIGHLIGHT SCENE ── */}
      <motion.div 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 80, damping: 15 }}
        className="pt-10 border-t border-white/[0.04] grid grid-cols-1 md:grid-cols-2 gap-8 text-left items-center bg-[#09090b]/20 p-6 md:p-8 rounded-2xl relative overflow-hidden"
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400">
            <ShieldCheck className="h-3 w-3" /> ĐỘ SẮC NÉT TUYỆT ĐỐI
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Kênh truyền tín đồng bộ đồng loạt (Simul-Sync)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hạ tầng IndieCollab được phát triển dựa trên triết lý <strong className="text-slate-200">Execution-First</strong>. Thay vì các giải pháp ping-pong cổ điển dễ nghẽn băng thông, chúng tôi triển khai hệ thống Pipeline phân quyền bảo mật riêng biệt cho từng phòng sảnh:
          </p>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold shrink-0">✦</span>
              <span><strong>Mạng lưới P2P Signaller:</strong> Giảm tải độ trễ đàm thoại nhóm xuống dưới 80ms quốc tế.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold shrink-0">✦</span>
              <span><strong>Hệ thống phân phối bảo quản:</strong> Giới hạn vùng tải mã nguồn game chỉ thuộc về cộng sự được duyệt.</span>
            </li>
          </ul>
        </div>
        <div className="relative rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-5 space-y-3 shadow-xl flex flex-col justify-center">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 text-[10px] font-mono text-slate-500">
            <span>PING STATS TO NODE</span>
            <span className="text-emerald-400 animate-pulse font-bold">● ONLINE (Excellent)</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Độ trễ truyền gói tin (Database synchronization latency):</span>
              <span className="text-white font-mono font-bold">~ 42ms</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Mức tiêu thụ CPU (Browser resource occupancy):</span>
              <span className="text-white font-mono font-bold">2.4%</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '15%' }} />
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
