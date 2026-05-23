import express from "express";
import { requireAllowlistedUser, requireFirebaseUser } from "./authGuards";

export function createLearnHubAdminRouter() {
  const router = express.Router();

  router.use(requireFirebaseUser);
  router.use(requireAllowlistedUser());

  router.get("/review-queue", async (_req, res) => {
    return res.json({
      items: [],
      message: "Review queue backend sẽ được kết nối ở milestone tiếp theo.",
    });
  });

  router.post("/keywords", async (_req, res) => {
    return res.status(501).json({
      error: "Keyword management chưa được triển khai ở phiên bản hiện tại.",
    });
  });

  router.post("/sources", async (_req, res) => {
    return res.status(501).json({
      error: "Source management chưa được triển khai ở phiên bản hiện tại.",
    });
  });

  router.put("/opportunities/:id/review", async (_req, res) => {
    return res.status(501).json({
      error: "Moderation workflow chưa được triển khai ở phiên bản hiện tại.",
    });
  });

  return router;
}
