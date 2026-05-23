export type LearnHubVisibilityStatus =
  | "pending_review"
  | "published"
  | "rejected"
  | "expired"
  | "suspicious";

export type LearnHubCategory =
  | "course"
  | "certificate"
  | "scholarship"
  | "event"
  | "other";

export interface LearnHubOpportunityRecord {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceDomain: string;
  sourceType: "rss" | "sitemap" | "page" | "search";
  category: LearnHubCategory;
  isFree: boolean;
  freeCondition: string;
  deadline?: string;
  tags: string[];
  language: string;
  status: LearnHubVisibilityStatus;
  discoveredAt: string;
  lastVerifiedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface LearnHubKeywordRecord {
  id: string;
  query: string;
  locale: string;
  category: string;
  enabled: boolean;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearnHubSourceRecord {
  id: string;
  domain: string;
  sourceMode: "rss" | "sitemap" | "page" | "search_scope";
  entryUrl: string;
  trusted: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearnHubScanRunRecord {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  urlsFound: number;
  itemsCreated: number;
  errors: Array<{ source: string; message: string }>;
}
