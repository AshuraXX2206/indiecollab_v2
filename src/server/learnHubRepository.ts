import { admin, db } from "./firebaseAdmin";
import type {
  LearnHubOpportunityRecord,
  LearnHubKeywordRecord,
  LearnHubSourceRecord,
  LearnHubScanRunRecord
} from "./learningPlatformTypes";

// -------------------------------------------------------------------------
// 1. Learning Opportunities
// -------------------------------------------------------------------------
export async function getPublishedLearningOpportunities(limit = 25) {
  const snapshot = await db
    .collection("learning_opportunities")
    .where("status", "==", "published")
    .orderBy("discoveredAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubOpportunityRecord);
}

export async function getLearningOpportunityById(id: string) {
  const doc = await db.collection("learning_opportunities").doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as LearnHubOpportunityRecord;
}

export async function getReviewQueueOpportunities(limit = 100) {
  const snapshot = await db
    .collection("learning_opportunities")
    .where("status", "==", "pending_review")
    .orderBy("discoveredAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubOpportunityRecord);
}

export async function reviewOpportunity(id: string, status: "published" | "rejected" | "expired" | "suspicious", reviewerId: string) {
  await db.collection("learning_opportunities").doc(id).update({
    status,
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString()
  });
}

export async function upsertOpportunity(op: LearnHubOpportunityRecord) {
  await db.collection("learning_opportunities").doc(op.id).set(op, { merge: true });
}

// -------------------------------------------------------------------------
// 2. Keywords Management
// -------------------------------------------------------------------------
export async function getEnabledLearningKeywords() {
  const snapshot = await db
    .collection("learning_keywords")
    .where("enabled", "==", true)
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubKeywordRecord);
}

export async function getAllLearningKeywords() {
  const snapshot = await db
    .collection("learning_keywords")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubKeywordRecord);
}

export async function createKeyword(keyword: Partial<LearnHubKeywordRecord>) {
  const id = keyword.id || db.collection("learning_keywords").doc().id;
  const fullKeyword: LearnHubKeywordRecord = {
    id,
    query: keyword.query || "",
    locale: keyword.locale || "vi",
    category: keyword.category || "course",
    enabled: keyword.enabled !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...keyword
  } as LearnHubKeywordRecord;
  await db.collection("learning_keywords").doc(id).set(fullKeyword);
  return fullKeyword;
}

export async function deleteKeyword(id: string) {
  await db.collection("learning_keywords").doc(id).delete();
}

// -------------------------------------------------------------------------
// 3. Sources Management
// -------------------------------------------------------------------------
export async function getEnabledLearningSources() {
  const snapshot = await db
    .collection("learning_sources")
    .where("enabled", "==", true)
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubSourceRecord);
}

export async function getAllLearningSources() {
  const snapshot = await db
    .collection("learning_sources")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubSourceRecord);
}

export async function createSource(source: Partial<LearnHubSourceRecord>) {
  const id = source.id || db.collection("learning_sources").doc().id;
  const fullSource: LearnHubSourceRecord = {
    id,
    domain: source.domain || "",
    sourceMode: source.sourceMode || "rss",
    entryUrl: source.entryUrl || "",
    trusted: source.trusted || false,
    enabled: source.enabled !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...source
  } as LearnHubSourceRecord;
  await db.collection("learning_sources").doc(id).set(fullSource);
  return fullSource;
}

export async function deleteSource(id: string) {
  await db.collection("learning_sources").doc(id).delete();
}

// -------------------------------------------------------------------------
// 4. Scan Runs Management
// -------------------------------------------------------------------------
export async function createScanRun(run: Partial<LearnHubScanRunRecord>) {
  const id = run.id || db.collection("learning_scan_runs").doc().id;
  const fullRun: LearnHubScanRunRecord = {
    id,
    startedAt: new Date().toISOString(),
    status: "running",
    urlsFound: 0,
    itemsCreated: 0,
    errors: [],
    ...run
  } as LearnHubScanRunRecord;
  await db.collection("learning_scan_runs").doc(id).set(fullRun);
  return fullRun;
}

export async function updateScanRun(id: string, updates: Partial<LearnHubScanRunRecord>) {
  await db.collection("learning_scan_runs").doc(id).update({
    ...updates,
    finishedAt: updates.status === "completed" || updates.status === "failed" ? new Date().toISOString() : undefined
  });
}

export async function getRecentScanRuns(limit = 10) {
  const snapshot = await db
    .collection("learning_scan_runs")
    .orderBy("startedAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => doc.data() as LearnHubScanRunRecord);
}
