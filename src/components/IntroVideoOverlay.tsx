import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import { ChevronRight, Sparkles, Zap, Code, Palette, Gamepad2, Rocket, Brain, Layers, ArrowRight, Cpu, Box, Hexagon } from "lucide-react";
import { safeStorage } from "../utils/storage";

interface IntroVideoOverlayProps {
  onClose: () => void;
}

// =============================================================================
// CINEMATIC SCENE DEFINITIONS — AAA Quality Game Creation Pipeline
// =============================================================================
interface Scene {
  id: string;
  tag: string;
  tagIcon: React.ElementType;
  tagColor: string;
  headline: string;
  subtext: string;
  codeSnippet?: string;
  visualType: "prompt" | "codegen" | "artgen" | "game" | "finale";
  accentGradient: string;
  accentColor: string;
  duration: number;
  cameraMovement: { scale: number[]; x: number[]; y: number[] };
}

const SCENES: Scene[] = [
  {
    id: "prompt",
    tag: "NEURAL IMAGINATION",
    tagIcon: Brain,
    tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    headline: "Describe Your Vision",
    subtext: "From concept to cosmos — AI interprets your imagination with neural precision. Speak your game into existence.",
    visualType: "prompt",
    accentGradient: "from-cyan-500 via-blue-500 to-indigo-500",
    accentColor: "#22d3ee",
    duration: 6000,
    cameraMovement: { scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, -10, 0] },
  },
  {
    id: "codegen",
    tag: "QUANTUM CODEGEN",
    tagIcon: Cpu,
    tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    headline: "Reality Programming",
    subtext: "Physics engines materialize from thought. AI architectures assemble at quantum speed — production-ready logic emerges from the void.",
    codeSnippet: `class RealityEngine extends QuantumEntity {
  constructor() {
    super();
    this.physics = new PhysicsWorld({
      gravity: 9.81,
      timeScale: 1.0,
      determinism: true
    });
    this.ai = new BehaviorTree({
      complexity: 'adaptive',
      learningRate: 0.001
    });
  }
  
  async generate(prompt: string): Promise<GameWorld> {
    const blueprint = await this.ai.interpret(prompt);
    return this.physics.instantiate(blueprint);
  }
}`,
    visualType: "codegen",
    accentGradient: "from-emerald-500 via-green-500 to-teal-500",
    accentColor: "#34d399",
    duration: 7000,
    cameraMovement: { scale: [1, 1.1, 1.05], x: [0, 15, -10], y: [0, 5, -5] },
  },
  {
    id: "artgen",
    tag: "PROCEDURAL CANVAS",
    tagIcon: Palette,
    tagColor: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    headline: "Dreams Rendered",
    subtext: "Every pixel breathes with purpose. Character souls take form. Worlds crystallize from pure imagination into tangible beauty.",
    visualType: "artgen",
    accentGradient: "from-pink-500 via-rose-500 to-orange-500",
    accentColor: "#f472b6",
    duration: 6500,
    cameraMovement: { scale: [1, 1.2, 1.1], x: [0, -15, 10], y: [0, -20, 10] },
  },
  {
    id: "game",
    tag: "REALITY MANIFEST",
    tagIcon: Box,
    tagColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    headline: "Your Universe Awakens",
    subtext: "The simulation breathes. Physics pulse with life. Rendered worlds await exploration — one click separates dream from playable reality.",
    visualType: "game",
    accentGradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    accentColor: "#a78bfa",
    duration: 8000,
    cameraMovement: { scale: [1, 1.3, 1.2], x: [0, 0, 0], y: [0, -30, -15] },
  },
  {
    id: "finale",
    tag: "THE CREATOR ERA",
    tagIcon: Hexagon,
    tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    headline: "IndieCollab — Birth Worlds",
    subtext: "You are the architect of infinite realities. Join the evolution of creation. From imagination to manifestation — this is your power.",
    visualType: "finale",
    accentGradient: "from-amber-500 via-orange-500 to-red-500",
    accentColor: "#fbbf24",
    duration: 7000,
    cameraMovement: { scale: [1, 1.1, 1], x: [0, 0, 0], y: [0, 10, 0] },
  },
];

// =============================================================================
// AAA PARTICLE SYSTEM WITH BLOOM EFFECT
// =============================================================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'normal' | 'spark' | 'trail';
}

const ParticleCanvas: React.FC<{ color: string; intensity?: number }> = ({ color, intensity = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const createParticle = (x?: number, y?: number, type?: Particle['type']): Particle => ({
      x: x ?? Math.random() * canvas.width,
      y: y ?? Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (type === 'spark' ? 4 : 1.5),
      vy: (Math.random() - 0.5) * (type === 'spark' ? 4 : 1.5),
      life: 1,
      maxLife: type === 'spark' ? 0.3 + Math.random() * 0.5 : 0.8 + Math.random() * 1.5,
      size: type === 'spark' ? 0.5 + Math.random() * 2 : 1 + Math.random() * 3,
      color,
      type: type ?? 'normal',
    });

    for (let i = 0; i < 40 * intensity; i++) {
      particlesRef.current.push(createParticle());
    }

    const drawParticle = (p: Particle) => {
      const alpha = Math.min(p.life / p.maxLife, 1);
      
      // Bloom layers
      for (let i = 4; i >= 0; i--) {
        const bloomSize = p.size * (1 + i * 1.5);
        const bloomAlpha = alpha * (0.15 - i * 0.025) * (p.type === 'spark' ? 2 : 1);
        if (bloomAlpha <= 0) continue;
        
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, bloomSize);
        gradient.addColorStop(0, color + Math.floor(bloomAlpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, color + '00');
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, bloomSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      // Core glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    };

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      ctx.fillStyle = "rgba(2, 6, 23, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.006;

        // Spark physics
        if (p.type === 'spark') {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        if (p.life <= 0) return false;
        drawParticle(p);
        return true;
      });

      // Spawn new particles
      if (particlesRef.current.length < 40 * intensity && Math.random() > 0.4) {
        particlesRef.current.push(createParticle());
      }
      
      // Occasional sparks
      if (frameCount % 30 === 0 && Math.random() > 0.5) {
        const sparkX = Math.random() * canvas.width;
        const sparkY = Math.random() * canvas.height;
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push(createParticle(sparkX, sparkY, 'spark'));
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current!);
      window.removeEventListener("resize", resize);
    };
  }, [color, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

// =============================================================================
// CINEMATIC SCAN LINES & CRT EFFECT
// =============================================================================
const ScanLines: React.FC = () => (
  <div 
    className="absolute inset-0 z-[5] pointer-events-none opacity-[0.04]"
    style={{
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
    }}
  />
);

// =============================================================================
// DEPTH OF FIELD VIGNETTE
// =============================================================================
const Vignette: React.FC = () => (
  <div 
    className="absolute inset-0 z-[6] pointer-events-none"
    style={{
      background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
    }}
  />
);

// =============================================================================
// CHROMATIC ABERRATION OVERLAY
// =============================================================================
const ChromaticOverlay: React.FC<{ intensity?: number }> = ({ intensity = 0.5 }) => (
  <div 
    className="absolute inset-0 z-[4] pointer-events-none mix-blend-screen opacity-30"
    style={{
      background: `
        linear-gradient(90deg, rgba(255,0,0,${intensity * 0.1}) 0%, transparent 33%, transparent 66%, rgba(0,255,255,${intensity * 0.1}) 100%)
      `,
    }}
  />
);

// =============================================================================
// TYPING ANIMATION COMPONENT
const TypingText: React.FC<{ text: string; speed?: number; className?: string; onComplete?: () => void }> = ({
  text,
  speed = 22,
  className = "",
  onComplete,
}) => {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse text-current opacity-80">|</span>
    </span>
  );
};

// =============================================================================
// CODE RAIN BACKGROUND — Matrix-style falling characters
// =============================================================================
const CodeRainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "01アイウエオカキクケコABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]<>/=();";
    const fontSize = 13;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 0.06)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(99, 102, 241, 0.12)";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 45);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-60"
    />
  );
};

// =============================================================================
// FLOATING PARTICLES — orbit/glow particles
// =============================================================================
const FloatingParticles: React.FC<{ color: string }> = ({ color }) => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 12,
  }));

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background: color,
            opacity: 0.3 + Math.random() * 0.4,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
};

// =============================================================================
// FAKE PROMPT INPUT — animated typing in a mock IDE prompt
// =============================================================================
const FakePromptInput: React.FC = () => {
  const [phase, setPhase] = useState(0);
  const prompts = [
    "Create a 2D roguelike with procedural dungeons...",
    "Add pixel art characters with 8-directional movement...",
    "Generate adaptive soundtrack that responds to combat...",
  ];

  useEffect(() => {
    const timer = setTimeout(() => setPhase((p) => Math.min(p + 1, 2)), 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Fake window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 ml-2 uppercase tracking-widest">AI Game Studio — Prompt</span>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
            <Brain className="h-3.5 w-3.5" />
            <span>Describe your game idea</span>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 min-h-[80px] font-mono text-sm text-slate-300 leading-relaxed">
            <TypingText text={prompts[Math.min(phase, 2)]} speed={30} />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] text-slate-600 font-mono">Powered by Gemini 3.5 Pro</span>
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono font-bold animate-pulse">
              <Zap className="h-3 w-3" /> Generating...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// CODE GENERATION VISUAL — animated IDE with code appearing line by line
// =============================================================================
const CodeGenerationVisual: React.FC<{ code: string }> = ({ code }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const lines = code.split("\n");

  useEffect(() => {
    setVisibleLines(0);
    const interval = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= lines.length) {
          clearInterval(interval);
          return v;
        }
        return v + 1;
      });
    }, 280);
    return () => clearInterval(interval);
  }, [code]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 ml-2 uppercase tracking-widest">player.ts — AI Generated</span>
          <div className="ml-auto flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="p-4 font-mono text-xs leading-6 max-h-[220px] overflow-hidden">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex gap-3 transition-all duration-300 ${
                i < visibleLines ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
              }`}
            >
              <span className="text-slate-600 select-none w-5 text-right shrink-0">{i + 1}</span>
              <span className="text-emerald-300/90 whitespace-pre">{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ART GENERATION VISUAL — AI generating pixel art with live preview
// =============================================================================
const ArtGenerationVisual: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [revealedPixels, setRevealedPixels] = useState(0);
  const totalPixels = 16 * 16; // 16x16 pixel art

  useEffect(() => {
    setProgress(0);
    setRevealedPixels(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 1.2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Pixel reveal animation
  useEffect(() => {
    if (progress < 30) {
      setRevealedPixels(Math.floor((progress / 30) * totalPixels * 0.3));
    } else if (progress < 70) {
      setRevealedPixels(Math.floor(totalPixels * 0.3 + ((progress - 30) / 40) * totalPixels * 0.5));
    } else {
      setRevealedPixels(Math.floor(totalPixels * 0.8 + ((progress - 70) / 30) * totalPixels * 0.2));
    }
  }, [progress]);

  const artItems = [
    { label: "Character Sprites", icon: "🎨", progress: Math.min(progress * 1.3, 100), color: "from-pink-500 to-rose-400" },
    { label: "Tileset Pack", icon: "🗺️", progress: Math.min(progress * 1.1, 100), color: "from-orange-400 to-amber-400" },
    { label: "UI Elements", icon: "🖥️", progress: Math.min(progress * 0.95, 100), color: "from-amber-400 to-yellow-400" },
    { label: "VFX Particles", icon: "✨", progress: Math.min(progress * 0.8, 100), color: "from-yellow-400 to-orange-300" },
  ];

  // Generate pixel grid
  const pixels = Array.from({ length: totalPixels }, (_, i) => ({
    id: i,
    revealed: i < revealedPixels,
    color: [
      "bg-pink-500", "bg-rose-400", "bg-orange-400", "bg-amber-400", 
      "bg-pink-400", "bg-fuchsia-400", "bg-purple-400", "bg-indigo-400"
    ][Math.floor(Math.random() * 8)],
    delay: Math.random() * 0.5,
  }));

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-[10px] font-mono text-slate-500 ml-2 uppercase tracking-widest">AI Art Pipeline — Generating Assets</span>
          <div className="ml-auto flex items-center gap-1 text-[9px] text-pink-400 font-mono animate-pulse">
            <Sparkles className="h-3 w-3" />
            AI CREATING...
          </div>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Pixel Art Preview Grid */}
          <div className="flex gap-5">
            {/* Main pixel art canvas */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-xl bg-slate-950 border border-slate-800 p-2">
                <div className="grid grid-cols-16 gap-0.5 w-full h-full">
                  {pixels.map((pixel) => (
                    <div
                      key={pixel.id}
                      className={`aspect-square rounded-[1px] transition-all duration-300 ${
                        pixel.revealed ? pixel.color : "bg-slate-800/50"
                      }`}
                      style={{
                        transitionDelay: pixel.revealed ? `${pixel.delay * 100}ms` : "0ms",
                        boxShadow: pixel.revealed ? "0 0 4px rgba(236, 72, 153, 0.3)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-2xl blur-xl -z-10 animate-pulse" />
            </div>

            {/* Progress bars */}
            <div className="flex-1 space-y-3">
              {artItems.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <span className="animate-bounce" style={{ animationDuration: "2s", animationDelay: `${i * 0.2}s` }}>{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-pink-400 font-mono font-bold">{Math.round(item.progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-200 ease-out relative`}
                      style={{ width: `${item.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Style tags */}
          <div className="flex flex-wrap gap-2">
            {["Pixel Art", "Cyberpunk", "8-bit", "Neon Glow", "Retro"].map((tag, i) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[9px] font-mono bg-pink-500/10 text-pink-300 border border-pink-500/20 animate-fade-in"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// AAA GAME PREVIEW — Holographic Reality Manifestation
// =============================================================================
const GamePreviewVisual: React.FC = () => {
  const [manifestProgress, setManifestProgress] = useState(0);
  const [phase, setPhase] = useState<'wireframe' | 'texturing' | 'lighting' | 'alive'>('wireframe');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameStateRef = useRef<{
    initialized: boolean;
    controlMode: 'auto' | 'mouse' | 'keyboard';
    mouseX: number;
    keysPressed: { left: boolean; right: boolean };
    stars: Array<{ x: number; y: number; speed: number; size: number }>;
    clouds: Array<{ x: number; y: number; scale: number; speed: number; opacity: number }>;
    player: { x: number; targetX: number; y: number; width: number; height: number; shootTimer: number };
    lasers: Array<{ x: number; y: number; speed: number }>;
    enemies: Array<{ id: number; x: number; y: number; speed: number; size: number; hp: number; maxHp: number; type: 'ufo' | 'meteor' | 'scout' }>;
    explosions: Array<{ x: number; y: number; radius: number; maxRadius: number; speed: number; alpha: number; color: string; particles: Array<{x:number, y:number, vx:number, vy:number, alpha:number, color:string, size:number}> }>;
    score: number;
    wave: number;
    shake: number;
  }>({
    initialized: false,
    controlMode: 'auto',
    mouseX: 100,
    keysPressed: { left: false, right: false },
    stars: [],
    clouds: [],
    player: { x: 100, targetX: 100, y: 200, width: 20, height: 16, shootTimer: 0 },
    lasers: [],
    enemies: [],
    explosions: [],
    score: 1250,
    wave: 1,
    shake: 0,
  });

  // Listen to keyboard inputs for steering the ship manually
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        state.controlMode = "keyboard";
        state.keysPressed.left = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        state.controlMode = "keyboard";
        state.keysPressed.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        state.keysPressed.left = false;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        state.keysPressed.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Cinematic progression through manifestation phases
  useEffect(() => {
    const phases: Array<{ phase: typeof phase; duration: number }> = [
      { phase: 'wireframe', duration: 2500 },
      { phase: 'texturing', duration: 2000 },
      { phase: 'lighting', duration: 2000 },
      { phase: 'alive', duration: 3500 },
    ];
    
    let currentIndex = 0;
    const runPhase = () => {
      if (currentIndex >= phases.length) {
        currentIndex = 0;
      }
      setPhase(phases[currentIndex].phase);
      currentIndex++;
      setTimeout(runPhase, phases[currentIndex - 1].duration);
    };
    
    const initialDelay = setTimeout(runPhase, 500);
    return () => clearTimeout(initialDelay);
  }, []);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setManifestProgress(p => {
        if (p >= 100) return 0;
        return p + 0.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Canvas holographic effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    let time = 0;
    let animationId: number;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w <= 0 || h <= 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
      ctx.fillRect(0, 0, w, h);

      time += 0.016;

      const state = gameStateRef.current;
      if (!state.initialized) {
        state.initialized = true;
        state.controlMode = 'auto';
        state.mouseX = w / 2;
        state.keysPressed = { left: false, right: false };
        state.player.x = w / 2;
        state.player.targetX = w / 2;
        state.player.y = h * 0.8;
        // Generate stars
        state.stars = [];
        for (let i = 0; i < 40; i++) {
          state.stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 0.5 + Math.random() * 1.5,
            size: 0.5 + Math.random() * 1.5,
          });
        }
        // Generate clouds
        state.clouds = [];
        for (let i = 0; i < 6; i++) {
          state.clouds.push({
            x: Math.random() * w,
            y: Math.random() * h,
            scale: 0.8 + Math.random() * 1.2,
            speed: 0.8 + Math.random() * 1.0,
            opacity: 0.05 + Math.random() * 0.1,
          });
        }
        state.enemies = [];
        state.lasers = [];
        state.explosions = [];
        state.score = 1250;
      }

      // Update state
      if (state.initialized) {
        // Move stars
        const starSpeedMultiplier = phase === 'alive' ? 3.0 : 1.2;
        state.stars.forEach(s => {
          s.y += s.speed * starSpeedMultiplier;
          if (s.y > h) {
            s.y = 0;
            s.x = Math.random() * w;
          }
        });

        // Move clouds
        state.clouds.forEach(c => {
          c.y += c.speed * (phase === 'alive' ? 2.0 : 1.0);
          if (c.y > h + 30) {
            c.y = -40;
            c.x = Math.random() * w;
          }
        });

        // Player steering controls
        state.player.shootTimer++;
        if (state.controlMode === 'keyboard') {
          if (state.keysPressed.left) {
            state.player.targetX = Math.max(15, state.player.targetX - 5);
          }
          if (state.keysPressed.right) {
            state.player.targetX = Math.min(w - 15, state.player.targetX + 5);
          }
          state.player.x += (state.player.targetX - state.player.x) * 0.25;
        } else if (state.controlMode === 'mouse') {
          state.player.targetX = Math.max(15, Math.min(w - 15, state.mouseX));
          state.player.x += (state.player.targetX - state.player.x) * 0.25;
        } else {
          // Autopilot steering
          if (state.enemies.length > 0) {
            const target = state.enemies.reduce((closest, curr) => curr.y > closest.y ? curr : closest, state.enemies[0]);
            state.player.targetX = target.x + Math.sin(time * 4) * 15;
          } else {
            state.player.targetX = w / 2 + Math.sin(time * 1.5) * (w * 0.35);
          }
          state.player.targetX = Math.max(15, Math.min(w - 15, state.player.targetX));
          state.player.x += (state.player.targetX - state.player.x) * 0.09;
        }
        state.player.y = h * 0.78;

        // Auto shoot
        const shootInterval = phase === 'alive' ? 10 : 18;
        if (state.player.shootTimer >= shootInterval) {
          state.player.shootTimer = 0;
          state.lasers.push({ x: state.player.x - 4, y: state.player.y - 6, speed: 6 });
          state.lasers.push({ x: state.player.x + 4, y: state.player.y - 6, speed: 6 });
        }

        // Update lasers
        state.lasers.forEach(l => { l.y -= l.speed; });
        state.lasers = state.lasers.filter(l => l.y > 0);

        // Spawn enemies
        const maxEnemies = phase === 'alive' ? 5 : 3;
        const spawnChance = phase === 'alive' ? 0.04 : 0.02;
        if (state.enemies.length < maxEnemies && Math.random() < spawnChance) {
          const types: Array<'ufo' | 'meteor' | 'scout'> = ['scout', 'meteor', 'ufo'];
          const type = types[Math.floor(Math.random() * types.length)];
          const size = type === 'meteor' ? 12 + Math.random() * 6 : 10;
          state.enemies.push({
            id: Math.random(),
            x: 20 + Math.random() * (w - 40),
            y: -20,
            speed: type === 'meteor' ? 0.8 + Math.random() * 0.6 : 1.2 + Math.random() * 0.8,
            size,
            hp: type === 'meteor' ? 3 : 1,
            maxHp: type === 'meteor' ? 3 : 1,
            type
          });
        }

        // Update enemies
        state.enemies.forEach(e => { e.y += e.speed; });
        state.enemies = state.enemies.filter(e => e.y < h + 20);

        // Collisions
        state.lasers.forEach((l, lIdx) => {
          state.enemies.forEach((e, eIdx) => {
            const dist = Math.hypot(l.x - e.x, l.y - e.y);
            if (dist < e.size + 3) {
              e.hp -= 1;
              state.lasers.splice(lIdx, 1);
              if (e.hp <= 0) {
                state.enemies.splice(eIdx, 1);
                state.score += e.type === 'meteor' ? 100 : 200;
                // Add explosion
                const particles: Array<{x:number, y:number, vx:number, vy:number, alpha:number, color:string, size:number}> = [];
                const color = e.type === 'meteor' ? '#f59e0b' : e.type === 'ufo' ? '#ec4899' : '#a78bfa';
                for (let p = 0; p < 10; p++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = 1.0 + Math.random() * 2.5;
                  particles.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1.0,
                    color,
                    size: 1 + Math.random() * 1.5
                  });
                }
                state.explosions.push({
                  x: e.x,
                  y: e.y,
                  radius: 2,
                  maxRadius: e.size * 1.6,
                  speed: 2,
                  alpha: 1.0,
                  color,
                  particles
                });
                if (phase === 'alive') {
                  state.shake = 5;
                }
              }
            }
          });
        });

        // Update explosions
        state.explosions.forEach(exp => {
          exp.radius += exp.speed;
          exp.alpha -= 0.05;
          exp.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;
          });
          exp.particles = exp.particles.filter(p => p.alpha > 0);
        });
        state.explosions = state.explosions.filter(exp => exp.alpha > 0);

        if (state.shake > 0) state.shake -= 0.4;
      }

      ctx.save();
      if (phase === 'alive' && state.shake > 0) {
        ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
      }

      // Draw background stars
      if (phase === 'wireframe') {
        ctx.fillStyle = '#c084fc';
        state.stars.forEach(s => {
          ctx.fillRect(s.x, s.y, 1, 1);
        });
      } else if (phase === 'texturing') {
        ctx.fillStyle = '#ffffff';
        state.stars.forEach(s => {
          ctx.fillRect(s.x, s.y, s.size, s.size);
        });
      } else {
        // lighting / alive
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
        ctx.lineWidth = 1;
        state.stars.forEach(s => {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x, s.y + s.speed * (phase === 'alive' ? 4 : 2));
          ctx.stroke();
        });
      }

      // Draw background clouds (only in texturing, lighting, and alive phases)
      if (phase !== 'wireframe') {
        ctx.save();
        state.clouds.forEach(c => {
          ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 14 * c.scale, 0, Math.PI * 2);
          ctx.arc(c.x - 10 * c.scale, c.y + 4 * c.scale, 9 * c.scale, 0, Math.PI * 2);
          ctx.arc(c.x + 10 * c.scale, c.y + 4 * c.scale, 9 * c.scale, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }

      // Render Player Ship
      if (phase === 'wireframe') {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(state.player.x, state.player.y - 8);
        ctx.lineTo(state.player.x - 8, state.player.y + 6);
        ctx.lineTo(state.player.x - 3, state.player.y + 3);
        ctx.lineTo(state.player.x + 3, state.player.y + 3);
        ctx.lineTo(state.player.x + 8, state.player.y + 6);
        ctx.closePath();
        ctx.stroke();
      } else if (phase === 'texturing') {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(state.player.x, state.player.y - 8);
        ctx.lineTo(state.player.x - 8, state.player.y + 6);
        ctx.lineTo(state.player.x - 3, state.player.y + 3);
        ctx.lineTo(state.player.x + 3, state.player.y + 3);
        ctx.lineTo(state.player.x + 8, state.player.y + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(state.player.x - 2, state.player.y - 1, 4, 3);
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(state.player.x - 3, state.player.y + 6, 6, 2);
      } else {
        // lighting / alive
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#3b82f6';
        
        // Ship gradient fill
        const shipGrad = ctx.createLinearGradient(state.player.x - 8, state.player.y, state.player.x + 8, state.player.y);
        shipGrad.addColorStop(0, '#2563eb');
        shipGrad.addColorStop(0.5, '#60a5fa');
        shipGrad.addColorStop(1, '#2563eb');
        ctx.fillStyle = shipGrad;
        
        ctx.beginPath();
        ctx.moveTo(state.player.x, state.player.y - 10);
        ctx.lineTo(state.player.x - 10, state.player.y + 8);
        ctx.lineTo(state.player.x - 4, state.player.y + 4);
        ctx.lineTo(state.player.x + 4, state.player.y + 4);
        ctx.lineTo(state.player.x + 10, state.player.y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Engine flame
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f97316';
        ctx.fillStyle = '#ff8c00';
        ctx.beginPath();
        ctx.moveTo(state.player.x - 3, state.player.y + 8);
        ctx.lineTo(state.player.x, state.player.y + 14 + Math.random() * 5);
        ctx.lineTo(state.player.x + 3, state.player.y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Render Lasers
      state.lasers.forEach(l => {
        if (phase === 'wireframe') {
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(l.x, l.y - 6);
          ctx.stroke();
        } else if (phase === 'texturing') {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(l.x - 1, l.y - 6, 2, 6);
        } else {
          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#22d3ee';
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(l.x - 1, l.y - 8, 2, 8);
          ctx.restore();
        }
      });

      // Render Enemies
      state.enemies.forEach(e => {
        if (phase === 'wireframe') {
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (e.type === 'meteor') {
            const pts = 7;
            for (let i = 0; i < pts; i++) {
              const ang = (i / pts) * Math.PI * 2;
              const r = e.size * (0.85 + Math.sin(i * 2 + e.id) * 0.15);
              const px = e.x + Math.cos(ang) * r;
              const py = e.y + Math.sin(ang) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
          } else {
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (phase === 'texturing') {
          if (e.type === 'meteor') {
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            const pts = 7;
            for (let i = 0; i < pts; i++) {
              const ang = (i / pts) * Math.PI * 2;
              const r = e.size * (0.85 + Math.sin(i * 2 + e.id) * 0.15);
              const px = e.x + Math.cos(ang) * r;
              const py = e.y + Math.sin(ang) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.ellipse(e.x, e.y, e.size, e.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.arc(e.x, e.y - 1, e.size * 0.4, Math.PI, 0);
            ctx.fill();
          }
        } else {
          // lighting / alive
          ctx.save();
          if (e.type === 'meteor') {
            ctx.shadowBlur = 6;
            ctx.shadowColor = '#d97706';
            const radGrad = ctx.createRadialGradient(e.x - 2, e.y - 2, 2, e.x, e.y, e.size);
            radGrad.addColorStop(0, '#f59e0b');
            radGrad.addColorStop(0.7, '#78350f');
            radGrad.addColorStop(1, '#451a03');
            ctx.fillStyle = radGrad;
            
            ctx.beginPath();
            const pts = 7;
            for (let i = 0; i < pts; i++) {
              const ang = (i / pts) * Math.PI * 2;
              const r = e.size * (0.85 + Math.sin(i * 2 + e.id) * 0.15);
              const px = e.x + Math.cos(ang) * r;
              const py = e.y + Math.sin(ang) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ec4899';
            
            const enemyGrad = ctx.createLinearGradient(e.x - e.size, e.y, e.x + e.size, e.y);
            enemyGrad.addColorStop(0, '#db2777');
            enemyGrad.addColorStop(0.5, '#f472b6');
            enemyGrad.addColorStop(1, '#db2777');
            ctx.fillStyle = enemyGrad;
            
            ctx.beginPath();
            ctx.ellipse(e.x, e.y, e.size, e.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cockpit dome
            ctx.fillStyle = '#e0f7fa';
            ctx.beginPath();
            ctx.arc(e.x, e.y - 1, e.size * 0.4, Math.PI, 0);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      // Render Explosions
      state.explosions.forEach(exp => {
        if (phase === 'wireframe') {
          ctx.strokeStyle = exp.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.save();
          if (phase === 'alive' || phase === 'lighting') {
            ctx.shadowBlur = 12;
            ctx.shadowColor = exp.color;
          }
          exp.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.restore();
        }
      });

      // UI text HUD
      ctx.save();
      ctx.font = 'bold 9px monospace';
      if (phase === 'wireframe') {
        ctx.strokeStyle = '#c084fc';
        ctx.strokeText(`SCORE: ${state.score}`, 8, 14);
        ctx.strokeText(`HI-SCORE: 99990`, w - 85, 14);
      } else if (phase === 'texturing') {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`SCORE: ${state.score}`, 8, 14);
        ctx.fillText(`HI-SCORE: 99990`, w - 85, 14);
      } else {
        // lighting / alive
        ctx.shadowBlur = 5;
        ctx.shadowColor = phase === 'alive' ? '#34d399' : '#a78bfa';
        ctx.fillStyle = phase === 'alive' ? '#34d399' : '#c084fc';
        ctx.fillText(`SCORE: ${state.score}`, 8, 14);
        ctx.fillText(`HI-SCORE: 99990`, w - 85, 14);

        if (phase === 'alive') {
          // HUD details
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
          ctx.strokeRect(8, h - 14, 50, 4);
          ctx.fillStyle = '#34d399';
          ctx.fillRect(9, h - 13, 48, 2);
          ctx.font = '7px monospace';
          ctx.fillText(`SHIELD 100%`, 62, h - 10);
          ctx.fillText(`WAVE ${state.wave}`, w - 45, h - 10);
        }
      }
      ctx.restore();

      // Scan line overlay (local to viewport)
      if (phase === 'wireframe' || phase === 'texturing') {
        const scanY = (time * 120) % h;
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(w, scanY);
        ctx.stroke();
      }

      // Chromatic Aberration in Alive mode
      if (phase === 'alive') {
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.03)';
        ctx.fillRect(-1.5, 0, w, h);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
        ctx.fillRect(1.5, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.restore(); // restore shake translation if any

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [phase]);

  const phaseLabels: Record<typeof phase, { label: string; color: string }> = {
    wireframe: { label: 'INITIALIZING WIREFRAME', color: 'text-violet-400' },
    texturing: { label: 'APPLYING PROCEDURAL TEXTURES', color: 'text-pink-400' },
    lighting: { label: 'COMPUTING GLOBAL ILLUMINATION', color: 'text-amber-400' },
    alive: { label: 'REALITY MANIFEST — LIVE', color: 'text-emerald-400' },
  };

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div className="relative rounded-2xl border border-violet-500/30 bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-violet-500/20 overflow-hidden">
        {/* Holographic header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-950/80 via-purple-950/80 to-violet-950/80 border-b border-violet-500/20">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 animate-pulse" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-violet-300 ml-2 uppercase tracking-widest flex items-center gap-2">
            <Box className="h-3 w-3" />
            Reality Engine — Manifestation Viewport
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className={`text-[9px] font-mono font-bold ${phaseLabels[phase].color} flex items-center gap-1`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {phaseLabels[phase].label}
            </span>
          </div>
        </div>
        
        {/* Holographic viewport */}
        <div 
          className="relative h-[260px] overflow-hidden cursor-crosshair group/viewport"
          onMouseMove={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const state = gameStateRef.current;
            state.controlMode = 'mouse';
            state.mouseX = e.clientX - rect.left;
          }}
        >
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Floating Instructions Banner */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 group-hover/viewport:opacity-40 select-none z-10">
            <div className="px-3 py-1 rounded-full text-[9px] font-mono bg-violet-950/90 text-violet-300 border border-violet-500/40 shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-pulse">
              <span>🕹️ Rà chuột / Phím mũi tên để lái thử!</span>
            </div>
          </div>
          
          {/* Holographic scanlines overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 92, 246, 0.1) 2px, rgba(139, 92, 246, 0.1) 4px)',
            }}
          />
          
          {/* Holographic glow edges */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-violet-500/10 to-transparent pointer-events-none" />
          
          {/* Progress indicator */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex justify-between text-[9px] font-mono text-violet-300 mb-1">
              <span>MANIFESTATION PROGRESS</span>
              <span>{Math.round(manifestProgress)}%</span>
            </div>
            <div className="h-1 bg-violet-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-400 transition-all duration-100"
                style={{ width: `${manifestProgress}%` }}
              />
            </div>
          </div>
          
          {/* Floating status badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5">
            {['PHYSICS: ONLINE', 'AI: ACTIVE', 'RENDER: RTX'].map((status, i) => (
              <span 
                key={status}
                className="px-2 py-0.5 rounded text-[8px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30 animate-fade-in"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                {status}
              </span>
            ))}
          </div>
        </div>
        
        {/* Holographic footer */}
        <div className="px-4 py-2 bg-gradient-to-r from-violet-950/60 via-purple-950/60 to-violet-950/60 border-t border-violet-500/20 flex justify-between items-center">
          <span className="text-[9px] text-violet-400 font-mono">Unreal Engine 5 • Nanite • Lumen</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              144 FPS
            </span>
            <span className="text-[9px] text-violet-300 font-mono">RT ON</span>
          </div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-2xl blur-xl -z-10 animate-pulse" />
      </div>
    </div>
  );
};

// =============================================================================
// FINALE VISUAL — Grand statistics showcase
// =============================================================================
const FinaleVisual: React.FC = () => {
  const stats = [
    { label: "Active Creators", value: "12K+", icon: "👥", color: "from-cyan-500 to-blue-500" },
    { label: "Games Shipped", value: "3,200+", icon: "🎮", color: "from-violet-500 to-purple-500" },
    { label: "AI Generations", value: "1.2M+", icon: "🧠", color: "from-pink-500 to-rose-500" },
    { label: "Universes Born", value: "∞", icon: "🌌", color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="relative rounded-2xl border border-slate-700/40 bg-slate-900/60 backdrop-blur-xl p-5 text-center overflow-hidden group"
          >
            {/* Animated gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-black text-white bg-clip-text">{s.value}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-wider">{s.label}</div>
            
            {/* Corner accent */}
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${s.color} opacity-20 blur-2xl`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN INTRO SCENE OVERLAY — CINEMATIC AAA EXPERIENCE
// =============================================================================
export const IntroVideoOverlay: React.FC<IntroVideoOverlayProps> = ({ onClose }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [sceneTransition, setSceneTransition] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [showProceedButton, setShowProceedButton] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const scene = SCENES[currentSceneIndex];
  const isLastScene = currentSceneIndex === SCENES.length - 1;

  // Scene auto-advance timer
  const startSceneTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setSceneProgress(0);

    const startTime = Date.now();
    const dur = scene.duration;

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setSceneProgress(Math.min((elapsed / dur) * 100, 100));
    }, 50);

    timerRef.current = setTimeout(() => {
      if (progressRef.current) clearInterval(progressRef.current);
      setSceneProgress(100);

      if (isLastScene) {
        setShowProceedButton(true);
      } else {
        goToNextScene();
      }
    }, dur);
  }, [currentSceneIndex, isLastScene]);

  useEffect(() => {
    startSceneTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [startSceneTimer]);

  const goToNextScene = () => {
    if (isLastScene) {
      setShowProceedButton(true);
      return;
    }
    setSceneTransition(true);
    setTimeout(() => {
      setCurrentSceneIndex((i) => i + 1);
      setSceneTransition(false);
    }, 400);
  };

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
    setShowProceedButton(true);
  };

  const handleProceed = () => {
    if (dontShowAgain) {
      safeStorage.setItem("indiecollab_hide_intro", "true");
    }
    setIsFading(true);
    setTimeout(() => onClose(), 700);
  };

  const SceneTagIcon = scene.tagIcon;

  // Render visual based on scene type
  const renderVisual = () => {
    switch (scene.visualType) {
      case "prompt":
        return <FakePromptInput />;
      case "codegen":
        return <CodeGenerationVisual code={scene.codeSnippet || ""} />;
      case "artgen":
        return <ArtGenerationVisual />;
      case "game":
        return <GamePreviewVisual />;
      case "finale":
        return <FinaleVisual />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isFading ? 0 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed inset-0 z-[100000] flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none ${
        isFading ? "pointer-events-none" : ""
      }`}
    >
      {/* AAA Cinematic Background Effects */}
      <ParticleCanvas color={scene.accentColor} intensity={scene.visualType === "game" ? 1.5 : 1} />
      <ScanLines />
      <Vignette />
      <ChromaticOverlay intensity={scene.visualType === "game" ? 0.8 : 0.3} />

      {/* Animated gradient overlays */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80 z-[2] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${scene.accentGradient} z-[2] pointer-events-none`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.06 }}
        transition={{ duration: 1.5 }} 
      />

      {/* Header */}
      <header className="relative z-20 w-full px-6 py-5 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full rounded-[11px] bg-slate-900 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 uppercase">
              IndieCollab
            </h1>
            <p className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em] leading-none mt-0.5">
              AI-Powered Game Creation • 2026
            </p>
          </div>
        </div>

        {/* Scene counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {SCENES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentSceneIndex
                    ? `w-6 bg-gradient-to-r ${scene.accentGradient}`
                    : i < currentSceneIndex
                    ? "w-1.5 bg-slate-500"
                    : "w-1.5 bg-slate-800"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {currentSceneIndex + 1}/{SCENES.length}
          </span>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative z-20 flex-1 flex flex-col justify-center items-center px-6 text-center max-w-4xl mx-auto w-full gap-8">
        <div
          className={`transition-all duration-400 transform w-full ${
            sceneTransition ? "opacity-0 -translate-y-6 scale-95 blur-sm" : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          {/* Scene tag */}
          <div className="flex justify-center mb-5">
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-widest border ${scene.tagColor} uppercase`}>
              <SceneTagIcon className="h-3.5 w-3.5" />
              {scene.tag}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-xl md:text-3xl font-black leading-tight text-white mb-3 tracking-tight">
            {scene.headline}
          </h2>

          {/* Subtext */}
          <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed mb-8">
            {scene.subtext}
          </p>

          {/* Visual */}
          {renderVisual()}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full px-6 py-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Don't show + Skip */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-300 transition select-none py-1 px-2 rounded-lg hover:bg-slate-900/40">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-indigo-500 h-3.5 w-3.5 rounded cursor-pointer"
            />
            <span className="text-[10px] font-mono uppercase tracking-wider">Không hiện lại</span>
          </label>

          {!showProceedButton && (
            <button
              onClick={handleSkip}
              className="text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 transition cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-900/40"
            >
              Bỏ qua tất cả ›
            </button>
          )}
        </div>

        {/* Right: Next / Proceed button */}
        <div className="flex items-center gap-3">
          {showProceedButton ? (
            <button
              onClick={handleProceed}
              className="group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 p-[1px] font-bold text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.97] cursor-pointer animate-fade-in"
            >
              <div className="flex items-center gap-2 rounded-[11px] bg-slate-950 px-8 py-3 text-xs font-mono tracking-widest uppercase transition duration-300 group-hover:bg-transparent">
                <Rocket className="h-4 w-4" />
                Bắt Đầu Hành Trình
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </button>
          ) : (
            <button
              onClick={goToNextScene}
              className="group flex items-center gap-1.5 rounded-xl bg-slate-900/60 border border-slate-800 px-5 py-2.5 text-[10px] font-mono uppercase tracking-widest text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer active:scale-[0.97]"
            >
              Tiếp theo
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </footer>

      {/* Scene progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 z-30">
        <div
          className={`h-full bg-gradient-to-r ${scene.accentGradient} transition-all duration-100 ease-linear`}
          style={{ width: `${sceneProgress}%` }}
        />
      </div>

      {/* Global CSS animations */}
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0px) translateX(0px); }
          100% { transform: translateY(-30px) translateX(15px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out both;
        }
      `}</style>
    </motion.div>
  );
};
