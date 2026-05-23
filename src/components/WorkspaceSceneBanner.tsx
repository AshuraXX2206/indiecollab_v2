import React, { useState, useEffect, useRef, useCallback } from "react";
import { Code, Palette, Users, Volume2, VolumeX, Terminal, Zap, GitBranch, Wifi } from "lucide-react";
import { safeStorage } from "../utils/storage";
import { playClickSound } from "../utils/audio";

interface WorkspaceSceneBannerProps {
  currentUser: any;
}

// ─── Terminal hacker lines pool ─────────────────────────────────────────────
const TERMINAL_LINES = [
  { text: "$ git clone https://github.com/indiecollab/game-engine.git", color: "#4ADE80" },
  { text: "Cloning into 'game-engine'... done.", color: "#94A3B8" },
  { text: "$ npm install --save-dev @unity/bridge @pixi/runtime", color: "#4ADE80" },
  { text: "added 312 packages in 4.2s", color: "#94A3B8" },
  { text: "$ node scripts/gen-tilemap.js --width 64 --height 32", color: "#4ADE80" },
  { text: "✓ Tilemap generated: assets/map_0x3F.json", color: "#22D3EE" },
  { text: "$ ts-node src/physics/collider.ts --profile", color: "#4ADE80" },
  { text: "Profiling... avg frame 0.83ms  ▶ PASS", color: "#A78BFA" },
  { text: "$ secure-cloud deploy --only database:rules", color: "#4ADE80" },
  { text: "✓ database: rules deployed. Project: secure-cloud-prod", color: "#22D3EE" },
  { text: "$ python3 ai/matchmaker_train.py --epochs 50", color: "#4ADE80" },
  { text: "Epoch 50/50 — loss: 0.0041 — val_acc: 0.983", color: "#A78BFA" },
  { text: "$ docker build -t indiecollab/backend:latest .", color: "#4ADE80" },
  { text: "Successfully built 8f3d21a9c1e2 — pushed to registry", color: "#22D3EE" },
  { text: "$ grep -r 'TODO' src/ | wc -l", color: "#4ADE80" },
  { text: "3", color: "#FBBF24" },
  { text: "$ git commit -m 'feat: AI matchmaker v2 — 98.3% accuracy'", color: "#4ADE80" },
  { text: "[main 7f3ac1b] feat: AI matchmaker v2 — 98.3% accuracy", color: "#94A3B8" },
];

// ─── Theme configs ────────────────────────────────────────────────────────────
const WORKSPACE_THEMES = {
  code: {
    name: "Terminal",
    icon: Terminal,
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    accentColor: "#4ADE80",
    accentBg: "rgba(74,222,128,0.08)",
    accentBorder: "rgba(74,222,128,0.25)",
    slogan: "Build fast. Ship clean. Repeat.",
    badgeLabel: "HACKER MODE",
    statsLabel: "Commits today",
    statsValue: () => `${Math.floor(Math.random() * 8) + 3}`,
  },
  art: {
    name: "Art",
    icon: Palette,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-of-a-designer-drawing-on-a-digital-tablet-40014-large.mp4",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    accentColor: "#F472B6",
    accentBg: "rgba(244,114,182,0.08)",
    accentBorder: "rgba(244,114,182,0.25)",
    slogan: "Pixel by pixel, vũ trụ game được vẽ nên.",
    badgeLabel: "ART MODE",
    statsLabel: "Assets created",
    statsValue: () => `${Math.floor(Math.random() * 12) + 4}`,
  },
  team: {
    name: "Team",
    icon: Users,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-group-of-creative-people-working-together-41618-large.mp4",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    accentColor: "#34D399",
    accentBg: "rgba(52,211,153,0.08)",
    accentBorder: "rgba(52,211,153,0.25)",
    slogan: "Cùng nhau chinh phục Game Jam. Sát cánh đến cuối.",
    badgeLabel: "COLLAB MODE",
    statsLabel: "Active studios",
    statsValue: () => `${Math.floor(Math.random() * 6) + 2}`,
  },
};

// ─── Terminal Scene ───────────────────────────────────────────────────────────
function TerminalScene({ username }: { username: string }) {
  const [lines, setLines] = useState<{ text: string; color: string; id: number }[]>([]);
  const [typingLine, setTypingLine] = useState("");
  const [typingColor, setTypingColor] = useState("#4ADE80");
  const [cursor, setCursor] = useState(true);
  const linePoolRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lineIdRef = useRef(0);
  const MAX_LINES = 6;

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  const typeNextLine = useCallback(() => {
    const pool = TERMINAL_LINES;
    const entry = pool[linePoolRef.current % pool.length];
    linePoolRef.current++;
    let i = 0;
    setTypingLine("");
    setTypingColor(entry.color);

    const typeChar = () => {
      i++;
      setTypingLine(entry.text.slice(0, i));
      if (i < entry.text.length) {
        // commands type faster on $ lines
        const delay = entry.text[0] === "$" ? 28 : 14;
        timeoutRef.current = setTimeout(typeChar, delay);
      } else {
        // line done → commit to lines array after short pause
        timeoutRef.current = setTimeout(() => {
          const id = lineIdRef.current++;
          setLines(prev => {
            const next = [...prev, { text: entry.text, color: entry.color, id }];
            return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
          });
          setTypingLine("");
          // pause between lines: short for output, longer for next command
          const pause = entry.text[0] === "$" ? 200 : 600;
          timeoutRef.current = setTimeout(typeNextLine, pause);
        }, 250);
      }
    };
    typeChar();
  }, []);

  useEffect(() => {
    timeoutRef.current = setTimeout(typeNextLine, 400);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [typeNextLine]);

  return (
    <div className="absolute inset-0 flex flex-col justify-end overflow-hidden"
         style={{ background: "linear-gradient(135deg, #020B04 0%, #000D09 60%, #050510 100%)" }}>
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 z-10"
           style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)" }} />
      {/* Green ambient glow top-left */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full blur-3xl"
           style={{ background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)" }} />
      {/* Matrix rain hint — faint vertical lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
           style={{ backgroundImage: "repeating-linear-gradient(90deg, #4ADE80 0px, transparent 1px, transparent 18px)" }} />

      {/* Terminal window chrome */}
      <div className="relative z-20 m-4 rounded-xl overflow-hidden"
           style={{ background: "rgba(0,12,5,0.92)", border: "1px solid rgba(74,222,128,0.18)", boxShadow: "0 0 40px rgba(74,222,128,0.05)" }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(74,222,128,0.1)", background: "rgba(74,222,128,0.03)" }}>
          <span className="h-2 w-2 rounded-full bg-rose-500/70" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="h-2 w-2 rounded-full" style={{ background: "#4ADE80", opacity: 0.7 }} />
          <span className="ml-2 text-[10px] font-mono font-bold tracking-widest" style={{ color: "rgba(74,222,128,0.5)" }}>
            {username}@indiecollab:~/workspace — bash
          </span>
          <span className="ml-auto flex items-center gap-1 text-[9px] font-mono" style={{ color: "rgba(74,222,128,0.35)" }}>
            <Wifi className="h-2.5 w-2.5" style={{ color: "#4ADE80" }} /> CONNECTED
          </span>
        </div>
        {/* Terminal body */}
        <div className="px-3 py-2.5 space-y-0.5" style={{ minHeight: 112 }}>
          {lines.map(l => (
            <div key={l.id} className="text-[11px] font-mono leading-snug" style={{ color: l.color, opacity: 0.85 }}>
              {l.text}
            </div>
          ))}
          {typingLine && (
            <div className="text-[11px] font-mono leading-snug" style={{ color: typingColor }}>
              {typingLine}
              <span className="inline-block w-[7px] h-[11px] ml-[1px] align-middle"
                    style={{ background: cursor ? typingColor : "transparent", transition: "background 0.1s" }} />
            </div>
          )}
          {!typingLine && (
            <div className="text-[11px] font-mono" style={{ color: "#4ADE80" }}>
              <span className="inline-block w-[7px] h-[11px] align-middle"
                    style={{ background: cursor ? "#4ADE80" : "transparent", transition: "background 0.1s" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Video Scene (art / team) ─────────────────────────────────────────────────
function VideoScene({ videoUrl, accentColor }: { videoUrl: string; accentColor: string }) {
  return (
    <>
      <video key={videoUrl} src={videoUrl} autoPlay muted playsInline loop
             className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none scale-105"
             style={{ opacity: 0.18, filter: "brightness(0.5) contrast(1.2) saturate(1.1)" }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
           style={{ background: "linear-gradient(135deg, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0.5) 50%, rgba(10,10,15,0.85) 100%)" }} />
      <div className="absolute inset-0 z-1 pointer-events-none"
           style={{ background: "linear-gradient(0deg, rgba(10,10,15,0.95) 0%, transparent 40%)" }} />
      {/* Accent glow */}
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full blur-3xl z-1"
           style={{ background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)` }} />
    </>
  );
}

// ─── Live ticker metrics ──────────────────────────────────────────────────────
const TICKER_ITEMS = [
  "🔥 3 project mới hôm nay",
  "⚡ AI Match: 47 kết quả",
  "🏆 Game Jam đang diễn ra",
  "🛡️ 8 studio hoạt động",
  "📡 Cloud Sync: ONLINE",
  "🎮 IndieCollab v2.0",
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % TICKER_ITEMS.length);
        setVisible(true);
      }, 250);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      className="text-[10px] font-mono font-bold tracking-wide transition-opacity duration-200"
      style={{ color: "rgba(255,255,255,0.45)", opacity: visible ? 1 : 0 }}
    >
      {TICKER_ITEMS[idx]}
    </span>
  );
}

// ─── Main Banner ──────────────────────────────────────────────────────────────
export const WorkspaceSceneBanner: React.FC<WorkspaceSceneBannerProps> = ({ currentUser }) => {
  const [activeTheme, setActiveTheme] = useState<"code" | "art" | "team">(() => {
    return (safeStorage.getItem("indiecollab_workspace_theme") as any) || "code";
  });
  const [activeDevs, setActiveDevs] = useState(142);
  const [isMuted, setIsMuted] = useState(() => {
    return safeStorage.getItem("indiecollab_workspace_music_muted") !== "false";
  });
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<any>(null);

  // Live devs counter — fast flicker feel
  useEffect(() => {
    const t = setInterval(() => {
      setActiveDevs(prev => {
        const d = Math.floor(Math.random() * 7) - 3;
        const n = prev + d;
        return n > 110 && n < 240 ? n : prev;
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);

  // Audio crossfade
  useEffect(() => {
    let live = true;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (isMuted) {
      if (activeAudioRef.current) {
        const a = activeAudioRef.current;
        let v = a.volume;
        const fi = setInterval(() => { v = Math.max(0, v - 0.02); a.volume = v; if (v <= 0) { a.pause(); clearInterval(fi); } }, 50);
        activeAudioRef.current = null;
      }
      return;
    }
    const url = WORKSPACE_THEMES[activeTheme].musicUrl;
    const oldAudio = activeAudioRef.current;
    const newAudio = new Audio(url);
    newAudio.loop = true; newAudio.volume = 0;
    activeAudioRef.current = newAudio;
    newAudio.play().catch(() => {});
    let step = 0; const STEPS = 10; const TARGET = 0.12;
    const fi = setInterval(() => {
      if (!live) { clearInterval(fi); return; }
      step++;
      if (oldAudio) { const v = Math.max(0, oldAudio.volume - oldAudio.volume / (STEPS - step + 1)); oldAudio.volume = isNaN(v) ? 0 : v; if (step >= STEPS) oldAudio.pause(); }
      newAudio.volume = Math.min(TARGET, (step / STEPS) * TARGET);
      if (step >= STEPS) clearInterval(fi);
    }, 50);
    fadeIntervalRef.current = fi;
    return () => { live = false; };
  }, [activeTheme, isMuted]);

  const handleThemeChange = (theme: "code" | "art" | "team") => {
    setActiveTheme(theme);
    safeStorage.setItem("indiecollab_workspace_theme", theme);
    playClickSound();
  };
  const toggleMute = () => {
    const n = !isMuted; setIsMuted(n);
    safeStorage.setItem("indiecollab_workspace_music_muted", n ? "true" : "false");
  };

  const theme = WORKSPACE_THEMES[activeTheme];
  const username = currentUser?.displayName || currentUser?.username || "Dev";
  const { accentColor, accentBg, accentBorder } = theme;

  return (
    <div
      className="relative rounded-2xl overflow-hidden mb-8 flex flex-col justify-between"
      style={{
        height: 260,
        background: "#080B0A",
        border: `1px solid ${accentBorder}`,
        boxShadow: `0 0 60px ${accentColor}10, 0 4px 32px rgba(0,0,0,0.6)`,
        transition: "border-color 0.4s, box-shadow 0.4s",
      }}
    >
      {/* ── Background scene ── */}
      {activeTheme === "code" ? (
        <TerminalScene username={username} />
      ) : (
        <VideoScene videoUrl={(theme as any).videoUrl} accentColor={accentColor} />
      )}

      {/* ── Top bar ── */}
      <div className="relative z-30 flex items-center justify-between px-5 pt-4">
        {/* Left: mode badge + live devs */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono tracking-widest uppercase"
            style={{ background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full opacity-75" style={{ background: accentColor }} />
              <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: accentColor }} />
            </span>
            {theme.badgeLabel}
          </span>
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#94A3B8" }}
          >
            <Wifi className="h-2.5 w-2.5" style={{ color: accentColor }} />
            {activeDevs} online
          </span>
          <span
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748B" }}
          >
            <GitBranch className="h-2.5 w-2.5" style={{ color: accentColor }} />
            main · up to date
          </span>
        </div>

        {/* Right: mute + theme switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { playClickSound(); toggleMute(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all"
            style={isMuted
              ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#475569" }
              : { background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor }}
          >
            {isMuted ? <VolumeX className="h-3 w-3" /> : (
              <>
                <Volume2 className="h-3 w-3" />
                <span className="flex gap-px h-2.5 items-end">
                  {[1.5, 2.5, 1, 2].map((h, i) => (
                    <span key={i} className="w-[1.5px] animate-bounce rounded-full"
                          style={{ height: `${h * 4}px`, background: accentColor, animationDelay: `${i * 0.12}s` }} />
                  ))}
                </span>
              </>
            )}
          </button>

          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {(Object.keys(WORKSPACE_THEMES) as Array<keyof typeof WORKSPACE_THEMES>).map(key => {
              const t = WORKSPACE_THEMES[key];
              const TIcon = t.icon;
              const active = activeTheme === key;
              return (
                <button key={key} onClick={() => handleThemeChange(key)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold font-mono transition-all cursor-pointer"
                  style={active
                    ? { background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.accentColor }
                    : { border: "1px solid transparent", color: "#475569" }}
                >
                  <TIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom: greeting + ticker ── */}
      <div className="relative z-30 px-5 pb-4">
        {activeTheme === "code" ? (
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3.5 w-3.5" style={{ color: accentColor }} />
                <span className="text-[10px] font-black font-mono uppercase tracking-widest" style={{ color: accentColor, opacity: 0.7 }}>
                  root@indiecollab
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight leading-tight" style={{ color: "#F0FDF4" }}>
                Welcome back, <span style={{ color: accentColor }}>{username}</span>
              </h2>
              <p className="text-[11px] font-mono mt-1" style={{ color: "rgba(74,222,128,0.55)" }}>
                {theme.slogan}
              </p>
            </div>
            {/* Metrics block */}
            <div className="hidden sm:flex flex-col items-end gap-1 text-right">
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>System</div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
                <span className="text-[10px] font-mono" style={{ color: "rgba(74,222,128,0.6)" }}>All systems operational</span>
              </div>
              <LiveTicker />
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-white leading-tight">
                Chào trở lại, <span style={{ color: accentColor }}>{username}</span>
              </h2>
              <p className="text-[11px] font-mono mt-1" style={{ color: `${accentColor}80` }}>{theme.slogan}</p>
            </div>
            <div className="hidden sm:block">
              <LiveTicker />
            </div>
          </div>
        )}

        {/* Bottom micro-stats strip */}
        <div className="mt-3 flex items-center gap-4 pt-3" style={{ borderTop: `1px solid ${accentColor}15` }}>
          <span className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Code className="h-3 w-3" style={{ color: accentColor, opacity: 0.6 }} />
            Tìm đồng đội bằng AI: <strong style={{ color: accentColor }}>READY</strong>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            <GitBranch className="h-3 w-3" style={{ color: accentColor, opacity: 0.6 }} />
            Tiến độ dự án: <strong style={{ color: accentColor }}>LIVE</strong>
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Zap className="h-3 w-3" style={{ color: accentColor, opacity: 0.6 }} />
            Họp tiến độ nhóm: <strong style={{ color: accentColor }}>OPEN</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
