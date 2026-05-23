import express from "express";
import { requireAllowlistedUser, requireFirebaseUser, AuthenticatedRequest } from "./authGuards";
import {
  getReviewQueueOpportunities,
  getAllLearningKeywords,
  createKeyword,
  deleteKeyword,
  getAllLearningSources,
  createSource,
  deleteSource,
  reviewOpportunity,
  getRecentScanRuns
} from "./learnHubRepository";
import { runLearningDiscoveryCycle } from "./discoveryWorker";

export function createLearnHubAdminRouter() {
  const router = express.Router();

  // Guard all admin operations with Firebase Session & Allowlist verification
  router.use(requireFirebaseUser);
  router.use(requireAllowlistedUser("ADMIN_USER_IDS"));

  // -------------------------------------------------------------------------
  // 1. Moderation Queue
  // -------------------------------------------------------------------------
  router.get("/review-queue", async (req: AuthenticatedRequest, res) => {
    try {
      const items = await getReviewQueueOpportunities(100);
      return res.json({ items });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error fetching review-queue:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi tải hàng đợi kiểm duyệt." });
    }
  });

  router.put("/opportunities/:id/review", async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const reviewerId = req.userId;

      if (!reviewerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!status || !["published", "rejected", "expired", "suspicious"].includes(status)) {
        return res.status(400).json({ error: "Trạng thái phê duyệt không hợp lệ." });
      }

      await reviewOpportunity(id, status as any, reviewerId);
      return res.json({ success: true, message: `Cơ hội học tập đã được chuyển trạng thái sang "${status}"` });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error reviewing opportunity:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi lưu kết quả duyệt." });
    }
  });

  // -------------------------------------------------------------------------
  // 2. Keyword Management
  // -------------------------------------------------------------------------
  router.get("/keywords", async (req, res) => {
    try {
      const items = await getAllLearningKeywords();
      return res.json({ items });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error listing keywords:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách từ khóa." });
    }
  });

  router.post("/keywords", async (req, res) => {
    try {
      const { query, locale, category } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "Từ khóa tìm kiếm không được để trống." });
      }

      const item = await createKeyword({
        query: query.trim(),
        locale: locale || "vi",
        category: category || "course",
        enabled: true
      });

      return res.status(201).json({ success: true, item });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error creating keyword:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi thêm từ khóa mới." });
    }
  });

  router.delete("/keywords/:id", async (req, res) => {
    try {
      await deleteKeyword(req.params.id);
      return res.json({ success: true, message: "Đã xóa từ khóa khỏi hệ thống." });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error deleting keyword:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi xóa từ khóa." });
    }
  });

  // -------------------------------------------------------------------------
  // 3. Source Management
  // -------------------------------------------------------------------------
  router.get("/sources", async (req, res) => {
    try {
      const items = await getAllLearningSources();
      return res.json({ items });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error listing sources:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách nguồn thu thập." });
    }
  });

  router.post("/sources", async (req, res) => {
    try {
      const { domain, sourceMode, entryUrl, trusted } = req.body;
      if (!domain || !entryUrl) {
        return res.status(400).json({ error: "Thiếu thông tin tên miền hoặc đường dẫn entry URL." });
      }

      const item = await createSource({
        domain: domain.trim(),
        sourceMode: sourceMode || "rss",
        entryUrl: entryUrl.trim(),
        trusted: !!trusted,
        enabled: true
      });

      return res.status(201).json({ success: true, item });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error creating source:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi thêm nguồn thu thập mới." });
    }
  });

  router.delete("/sources/:id", async (req, res) => {
    try {
      await deleteSource(req.params.id);
      return res.json({ success: true, message: "Đã xóa nguồn thu thập khỏi hệ thống." });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error deleting source:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi xóa nguồn." });
    }
  });

  // -------------------------------------------------------------------------
  // 4. Manual Scanning & Logs
  // -------------------------------------------------------------------------
  router.post("/trigger-scan", async (req, res) => {
    // Run scan in background so it doesn't time out the API connection
    runLearningDiscoveryCycle()
      .then(result => {
        console.log("[LearnHubAdmin/ScanTrigger] Async discovery completed:", result);
      })
      .catch(err => {
        console.error("[LearnHubAdmin/ScanTrigger] Async discovery failed:", err);
      });

    return res.json({
      success: true,
      message: "Tiến trình thu thập tự động đã được khởi chạy trong nền. Có thể mất tới vài phút để đồng bộ hóa."
    });
  });

  router.get("/scan-runs", async (req, res) => {
    try {
      const items = await getRecentScanRuns(15);
      return res.json({ items });
    } catch (error: any) {
      console.error("[LearnHubAdmin] Error listing scan runs:", error);
      return res.status(500).json({ error: "Lỗi hệ thống khi tải lịch sử quét." });
    }
  });

  return router;
}
