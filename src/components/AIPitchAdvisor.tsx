import React, { useState } from "react";
import { auth } from "../firebase";
import { Sparkles, Loader2, Gamepad2, Lightbulb, VolumeX, ShieldQuestion, HelpCircle, CheckCircle, Compass, Cpu } from "lucide-react";

export default function AIPitchAdvisor() {
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [engine, setEngine] = useState("Godot");
  const [targetRoles, setTargetRoles] = useState<string[]>(["2D Artist"]);

  const [isLoading, setIsLoading] = useState(false);
  const [critique, setCritique] = useState<string | null>(null);

  const rolesCatalog = [
    "2D Artist", "3D Modeler", "Core Developer", "Synth Composer & Sound Designer", "Game Designer", "Narrative Designer & Writer"
  ];

  const handleToggleTargetRole = (role: string) => {
    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter(r => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  const handleFetchCritique = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pitch) {
      alert("Đầu tiên hãy cung cấp Tên dự án và Elevator Pitch của sản phẩm nhé!");
      return;
    }
    setIsLoading(true);
    setCritique(null);

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
          lookingForRoles: targetRoles
        })
      });
      const data = await res.json();
      if (data.success) {
        setCritique(data.critique);
      } else {
        setCritique(data.error || "Không thể kết nối với mô hình chấm điểm AI.");
      }
    } catch (err) {
      setCritique("Lỗi rò rỉ kết nối máy chủ API.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = () => {
    setTitle("Chronos Echoes");
    setPitch("A time-loop puzzle game where your past shadow copies replicate your input actions to solve high-pressure locks.");
    setEngine("Unity");
    setTargetRoles(["Core Developer", "Game Designer"]);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 pb-32 md:pb-16">
      {/* Title block */}
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-indigo-300 via-pink-300 to-indigo-100 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          AI Pitch Advisor
        </h1>
        <p className="mx-auto mt-2 max-w-md text-slate-400 text-sm leading-relaxed">
          Tối ưu hóa ý tưởng, đánh giá độ khả thi kỹ thuật, và hoàn thiện Elevator Pitch của bạn với Gemini AI.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Form panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:col-span-5 h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Thông tin dự án:</span>
            <button
              onClick={loadExample}
              className="text-[10px] font-bold text-indigo-400 hover:underline"
            >
              Tải ví dụ mẫu
            </button>
          </div>

          <form onSubmit={handleFetchCritique} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-400 uppercase font-mono">Tên game giả thuyết (Working Title)</label>
              <input
                type="text"
                required
                placeholder="e.g. Chronos Echoes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.8 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase font-mono">Ý tưởng cốt lõi (Elevator Pitch)</label>
              <textarea
                required
                rows={4}
                placeholder="Mô tả cơ chế chơi cốt lõi đắt giá nhất của bạn..."
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.8 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase font-mono">Engine phát triển</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200"
              >
                <option value="Unity">Unity C#</option>
                <option value="Godot">Godot (GDScript/C#)</option>
                <option value="Unreal Engine">Unreal Engine</option>
                <option value="Custom JS/HTML5">Phaser / Three.js</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-400 uppercase font-mono mb-2">Vai trò cần bổ trợ tuyển dụng</label>
              <div className="flex flex-wrap gap-1.5">
                {rolesCatalog.map((role) => {
                  const active = targetRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleTargetRole(role)}
                      className={`rounded px-2 py-1 text-[10px] font-mono border transition ${
                        active 
                          ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50" 
                          : "bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang phân tích ý tưởng...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Phân tích với AI
                </>
              )}
            </button>
          </form>
        </div>

        {/* Critique display with styled dashboard panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 md:col-span-7 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-350 uppercase font-mono tracking-wider flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              Đánh giá Pitch:
            </h2>
            
            {critique ? (
              <div className="mt-5 prose prose-invert max-w-none text-slate-300 text-xs leading-relaxed space-y-4">
                <div className="whitespace-pre-wrap">{critique}</div>
              </div>
            ) : (
              <div className="mt-12 text-center text-slate-500 text-xs max-w-sm mx-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                    <p className="font-mono text-[10px] text-slate-400">AI đang đọc ý tưởng và phân tích cấu trúc tuyển dụng...</p>
                  </div>
                ) : (
                  <>
                    <Gamepad2 className="mx-auto h-12 w-12 text-slate-700 opacity-60 mb-3 animate-bounce" />
                    <p>Nhập thông tin bên trái hoặc bấm "Tải ví dụ mẫu" để nhận phân tích chi tiết từ Gemini AI.</p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center gap-4 text-[10.5px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-indigo-500" />
              Critique bám sát Game Jam Criteria
            </span>
            <span className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-pink-500" />
              Mô hình đề xuất gọn gàng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
