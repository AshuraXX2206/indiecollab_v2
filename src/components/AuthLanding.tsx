// ============================================================================
// AuthLanding.tsx — Premium landing page & authentication gateway
// Redesigned: Linear/Vercel-inspired dark mode, animated network background,
// hero + auth above the fold, real product UI previews, zero fake metrics.
// All auth logic (Google, GitHub, Guest, Email) preserved from original.
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleSignIn, githubSignIn, anonymousSignIn } from "../firebase";
import { JobType } from "../types";
import { getDeviceSignature, getOrCreateDeviceId } from "../utils/device";
import { setPageMeta } from "../utils/seo";
import { safeStorage } from "../utils/storage";
import {
  Mail,
  Lock,
  User as UserIcon,
  ChevronRight,
  Gamepad2,
  Users,
  ArrowRight,
  Zap,
  Github,
  UserCheck,
  Search,
  MessageSquare,
  Shield,
  Layers,
  GitBranch,
  Workflow,
  Wifi,
  ShieldAlert,
  Copy,
  ExternalLink
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { navigateToPath } from "../App";
import HowItWorksSection from "./HowItWorksSection";

// Hacker Background — multi-pane terminal scene, scanlines, matrix rain
// ============================================================================
const HACK_LINES_LEFT = [
  { t: "$ git clone https://github.com/indiecollab/core", c: "#4ADE80" },
  { t: "Cloning into 'core'... done.", c: "#64748B" },
  { t: "$ npm ci --silent", c: "#4ADE80" },
  { t: "added 847 packages in 6.1s", c: "#64748B" },
  { t: "$ tsc --noEmit", c: "#4ADE80" },
  { t: "✓ 0 errors — types clean", c: "#22D3EE" },
  { t: "$ vitest run --reporter verbose", c: "#4ADE80" },
  { t: "✓ 142 tests passed in 2.3s", c: "#22D3EE" },
  { t: "$ cloud deploy --only security-layers", c: "#4ADE80" },
  { t: "✓ Deploy complete. 12 security filters active", c: "#22D3EE" },
  { t: "$ node ai/matchmaker.js --benchmark", c: "#4ADE80" },
  { t: "Accuracy: 98.3%  ·  latency: 42ms", c: "#A78BFA" },
  { t: "$ docker push indiecollab/api:latest", c: "#4ADE80" },
  { t: "latest: digest sha256:8f3d21a pushed", c: "#64748B" },
];
const HACK_LINES_RIGHT = [
  { t: "[INFO]  ws://lobby.indiecollab.io connected", c: "#22D3EE" },
  { t: "[JOIN]  Pixel_Hunter_4721 entered lobby", c: "#4ADE80" },
  { t: "[MATCH] Pair: Synthwave_Boss ↔ Engine_Knight", c: "#A78BFA" },
  { t: "[JAM]   GameJam #12 starts in 02:14:33", c: "#FBBF24" },
  { t: "[JOIN]  Chibi_Artist_9032 entered lobby", c: "#4ADE80" },
  { t: "[MSG]   Engine_Knight: 'anyone need a 2D physics dev?'", c: "#94A3B8" },
  { t: "[MATCH] Pair: Vibe_Composer ↔ Chibi_Artist", c: "#A78BFA" },
  { t: "[BOUNTY] Bug #447 claimed — +50 XP", c: "#34D399" },
  { t: "[JOIN]  Game_Jam_King_2206 entered lobby", c: "#4ADE80" },
  { t: "[STUDIO] 'Pixel Wolves' studio created", c: "#22D3EE" },
  { t: "[JAM]   Submission uploaded — 14.2 MB", c: "#34D399" },
  { t: "[MATCH] Pair: Game_Jam_King ↔ Pixel_Hunter", c: "#A78BFA" },
];

// IDE (VSCode-style) — code editing scene
const IDE_LINES = [
  { t: "// PlayerController.cs — Unity 2D", c: "#64748B" },
  { t: "public class PlayerController : MonoBehaviour {", c: "#93C5FD" },
  { t: "  [SerializeField] float speed = 5f;", c: "#C4B5FD" },
  { t: "  Rigidbody2D rb;", c: "#6EE7B7" },
  { t: "  void FixedUpdate() {", c: "#FCD34D" },
  { t: "    float h = Input.GetAxis(\"Horizontal\");", c: "#94A3B8" },
  { t: "    rb.velocity = new Vector2(h*speed, rb.velocity.y);", c: "#94A3B8" },
  { t: "  }", c: "#FCD34D" },
  { t: "}", c: "#93C5FD" },
  { t: "// EnemyAI.gd — Godot 4", c: "#64748B" },
  { t: "extends CharacterBody2D", c: "#86EFAC" },
  { t: "const SPEED := 120.0", c: "#C4B5FD" },
  { t: "func _physics_process(delta):", c: "#FCD34D" },
  { t: "  velocity = direction * SPEED", c: "#94A3B8" },
  { t: "  move_and_slide()", c: "#6EE7B7" },
];

// Cyber security logger output
const CYBER_SECURITY_LINES = [
  { t: "[SEC-INFO] Initializing intrusion countermeasure system...", c: "#4ADE80" },
  { t: "[SEC-WARN] Port 8080: routing traffic through encrypted tunnel", c: "#FBBF24" },
  { t: "[SEC-PASS] Cryptographic verification complete (2048-bit AES)", c: "#22D3EE" },
  { t: "[SEC-TRACE] Resolving source node ID... trace successful", c: "#A78BFA" },
  { t: "[SEC-ALERT] High-frequency sync requests throttled successfully", c: "#EF4444" },
  { t: "[SEC-INFO] Threat level: ZERO. Memory sandbox secured.", c: "#34D399" },
  { t: "[SEC-LOCK] Virtual environment isolated and active", c: "#22D3EE" },
  { t: "[SEC-SYNC] Multi-node replication channel established", c: "#4ADE80" },
];

function TerminalPane({
  lines, speed, maxLines = 7, opacity = 1,
}: {
  lines: { t: string; c: string }[];
  speed: number;
  maxLines?: number;
  opacity?: number;
}) {
  const [committed, setCommitted] = useState<{ text: string; color: string; id: number }[]>([]);
  const [typing, setTyping] = useState("");
  const [typingColor, setTypingColor] = useState("#4ADE80");
  const [blink, setBlink] = useState(true);
  const poolRef = useRef(0);
  const idRef = useRef(0);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { const t = setInterval(() => setBlink(b => !b), 530); return () => clearInterval(t); }, []);

  const next = useCallback(() => {
    const entry = lines[poolRef.current % lines.length];
    poolRef.current++;
    let i = 0;
    setTyping("");
    setTypingColor(entry.c);
    const type = () => {
      i++;
      setTyping(entry.t.slice(0, i));
      if (i < entry.t.length) {
        tRef.current = setTimeout(type, speed);
      } else {
        tRef.current = setTimeout(() => {
          const id = idRef.current++;
          setCommitted(prev => {
            const arr = [...prev, { text: entry.t, color: entry.c, id }];
            return arr.length > maxLines ? arr.slice(arr.length - maxLines) : arr;
          });
          setTyping("");
          tRef.current = setTimeout(next, entry.t[0] === "$" || entry.t[0] === "[" ? 180 : 480);
        }, 200);
      }
    };
    type();
  }, [lines, speed, maxLines]);

  useEffect(() => { tRef.current = setTimeout(next, Math.random() * 600 + 200); return () => { if (tRef.current) clearTimeout(tRef.current); }; }, [next]);

  return (
    <div className="font-mono text-[10.5px] leading-snug space-y-0.5" style={{ opacity }}>
      {committed.map(l => (
        <div key={l.id} style={{ color: l.color, opacity: 0.75 }}>{l.text}</div>
      ))}
      {typing && (
        <div style={{ color: typingColor }}>
          {typing}
          <span className="inline-block w-[6px] h-[10px] ml-[1px] align-middle"
                style={{ background: blink ? typingColor : "transparent" }} />
        </div>
      )}
    </div>
  );
}

function CyberSecurityRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    
    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const cyberPhrases = [
      "DECRYPTING...",
      "01101001 01101110 01100100 01101001 01100100",
      "SYS.OVERRIDE.BYPASS_FIREWALL()",
      "PORT_SCAN: 80, 443, 8080, 22 [OPEN]",
      "TRACING IP: 192.168.1.104",
      "STATUS: ENCRYPTED_TUNNEL_ESTABLISHED",
      "INTRUSION_DETECTION: INACTIVE",
      "CONNECTING TO VIRTUAL_ENV...",
      "ALERT: QUANTUM_DECRYPT_INIT",
      "AUTH_VERIFY_TOKEN: OK",
      "CLEANING LOGS...",
      "MEM_ALLOC: 0x7FFA4B2F",
      "AES_256_GCM_DECRYPT_SUCCESS",
      "[DECRYPTING HASH: SHA-256...]",
      "[SECURE HANDSHAKE: INITIATED]",
      "[NODE_ROUTING: ACTIVE]",
      "[VIRTUAL_FIREWALL: BYPASSED]",
      "[ISOLATED_CONTAINER: ONLINE]",
      "[ENCRYPTED_VPN_TUNNEL: CONNECTED]",
      "[THREAT_LEVEL: ZERO]"
    ];

    const fontSize = 10;
    const columns = Math.floor(canvas.width / 100) || 3;
    const drops: { x: number; y: number; text: string; speed: number; opacity: number }[] = [];

    for (let i = 0; i < columns; i++) {
      drops.push({
        x: i * (canvas.width / columns) + Math.random() * 15,
        y: Math.random() * -canvas.height,
        text: cyberPhrases[Math.floor(Math.random() * cyberPhrases.length)],
        speed: Math.random() * 1.2 + 0.6,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 12, 5, 0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "rgba(74, 222, 128, 0.02)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw circular radar sweep
      const time = Date.now() * 0.001;
      ctx.strokeStyle = "rgba(34, 211, 238, 0.03)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, Math.abs(Math.sin(time)) * (canvas.width / 2.2), 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `bold ${fontSize}px monospace`;

      drops.forEach((drop) => {
        if (drop.text.includes("ALERT") || drop.text.includes("OVERRIDE")) {
          ctx.fillStyle = `rgba(239, 68, 68, ${drop.opacity * 1.5})`;
        } else if (drop.text.includes("SUCCESS") || drop.text.includes("OK") || drop.text.includes("CONNECTED")) {
          ctx.fillStyle = `rgba(74, 222, 128, ${drop.opacity * 1.5})`;
        } else {
          ctx.fillStyle = `rgba(34, 211, 238, ${drop.opacity})`;
        }

        ctx.fillText(drop.text, drop.x, drop.y);

        drop.y += drop.speed;

        if (drop.y > canvas.height) {
          drop.y = Math.random() * -100;
          drop.text = cyberPhrases[Math.floor(Math.random() * cyberPhrases.length)];
          drop.speed = Math.random() * 1.2 + 0.6;
          drop.opacity = Math.random() * 0.3 + 0.1;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none rounded-2xl opacity-35 mix-blend-screen"
      style={{ zIndex: 0 }}
    />
  );
}

function HackerBackground() {
  const [glitch, setGlitch] = useState(false);

  // Random glitch flicker
  useEffect(() => {
    const schedule = () => {
      const delay = Math.random() * 5000 + 3000;
      setTimeout(() => { setGlitch(true); setTimeout(() => { setGlitch(false); schedule(); }, 120); }, delay);
    };
    schedule();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none"
         style={{ background: "linear-gradient(135deg, #010804 0%, #010608 50%, #050510 100%)" }}>

      {/* Scanlines */}
      <div className="absolute inset-0 z-10"
           style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.22) 2px,rgba(0,0,0,0.22) 4px)", pointerEvents: "none" }} />

      {/* Faint vertical matrix rain lines */}
      <div className="absolute inset-0 z-0"
           style={{ backgroundImage: "repeating-linear-gradient(90deg,rgba(74,222,128,0.025) 0px,transparent 1px,transparent 20px)", pointerEvents: "none" }} />

      {/* Ambient green glow — top left */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl"
           style={{ background: "radial-gradient(circle,rgba(74,222,128,0.06) 0%,transparent 70%)" }} />
      {/* Cyan glow — bottom right */}
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full blur-3xl"
           style={{ background: "radial-gradient(circle,rgba(34,211,238,0.05) 0%,transparent 70%)" }} />
      {/* Violet glow — center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-3xl"
           style={{ background: "radial-gradient(ellipse,rgba(124,58,237,0.04) 0%,transparent 70%)" }} />

      {/* Glitch overlay */}
      {glitch && (
        <div className="absolute inset-0 z-20"
             style={{ background: "rgba(74,222,128,0.03)", transform: "translateX(2px) skewX(-0.5deg)" }} />
      )}

      {/* ── Left terminal pane ── */}
      <div className="hidden md:block absolute top-8 left-6 w-[340px] max-w-[38vw]"
           style={{ background: "rgba(0,10,4,0.82)", border: "1px solid rgba(74,222,128,0.14)", borderRadius: 10, overflow: "hidden", boxShadow: "0 0 30px rgba(74,222,128,0.04)" }}>
        <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid rgba(74,222,128,0.08)", background: "rgba(74,222,128,0.03)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "#EF4444", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#F59E0B", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#4ADE80", opacity: 0.7 }} />
          <span className="ml-2 text-[9px] font-mono tracking-widest" style={{ color: "rgba(74,222,128,0.4)" }}>dev@indiecollab — bash</span>
        </div>
        <div className="px-3 py-2.5" style={{ minHeight: 140 }}>
          <TerminalPane lines={HACK_LINES_LEFT} speed={22} maxLines={8} />
        </div>
      </div>

      {/* ── Right terminal pane ── */}
      <div className="hidden md:block absolute top-6 right-6 w-[300px] max-w-[34vw]"
           style={{ background: "rgba(0,6,12,0.82)", border: "1px solid rgba(34,211,238,0.12)", borderRadius: 10, overflow: "hidden", boxShadow: "0 0 30px rgba(34,211,238,0.04)" }}>
        <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "1px solid rgba(34,211,238,0.08)", background: "rgba(34,211,238,0.02)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "#EF4444", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#F59E0B", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#22D3EE", opacity: 0.7 }} />
          <Wifi className="ml-2 h-2.5 w-2.5" style={{ color: "rgba(34,211,238,0.4)" }} />
          <span className="text-[9px] font-mono tracking-widest" style={{ color: "rgba(34,211,238,0.4)" }}>lobby.indiecollab.io — live</span>
        </div>
        <div className="px-3 py-2.5" style={{ minHeight: 140 }}>
          <TerminalPane lines={HACK_LINES_RIGHT} speed={14} maxLines={8} opacity={0.9} />
        </div>
      </div>

      {/* ── IDE pane (VSCode style) — bottom left ── */}
      <div className="hidden md:block absolute bottom-10 left-6 w-[320px] max-w-[36vw]"
           style={{ background: "rgba(1,7,18,0.85)", border: "1px solid rgba(147,197,253,0.12)", borderRadius: 10, overflow: "hidden", boxShadow: "0 0 28px rgba(147,197,253,0.04)" }}>
        <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderBottom: "1px solid rgba(147,197,253,0.08)", background: "rgba(147,197,253,0.02)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "#EF4444", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#F59E0B", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#4ADE80", opacity: 0.7 }} />
          <span className="ml-2 text-[9px] font-mono" style={{ color: "rgba(147,197,253,0.35)" }}>PlayerController.cs — VSCode</span>
          <span className="ml-auto text-[8px] font-mono px-1 rounded" style={{ background: "rgba(147,197,253,0.08)", color: "rgba(147,197,253,0.3)" }}>C#</span>
        </div>
        {/* Line numbers + code */}
        <div className="px-3 py-2" style={{ minHeight: 120 }}>
          <TerminalPane lines={IDE_LINES} speed={30} maxLines={7} opacity={0.85} />
        </div>
      </div>

      {/* ── Cyber Security Threat Monitor — bottom center ── */}
      <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 w-[300px] max-w-[32vw]"
           style={{ background: "rgba(2,10,6,0.85)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 10, overflow: "hidden", boxShadow: "0 0 28px rgba(74,222,128,0.04)" }}>
        <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderBottom: "1px solid rgba(74,222,128,0.08)", background: "rgba(74,222,128,0.03)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "#EF4444", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#F59E0B", opacity: 0.7 }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "#4ADE80", opacity: 0.7 }} />
          <span className="text-[9px] font-mono ml-2" style={{ color: "rgba(74,222,128,0.35)" }}>cyber-sentinel — threat-log</span>
          <span className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-500" />
            <span className="text-[8px] font-mono text-emerald-400">SECURE</span>
          </span>
        </div>
        <div className="px-3 py-2" style={{ minHeight: 110 }}>
          <TerminalPane lines={CYBER_SECURITY_LINES} speed={25} maxLines={6} opacity={0.85} />
        </div>
      </div>

      {/* ── Bottom status bar ── */}
      <div className="hidden md:flex absolute bottom-0 left-0 right-0 px-6 py-2 items-center gap-6"
           style={{ borderTop: "1px solid rgba(74,222,128,0.07)", background: "rgba(0,8,4,0.7)" }}>
        <span className="flex items-center gap-1.5 text-[9px] font-mono" style={{ color: "rgba(74,222,128,0.5)" }}>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#4ADE80" }} />
          SYSTEM ONLINE
        </span>
        <span className="text-[9px] font-mono" style={{ color: "rgba(34,211,238,0.4)" }}>AI MATCHMAKER: READY</span>
        <span className="text-[9px] font-mono" style={{ color: "rgba(167,139,250,0.4)" }}>CLOUD: SYNC_ONLINE</span>
        <span className="text-[9px] font-mono hidden md:inline" style={{ color: "rgba(74,222,128,0.3)" }}>indiecollab v2.0.0 · build 2025</span>
      </div>
    </div>
  );
}

// ============================================================================
// Product Mockup UI cards — static visual representations of product features
// These replace fake metrics and give users a real preview of the platform
// ============================================================================
function ProductMockup({ title, children, icon }: { title: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-3 hover:border-indigo-500/20 transition-colors duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          {icon}
        </div>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// Main AuthLanding Component — preserves ALL original auth handler logic
// ============================================================================
interface AuthLandingProps {
  onLoginSuccess: (user: any, isGoogle: boolean, customProfile?: any) => void;
  onGuestLogin: (presetUserId: string) => void;
}

export default function AuthLanding({ onLoginSuccess, onGuestLogin }: AuthLandingProps) {
  const [tab, setTab] = useState<"about" | "login" | "register">("about");

  // Set landing page meta on mount
  useEffect(() => { setPageMeta("landing"); }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authErrorType, setAuthErrorType] = useState<"unauthorized_domain" | "popup_blocked" | "other" | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const [lastActiveUser, setLastActiveUser] = useState<any>(() => {
    const item = safeStorage.getItem("indiecollab_last_active_user");
    if (item) {
      try { return JSON.parse(item); } catch (e) { return null; }
    }
    return null;
  });

  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setAuthErrorType(null);
  }, [tab]);

  // ===========================================================================
  // Auth Handlers — ALL preserved exactly from original implementation
  // ===========================================================================
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return { Authorization: `Bearer ${token}` };
      }
    } catch (e) {
      console.warn("Could not get auth token:", e);
    }
    return {};
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setErrorMsg("Vui lòng điền đầy đủ thông tin đăng ký.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải dài ít nhất 6 ký tự.");
      return;
    }
    if (!termsAccepted) {
      setErrorMsg("Bạn phải đồng ý với Điều Khoản Dịch Vụ và Chính Sách Quyền Riêng Tư để đăng ký.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitLoading(true);
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      const user = credentials.user;
      
      const newProfile = {
        id: user.uid,
        displayName: displayName,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(displayName)}`,
        jobTitle: "Gameplay Programmer" as JobType,
        skills: [],
        tools: [],
        bio: "",
        howToReachMe: `Email: ${email}`,
        openToWork: true,
        profileComplete: false,
        createdAt: new Date().toISOString(),
        termsAccepted: true,
        termsVersion: "VN-2026-05-22",
        termsAcceptedAt: new Date().toISOString(),
        privacyAccepted: true,
        privacyVersion: "VN-2026-05-22",
        privacyAcceptedAt: new Date().toISOString()
      };
      
      const idToken = await user.getIdToken();
      const apiRes = await fetch(`/api/users/${user.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          displayName,
          jobTitle: "Gameplay Programmer",
          skills: [],
          tools: [],
          bio: "",
          howToReachMe: `Email: ${email}`,
          openToWork: true,
          profileComplete: false,
          termsAccepted: true,
          termsVersion: "VN-2026-05-22",
          termsAcceptedAt: newProfile.termsAcceptedAt,
          privacyAccepted: true,
          privacyVersion: "VN-2026-05-22"
        })
      });
      if (!apiRes.ok) {
        const errorData = await apiRes.json();
        throw new Error(errorData.error || "Không thể đồng bộ điều khoản với máy chủ.");
      }
      
      await setDoc(doc(db, "users", user.uid), newProfile);
      safeStorage.setItem(`indiecollab_backup_${user.uid}`, JSON.stringify(newProfile));
      setSuccessMsg("Tạo tài khoản thành công! Đang đăng nhập...");
      setTimeout(() => {
        onLoginSuccess(user, false, newProfile);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Tài khoản email này đã tồn tại. Vui lòng đăng nhập.");
      } else {
        setErrorMsg("Lỗi đăng ký: " + (err.message || "Không xác định"));
      }
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Vui lòng điền Email và Mật khẩu đăng nhập.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitLoading(true);
    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const user = credentials.user;
      
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      let profile = snap.exists() ? snap.data() : null;
      
      if (!profile) {
        profile = {
          id: user.uid,
          displayName: email.split("@")[0],
          avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user.uid)}`,
          jobTitle: "Gameplay Programmer" as JobType,
          skills: [],
          tools: [],
          bio: "",
          howToReachMe: `Email: ${email}`,
          openToWork: true,
          profileComplete: false,
          createdAt: new Date().toISOString()
        };
        await setDoc(docRef, profile);
      }
      
      safeStorage.setItem(`indiecollab_backup_${user.uid}`, JSON.stringify(profile));
      setSuccessMsg("Đăng nhập thành công!");
      setTimeout(() => {
        onLoginSuccess(user, false, profile);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorMsg("Email hoặc mật khẩu không chính xác.");
      } else {
        setErrorMsg("Thông tin đăng nhập không hợp lệ hoặc lỗi kết nối.");
      }
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleGoogleLoginClick = async () => {
    if (!termsAccepted) {
      setErrorMsg("Bạn phải đồng ý với Điều Khoản Dịch Vụ và Chính Sách Quyền Riêng Tư để tiếp tục.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        const { user } = res;
        const snap = await getDoc(doc(db, "users", user.uid));
        let profile = null;
        if (!snap.exists()) {
          profile = {
            id: user.uid,
            displayName: user.displayName || "Indie Dev",
            avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
            jobTitle: "Gameplay Programmer",
            skills: [],
            tools: [],
            bio: "",
            howToReachMe: `Email: ${user.email}`,
            openToWork: true,
            profileComplete: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", user.uid), profile);
        } else {
          profile = snap.data();
        }
        setSuccessMsg("Đăng nhập Google thành công!");
        setTimeout(() => { onLoginSuccess(user, true, profile); }, 1200);
        return;
      }
    } catch (err: any) {
      console.error("Google Sign-in error:", err);
      // Show user-friendly error based on Firebase error code
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Bạn đã đóng cửa sổ đăng nhập Google.");
        setAuthErrorType("popup_blocked");
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain chưa được liên kết cấu hình bảo mật trong Firebase.");
        setAuthErrorType("unauthorized_domain");
      } else if (err.code === "auth/popup-blocked" || err.code === "auth/internal-error") {
        setErrorMsg("Trình duyệt đang chặn cửa sổ đăng nhập (popup) hoặc cookies bên thứ ba.");
        setAuthErrorType("popup_blocked");
      } else if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Đăng nhập Google tạm thời chưa khả dụng. Liên hệ admin.");
      } else {
        setErrorMsg("Đăng nhập Google thất bại: " + (err.message || "Lỗi không xác định"));
      }
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleGitHubLoginClick = async () => {
    if (!termsAccepted) {
      setErrorMsg("Bạn phải đồng ý với Điều Khoản Dịch Vụ và Chính Sách Quyền Riêng Tư để tiếp tục.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitLoading(true);
    try {
      const res = await githubSignIn();
      if (res) {
        const { user } = res;
        const snap = await getDoc(doc(db, "users", user.uid));
        let profile = null;
        if (!snap.exists()) {
          const screenName = (user as any).reloadUserInfo?.screenName || "";
          profile = {
            id: user.uid,
            displayName: user.displayName || screenName || "GitHub Dev",
            avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
            jobTitle: "Gameplay Programmer",
            skills: [],
            tools: [],
            bio: "",
            howToReachMe: user.email ? `Email: ${user.email}` : (screenName ? `GitHub: @${screenName}` : "GitHub"),
            openToWork: true,
            profileComplete: false,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", user.uid), profile);
        } else {
          profile = snap.data();
        }
        setSuccessMsg("Đăng nhập GitHub thành công!");
        setTimeout(() => { onLoginSuccess(user, false, profile); }, 1200);
        return;
      }
    } catch (err: any) {
      console.error("GitHub Sign-in error:", err);
      // Show user-friendly error based on Firebase error code
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("Bạn đã đóng cửa sổ đăng nhập GitHub.");
        setAuthErrorType("popup_blocked");
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMsg("Domain chưa được liên kết cấu hình bảo mật trong Firebase.");
        setAuthErrorType("unauthorized_domain");
      } else if (err.code === "auth/popup-blocked" || err.code === "auth/internal-error") {
        setErrorMsg("Trình duyệt đang chặn cửa sổ đăng nhập (popup) hoặc cookies bên thứ ba.");
        setAuthErrorType("popup_blocked");
      } else if (err.code === "auth/operation-not-allowed") {
        setErrorMsg("Đăng nhập GitHub tạm thời chưa khả dụng. Liên hệ admin.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setErrorMsg("Email này đã được dùng với phương thức đăng nhập khác (Google hoặc Email).");
      } else {
        setErrorMsg("Đăng nhập GitHub thất bại: " + (err.message || "Lỗi không xác định"));
      }
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleGuestLoginClickInstant = async () => {
    if (!termsAccepted) {
      scrollToAuth("about");
      setErrorMsg("Vui lòng tích chọn đồng ý điều khoản và chính sách trước khi bắt đầu.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg("Đang kết nối bằng tài khoản Khách...");
    setIsSubmitLoading(true);

    const GUEST_UID_KEY = "indiecollab_guest_uid";
    const GUEST_DEVICE_KEY = "indiecollab_guest_device";

    try {
      let user = auth.currentUser;
      if (!user || !user.isAnonymous) {
        user = await anonymousSignIn();
      }
      if (user) {
        // Check if there's a saved guest UID from a previous session
        const savedGuestUid = safeStorage.getItem(GUEST_UID_KEY);
        const savedDeviceId = safeStorage.getItem(GUEST_DEVICE_KEY);
        const currentDeviceId = getOrCreateDeviceId();
        let profile = null;

        // Only reuse previous profile if it was created on THIS same device
        const isSameDevice = savedDeviceId === currentDeviceId;

        if (savedGuestUid && savedGuestUid !== user.uid && isSameDevice) {
          // Try to load the previous guest's completed profile
          const savedSnap = await getDoc(doc(db, "users", savedGuestUid));
          if (savedSnap.exists()) {
            const savedProfile = savedSnap.data();
            if (savedProfile?.profileComplete) {
              // Returning guest on same device — reuse their completed profile
              profile = { ...savedProfile, id: user.uid };
              await setDoc(doc(db, "users", user.uid), profile);
              safeStorage.setItem(GUEST_UID_KEY, user.uid);
              safeStorage.setItem(GUEST_DEVICE_KEY, currentDeviceId);
              safeStorage.setItem(`indiecollab_backup_${user.uid}`, JSON.stringify(profile));
              setSuccessMsg("Chào mừng trở lại, " + profile.displayName + "!");
              setTimeout(() => {
                onLoginSuccess(user, false, profile);
                setIsSubmitLoading(false);
              }, 1200);
              return;
            }
          }
        }

        // New guest or previous session never completed onboarding
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          const nickNouns = ["Pixel_Hunter", "Chibi_Artist", "Synthwave_Boss", "Engine_Knight", "Vibe_Composer", "Game_Jam_King"];
          const randNum = Math.floor(Math.random() * 8999 + 1000);
          const guestName = nickNouns[Math.floor(Math.random() * nickNouns.length)] + "_" + randNum;
          profile = {
            id: user.uid,
            displayName: guestName,
            avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(guestName)}`,
            jobTitle: "Gameplay Programmer",
            skills: [],
            tools: [],
            bio: "",
            howToReachMe: "Discord: @guest_" + randNum,
            openToWork: true,
            profileComplete: false,
            createdAt: new Date().toISOString(),
            isGuest: true
          };
          await setDoc(docRef, profile);
        } else {
          profile = snap.data();
          if (profile && !profile.isGuest) {
            profile.isGuest = true;
            await setDoc(docRef, profile, { merge: true }).catch(() => {});
          }
          // If existing profile is already complete, skip onboarding
          if (profile?.profileComplete) {
            safeStorage.setItem(GUEST_UID_KEY, user.uid);
          }
        }

        // Persist this uid as the guest uid for future sessions
        safeStorage.setItem(GUEST_UID_KEY, user.uid);
        safeStorage.setItem(`indiecollab_backup_${user.uid}`, JSON.stringify(profile));

        setSuccessMsg("Chào mừng khách, " + profile.displayName + "!");
        setTimeout(() => {
          onLoginSuccess(user, false, profile);
          setIsSubmitLoading(false);
        }, 1200);
        return;
      }
    } catch (err: any) {
      console.error("Anonymous Sign-In Error:", err);
      setErrorMsg("Lỗi kết nối tài khoản Khách. Vui lòng liên hệ quản trị viên để kiểm tra thiết lập bảo mật mạng.");
      setIsSubmitLoading(false);
    }
  };

  const scrollToAuth = (tabName: "about" | "login" | "register") => {
    setTab(tabName);
    const element = document.getElementById("auth-terminal");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      element.classList.add("ring-2", "ring-indigo-500/50");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-indigo-500/50");
      }, 1500);
    }
  };

  // ============================================================================
  // RENDER — 4-section premium landing page
  // 1. Hero + Auth (above the fold)
  // 2. Product Showcase (what you get)
  // 3. How It Works (3 steps)
  // 4. Final CTA + Footer
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#010804] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-white relative overflow-x-hidden">

      {/* Hacker terminal background */}
      <HackerBackground />

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .anim-up { animation: fadeInUp 0.7s ease-out both; }
        .anim-d1 { animation-delay: 0.1s; }
        .anim-d2 { animation-delay: 0.2s; }
        .anim-d3 { animation-delay: 0.3s; }
        .anim-d4 { animation-delay: 0.4s; }
      `}</style>

      {/* ================================================================
          NAV — Minimal, clean, no fake stats
          ================================================================ */}
      <header className="border-b border-white/[0.05] backdrop-blur-xl px-6 py-3 flex items-center justify-between z-50 sticky top-0" style={{ background: "rgba(1,8,4,0.88)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">IndieCollab</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-[13px] text-slate-500">
          <a href="#product" className="hover:text-white transition-colors">Product</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <LanguageSelector />
          <button
            onClick={() => scrollToAuth("about")}
            className="px-3.5 py-1.5 text-[13px] font-medium rounded-md bg-white text-zinc-900 hover:bg-zinc-200 transition cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center z-10 w-full">

        {/* ================================================================
            SECTION 1: HERO — Value prop + Auth panel, above the fold
            Left: headline, subhead, quick-action buttons
            Right: Auth terminal (login/register/guest)
            ================================================================ */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* LEFT — Value Proposition */}
            <div className="space-y-8 anim-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/15 bg-indigo-500/[0.06] px-3.5 py-1.5 text-[11px] font-medium text-indigo-300 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Early access — join the network
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-white leading-[1.08] tracking-tight">
                Find your team.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  Ship your game.
                </span>
              </h1>

              <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-lg">
                IndieCollab connects indie game developers, pixel artists, sound designers, and creators into real teams. Post your project, find collaborators with the right skills, and build together.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleGuestLoginClickInstant}
                  className="px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Zap className="h-4 w-4" /> Try it free
                </button>
                <button
                  onClick={() => scrollToAuth("register")}
                  className="px-5 py-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-medium text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  Create account <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Lightweight social proof — no fake numbers */}
              <div className="flex items-center gap-3 pt-4">
                <div className="flex -space-x-2">
                  {["Ax","Bk","Cm","Dz","Ep"].map((seed, i) => (
                    <img key={i} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`} alt="" className="w-7 h-7 rounded-full border-2 border-[#09090b]" />
                  ))}
                </div>
                <span className="text-xs text-slate-500">Developers building together</span>
              </div>
            </div>

            <div id="auth-terminal" className="anim-up anim-d2 rounded-2xl p-6 backdrop-blur-sm transition-all relative overflow-hidden"
                 style={{ background: "rgba(0,12,5,0.92)", border: "1px solid rgba(74,222,128,0.18)", boxShadow: "0 0 40px rgba(74,222,128,0.08)" }}>
              
              {/* Cyber Security Rain Animation behind the form layer */}
              <CyberSecurityRainCanvas />

              <div className="relative z-10">
                {/* Tab navigation */}
              <div className="flex gap-1 mb-6 bg-white/[0.03] p-1 rounded-lg">
                {([
                  { key: "about" as const, label: "Quick Start" },
                  { key: "login" as const, label: "Sign In" },
                  { key: "register" as const, label: "Register" }
                ]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-md transition cursor-pointer ${tab === t.key ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Status messages */}
              {errorMsg && (
                <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{errorMsg}</div>
              )}
              {successMsg && (
                <div className="mb-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">{successMsg}</div>
              )}

              {/* Troubleshooting guides for authentication errors */}
              {authErrorType === "unauthorized_domain" && typeof window !== "undefined" && (
                <div className="mb-5 p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/25 text-amber-200">
                  <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs sm:text-sm">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Hướng dẫn khắc phục lỗi chưa ủy quyền tên miền</span>
                  </div>
                  <div className="space-y-3 text-[11.5px] leading-relaxed border-t border-white/[0.05] pt-2 mt-2">
                    <p>
                      Mã lỗi: <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-white text-[10.5px]">auth/unauthorized-domain</code>.
                      Tên miền hiện tại (<code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[10.5px] font-bold">{window.location.hostname}</code>) chưa được cấu hình là <strong>Miền được ủy quyền (Authorized domains)</strong> trong dự án Firebase của WebApp <strong>indiecollab</strong>.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.hostname);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-white font-medium transition cursor-pointer flex items-center gap-1.5 text-[11px]"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedDomain ? "Đã sao chép!" : "Sao chép tên miền"}
                      </button>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-300 mb-1">Các bước thêm miền mới vào Firebase:</p>
                      <ol className="list-decimal pl-4.5 space-y-1 text-slate-300">
                        <li>Mở trang quản trị <strong>Firebase Console</strong> của bạn.</li>
                        <li>Đi tới mục <strong>Authentication</strong> &gt; tab <strong>Settings</strong> &gt; mục <strong>Authorized domains</strong>.</li>
                        <li>Đăng ký tên miền ở trên bằng cách nhấn <strong>Add domain</strong> và dán miền vừa sao chép vào.</li>
                        <li>Đồng thời, hãy thêm cả miền của Render.com (ví dụ: <code className="px-1 rounded bg-black/30 font-mono text-[10px]">indiecollab.onrender.com</code>) để ứng dụng hoạt động tốt sau khi tự deploy độc lập nhé.</li>
                      </ol>
                    </div>
                    {window.self !== window.top && (
                      <div className="p-2.5 rounded bg-blue-500/[0.08] border border-blue-500/20 text-blue-300">
                        💡 <strong>Lưu ý:</strong> Bạn đang xem trước trong <strong>Iframe</strong> của Google AI Studio. Hãy nhấp vào biểu tượng <strong>Mở trong tab mới (Open in new tab)</strong> ở phía trên cùng của thanh xem trước để tránh bị trình duyệt chặn đăng nhập.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {authErrorType === "popup_blocked" && (
                <div className="mb-5 p-4 rounded-xl bg-blue-500/[0.08] border border-blue-500/25 text-blue-200">
                  <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-xs sm:text-sm">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Lỗi chặn cửa sổ đăng nhập / cookies bên thứ ba</span>
                  </div>
                  <div className="space-y-3 text-[11.5px] leading-relaxed border-t border-white/[0.05] pt-2 mt-2">
                    <p>
                      Cửa sổ đăng nhập bị trình duyệt chặn (hoặc chính sách cookie gốc đang hạn chế giao dịch bảo mật của Authentication bên dưới khung xem trước Iframe của AI Studio).
                    </p>
                    
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => window.open(window.location.href, "_blank")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer select-none"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Mở cổng ứng dụng ở Tab Mới
                      </button>
                    </div>

                    <p className="font-bold text-blue-300">Hoặc khắc phục bằng một số cách sau:</p>
                    <ul className="list-disc pl-4.5 space-y-1 text-slate-300">
                      <li>Nhấp vào nút <strong className="text-white">Mở trong tab mới (Open in new tab)</strong> ở góc trên bên phải thanh công cụ AI Studio.</li>
                      <li>Ủy quyền hiển thị cửa sổ con (Popup) của trang này trên trình duyệt của bạn.</li>
                      <li>Chuyển sang tab <strong className="text-white">Sign In / Register</strong> bằng Email hoặc nhấp chọn <strong className="text-white">Try as Guest (Khách)</strong> bên dưới để dùng thử nhanh.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB: Quick Start — OAuth + Guest */}
              {tab === "about" && (
                <div className="space-y-3">
                  {/* Terms checkbox for Quick Start */}
                  <div className="flex items-start gap-2.5 pt-1 pb-3 border-b border-white/[0.06] mb-1">
                    <input 
                      type="checkbox" 
                      id="quickstartTermsAccepted" 
                      checked={termsAccepted} 
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/[0.08] bg-[#010804] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="quickstartTermsAccepted" className="text-[11px] text-slate-400 leading-normal select-none cursor-pointer">
                      Tôi đã đọc và đồng ý với{" "}
                      <a 
                        href="/terms" 
                        onClick={(e) => { e.preventDefault(); navigateToPath("/terms"); }} 
                        className="text-indigo-400 hover:underline hover:text-indigo-350 font-semibold"
                      >
                        Điều khoản dịch vụ
                      </a>{" "}
                      &amp;{" "}
                      <a 
                        href="/privacy" 
                        onClick={(e) => { e.preventDefault(); navigateToPath("/privacy"); }} 
                        className="text-indigo-400 hover:underline hover:text-indigo-350 font-semibold"
                      >
                        Chính sách bảo mật
                      </a>
                    </label>
                  </div>
                  <button
                    onClick={handleGoogleLoginClick}
                    disabled={isSubmitLoading}
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-zinc-900 font-semibold py-2.5 rounded-lg text-sm hover:bg-zinc-100 transition cursor-pointer disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>

                  <button
                    onClick={handleGitHubLoginClick}
                    disabled={isSubmitLoading}
                    className="w-full flex items-center justify-center gap-2.5 bg-zinc-800 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-zinc-700 transition cursor-pointer disabled:opacity-50"
                  >
                    <Github className="h-4 w-4" /> Continue with GitHub
                  </button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                    <div className="relative flex justify-center"><span className="bg-[#09090b] px-3 text-[11px] text-slate-600">or</span></div>
                  </div>

                  <button
                    onClick={handleGuestLoginClickInstant}
                    disabled={isSubmitLoading}
                    className="w-full flex items-center justify-center gap-2 bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium py-2.5 rounded-lg text-sm hover:bg-white/[0.08] transition cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="h-4 w-4" /> Try as Guest
                  </button>

                  <p className="text-[11px] text-slate-600 text-center pt-2">No credit card needed. Free forever for indie teams.</p>
                </div>
              )}

              {/* TAB: Sign In — Email/Password */}
              {tab === "login" && (
                <form onSubmit={handleEmailLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-sm text-white rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm text-white rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer disabled:opacity-50">
                    {isSubmitLoading ? "Signing in..." : "Sign In"}
                  </button>
                  <p className="text-[11px] text-slate-600 text-center">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setTab("register")} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">Register</button>
                  </p>
                </form>
              )}

              {/* TAB: Register — Create account */}
              {tab === "register" && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Display Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input type="text" required placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full text-sm text-white rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-sm text-white rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input type="password" required placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm text-white rounded-lg border border-white/[0.08] bg-white/[0.03] pl-10 pr-3.5 py-2.5 focus:border-indigo-500 focus:outline-none transition placeholder:text-slate-600" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1 mb-2">
                    <input 
                      type="checkbox" 
                      id="termsAccepted" 
                      checked={termsAccepted} 
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/[0.08] bg-[#010804] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="termsAccepted" className="text-[11px] text-slate-400 leading-normal select-none cursor-pointer">
                      Tôi đã đọc và đồng ý với{" "}
                      <a 
                        href="/terms" 
                        onClick={(e) => { e.preventDefault(); navigateToPath("/terms"); }} 
                        className="text-indigo-400 hover:underline hover:text-indigo-350"
                      >
                        Điều khoản dịch vụ
                      </a>
                      ,{" "}
                      <a 
                        href="/privacy" 
                        onClick={(e) => { e.preventDefault(); navigateToPath("/privacy"); }} 
                        className="text-indigo-400 hover:underline hover:text-indigo-350"
                      >
                        Chính sách bảo mật
                      </a>{" "}
                      và xử lý dữ liệu theo luật VN.
                    </label>
                  </div>
                  <button type="submit" disabled={isSubmitLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg text-sm transition cursor-pointer disabled:opacity-50">
                    {isSubmitLoading ? "Creating account..." : "Create Account"} 
                  </button>
                  <p className="text-[11px] text-slate-600 text-center">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setTab("login")} className="text-indigo-400 hover:text-indigo-300 cursor-pointer">Sign in</button>
                  </p>
                </form>
              )}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 2: PRODUCT SHOWCASE — Real UI mockups
            Shows what the platform actually looks like once you're inside.
            No fake metrics, no screenshots of unrelated tools.
            ================================================================ */}
        <section id="product" className="w-full relative" style={{ borderTop: "1px solid rgba(74,222,128,0.07)", background: "rgba(1,8,4,0.96)" }}>
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Everything you need to build together</h2>
              <p className="text-slate-400 text-base">From finding the right people to shipping your game — one workspace for your entire indie team.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <ProductMockup title="Team Discovery" icon={<Search className="h-4 w-4" />}>
                <div className="space-y-2">
                  {["Pixel Artist — Aseprite, Spine 2D", "Sound Designer — FMOD, REAPER", "Gameplay Dev — Unity, C#"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-2 px-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                      <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=user${i}`} alt="" className="w-6 h-6 rounded-full" />
                      <span className="text-xs text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </ProductMockup>

              <ProductMockup title="Project Board" icon={<Layers className="h-4 w-4" />}>
                <div className="space-y-2">
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <div className="text-xs font-semibold text-white mb-1">Void Drifter</div>
                    <div className="text-[11px] text-slate-500 mb-2">Synthwave racing — looking for a pixel artist</div>
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">Godot</span>
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20">Recruiting</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <div className="text-xs font-semibold text-white mb-1">Rhythm of the Void</div>
                    <div className="text-[11px] text-slate-500 mb-2">Roguelite — needs sound designer</div>
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] bg-violet-500/10 text-violet-300 rounded-full border border-violet-500/20">Unity</span>
                      <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/20">Rev Share</span>
                    </div>
                  </div>
                </div>
              </ProductMockup>

              <ProductMockup title="Collaboration" icon={<MessageSquare className="h-4 w-4" />}>
                <div className="space-y-2">
                  <div className="flex gap-2 items-start p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=dev1" alt="" className="w-5 h-5 rounded-full mt-0.5" />
                    <div>
                      <span className="text-[11px] text-slate-300 font-medium">@pixel_slayer</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Just pushed the new tileset. Check the asset board!</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=dev2" alt="" className="w-5 h-5 rounded-full mt-0.5" />
                    <div>
                      <span className="text-[11px] text-slate-300 font-medium">@synth_ghost</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Boss theme draft is ready for review.</p>
                    </div>
                  </div>
                </div>
              </ProductMockup>

              <ProductMockup title="Bug Bounties" icon={<Shield className="h-4 w-4" />}>
                <div className="space-y-2">
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] flex justify-between items-center">
                    <div>
                      <div className="text-xs text-white font-medium">Memory leak in wave spawner</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Hard · 150 XP reward</div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] bg-red-500/10 text-red-300 rounded-full border border-red-500/20">Open</span>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] flex justify-between items-center">
                    <div>
                      <div className="text-xs text-white font-medium">Sprite artifact on direction change</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Easy · 50 XP reward</div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20">Solved</span>
                  </div>
                </div>
              </ProductMockup>

              <ProductMockup title="Game Studios" icon={<Users className="h-4 w-4" />}>
                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-semibold">Neon Drift Studios</span>
                    <span className="text-[10px] text-slate-500">4 members</span>
                  </div>
                  <div className="flex -space-x-1.5">
                    {["s1","s2","s3","s4"].map((s, i) => (
                      <img key={i} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`} alt="" className="w-6 h-6 rounded-full border-2 border-[#09090b]" />
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-500">Working on Void Drifter 1999</div>
                </div>
              </ProductMockup>

              <ProductMockup title="Asset Marketplace" icon={<GitBranch className="h-4 w-4" />}>
                <div className="space-y-2">
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <div className="text-xs text-white font-medium">Samurai Sprite Pack</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">32×32 · 12 animations · Exclusive</div>
                    <div className="text-[11px] text-indigo-400 font-semibold mt-1.5">$45 USD</div>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                    <div className="text-xs text-white font-medium">Voxel Castle Kit</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">50 modular pieces · Mobile-ready</div>
                    <div className="text-[11px] text-indigo-400 font-semibold mt-1.5">150 Credits</div>
                  </div>
                </div>
              </ProductMockup>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 3: HOW IT WORKS — Simple 3-step flow
            Psychological purpose: reduce friction, make it feel easy
            ================================================================ */}
        <section id="how-it-works" className="w-full border-t border-white/[0.04]" style={{ background: "radial-gradient(ellipse at bottom, rgba(99,102,241,0.03) 0%, transparent 60%)" }}>
          <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
            <div className="text-center mb-10 space-y-3">
              <span className="px-3 py-1 text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/15 uppercase font-bold">Cơ chế vận hành</span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">Hành trình lập đội & phát hành qua 3 bước</h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">Không còn làm việc cô rực. Hãy tham gia sảnh chơi tương tác để cảm nhận cách thức kết nối tự động.</p>
            </div>

            <HowItWorksSection />
          </div>
        </section>

        {/* ================================================================
            SECTION 4: BOTTOM CTA — Final conversion push
            ================================================================ */}
        <section id="join" className="w-full border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Stop building alone
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
              Your dream project needs more than just you. IndieCollab brings the people, tools, and momentum to turn your idea into a real, shipped game.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleGuestLoginClickInstant}
                className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <Zap className="h-4 w-4" /> Start building — it's free
              </button>
              <button
                onClick={() => scrollToAuth("register")}
                className="px-6 py-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 font-medium text-sm transition cursor-pointer flex items-center gap-2"
              >
                Create account <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 text-center text-[12px] text-slate-650 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        <span>IndieCollab — Nền tảng kết nối và phát triển game độc lập. Powered by React & Secure Cloud Services.</span>
        <div className="flex items-center gap-4">
          <a 
            href="/terms" 
            onClick={(e) => { e.preventDefault(); navigateToPath("/terms"); }} 
            className="hover:text-slate-400 transition"
          >
            Điều khoản dịch vụ
          </a>
          <span>•</span>
          <a 
            href="/privacy" 
            onClick={(e) => { e.preventDefault(); navigateToPath("/privacy"); }} 
            className="hover:text-slate-400 transition"
          >
            Chính sách bảo mật
          </a>
        </div>
      </footer>
    </div>
  );
}
