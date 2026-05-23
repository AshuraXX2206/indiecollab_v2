# Learning Platform v1

## Goal

This document defines the first implementation scope for IndieCollab's learning platform.

The work is split into two parts:

1. A shared AI connection layer for signed-in users.
2. A public Learn Hub feed for free courses, certificates, and learning opportunities reviewed by admins.

The first version keeps legacy AI buttons locked until they are migrated into the shared connection layer.

## User AI connection layer

The app should support a user-owned provider connection. The connection is only available to signed-in non-guest users.

Required behavior:

- show connection status in profile or settings
- validate the provider connection before saving it
- store the provider secret only through the backend
- never expose the provider secret to the browser after saving
- require Firebase ID token on every AI endpoint
- apply request limits by user ID and IP
- avoid logging secrets or sensitive prompts
- return clear Vietnamese errors for invalid connection, quota issues, and provider failures

Suggested data shape:

```ts
interface AiProviderConnection {
  provider: 'gemini';
  encryptedKey: string;
  iv: string;
  authTag: string;
  encryptionVersion: 'v1';
  status: 'connected' | 'invalid' | 'disconnected';
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

Collection path:

```text
ai_provider_connections/{uid}
```

Client rules should deny direct read/write for this collection. Backend access should use Firebase Admin SDK.

## Learn Hub feed

Learn Hub is a new navigation tab.

Public users can view reviewed and published items. Signed-in users with an AI connection can ask the app to analyze a single item for their own session.

Feed filters:

- type
- category
- language
- active deadline

Opportunity shape:

```ts
interface LearningOpportunity {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceDomain: string;
  sourceType: 'rss' | 'sitemap' | 'page' | 'search';
  category: 'course' | 'certificate' | 'scholarship' | 'event' | 'other';
  isFree: boolean;
  freeCondition: string;
  deadline?: string;
  tags: string[];
  language: string;
  status: 'pending_review' | 'published' | 'rejected' | 'expired' | 'suspicious';
  discoveredAt: string;
  lastVerifiedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}
```

IDs should be derived from the canonical URL hash to avoid duplicates.

## Admin workspace

Admin actions should be server-authorized by env allowlist or Firebase custom claim, not by UI-only checks.

Admin can manage:

- learning keywords
- trusted sources
- blocked domains
- review queue
- opportunity status

Keyword shape:

```ts
interface LearningKeyword {
  id: string;
  query: string;
  locale: string;
  category: string;
  enabled: boolean;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

Source shape:

```ts
interface LearningSource {
  id: string;
  domain: string;
  sourceMode: 'rss' | 'sitemap' | 'page' | 'search_scope';
  entryUrl: string;
  trusted: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Discovery worker

The worker runs every 6 hours on the backend environment.

Pipeline:

1. Load enabled keywords and sources.
2. Collect candidate URLs from selected sources.
3. Optionally expand discovery through a configured search adapter.
4. Normalize URLs and remove duplicates.
5. Respect robots.txt before fetching public pages.
6. Extract deterministic metadata only.
7. Create new items as `pending_review`.
8. Record run status and per-source errors.

Do not auto-publish crawler results.

Scan run shape:

```ts
interface LearningScanRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'completed' | 'failed';
  urlsFound: number;
  itemsCreated: number;
  errors: Array<{ source: string; message: string }>;
}
```

## API surface

AI connection:

- `POST /api/ai/connections/gemini/validate`
- `PUT /api/ai/connections/gemini`
- `GET /api/ai/connections/status`
- `DELETE /api/ai/connections/gemini`
- `POST /api/ai/learning-opportunities/:id/analyze`

Public Learn Hub:

- `GET /api/learn-hub/opportunities`
- `GET /api/learn-hub/opportunities/:id`

Admin Learn Hub:

- `GET /api/admin/learn-hub/keywords`
- `POST /api/admin/learn-hub/keywords`
- `PUT /api/admin/learn-hub/keywords/:id`
- `GET /api/admin/learn-hub/sources`
- `POST /api/admin/learn-hub/sources`
- `PUT /api/admin/learn-hub/sources/:id`
- `GET /api/admin/learn-hub/review-queue`
- `PUT /api/admin/learn-hub/opportunities/:id/review`

## Firestore rules

Required rules:

- Public can only read `learning_opportunities` where `status == 'published'`.
- Client cannot read or write `ai_provider_connections`.
- Client cannot read or write `learning_scan_runs`.
- Keyword, source, and review mutations go through backend admin APIs.

## Indexes

Recommended indexes:

- `learning_opportunities`: status, category, deadline, discoveredAt
- `learning_opportunities`: status, language, discoveredAt

## Acceptance checklist

- Guest cannot connect AI.
- Signed-in user can validate, save, check status, and disconnect their own provider connection.
- Saved provider secret is not visible to browser code.
- Legacy AI actions remain locked until migrated.
- Crawler creates pending review items only.
- Duplicate canonical URLs do not create duplicate opportunities.
- Disallowed robots paths are skipped.
- Guest can view published Learn Hub items only.
- Only admin can review or publish discovered items.
- `npm run check` passes before merge.

## Rollout

1. Docs and type definitions.
2. Backend AI connection API.
3. Rules and indexes.
4. Public Learn Hub UI.
5. Admin review UI.
6. Discovery worker and scheduler docs.
7. Legacy AI migration or lock cleanup.
