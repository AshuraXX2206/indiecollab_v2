import type express from "express";
import admin from "firebase-admin";
import { userIsInAllowlist } from "./runtimeConfig";

export interface AuthenticatedRequest extends express.Request {
  userId?: string;
}

export async function requireFirebaseUser(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Bạn cần đăng nhập để tiếp tục." });
  }

  try {
    const token = header.slice("Bearer ".length);
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    return next();
  } catch {
    return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
  }
}

export function requireAllowlistedUser(settingName = "ADMIN_USER_IDS") {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: "Bạn cần đăng nhập để tiếp tục." });
    }

    if (!userIsInAllowlist(req.userId, settingName)) {
      return res.status(403).json({ error: "Bạn không có quyền quản trị khu vực này." });
    }

    return next();
  };
}
