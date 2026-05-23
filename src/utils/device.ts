import { safeStorage } from "./storage";
import { User } from "../types";

interface DeviceSignature {
  deviceId: string;
  ipAddress: string;
}

/**
 * Generates or retrieves a permanent machine/device fingerprint ID for auto-login security
 */
export function getOrCreateDeviceId(): string {
  let deviceId = safeStorage.getItem("indiecollab_device_id");
  if (!deviceId) {
    const userAgent = navigator.userAgent;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    // Generate a high-entropy seed incorporating unique browser parameters
    const cleanedUA = userAgent.replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);
    const rand = Math.floor(Math.random() * 89999 + 10000);
    deviceId = `mac_${cleanedUA}_${screenRes}_${rand}_${Date.now().toString(36)}`;
    safeStorage.setItem("indiecollab_device_id", deviceId);
  }
  return deviceId;
}

/**
 * Fetches the user's current public IP address using a stable, free API
 */
export async function getDeviceSignature(): Promise<DeviceSignature> {
  const deviceId = getOrCreateDeviceId();
  let ipAddress = "127.0.0.1";

  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (res.ok) {
      const data = await res.json();
      ipAddress = data.ip || ipAddress;
    }
  } catch (err) {
    console.warn("Adblocker or offline mode prevented fetching public IP. Using fallback local IP.", err);
  }

  return { deviceId, ipAddress };
}
