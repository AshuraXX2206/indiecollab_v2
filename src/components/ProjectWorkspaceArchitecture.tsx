import React, { useState } from "react";
import { 
  Database, 
  Tv, 
  Lock, 
  Volume2, 
  RefreshCw, 
  Send,
  Zap, 
  ShieldCheck,
  CheckCircle2,
  Workflow,
  CloudLightning,
  ShieldAlert,
  Terminal,
  Skull,
  Bug,
  XCircle,
  ShieldX
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
    flowSteps: string[];
    rules: string;
  };
}

interface HackerDefenseScenario {
  id: string;
  title: string;
  victimNode: string;
  exploitVector: string;
  dangerLevel: string;
  icon: React.ReactNode;
  attackPayload: string;
  behavior: string;
  rulesApplied: string;
  vietRemedy: string;
  codeDefense: string;
}

export default function ProjectWorkspaceArchitecture() {
  const [selectedNode, setSelectedNode] = useState<string>("firestore");
  const [packets, setPackets] = useState<{ id: number; from: string; to: string; color: string }[]>([]);
  const [packetCounter, setPacketCounter] = useState(0);
  const [activeSimulationType, setActiveSimulationType] = useState<string | null>(null);

  // Security Simulation State
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [securityStatus, setSecurityStatus] = useState<"IDLE" | "ATTACKING" | "DEFENDED">("IDLE");
  const [scenLog, setScenLog] = useState<string[]>([]);

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
        flowSteps: [
          "Mở trình duyệt, khởi chạy sảnh kết nối indiecollab với tốc độ tải tức thì cực nhanh.",
          "Thành viên thao tác tương tác như kéo thả Task trên bảng Kanban, viết chat, gửi asset.",
          "Client cập nhật trạng thái hoạt ảnh trước (Optimistic UI) giúp giảm cảm giác trễ xuống 0ms.",
          "Truyền dữ liệu không đồng bộ lên đám mây thông qua phân luồng kết nối song song."
        ],
        rules: "Client-side tối ưu hóa tài nguyên phần cứng, tự dọn dẹp các lắng nghe kết nối thừa khi đóng tab."
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
        tech: "NoSQL Real-time Engine",
        vietDesc: "Bộ não đồng bộ trạng thái của toàn bộ dự án. Mọi thay đổi về Kanban task, Milestones, Pinned Message đều truyền qua Stream OnSnapshot và phân phối lại cho thành viên nhóm chỉ dưới 150ms.",
        engDesc: "Serves as the central reactive authority. Handles multi-user conflicts natively via transactions and validates documents against strict security rules.",
        flowSteps: [
          "Nhận yêu cầu thay đổi từ Client gửi tới hệ thống cơ sở dữ liệu phân tán.",
          "Tự động đối chiếu thông tin người dùng với danh sách thành viên hợp lệ trong dự án.",
          "Xử lý chống xung đột phiên làm việc đa người dùng thông qua mô hình Transaction.",
          "Tự động phát tín hiệu OnSnapshot phát sóng cập nhật đồng loạt tới các thành viên đang hoạt động."
        ],
        rules: "Giới hạn kích thước gói tin gửi nhận và phân mảnh các kênh truyền tải dữ liệu giúp tránh tắc nghẽn."
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
        tech: "Cloud File Cloud Storage",
        vietDesc: "Lưu giữ an toàn mã nguồn game, file nén (.zip, .unitypackage), và phác thảo đồ họa độc bản. Chỉ những thành viên có quyền hạn sở hữu hoặc thuộc nhóm dự án được cấp quyền đọc và tải tài liệu gốc.",
        engDesc: "Stores production binaries, graphics packs, and archives securely. Access tokens are generated with granular permission checks.",
        flowSteps: [
          "Client bắt đầu kéo thả tệp asset đồ họa hoặc zip tài liệu kỹ thuật vào vùng tải lên.",
          "Tắt luồng nén và kiểm tra định dạng tệp trước khi bắt đầu tải song song nhiều phần (Multipart).",
          "Lưu trữ tệp nhị phân gốc an toàn tại cụm máy chủ phân tán với tính năng mã hóa tại chỗ.",
          "Tự sinh đường dẫn bảo mật có giới hạn thời gian (Signed URL) gửi ngược về cơ sở dữ liệu."
        ],
        rules: "Tự động quét virus tệp khi nhận và nén nhẹ hình ảnh hiển thị trước để tối ưu dung lượng băng thông."
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
        tech: "WebRTC Audio Gateway & Signals",
        vietDesc: "Nhà điều phối cuộc gọi thoại và phòng họp trực tuyến ảo của Studio. Sử dụng cơ chế lắng nghe Firestore để cập nhật và hiển thị trực quan ai đang tham gia nói chuyện trong phòng vòm.",
        engDesc: "Handles high-frequency presence polling and updates WebRTC audio status instantly back to colleagues active in the room.",
        flowSteps: [
          "Thành viên kích hoạt phòng thoại nhóm trong sảnh dự án của indiecollab.",
          "Hợp nhất luồng tín hiệu báo hiệu trạng thái tắt mic, bật mic, và trạng thái âm lượng nói.",
          "Thiết lập kết nối âm thanh ngang hàng (Peer-to-Peer WebRTC) mang lại chất lượng tiếng trung thực.",
          "Đo đạc liên tục độ trễ đường truyền đảm bảo tín hiệu âm thoại ổn định trong suốt buổi họp."
        ],
        rules: "Hệ thống tự động giải phóng phòng thoại (Garbage Collection) ngay khi người dùng cuối cùng rời phòng."
      }
    }
  ];

  // Cyber Security Scenarios
  const scenarios: HackerDefenseScenario[] = [
    {
      id: "escalation",
      title: "Leo thang đặc quyền (Privilege Escalation)",
      victimNode: "firestore",
      exploitVector: "Tự nâng cấp profile để set isAdmin = true, sửa trực tiếp role của thành viên để chiếm quyền sở hữu dự án game.",
      dangerLevel: "CRITICAL",
      icon: <Skull className="h-4 w-4 text-red-500 animate-pulse" />,
      attackPayload: `{ id: "bad_user", displayName: "Hacker_X", isAdmin: true, role: "owner" }`,
      behavior: "Hacker sử dụng trực tiếp Firebase Console DevTools hoặc Curl Post gửi bản tin chỉnh sửa trực tiếp thông tin người dùng từ trình duyệt.",
      rulesApplied: "Quy tắc kiểm tra update.diff().affectedKeys().hasOnly() cùng với zero-trust helper.",
      vietRemedy: "Firestore Rules từ chối toàn bộ thao tác do trường dữ liệu 'isAdmin' nằm ngoài danh mục khóa được cho phép sửa đổi (Whitelist), đồng thời từ chối việc tự đổi 'id' không trùng khớp với mã token Auth UID do máy chủ Google Authentication xác thực.",
      codeDefense: `allow update: if isSelf(userId) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'avatarUrl', 'skills', 'tools', 'bio'])`
    },
    {
      id: "scraping",
      title: "Quét trộm cơ sở dữ liệu (Unauthorized Scrapes)",
      victimNode: "firestore",
      exploitVector: "Hacker xem trộm mã nguồn client, có được Firebase API Key, sau đó bỏ qua website và viết Script kéo toàn bộ tin nhắn chat trong các dự án mật.",
      dangerLevel: "HIGH",
      icon: <Bug className="h-4 w-4 text-orange-500 animate-pulse" />,
      attackPayload: `firestore.collection("project_workspaces").doc("project_uuid_bi_mat").collection("messages").get()`,
      behavior: "Sử dụng key công khai của Firebase để kích hoạt lệnh fetch lấy toàn bộ danh sách Workspace mật mà hacker không sở hữu quyền truy cập.",
      rulesApplied: "Ràng buộc kiểm tra nguồn quan hệ (Relational Constraint Verification) onSnapshot & get queries.",
      vietRemedy: "Quy tắc bảo mật Firestore ngay lập tức chặn đứng lượt lấy dữ liệu thông qua lệnh kiểm tra: belongsToWorkspace(). Kể cả hacker có API Key công khai, máy chủ Firestore kiểm tra người yêu cầu KHÔNG nằm trong mảng `memberIds` của Workspace, chấm dứt kết nối lập tức, trả về lỗi Permission Denied 403.",
      codeDefense: `allow read: if signedIn() && (resource.data.ownerId == uid() || uid() in resource.data.memberIds)`
    },
    {
      id: "poisoning",
      title: "Làm giả danh tính (Identity Spoofing)",
      victimNode: "firestore",
      exploitVector: "Gửi gói tin chat cố ý ghi đè tên người gửi (senderId) thành ID của Admin hoặc Trưởng nhóm để ra chỉ thị độc lập phi pháp.",
      dangerLevel: "HIGH",
      icon: <ShieldX className="h-4 w-4 text-yellow-500" />,
      attackPayload: `{ senderId: "project_leader_uid", content: "Yêu cầu chuyển giao toàn bộ mã nguồn game gửi vào link lạ này" }`,
      behavior: "Thay đổi biến cục bộ để giả dạng là trưởng nhóm thực hiện chat trong Studio workspace.",
      rulesApplied: "Identity Integrity Enforcement (Xác thực ràng buộc nhận diện máy chủ).",
      vietRemedy: "Quy tắc chặn tuyệt đối mọi hành vi gửi tin nếu `request.resource.data.senderId != request.auth.uid`. Không cần quan tâm client gửi gì lên, Firestore đối chiếu mã căn cước UID trực tiếp từ token mật đã được mã hóa của Google Auth. Việc giả mạo ID bị kết luận thất bại hoàn toàn.",
      codeDefense: `function isValidMessage(data) { return data.senderId == uid(); }`
    },
    {
      id: "wallet_exhaustion",
      title: "Tẩy chay tài chính (Denial of Wallet Storage)",
      victimNode: "storage",
      exploitVector: "Hacker cố tình tạo vòng lặp liên tục đẩy vô hạn các file rác dung lượng lớn (10GB file zip trống) hòng làm vượt hạn mức Storage để kích hoạt hóa đơn khổng lồ.",
      dangerLevel: "CRITICAL",
      icon: <Lock className="h-4 w-4 text-red-400" />,
      attackPayload: `Upload: trash_loop_infinity.zip (10,000 MB)`,
      behavior: "Khởi động luồng upload tệp nhị phân rác với quy mô lớn lên hệ thống Cloud Storage.",
      rulesApplied: "Nguyên tắc kiểm soát tệp và dung lượng (Temporal & Payload Boundary Bounds).",
      vietRemedy: "Cloud Storage Rules áp đặt ranh giới bảo mật cứng: Chỉ cho phép tệp tải lên dưới 50MB, đồng thời tệp phải có đường dẫn trùng khớp dạng \`exclusive-assets/{userId}/{assetId}\` với `{userId}` là Auth UID thực tế của hacker. Mọi yêu cầu ghi đè dung lượng lớn hoặc nặc danh đều bị từ chối trước khi lưu tệp.",
      codeDefense: `allow create: if request.resource.size <= 50 * 1024 * 1024 && paths.matches('^exclusive-assets/' + uid() + '/.+$')`
    }
  ];

  // Manual trigger simulation
  const triggerSimulation = (type: string) => {
    playClickSound();
    setActiveSimulationType(type);
    setActiveScenarioId(null);
    setSecurityStatus("IDLE");
    
    // Generate simulated glowing data packets along paths
    const newPackets: { id: number; from: string; to: string; color: string }[] = [];
    let baseId = packetCounter;

    if (type === "chat") {
      newPackets.push({ id: baseId++, from: "client", to: "firestore", color: "#6366F1" });
      setTimeout(() => {
        newPackets.push({ id: baseId++, from: "firestore", to: "client", color: "#F59E0B" });
      }, 700);
    } else if (type === "file") {
      newPackets.push({ id: baseId++, from: "client", to: "storage", color: "#14B8A6" });
      setTimeout(() => {
        newPackets.push({ id: baseId++, from: "storage", to: "firestore", color: "#F59E0B" });
      }, 600);
    } else if (type === "voice") {
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

  const triggerHackerDefenseSimulator = (scenId: string) => {
    playClickSound();
    setActiveScenarioId(scenId);
    setSecurityStatus("ATTACKING");
    setScenLog(["[Hacker] Đang tải payload...", "[Hacker] Khởi động cuộc tấn công mạng..."]);

    const targetScen = scenarios.find(s => s.id === scenId);
    if (!targetScen) return;

    // Send Red Packets from Screen corners into target Nodes
    const baseId = packetCounter;
    const newPackets = [
      { id: baseId, from: "client", to: targetScen.victimNode, color: "#EF4444" }
    ];
    setPackets(prev => [...prev, ...newPackets]);
    setPacketCounter(p => p + 1);

    setTimeout(() => {
      setScenLog(prev => [...prev, `[Hacker] Gửi payload độc: ${targetScen.attackPayload}`, "[Database Core] Đang xử lý đối soát bản tin..."]);
    }, 700);

    setTimeout(() => {
      setSecurityStatus("DEFENDED");
      setScenLog(prev => [
        ...prev, 
        `[Cloud Rules Engine] TRẬN ĐỒ BẢO VỆ PHÁT HIỆN INTRUSION!`,
        `[Chính sách áp dụng] ${targetScen.rulesApplied}`,
        `[KẾT QUẢ] ABORT OPERATION - CODE 403 FORBIDDEN. BLOCK AN TOÀN TRONG 0ms!`
      ]);
      playClickSound(); // Alert tone
    }, 1600);

    // Filter packet
    setTimeout(() => {
      setPackets(prev => prev.filter(p => p.id !== baseId));
    }, 2500);
  };

  const handleNodeClick = (id: string) => {
    playClickSound();
    setSelectedNode(id);
    setActiveScenarioId(null);
    setSecurityStatus("IDLE");
  };

  const currentActiveNode = nodes.find(n => n.id === selectedNode) || nodes[1];

  const currentScenario = scenarios.find(s => s.id === activeScenarioId);

  return (
    <div className="w-full relative py-12 space-y-12">
      {/* ── Section Title ── */}
      <div className="text-center space-y-3">
        <span className="px-3 py-1 text-[10px] font-mono tracking-widest text-[#06B6D4] bg-[#06B6D4]/10 rounded-full border border-[#06B6D4]/15 uppercase font-bold">
          Sơ đồ đồng bộ & Bảo mật
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Bộ Khung Kiến Trúc & Phòng Thủ Zero-Trust
        </h2>
        <p className="text-slate-450 text-sm max-w-2xl mx-auto font-normal leading-relaxed">
          Kể cả khi Hacker đọc mã nguồn Client và biết quy trình đồng bộ, họ <strong className="text-emerald-400">KHÔNG THỂ</strong> bẻ gãy hệ thống. Cơ chế Firestore Security Rules bảo mật toán học từ máy chủ sẽ chặn đứng mọi gói tin giả mạo!
        </p>
      </div>

      {/* ── Interactive Playground Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
        
        {/* LEFT COMPONENT: ARCHITECTURE SYSTEM GRAPH (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-2xl border border-white/[0.05] bg-[#09090b]/60 relative overflow-hidden" style={{ minHeight: "450px" }}>
          
          {/* Subtle Technical Grid decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
          
          {/* Active Cyber Security Threat banner */}
          <AnimatePresence>
            {securityStatus !== "IDLE" && (
              <motion.div 
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`absolute top-4 left-4 right-4 p-2.5 rounded-lg border flex items-center justify-between text-[11px] font-mono font-bold z-20 ${
                  securityStatus === "ATTACKING" 
                    ? "bg-red-950/80 border-red-500/30 text-red-400" 
                    : "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${securityStatus === "ATTACKING" ? "bg-red-500 animate-ping" : "bg-emerald-400"}`} />
                  <span>
                    {securityStatus === "ATTACKING" 
                      ? `[CẢNH BÁO TẤN CÔNG] Đang cố ý đột hại: ${currentScenario?.title}` 
                      : `[STÀNH PHÒNG THỦ] Đánh chặn thành công! Code 403: Operation Aborted`
                    }
                  </span>
                </div>
                <span>{securityStatus === "ATTACKING" ? "DANGER_ATTACK_PLAYING" : "SECURE_SHIELD_READY"}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
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
              <path d="M 300 85 L 300 245" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" strokeDasharray="4 4" />
              
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
                  linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px);
              }
            `}</style>

            {/* Render node elements absolutely placed on stage */}
            {nodes.map(node => {
              const isSelected = selectedNode === node.id && securityStatus === "IDLE";
              const isVictim = securityStatus !== "IDLE" && currentScenario?.victimNode === node.id;
              
              let borderClass = "border-white/[0.04] hover:border-white/[0.12]";
              let bgClass = "bg-[#09090b]/80";
              let shadowStyle = "none";

              if (isSelected) {
                borderClass = "border-white/[0.25] scale-105";
                bgClass = "bg-slate-950";
                shadowStyle = `0 10px 30px ${node.glowColor}`;
              } else if (isVictim) {
                if (securityStatus === "ATTACKING") {
                  borderClass = "border-red-500/50 scale-105 animate-pulse";
                  bgClass = "bg-red-950/60";
                  shadowStyle = "0 0 25px rgba(239, 68, 68, 0.5)";
                } else if (securityStatus === "DEFENDED") {
                  borderClass = "border-emerald-500/50 scale-105";
                  bgClass = "bg-emerald-950/60";
                  shadowStyle = "0 0 25px rgba(16, 185, 129, 0.5)";
                }
              }

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseEnter={() => playHoverSound()}
                  className={`absolute p-3 rounded-xl border cursor-pointer select-none transition-all duration-300 flex flex-col items-center gap-1.5 text-center z-10 ${bgClass} ${borderClass}`}
                  style={{
                    left: node.x,
                    top: node.y,
                    transform: "translate(-50%, -50%)",
                    boxShadow: shadowStyle
                  }}
                >
                  <div 
                    className={`p-2 rounded-lg border transition-all ${
                      isSelected ? "bg-white/[0.06] text-white" : isVictim ? "text-white" : "text-slate-500 border-white/[0.05]"
                    }`}
                  >
                    {isVictim ? (
                      securityStatus === "ATTACKING" ? <ShieldAlert className="h-5 w-5 text-red-500 animate-bounce" /> : <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    ) : (
                      node.icon
                    )}
                  </div>
                  <span className={`text-[10px] font-bold font-mono tracking-wide ${isSelected || isVictim ? "text-white" : "text-slate-400"}`}>
                    {node.label}
                  </span>
                  
                  {/* Subtle pulsing beacon when selected or victim */}
                  {(isSelected || isVictim) && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVictim ? "bg-red-400" : "bg-indigo-400"}`} />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isVictim ? (securityStatus === "ATTACKING" ? "bg-red-500" : "bg-emerald-400") : "bg-indigo-500"}`} />
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
                disabled={activeSimulationType !== null || securityStatus === "ATTACKING"}
                className="px-3 py-1.5 rounded-lg border border-indigo-500/10 hover:border-indigo-500/30 bg-indigo-500/[0.03] text-indigo-400 hover:text-indigo-300 text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" /> Gửi tin Chat real-time
              </button>
              <button
                onClick={() => triggerSimulation("file")}
                disabled={activeSimulationType !== null || securityStatus === "ATTACKING"}
                className="px-3 py-1.5 rounded-lg border border-teal-500/10 hover:border-teal-500/30 bg-teal-500/[0.03] text-teal-400 hover:text-teal-350 text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <CloudLightning className="h-3.5 w-3.5" /> Đồng bộ file asset lớn
              </button>
              <button
                onClick={() => triggerSimulation("voice")}
                disabled={activeSimulationType !== null || securityStatus === "ATTACKING"}
                className="px-3 py-1.5 rounded-lg border border-rose-500/10 hover:border-rose-500/30 bg-rose-500/[0.03] text-rose-400 hover:text-rose-350 text-[10px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Volume2 className="h-3.5 w-3.5" /> Bật Mic họp thoại nhóm
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: NODE TECHNICAL ANALYSIS & HACKER PROTECTION PANEL (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl border border-white/[0.05] bg-[#09090b]/40 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {!activeScenarioId ? (
              /* STANDARD COMPONENT DETAILS */
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
                  <p className="text-xs text-slate-350 leading-relaxed font-normal animate-fade-in">
                    {currentActiveNode.details.vietDesc}
                  </p>
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">
                    {currentActiveNode.details.engDesc}
                  </p>
                </div>

                {/* FLOW MECHANICS STEPS */}
                <div className="space-y-2 pt-1 border-t border-white/[0.04]">
                  <span className="text-[9px] font-mono text-indigo-400 font-bold block flex items-center gap-1 uppercase tracking-wider">
                    <Workflow className="h-3.5 w-3.5" /> Quy trình vận hành dữ liệu:
                  </span>
                  <div className="space-y-1.5">
                    {currentActiveNode.details.flowSteps.map((step, sIdx) => (
                      <div key={sIdx} className="flex gap-2.5 items-start text-xs bg-white/[0.01] hover:bg-white/[0.02] p-2 rounded border border-white/[0.03] transition-colors leading-relaxed">
                        <div className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 w-5 h-5 rounded flex items-center justify-center shrink-0">
                          {String(sIdx + 1).padStart(2, '0')}
                        </div>
                        <span className="text-slate-300 text-[11px] font-normal">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules & Guidelines bar */}
                <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-lg">
                  <div className="flex gap-2 items-start text-indigo-400/95">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider block">Nguyên tắc giữ dải đồng bộ:</span>
                      <span className="text-[10px] text-slate-400 block">{currentActiveNode.details.rules}</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              /* CYBER DEFENSE MODE PANEL */
              <motion.div
                key={activeScenarioId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border ${securityStatus === "ATTACKING" ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">{currentScenario?.title}</h3>
                    <span className="text-[9px] font-mono font-bold text-red-400 border border-red-500/20 bg-red-950/20 px-1.5 py-0.5 rounded leading-none uppercase">
                      LEVEL: {currentScenario?.dangerLevel} THREAT
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-red-950/20 border border-white/[0.03] rounded-lg text-[11px] space-y-1">
                  <div className="text-slate-500 font-mono font-bold text-[9px] uppercase">Gói tin độc hại (Attack Payload):</div>
                  <code className="text-red-400 block font-mono font-medium text-[10px] break-all bg-black/40 p-1.5 rounded border border-red-500/10">
                    {currentScenario?.attackPayload}
                  </code>
                </div>

                {/* Simulated firewall execution logs */}
                <div className="p-3 bg-slate-950/90 rounded-lg border border-white/[0.05] font-mono text-[10px] space-y-1 select-text">
                  <span className="text-[9px] text-[#06B6D4] font-bold block flex items-center gap-1 uppercase tracking-wider mb-1">
                    <Terminal className="h-3.5 w-3.5" /> Console mô phỏng phòng thủ:
                  </span>
                  <div className="space-y-1 max-h-[110px] overflow-y-auto">
                    {scenLog.map((log, lIdx) => (
                      <div key={lIdx} className={log.includes("TRẬN ĐỒ") || log.includes("KẾT QUẢ") ? "text-emerald-400 font-bold" : log.includes("[Hacker]") ? "text-red-400" : "text-slate-400"}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vietnamese remedy explaining backend block */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">Cơ Chế Khóa Bảo Mật:</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#0c0c0e] p-2.5 rounded border border-white/[0.03]">
                    {currentScenario?.vietRemedy}
                  </p>
                </div>

                {/* Rules Code Snippet defense */}
                {securityStatus === "DEFENDED" && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 font-bold block uppercase tracking-wider">Mã Kiểm Lỗi Thực Tế Trong Firestore Rules:</span>
                    <pre className="text-[9px] font-mono text-slate-400 bg-black/40 p-2 rounded max-h-[100px] overflow-x-auto whitespace-pre leading-normal border border-white/[0.02]">
                      {currentScenario?.codeDefense}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt footer info */}
          <div className="pt-4 border-t border-white/[0.04] text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span>Thiết kế bảo trì: Zero-Trust Policy</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Đánh chặn tuyệt đối tại Server API
            </span>
          </div>

        </div>

      </div>

      {/* Cyber Security Threat List selector */}
      <div className="border border-white/[0.04] bg-[#09090b]/40 relative p-6 rounded-2xl max-w-6xl mx-auto space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5 font-bold">
              <ShieldAlert className="h-4.5 w-4.5 text-red-500 animate-pulse" /> SÂN CHƠI MÔ PHÒNG KHẮC PHỤC LỖ HỔNG (CYBER DEFENSE PLAYGROUND)
            </h4>
            <p className="text-xs text-slate-400 font-normal">
              Hacker giải mã code của bạn, gửi gói tin rác trực tiếp lên máy chủ không qua UI. Hãy kích hoạt thử nghiệm đánh trả!
            </p>
          </div>
          {activeScenarioId && (
            <button
              onClick={() => {
                playClickSound();
                setActiveScenarioId(null);
                setSecurityStatus("IDLE");
              }}
              className="px-2.5 py-1 text-[10px] font-mono font-bold text-slate-400 border border-white/[0.1] hover:border-white/[0.2] bg-white/[0.02] hover:bg-white/[0.04] rounded transition cursor-pointer"
            >
              ← Quay lại phân tích cốt lõi
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map(scen => {
            const isCurrent = activeScenarioId === scen.id;
            return (
              <div
                key={scen.id}
                onClick={() => triggerHackerDefenseSimulator(scen.id)}
                onMouseEnter={() => playHoverSound()}
                className={`group p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between h-[110px] ${
                  isCurrent 
                    ? "bg-red-500/[0.02] border-red-500/40 shadow-inner" 
                    : "bg-[#09090b]/60 border-white/[0.03] hover:border-white/[0.1] hover:bg-slate-950/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {scen.icon}
                    <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white transition leading-snug">
                      {scen.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-normal line-clamp-2">
                    {scen.exploitVector}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono font-bold">
                  <span className="text-red-400 uppercase tracking-widest">{scen.dangerLevel}</span>
                  <span className={`transition-colors ${isCurrent ? "text-red-400 animate-pulse" : "text-[#06B6D4] group-hover:text-emerald-400"}`}>
                    {isCurrent ? "ĐANG TẤN CÔNG •••" : "MÔ PHỎNG NGAY →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
