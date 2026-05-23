import express from "express";
import {
  getLearningOpportunityById,
  getPublishedLearningOpportunities,
} from "./learnHubRepository";

export function createLearnHubRouter() {
  const router = express.Router();

  router.get("/opportunities", async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit || 25), 50);
      const afterId = req.query.after as string | undefined; // last doc ID from previous page
      const items = await getPublishedLearningOpportunities(limit, afterId);
      const nextCursor = items.length === limit ? items[items.length - 1].id : null;
      return res.json({ items, nextCursor });
    } catch (error) {
      console.error("[LearnHub] Failed to load opportunities", error);
      return res.status(500).json({ error: "Không thể tải Learn Hub. Vui lòng thử lại sau." });
    }
  });

  router.get("/opportunities/:id", async (req, res) => {
    try {
      const item = await getLearningOpportunityById(req.params.id);
      if (!item || item.status !== "published") {
        return res.status(404).json({ error: "Không tìm thấy cơ hội học tập đã công bố." });
      }

      return res.json({ item });
    } catch (error) {
      console.error("[LearnHub] Failed to load opportunity", error);
      return res.status(500).json({ error: "Không thể tải chi tiết cơ hội học tập." });
    }
  });

  return router;
}
