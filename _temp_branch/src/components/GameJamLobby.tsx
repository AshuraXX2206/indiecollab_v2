import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Clock, 
  Sparkles, 
  Users, 
  Zap, 
  Gamepad2, 
  ExternalLink,
  Loader2,
  Calendar,
  Share2
} from "lucide-react";
import { auth } from "../firebase";
import { playClickSound, playHoverSound } from "../utils/audio";

// Sub-component for individual LED Countdown
const CountdownTimer: React.FC<{ targetDate: string; prefixText?: string }> = ({ targetDate, prefixText = "Còn lại" }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        ended: false
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.ended) {
    return (
      <div className="flex items-center gap-1 text-red-400 font-mono text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg">
        ● ĐÃ KẾT THÚC
      </div>
    );
  }

  const formatNum = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="flex flex-col items-start sm:items-end gap-1 select-none">
      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">{prefixText}</div>
      <div className="flex gap-1.5 font-mono text-white text-xs font-black">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-lg text-indigo-400 shadow shadow-indigo-500/5 min-w-[28px]">
            {formatNum(timeLeft.days)}
          </div>
          <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">Ngày</span>
        </div>
        <span className="py-1 text-slate-650">:</span>
        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-lg text-indigo-400 shadow shadow-indigo-500/5 min-w-[28px]">
            {formatNum(timeLeft.hours)}
          </div>
          <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">Giờ</span>
        </div>
        <span className="py-1 text-slate-650">:</span>
        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-lg text-indigo-400 shadow shadow-indigo-500/5 min-w-[28px]">
            {formatNum(timeLeft.minutes)}
          </div>
          <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">Phút</span>
        </div>
        <span className="py-1 text-slate-650">:</span>
        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950 border border-slate-850 px-2 py-1.5 rounded-lg text-pink-500 shadow shadow-pink-500/5 min-w-[28px] animate-pulse">
            {formatNum(timeLeft.seconds)}
          </div>
          <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">Giây</span>
        </div>
      </div>
    </div>
  );
};

interface GameJamLobbyProps {
  currentUser: any;
}

export default function GameJamLobby({ currentUser }: GameJamLobbyProps) {
  const [analyzingJamId, setAnalyzingJamId] = useState<string | null>(null);
  const [jamMatchResults, setJamMatchResults] = useState<Record<string, { text: string; matchedUsers: string[] }>>({});

  // Mock list of interesting jams
  const JAMS = [
    {
      id: "jam-1",
      title: "IndieCollab Hyper Jam 2026",
      theme: "Đảo Ngược Trọng Lực (Gravity Manipulation)",
      status: "active",
      targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 2d 4h from now
      description: "Cuộc thi phát triển game thần tốc trong 48 giờ. Thiết kế lối chơi độc lạ nơi người chơi có thể thay đổi trọng lực để giải đố hoặc chiến đấu.",
      prize: "$500 Steam Wallet + Profile Badge độc quyền",
      participants: 84,
      bgGradient: "from-indigo-900/40 via-slate-950 to-slate-950 border-indigo-500/25",
      accentColor: "text-indigo-400"
    },
    {
      id: "jam-2",
      title: "Voxel Cyberpunk Retro Jam",
      theme: "Tương Lai Thập Niên 80 (Retro-Futurism & Neon)",
      status: "upcoming",
      targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      description: "Thử thách xây dựng thế giới bằng Voxel Art. Yêu cầu đồ họa pixel 3D kết hợp âm thanh Synthwave lôi cuốn.",
      prize: "Tài trợ giấy phép phần mềm MagicaVoxel Premium + Showcase nổi bật",
      participants: 128,
      bgGradient: "from-pink-900/30 via-slate-950 to-slate-950 border-pink-500/25",
      accentColor: "text-pink-400"
    },
    {
      id: "jam-3",
      title: "Global Solar Odyssey Challenge",
      theme: "Cánh Buồm Mặt Trời (Solar Sailing & Parallel Worlds)",
      status: "upcoming",
      targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
      description: "Hành trình thám hiểm vũ trụ bằng thuyền mặt trời qua các chiều không gian song song. Cực kỳ khuyến khích kể chuyện phi tuyến tính.",
      prize: "Ấn phẩm sách artbook thiết kế trò chơi + Chứng nhận kỷ niệm",
      participants: 216,
      bgGradient: "from-emerald-900/30 via-slate-950 to-slate-950 border-emerald-500/25",
      accentColor: "text-emerald-400"
    }
  ];

  // Request matchmaker logic reuse
  const handleJamMatchRequest = async (jam: typeof JAMS[0]) => {
    setAnalyzingJamId(jam.id);
    try {
      // Build auth headers with Firebase token
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
        } catch (e) { /* fallback */ }
      }

      const res = await fetch("/api/ai/recommend-partners", {
        method: "POST",
        headers,
        body: JSON.stringify({
          projectTitle: `Game Jam: ${jam.title}`,
          projectDescription: `Làm game tham gia cuộc thi với chủ đề ${jam.theme}. Cần tìm đồng đội làm game jam ăn ý, tốc chiến tốc thắng. Mô tả: ${jam.description}`,
          teamNeeds: ["Gameplay Programmer", "Pixel Artist", "3D Modeler", "Composer / Musician", "Game Designer"]
        })
      });

      const data = await res.json();
      if (data.success) {
        setJamMatchResults(prev => ({
          ...prev,
          [jam.id]: {
            text: data.analysis,
            matchedUsers: data.matchedUsers
          }
        }));
      } else {
        alert("Lỗi AI: " + (data.error || "Mô hình bận"));
      }
    } catch (e) {
      console.error(e);
      alert("Không kết nối được máy chủ AI Matchmaker. Đảm bảo API Backend đang chạy.");
    } finally {
      setAnalyzingJamId(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 blur-3xl rounded-full" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-400 animate-pulse" /> Sảnh Thi Đấu Game Jams
            </h2>
            <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed max-w-2xl">
              Nơi giao lưu, lập đội và chinh phục các kỳ thi phát triển game độc lập tốc độ cao. Sử dụng AI để kết nối nhanh các chuyên gia phù hợp với thể loại và chủ đề của từng cuộc thi.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { playClickSound(); alert("Tính năng gửi game jam của riêng bạn sẽ được mở khóa ở bản cập nhật tiếp theo!"); }}
              className="px-3.5 py-2 border border-slate-800 bg-slate-950 text-slate-400 hover:text-white rounded-xl text-xs font-mono font-bold hover:border-slate-700 transition cursor-pointer"
            >
              Liên kết Jam Ngoài
            </button>
          </div>
        </div>
      </div>

      {/* Jams Feed */}
      <div className="space-y-6">
        {JAMS.map((jam) => {
          const match = jamMatchResults[jam.id];
          const isAnalyzing = analyzingJamId === jam.id;

          return (
            <div 
              key={jam.id}
              className={`rounded-2xl border bg-gradient-to-br ${jam.bgGradient} p-5 sm:p-6 transition-all duration-300 hover:border-slate-750 shadow-md relative group`}
            >
              {/* Top Banner Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-900 pb-4">
                {/* Title info */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${jam.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-indigo-400"}`} />
                    <h3 className="text-base font-extrabold text-white group-hover:text-indigo-400 transition duration-200">
                      {jam.title}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-350">
                    Chủ đề chính: <strong className="text-slate-200">{jam.theme}</strong>
                  </div>
                </div>

                {/* LED countdown or start clock */}
                <CountdownTimer 
                  targetDate={jam.targetDate} 
                  prefixText={jam.status === "active" ? "Thời gian nộp bài còn" : "Bắt đầu sau"} 
                />
              </div>

              {/* Body details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {/* Col 1 & 2: Description */}
                <div className="md:col-span-2 space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed font-sans select-text">
                    {jam.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-[10.5px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-indigo-400" />
                      {jam.participants} dev đang lập đội
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-yellow-450" />
                      Cơ chế: Free-to-Join
                    </span>
                  </div>
                </div>

                {/* Col 3: Rewards card */}
                <div className="bg-slate-950/60 rounded-xl border border-slate-900 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Phần thưởng & Vinh danh</span>
                    <p className="text-xs text-slate-200 font-bold mt-1.5 leading-snug">
                      {jam.prize}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        playClickSound();
                        handleJamMatchRequest(jam);
                      }}
                      disabled={isAnalyzing}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10.5px] py-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Đang tìm...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Tìm Đồng Đội Jam
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        playClickSound();
                        alert(`Đăng ký tham gia "${jam.title}" thành công! Hệ thống sẽ cập nhật trạng thái của bạn thành "Đang tham gia Jam".`);
                      }}
                      className="px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[10.5px] text-slate-300 font-bold cursor-pointer transition"
                      title="Đăng ký tham gia"
                    >
                      Đăng Ký
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Matchmaking analysis panel */}
              {match && (
                <div className="mt-4 border-t border-indigo-500/20 bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 font-mono">
                    <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                    <span>ĐỀ XUẤT ĐỒNG ĐỘI GAME JAM TỪ AI GEMINI:</span>
                  </div>
                  
                  <div className="mt-2 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans select-text">
                    {match.text}
                  </div>
                  
                  <div className="mt-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest text-right">
                    *Mở tab "Tìm Đồng Đội" để gửi yêu cầu kết nối ngay đến các thành viên được đề xuất.
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
