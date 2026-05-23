import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { decryptText } from "./cryptoUtils";

const db = admin.firestore();

/**
 * Lazy initialization/retrieval of a user-specific Gemini API client.
 * If the user has configured their own encrypted API key in Firestore, decrypt and use it.
 * Otherwise, falls back to the system-wide global Gemini client.
 */
export async function getUserGeminiClient(userId?: string | null): Promise<GoogleGenAI | null> {
  if (userId) {
    try {
      const doc = await db.collection("ai_provider_connections").doc(userId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data && data.encryptedApiKey) {
          const decryptedKey = decryptText(data.encryptedApiKey);
          if (decryptedKey && decryptedKey.trim()) {
            return new GoogleGenAI({
              apiKey: decryptedKey.trim(),
              httpOptions: {
                headers: {
                  "User-Agent": "aistudio-build-byok",
                }
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[AICore] Error loading user custom API key for ${userId}:`, err);
    }
  }

  // Fallback to the global server-configured key
  return getGlobalGeminiClient();
}

/**
 * Fallback global client initialization.
 */
let globalClient: GoogleGenAI | null = null;
export function getGlobalGeminiClient(): GoogleGenAI | null {
  if (!globalClient) {
    const candidates = [
      process.env.GEMINI_API_KEY,
      process.env.GOOGLE_API_KEY,
      process.env.GEMINI_KEY,
      process.env.GOOGLE_GENAI_API_KEY
    ];

    let foundKey: string | undefined;
    for (const c of candidates) {
      if (c && typeof c === "string") {
        let trimmed = c.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          trimmed = trimmed.substring(1, trimmed.length - 1).trim();
        }
        if (trimmed && trimmed !== "MY_GEMINI_API_KEY") {
          foundKey = trimmed;
          break;
        }
      }
    }

    if (foundKey) {
      globalClient = new GoogleGenAI({
        apiKey: foundKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build-global",
          }
        }
      });
      console.log("✅ [AICore] Successfully initialized global Gemini AI client.");
    } else {
      console.warn("⚠️ [AICore] Global Gemini API Key env is missing or empty.");
    }
  }
  return globalClient;
}
