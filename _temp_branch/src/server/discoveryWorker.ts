import {
  getEnabledLearningKeywords,
  getEnabledLearningSources,
} from "./learnHubRepository";

export interface DiscoveryCandidateUrl {
  url: string;
  source: string;
}

export async function runLearningDiscoveryCycle() {
  const [keywords, sources] = await Promise.all([
    getEnabledLearningKeywords(),
    getEnabledLearningSources(),
  ]);

  return {
    startedAt: new Date().toISOString(),
    keywordCount: keywords.length,
    sourceCount: sources.length,
    discoveredCandidates: [] as DiscoveryCandidateUrl[],
    status: "planned",
  };
}

export function normalizeLearningUrl(input: string) {
  try {
    const url = new URL(input);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function isBlockedDiscoveryDomain(hostname: string) {
  const blocked = [
    "localhost",
    "127.0.0.1",
  ];

  return blocked.includes(hostname.toLowerCase());
}
