import express from "express";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";
import { requireFirebaseUser, AuthenticatedRequest } from "./authGuards";
import { encryptText } from "./cryptoUtils";

const db = admin.firestore();

export function createAiCoreRouter() {
  const router = express.Router();

  // Protect all BYOK endpoints with Firebase JWT
  router.use(requireFirebaseUser);

  // Check if current user has a personal key configured
  router.get("/provider-keys", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const doc = await db.collection("ai_provider_connections").doc(userId).get();
      const hasKey = doc.exists && !!doc.data()?.encryptedApiKey;

      return res.json({ hasKey });
    } catch (error: any) {
      console.error("[AICore/Routes] Error fetching provider-key status:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi kiểm tra trạng thái API key." });
    }
  });

  // Save (and cryptographically validate) a user's custom API key
  router.post("/provider-keys", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;
      const { apiKey } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return res.status(400).json({ error: "API Key không hợp lệ." });
      }

      const trimmedKey = apiKey.trim();

      // Cryptographically validate the key with a quick status check Content generation call
      try {
        const testAi = new GoogleGenAI({
          apiKey: trimmedKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build-byok-test",
            }
          }
        });
        await testAi.models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Hi",
        });
      } catch (validationError: any) {
        console.warn("[AICore/Routes] Custom key validation failed:", validationError);
        return res.status(400).json({
          error: "API Key không hợp lệ hoặc không có quyền truy cập mô hình gemini-2.5-flash. Vui lòng kiểm tra lại."
        });
      }

      // Encrypt and store securely
      const encrypted = encryptText(trimmedKey);
      await db.collection("ai_provider_connections").doc(userId).set({
        userId,
        encryptedApiKey: encrypted,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return res.json({ success: true, message: "Lưu API Key cá nhân thành công!" });
    } catch (error: any) {
      console.error("[AICore/Routes] Error saving custom key:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi lưu API Key." });
    }
  });

  // Remove custom API Key
  router.delete("/provider-keys", async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await db.collection("ai_provider_connections").doc(userId).delete();

      return res.json({ success: true, message: "Đã xóa API Key cá nhân thành công!" });
    } catch (error: any) {
      console.error("[AICore/Routes] Error deleting custom key:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi xóa API Key." });
    }
  });

  return router;
}
