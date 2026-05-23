import { safeStorage } from "./storage";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn("Web Audio API is not supported in this browser:", e);
    return null;
  }
}

export function isUiSoundEnabled(): boolean {
  return safeStorage.getItem("indiecollab_ui_sounds_disabled") !== "true";
}

export function setUiSoundEnabled(enabled: boolean) {
  safeStorage.setItem("indiecollab_ui_sounds_disabled", enabled ? "false" : "true");
}

/**
 * Tiếng click chuột ngắn dạng cyberpunk
 */
export function playClickSound() {
  if (!isUiSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * Tiếng tích chuột siêu ngắn khi hover
 */
export function playHoverSound() {
  if (!isUiSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);

  gain.gain.setValueAtTime(0.015, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}

/**
 * Hợp âm trưởng phát lên khi thao tác thành công hoặc nhận Toast success
 */
export function playSuccessSound() {
  if (!isUiSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, idx) => {
    const noteTime = now + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.05, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.16);
  });
}

/**
 * Tiếng buzz đục rè giảm dần báo lỗi
 */
export function playErrorSound() {
  if (!isUiSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(130, now);
  osc1.frequency.linearRampToValueAtTime(90, now + 0.22);

  osc2.type = "sawtooth";
  osc2.frequency.setValueAtTime(133, now);
  osc2.frequency.linearRampToValueAtTime(93, now + 0.22);

  gain.gain.setValueAtTime(0.07, now);
  gain.gain.linearRampToValueAtTime(0.001, now + 0.22);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);

  osc1.stop(now + 0.23);
  osc2.stop(now + 0.23);
}

/**
 * Âm thanh kép báo tin nhắn, lời mời họp
 */
export function playNotificationSound() {
  if (!isUiSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [587.33, 880.00]; // D5, A5

  notes.forEach((freq, idx) => {
    const noteTime = now + idx * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.04, noteTime);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 0.26);
  });
}
