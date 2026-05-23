import { admin, db } from "./firebaseAdmin";
import {
  getEnabledLearningKeywords,
  getEnabledLearningSources,
  createScanRun,
  updateScanRun,
  upsertOpportunity
} from "./learnHubRepository";
import { getGlobalGeminiClient } from "./aiCoreGateway";
import type { LearnHubOpportunityRecord, LearnHubCategory } from "./learningPlatformTypes";
import { Type } from "@google/genai";

export interface DiscoveryCandidateUrl {
  url: string;
  title: string;
  source: string;
  sourceType: "rss" | "sitemap" | "page" | "search";
}

/**
 * Validates and normalizes URLs
 */
export function normalizeLearningUrl(input: string): string | null {
  try {
    const url = new URL(input);
    url.hash = "";
    // strip tracking queries
    const searchParams = url.searchParams;
    const trackingKeys = ["utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"];
    trackingKeys.forEach(k => searchParams.delete(k));
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Filter out localhost and core forbidden testing networks
 */
export function isBlockedDiscoveryDomain(hostname: string): boolean {
  const blocked = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "test.com",
    "example.com"
  ];
  return blocked.includes(hostname.toLowerCase());
}

/**
 * Performs robots.txt check (lightweight compliance crawler helper)
 */
async function checkRobotsCompliance(link: string): Promise<boolean> {
  try {
    const parsed = new URL(link);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return true; // Safe to crawl if robots.txt doesn't exist
    const text = await res.text();
    
    // Check if '*' or custom user-agent are blocked on the entry path
    const path = parsed.pathname;
    const lines = text.split("\n");
    let inGlobalAgent = false;
    for (const line of lines) {
      const uLine = line.trim().toLowerCase();
      if (uLine.startsWith("user-agent:")) {
        const ua = uLine.split(":")[1].trim();
        inGlobalAgent = ua === "*" || ua === "indiecollab-discovery-bot";
      } else if (inGlobalAgent && uLine.startsWith("disallow:")) {
        const disallowPath = uLine.split(":")[1]?.trim() || "";
        if (disallowPath && path.startsWith(disallowPath)) {
          console.log(`[Discovery/Robots] Disallowed crawl by rule "${disallowPath}" on ${link}`);
          return false;
        }
      }
    }
    return true;
  } catch {
    return true; // default compliant if connection times out or fails
  }
}

/**
 * Simple XML parser for RSS feed
 */
async function fetchAndParseRss(url: string): Promise<Array<{ title: string; link: string }>> {
  try {
    console.log(`[Discovery/RSS] Fetching ${url}`);
    const res = await fetch(url, { 
      headers: { "User-Agent": "indiecollab-discovery-bot/1.0" },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const text = await res.text();
    const items: Array<{ title: string; link: string }> = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];
      const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
      const titleMatch = /<title>(.*?)<\/title>/.exec(itemContent);
      if (linkMatch) {
        let link = linkMatch[1].trim();
        if (link.startsWith("<![CDATA[")) {
          link = link.substring(9, link.length - 3);
        }
        let title = titleMatch ? titleMatch[1].trim() : "Unknown RSS Resource";
        if (title.startsWith("<![CDATA[")) {
          title = title.substring(9, title.length - 3);
        }
        items.push({ title, link });
      }
    }
    return items;
  } catch (err: any) {
    console.warn(`[Discovery/RSS] Error parsing RSS from ${url}:`, err.message);
    throw err;
  }
}

/**
 * Sitemap loc tag parser
 */
async function fetchAndParseSitemap(url: string): Promise<Array<{ title: string; link: string }>> {
  try {
    console.log(`[Discovery/Sitemap] Fetching ${url}`);
    const res = await fetch(url, { 
      headers: { "User-Agent": "indiecollab-discovery-bot/1.0" },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const text = await res.text();
    const items: Array<{ title: string; link: string }> = [];

    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = locRegex.exec(text)) !== null) {
      let link = match[1].trim();
      if (link.startsWith("<![CDATA[")) {
        link = link.substring(9, link.length - 3);
      }
      const slug = link.split("/").pop() || "";
      const title = slug.replace(/[-_]+/g, " ").replace(/\.[a-z0-9]+$/i, "");
      items.push({ title: title || "Sitemap Discovery Link", link });
    }
    return items;
  } catch (err: any) {
    console.warn(`[Discovery/Sitemap] Error parsing sitemap from ${url}:`, err.message);
    throw err;
  }
}

/**
 * Custom Search Web queries
 */
async function fetchGoogleCustomSearch(query: string): Promise<Array<{ title: string; link: string }>> {
  const apiKey = process.env.SEARCH_API_KEY;
  const cx = process.env.SEARCH_ENGINE_ID;
  if (!apiKey || !cx) {
    console.log("[Discovery/Search] Google Search Engine not configured. Skipping Web API search...");
    return [];
  }

  try {
    console.log(`[Discovery/Search] Querying Custom Search API for: "${query}"`);
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Search API HTTP ${res.status}`);
    const data = await res.json();
    
    if (data && Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        title: item.title || "Custom Search Result",
        link: item.link || ""
      })).filter((item: any) => item.link);
    }
    return [];
  } catch (err: any) {
    console.warn(`[Discovery/Search] Custom Search failed for "${query}":`, err.message);
    return [];
  }
}

/**
 * Local fallback heuristics for classification
 */
function fallbackHeuristics(title: string, url: string): {
  category: LearnHubCategory;
  isFree: boolean;
  freeCondition: string;
  tags: string[];
  language: string;
} {
  const lTitle = title.toLowerCase();
  let category: LearnHubCategory = "course";
  if (lTitle.includes("hội thảo") || lTitle.includes("workshop") || lTitle.includes("event") || lTitle.includes("sự kiện")) {
    category = "event";
  } else if (lTitle.includes("học bổng") || lTitle.includes("scholarship")) {
    category = "scholarship";
  } else if (lTitle.includes("chứng chỉ") || lTitle.includes("certificate")) {
    category = "certificate";
  }
  return {
    category,
    isFree: !lTitle.includes("buy") && !lTitle.includes("mất phí") && !lTitle.includes("đọc thử"),
    freeCondition: "Miễn phí",
    tags: lTitle.includes("unity") ? ["Unity", "C#"] : lTitle.includes("unreal") ? ["Unreal", "C++"] : ["Game Dev"],
    language: /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i.test(title) ? "vi" : "en"
  };
}

/**
 * Batch AI Classifier using Gemini 3.5 Flash (free tier compliant and optimized)
 */
async function classifyBatchWithGemini(
  items: Array<{ title: string; url: string }>
): Promise<Array<{
  category: LearnHubCategory;
  isFree: boolean;
  freeCondition: string;
  tags: string[];
  language: string;
}>> {
  const ai = getGlobalGeminiClient();
  if (!ai || items.length === 0) {
    return items.map(it => fallbackHeuristics(it.title, it.url));
  }

  try {
    const prompt = `You are an expert AI Classifier for a game development network called Learn Hub.
Classify each learning resource list below on its metadata and provide categorization, commercial pricing, technical tags, and language indicator.

Return ONLY a JSON array, one object per item, in the exact same order as the input list.

Items:
${items.map((it, i) => `${i + 1}. Title: "${it.title}" URL: "${it.url}"`).join("\n")}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Category: 'course' | 'certificate' | 'scholarship' | 'event' | 'other'" },
              isFree: { type: Type.BOOLEAN, description: "Whether this resource is free" },
              freeCondition: { type: Type.STRING, description: "Brief free condition status string in Vietnamese, e.g. 'Học miễn phí', 'Học thử/Trả phí', 'Bản dùng thử', 'Yêu cầu đăng ký'" },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of max 3 technical tags related to game development (e.g., Unity, C#, Unreal Engine, Blender)"
              },
              language: { type: Type.STRING, description: "Language used in the course: 'vi' | 'en' | 'other'" }
            },
            required: ["category", "isFree", "freeCondition", "tags", "language"]
          }
        }
      }
    });

    const cleanText = response.text?.trim() || "[]";
    const parsed = JSON.parse(cleanText);

    if (Array.isArray(parsed)) {
      return items.map((it, idx) => {
        const itemResult = parsed[idx] || {};
        return {
          category: (itemResult.category || "course") as LearnHubCategory,
          isFree: typeof itemResult.isFree === "boolean" ? itemResult.isFree : true,
          freeCondition: itemResult.freeCondition || "Học miễn phí",
          tags: Array.isArray(itemResult.tags) ? itemResult.tags.slice(0, 3) : ["Game Dev"],
          language: itemResult.language || "en"
        };
      });
    }
  } catch (err) {
    console.warn(`[Discovery/Gemini] Batch classification failed for ${items.length} items. Falling back to local heuristics:`, err);
  }

  // Fallback for all items in case of failure
  return items.map(it => fallbackHeuristics(it.title, it.url));
}

/**
 * AI Classifier using Gemini 3.5 Flash
 */
async function classifyOpportunityWithGemini(title: string, url: string): Promise<{
  category: LearnHubCategory;
  isFree: boolean;
  freeCondition: string;
  tags: string[];
  language: string;
}> {
  const [result] = await classifyBatchWithGemini([{ title, url }]);
  return result;
}

/**
 * CORE EXECUTION LOOP FOR CRAWLING & SEARCH HARVESTING
 */
export async function runLearningDiscoveryCycle() {
  const scanRecord = await createScanRun({
    id: db.collection("learning_scan_runs").doc().id,
  });

  const errors: Array<{ source: string; message: string }> = [];
  let urlsFoundCount = 0;
  let itemsCreatedCount = 0;

  console.log(`🚀Starting Learn Hub Discovery Cycle (Run ID: ${scanRecord.id})...`);

  try {
    const [keywords, sources] = await Promise.all([
      getEnabledLearningKeywords(),
      getEnabledLearningSources()
    ]);

    const candidates: DiscoveryCandidateUrl[] = [];

    // Part A: Crawler Sources (RSS & Sitemaps)
    for (const src of sources) {
      try {
        let discoveredItems: Array<{ title: string; link: string }> = [];
        if (src.sourceMode === "rss") {
          discoveredItems = await fetchAndParseRss(src.entryUrl);
        } else if (src.sourceMode === "sitemap") {
          discoveredItems = await fetchAndParseSitemap(src.entryUrl);
        }

        for (const item of discoveredItems) {
          const norm = normalizeLearningUrl(item.link);
          if (norm && !isBlockedDiscoveryDomain(new URL(norm).hostname)) {
            candidates.push({
              url: norm,
              title: item.title,
              source: src.domain,
              sourceType: src.sourceMode as any
            });
          }
        }
      } catch (err: any) {
        errors.push({ source: src.domain, message: err.message || "Unknown error during fetch" });
      }
    }

    // Part B: Custom Search API queries
    for (const kw of keywords) {
      try {
        const searchItems = await fetchGoogleCustomSearch(kw.query);
        for (const item of searchItems) {
          const norm = normalizeLearningUrl(item.link);
          if (norm && !isBlockedDiscoveryDomain(new URL(norm).hostname)) {
            candidates.push({
              url: norm,
              title: item.title,
              source: `Google Search: ${kw.query}`,
              sourceType: "search"
            });
          }
        }
      } catch (err: any) {
        errors.push({ source: `Search: ${kw.query}`, message: err.message || "Unknown search error" });
      }
    }

    urlsFoundCount = candidates.length;
    console.log(`[Discovery] Scanned and found ${urlsFoundCount} candidates. Deduplicating & analyzing...`);

    // Part C: Deduplication & Compliance Filters
    const processedUrls = new Set<string>();
    const eligibleCandidates: typeof candidates = [];

    for (const cand of candidates) {
      if (processedUrls.has(cand.url)) continue;
      processedUrls.add(cand.url);

      try {
        const existingOpportunityQuery = await db
          .collection("learning_opportunities")
          .where("canonicalUrl", "==", cand.url)
          .get();

        if (!existingOpportunityQuery.empty) {
          continue;
        }

        const isCompliant = await checkRobotsCompliance(cand.url);
        if (!isCompliant) continue;

        eligibleCandidates.push(cand);
      } catch (err: any) {
        console.error(`[Discovery] Failed to validate compliance for candidate ${cand.url}:`, err);
        errors.push({ source: cand.url, message: err.message || "Compliance/duplication pre-check failed" });
      }
    }

    console.log(`[Discovery] Deduplication & compliance complete. ${eligibleCandidates.length} eligible candidates left for AI classification.`);

    const BATCH_SIZE = 5;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const GEMINI_RATE_DELAY_MS = 4500; // safe for 15 RPM

    for (let i = 0; i < eligibleCandidates.length; i += BATCH_SIZE) {
      const chunk = eligibleCandidates.slice(i, i + BATCH_SIZE);
      console.log(`[Discovery] Classification batch processing ${i / BATCH_SIZE + 1} with ${chunk.length} items...`);

      if (i > 0) {
        await sleep(GEMINI_RATE_DELAY_MS);
      }

      try {
        const aiInfos = await classifyBatchWithGemini(chunk);

        for (let j = 0; j < chunk.length; j++) {
          const cand = chunk[j];
          const aiInfo = aiInfos[j] || fallbackHeuristics(cand.title, cand.url);

          try {
            const opId = db.collection("learning_opportunities").doc().id;
            const record: LearnHubOpportunityRecord = {
              id: opId,
              title: cand.title,
              canonicalUrl: cand.url,
              sourceDomain: new URL(cand.url).hostname,
              sourceType: cand.sourceType,
              category: aiInfo.category,
              isFree: aiInfo.isFree,
              freeCondition: aiInfo.freeCondition,
              tags: aiInfo.tags,
              language: aiInfo.language,
              status: "pending_review",
              discoveredAt: new Date().toISOString(),
              lastVerifiedAt: new Date().toISOString()
            };

            await upsertOpportunity(record);
            itemsCreatedCount++;
          } catch (err: any) {
            console.error(`[Discovery] Failed to ingest candidate ${cand.url}:`, err);
            errors.push({ source: cand.url, message: err.message || "Ingestion record creation failure" });
          }
        }
      } catch (err: any) {
        console.error(`[Discovery] Failed to classify and process batch starting at ${i}:`, err);
        errors.push({ source: `Batch ${i}`, message: err.message || "Batch classification failure" });
      }
    }

    // Complete the scan run
    await updateScanRun(scanRecord.id, {
      status: "completed",
      urlsFound: urlsFoundCount,
      itemsCreated: itemsCreatedCount,
      errors
    });

    console.log(`✨ Discovery run completed successfully (Found: ${urlsFoundCount} | Ingested: ${itemsCreatedCount})`);
  } catch (globalErr: any) {
    console.error("[Discovery] Critical failure in scan run cycle:", globalErr);
    errors.push({ source: "CRITICAL", message: globalErr.message || "Fatal error" });
    await updateScanRun(scanRecord.id, {
      status: "failed",
      urlsFound: urlsFoundCount,
      itemsCreated: itemsCreatedCount,
      errors
    });
  }

  return {
    runId: scanRecord.id,
    urlsFound: urlsFoundCount,
    itemsCreated: itemsCreatedCount,
    errors
  };
}
