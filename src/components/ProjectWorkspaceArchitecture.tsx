import React, { useState, useEffect } from "react";
import { 
  Database, 
  Server, 
  Tv, 
  Lock, 
  Volume2, 
  FileCode, 
  Key, 
  CloudLightning, 
  RefreshCw, 
  Shuffle, 
  Send,
  Zap, 
  ShieldCheck, 
  GitBranch, 
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { playClickSound, playHoverSound } from "../utils/audio";

interface ArchNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  x: string; // CSS position left
  y: string; // CSS position top
  details: {
    title: string;
    tech: string;
    vietDesc: string;
    engDesc: string;
    codeSnippet: string;
    rules: string;
  };
}

export default function ProjectWorkspaceArchitecture() {
  const [selectedNode, setSelectedNode] = useState<string>("firestore");
  const [packets, setPackets] = useState<{ id: number; from: string; to: string; color: string }[]>([]);
  const [packetCounter, setPacketCounter] = useState(0);
  const [activeSimulationType, setActiveSimulationType] = useState<string | null>(null);

  // Nodes definition
  const nodes: ArchNode[] = [
    {
      id: "client",
      label: "Ứng dụng Client (Web/Vite)",
      icon: <Tv className="h-5 w-5" />,
      color: "text-indigo-400",
      glowColor: "rgba(99, 102, 241, 0.4)",
      x: "15%",
      y: "45%",
      details: {
        title: "Client-Side Engine (React + Vite)",
        tech: "Vite, Tailwind, Motion",
        vietDesc: "Giao diện làm việc tối ưu hóa 60fps. Lưu trữ trạng thái thông qua React Context và đồng bộ hóa không đồng bộ. Tích hợp trực tiếp các hook presence để thông báo trạng thái hoạt động tức thì.",
        engDesc: "Rich React environment optimized with Vite. Implements strict state control and proactive client cache layers to guarantee lightning fast response.",
        codeSnippet: `// Đăng ký nhận thay đổi thời gian thực
const unsub = onSnapshot(
  doc(db, "project_workspaces", workspaceId),
  (snapshot) => {
    setWorkspaceData(snapshot.data());
  }
);`,
        rules: "Client-side routing hoàn toàn qua React Router, tối ưu hóa các thành phần giao diện nhẹ."
      }
    },
    {
      id: "firestore",
      label: "Cơ sở dữ liệu Firestore",
      icon: <Database className="h-5 w-5" />,
      color: "text-amber-400",
      glowColor: "rgba(245, 158, 11, 0.4)",
      x: "50%",
      y: "25%",
      details: {
        title: "Real-time Database Replica",
        tech: "Cloud Firestore Rules",
        vietDesc: "Bộ não đồng bộ trạng thái của toàn bộ dự án. Mọi thay đổi về Kanban task, Milestones, Pinned Message đều truyền qua Stream OnSnapshot và phân phối lại cho thành viên nhóm chỉ dưới 150ms.",
        engDesc: "Serves as the central reactive authority. Handles multi-user conflicts natively via transactions and validates documents against strict security rules.",
        codeSnippet: `// Luật phân quyền Firestore Rules an toàn
match /project_workspaces/{projectId} {
  allow read: if isWorkspaceMember(projectId);
  allow write: if isWorkspaceMember(projectId) 
    && request.resource.data.diff(resource.data)
       .affectedKeys().hasOnly(['goals', 'tasks', 'milestones']);
}`,
        rules: "Hạn chế tối đa truy vấn dư thừa bằng cách tách luồng tin nhắn chat (/channels) ra khỏi dữ liệu cấu trúc cốt lõi."
      }
    },
    {
      id: "storage",
      label: "Kho lưu trữ Tài nguyên (Storage)",
      icon: <Lock className="h-5 w-5" />,
      color: "text-teal-400",
      glowColor: "rgba(20, 184, 166, 0.4)",
      x: "82%",
      y: "35%",
      details: {
        title: "Secure Artifact Ledger (Cloud Storage)",
        tech: "Firebase Cloud Storage rules",
        vietDesc: "Lưu giữ an toàn mã nguồn game, file nén (.zip, .unitypackage), và phác thảo đồ họa độc bản. Chỉ những thành viên có quyền hạn sở hữu hoặc thuộc nhóm dự án được cấp quyền đọc và tải tài liệu gốc.",
        engDesc: "Stores production binaries, graphics packs, and archives securely. Access tokens are generated with granular permission checks.",
        codeSnippet: `// Bảo mật Cloud Storage tối ưu
match /workspaces/{projectId}/{allPaths=**} {
  allow read, write: if request.auth != null 
    && isProjectMember(projectId);
}`,
        rules: "Tự động mã hóa tại chỗ (Encryption at rest). Hỗ trợ tải kéo thả đồng thời nhiều tệp dung lượng lớn."
      }
    },
    {
      id: "voice",
      label: "Kênh thoại (Voice Presence)",
      icon: <Volume2 className="h-5 w-5" />,
      color: "text-rose-400",
      glowColor: "rgba(244, 63, 94, 0.4)",
      x: "50%",
      y: "75%",
      details: {
        title: "Live Presence Signaling Node",
        tech: "Firestore Transaction & Presence SDK",
        vietDesc: "Nhà điều phối cuộc gọi thoại và phòng họp trực tuyến ảo của Studio. Sử dụng cơ chế lắng nghe Firestore để cập nhật và hiển thị trực quan ai đang tham gia nói chuyện trong phòng vòm.",
        engDesc: "Handles high-frequency presence polling and updates WebRTC audio status instantly back to colleagues active in the room.",
        codeSnippet: `// Cập nhật trạng thái người dùng trong phòng thoại
async function joinVoiceRoom(roomId, userId) {
  const userRef = doc(db, 'voice_rooms', roomId, 'participants', userId);
  await setDoc(userRef, {
    joinedAt: serverTimestamp(),
    speaking: false,
    muted: false
  });
}`,
        rules: "Hệ thống tự động dọn dẹp (garbage collection) phòng trống khi phát hiện trạng thái ngoại tuyến của thành viên cuối cùng."
      }
    }
  ];

  // Manual trigger simulation
  const triggerSimulation = (type: string) => {
    playClickSound();
    setActiveSimulationType(type);
    
    // Generate simulated glowing data packets along paths
    const newPackets: { id: number; from: string; to: string; color: string }[] = [];
    let baseId = packetCounter;

    if (type === "chat") {
      // Chat message going from client to firestore, and database broadcasting to storage/voice
      newPackets.push({ id: baseId++, from: "client", to: "firestore", color: "#6366F1" });
      setTimeout(() => {
        newPackets.push({ id: baseId++, from: "firestore", to: "client", color: "#F59E0B" });
      }, 700);
    } else if (type === "file") {
      // Client uploads to storage, and metadata written to firestore
      newPackets.push({ id: baseId++, from: "client", to: "storage", color: "#14B8A6" });
      setTimeout(() => {
        newPackets.push({ id: baseId++, from: "storage", to: "firestore", color: "#F59E0B" });
      }, 600);
    } else if (type === "voice") {
      // Voice signaling connection
      newPackets.push({ id: baseId++, from: "client", to: "voice", color: "#F43F5E" });
      setTimeout(() => {
        newPackets.push({ id: baseId++, from: "voice", to: "firestore", color: "#F59E0B" });
      }, 500);
    }

    setPackets(prev => [...prev, ...newPackets]);
    setPacketCounter(baseId);

    // Keep simulation animation and reset
    setTimeout(() => {
      setActiveSimulationType(null);
    }, 1800);

    // Filter old packets
    setTimeout(() => {
      setPackets(prev => prev.filter(p => !newPackets.some(np => np.id === p.id)));
    }, 2500);
  };

  const handleNodeClick = (id: string) => {
    playClickSound();
    setSelectedNode(id);
  };

  const currentActiveNode = nodes.find(n => n.id === selectedNode) || nodes[1];

  return (
    <div className="w-full relative py-12 space-y-12 border-t border-white/[0.04]">
      {/* ── Section Title ── */}
      <div className="text-center space-y-3">
        <span className="px-3 py-1 text-[10px] font-mono tracking-widest text-[#06B6D4] bg-[#06B6D4]/10 rounded-full border border-[#06B6D4]/15 uppercase font-bold">
          Sơ đồ đồng bộ
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Kiến Trúc Hệ Thống Workspace Mượt Mà
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Cơ chế vận hành đa người dùng thời gian thực. Bấm vào các nút đầu mối trong sơ đồ để xem cách chúng kết nối và bảo mật!
        </p>
      </div>

      {/* ── Interactive Playground Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
        
        {/* LEFT COMPONENT: ARCHITECTURE SYSTEM GRAPH (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-2xl border border-white/[0.05] bg-[#09090b]/60 relative overflow-hidden" style={{ minHeight: "450px" }}>
          
          {/* Subtle Technical Grid decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          
          {/* Graph Interactive Stage Container */}
          <div className="relative w-full h-[320px] flex items-center justify-center">
            
            {/* SVG Connecting Cables (Laser lines) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {/* Path client to firestore */}
              <path d="M 120 145 C 200 145, 200 85, 300 85" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="4 4" />
              {/* Path client to voice */}
              <path d="M 120 145 C 200 145, 200 245, 300 245" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="4 4" />
              {/* Path firestore to storage */}
              <path d="M 300 85 C 400 85, 400 120, 500 120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="4 4" />
              {/* Path firestore to voice */}
              <path d="M 300 85 L 300 245" fill="none" stroke="rgba(255,255,255,0.06)'" strokeWidth="2" strokeDasharray="4 4" />
              
              {/* Animated pulses along lines using dynamic packets */}
              {packets.map(packet => {
                let dPath = "";
                if (packet.from === "client" && packet.to === "firestore") {
                  dPath = "M 120 145 C 200 145, 200 85, 300 85";
                } else if (packet.from === "client" && packet.to === "voice") {
                  dPath = "M 120 145 C 200 145, 200 245, 300 245";
                } else if (packet.from === "client" && packet.to === "storage") {
                  dPath = "M 120 145 C 250 145, 350 120, 500 120";
                } else if (packet.from === "firestore" && packet.to === "client") {
                  dPath = "M 300 85 C 200 85, 200 145, 120 145";
                } else if (packet.from === "firestore" && packet.to === "voice") {
                  dPath = "M 300 85 L 300 245";
                } else if (packet.from === "voice" && packet.to === "firestore") {
                  dPath = "M 300 245 L 300 85";
                } else if (packet.from === "storage" && packet.to === "firestore") {
                  dPath = "M 500 120 C 400 120, 400 85, 300 85";
                }

                if (!dPath) return null;

                return (
                  <path 
                    key={packet.id}
                    d={dPath}
                    fill="none" 
                    stroke={packet.color} 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="animate-dash"
                    style={{
                      strokeDasharray: "12, 120",
                      animation: "dash 1.6s cubic-bezier(0.2, 0.8, 0.2, 1) infinite"
                    }}
                  />
                );
              })}
            </svg>

            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -130;
                }
              }
              .bg-grid-pattern {
                background-size: 24px 24px;
                background-image: 
                  linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
              }
            `}</style>

            {/* Render node elements absolutely placed on stage */}
            {nodes.map(node => {
              const isSelected = selectedNode === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => playHoverSound()}
                  className={`absolute p-3 rounded-xl border cursor-pointer select-none transition-all duration-300 flex flex-col items-center gap-1.5 text-center ${
                    isSelected 
                      ? "bg-slate-950 border-white/[0.25] scale-105 shadow-2xl z-10" 
                      : "bg-[#09090b]/80 border-white/[0.04] hover:border-white/[0.12]"
                  }`}
                  style={{
                    left: node.x,
                    top: node.y,
                    transform: "translate(-50%, -50%)",
                    boxShadow: isSelected ? `0 10px 30px ${node.glowColor}` : "none"
                  }}
                >
                  <div 
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected ? "bg-white/[0.06] text-white" : "text-slate-500 border-white/[0.05]"
                    }`}
                    style={{ color: isSelected ? "" : "inherit" }}
                  >
                    {node.icon}
                  </div>
                  <span className={`text-[10px] font-bold font-mono tracking-wide ${isSelected ? "text-white" : "text-slate-400"}`}>
                    {node.label}
                  </span>
                  
                  {/* Subtle pulsing beacon when selected */}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-indigo-400" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Simulator Actions trigger */}
          <div className="border-t border-white/[0.06] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 uppercase font-semibold">
              <Zap className="h-3 w-3 text-amber-400" /> Bảng mô phỏng tương tác:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerSimulation("chat")}
                disabled={activeSimulationType !== null}
                className="px-3 py-1.5 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 bg-indigo-500/[0.03] text-indigo-400 hover:text-indigo-300 text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" /> Gửi tin Chat real-time
              </button>
              <button
                onClick={() => triggerSimulation("file")}
                disabled={activeSimulationType !== null}
                className="px-3 py-1.5 rounded-lg border border-teal-500/10 hover:border-teal-500/30 bg-teal-500/[0.03] text-teal-400 hover:text-teal-350 text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <CloudLightning className="h-3.5 w-3.5" /> Đồng bộ file asset lớn
              </button>
              <button
                onClick={() => triggerSimulation("voice")}
                disabled={activeSimulationType !== null}
                className="px-3 py-1.5 rounded-lg border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/[0.03] text-rose-400 hover:text-rose-350 text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Volume2 className="h-3.5 w-3.5" /> Bật Mic họp thoại nhóm
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: NODE TECHNICAL ANALYSIS (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl border border-white/[0.05] bg-[#09090b]/40 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white">
                  {currentActiveNode.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{currentActiveNode.details.title}</h3>
                  <div className="text-[10px] font-mono font-bold text-indigo-400 uppercase">{currentActiveNode.details.tech}</div>
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-2.5">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {currentActiveNode.details.vietDesc}
                </p>
                <p className="text-[11px] text-slate-450 italic leading-relaxed">
                  {currentActiveNode.details.engDesc}
                </p>
              </div>

              {/* Technical Code logic box */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-slate-500 font-bold block flex items-center gap-1">
                  <FileCode className="h-3 w-3 text-indigo-400" /> CODE LOGIC VẬN HÀNH THỰC TẾ:
                </span>
                <div className="p-3.5 rounded-lg bg-slate-950/90 border border-white/[0.04] overflow-x-auto">
                  <pre className="text-[10px] font-mono text-slate-350 leading-relaxed whitespace-pre select-all">
                    {currentActiveNode.details.codeSnippet}
                  </pre>
                </div>
              </div>

              {/* Rules & Guidelines bar */}
              <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                <div className="flex gap-2 items-start text-emerald-400/95">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Nguyên tắc bảo mật sảnh:</span>
                    <span className="text-[10px] text-slate-400 block">{currentActiveNode.details.rules}</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Prompt footer info */}
          <div className="pt-4 border-t border-white/[0.04] text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Dạng cơ sở dữ liệu: NoSQL Realtime</span>
            <span className="text-indigo-400 font-bold">✓ Client & Server Đồng bộ tuyệt đối</span>
          </div>

        </div>

      </div>
    </div>
  );
}
