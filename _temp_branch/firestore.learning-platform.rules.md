# Firestore rules plan for Learning Platform v1

This note documents the security posture that should be applied when merging the Learn Hub backend.

## Collections

### ai_provider_connections

Client access should be denied. All reads and writes must go through server-side Firebase Admin SDK.

```rules
match /ai_provider_connections/{userId} {
  allow read, write: if false;
}
```

### learning_scan_runs

Client access should be denied. The backend worker and admin APIs can read/write through Admin SDK.

```rules
match /learning_scan_runs/{runId} {
  allow read, write: if false;
}
```

### learning_keywords and learning_sources

Client access should be denied for v1. Admin management goes through backend APIs.

```rules
match /learning_keywords/{keywordId} {
  allow read, write: if false;
}

match /learning_sources/{sourceId} {
  allow read, write: if false;
}
```

### learning_opportunities

Public users can only read published opportunities. All writes go through backend/admin APIs.

```rules
match /learning_opportunities/{opportunityId} {
  allow read: if resource.data.status == 'published';
  allow write: if false;
}
```

## Why backend-only writes

- crawler output must enter moderation as pending_review
- admin review must be authorized by trusted backend logic
- provider connection material must never be exposed to browser code
- scan logs may contain source errors and should not be public

## Follow-up

When backend APIs are added, keep these rules strict and use Admin SDK for privileged operations.
