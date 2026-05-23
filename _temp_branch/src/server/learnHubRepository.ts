import admin from "firebase-admin";
import type {
  LearnHubOpportunityRecord,
  LearnHubKeywordRecord,
  LearnHubSourceRecord,
} from "./learningPlatformTypes";

const db = admin.firestore();

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

export async function getEnabledLearningKeywords() {
  const snapshot = await db
    .collection("learning_keywords")
    .where("enabled", "==", true)
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubKeywordRecord);
}

export async function getEnabledLearningSources() {
  const snapshot = await db
    .collection("learning_sources")
    .where("enabled", "==", true)
    .get();

  return snapshot.docs.map((doc) => doc.data() as LearnHubSourceRecord);
}
