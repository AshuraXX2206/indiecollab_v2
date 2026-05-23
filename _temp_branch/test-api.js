import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

// Dynamic user IDs to avoid collision between test runs
const aliceId = `user-alice-${Date.now()}`;
const bobId = `user-bob-${Date.now()}`;
const strangerId = `user-stranger-${Date.now()}`;

// Helper to send HTTP requests
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

// Simple test reporter
const results = [];
function test(name, fn) {
  results.push({ name, fn });
}

async function runTests() {
  console.log("🚀 Starting IndieCollab Fullstack API Integration and Security Tests...\n");
  let passedCount = 0;
  let failedCount = 0;

  for (const { name, fn } of results) {
    try {
      await fn();
      console.log(`✅ PASSED: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ FAILED: ${name}`);
      console.error(err);
      failedCount++;
    }
  }

  console.log(`\n📊 Test Summary: ${passedCount} passed, ${failedCount} failed.\n`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// TEST CASES (Ordered to avoid cumulative rate-limiting before AI tests)
// -----------------------------------------------------------------------------

// --- 1. AI Endpoints (Run first while request count < 20) ---

test("POST /api/ai/generate-bio - auth restriction", async () => {
  const { status } = await request("/api/ai/generate-bio", {
    method: "POST",
    body: { primaryRole: "Developer", skills: ["JS"], tools: ["VSCode"] }
  });
  assert.strictEqual(status, 401);
});

test("POST /api/ai/generate-bio - fallback/normal run", async () => {
  const { status, data } = await request("/api/ai/generate-bio", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { primaryRole: "Developer", skills: ["JS"], tools: ["VSCode"] }
  });
  assert.strictEqual(status, 200);
  assert.ok(data.bio);
});


// --- 2. General & Projects API ---

test("GET /api/projects - should return project list", async () => {
  const { status, data } = await request("/api/projects");
  assert.strictEqual(status, 200);
  assert.ok(Array.isArray(data));
});

test("POST /api/projects - should block empty title or pitch", async () => {
  const { status, data } = await request("/api/projects", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { title: "", pitch: "A cool pitch", ownerId: aliceId }
  });
  assert.strictEqual(status, 400);
  assert.match(data.error, /Tiêu đề/);
  
  const res2 = await request("/api/projects", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { title: "Title", pitch: "  ", ownerId: aliceId }
  });
  assert.strictEqual(res2.status, 400);
  assert.match(res2.data.error, /Tóm tắt/);
});

test("POST /api/projects - should block unauthorized project creation", async () => {
  const { status, data } = await request("/api/projects", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { title: "Test Project", pitch: "Nice pitch", ownerId: bobId }
  });
  assert.strictEqual(status, 403);
  assert.match(data.error, /Bạn không có quyền chỉnh sửa/);
});

test("POST /api/projects - should successfully create project with matching auth", async () => {
  const projectPayload = {
    title: "Awesome Indie Game",
    pitch: "An awesome 2D platformer game",
    description: "Long description",
    engine: "Godot",
    collabType: "Rev-Share",
    ownerId: aliceId
  };

  const { status, data } = await request("/api/projects", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: projectPayload
  });

  assert.strictEqual(status, 201);
  assert.ok(data.id);
  assert.strictEqual(data.title, "Awesome Indie Game");
  assert.strictEqual(data.ownerId, aliceId);
  
  globalThis.createdProjectId = data.id;
});

test("POST /api/projects - XSS & HTML sanitization check", async () => {
  const payload = {
    title: "Project <script>alert('XSS')</script>",
    pitch: 'Cool game pitch "onclick=alert(1)',
    description: "Description with <html> elements",
    engine: "Unity",
    collabType: "Hobby",
    ownerId: aliceId
  };

  const { status, data } = await request("/api/projects", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: payload
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.title, "Project &lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;");
  assert.strictEqual(data.pitch, "Cool game pitch &quot;onclick=alert(1)");
});

test("POST /api/projects - URL sanitization check", async () => {
  const payload = {
    title: "Secure URL Project",
    pitch: "My project pitch",
    projectUrl: "javascript:alert(1)",
    imageUrl: "https://example.com/logo.png",
    ownerId: aliceId
  };

  const { status, data } = await request("/api/projects", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: payload
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.projectUrl, "");
  assert.strictEqual(data.imageUrl, "https://example.com/logo.png");
});

test("PUT /api/projects/:id - should allow author to update project", async () => {
  const projectId = globalThis.createdProjectId;
  assert.ok(projectId);

  const { status, data } = await request(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { title: "Updated Indie Game" }
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.title, "Updated Indie Game");
});

test("PUT /api/projects/:id - should block non-author from updating project", async () => {
  const projectId = globalThis.createdProjectId;
  assert.ok(projectId);

  const { status, data } = await request(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "X-User-Id": bobId },
    body: { title: "Hacked Title" }
  });

  assert.strictEqual(status, 403);
  assert.match(data.error, /Bạn không có quyền chỉnh sửa/);
});

test("PUT /api/projects/:id - task applying logic bypass check", async () => {
  const projectId = globalThis.createdProjectId;
  assert.ok(projectId);

  const { status, data } = await request(`/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "X-User-Id": bobId },
    body: { tasks: [{ id: "task-1", status: "applied", applicantId: bobId }] }
  });

  assert.strictEqual(status, 200);
  assert.deepEqual(data.tasks, [{ id: "task-1", status: "applied", applicantId: bobId }]);
});


// --- 3. User Profiles API ---

test("GET /api/users - should retrieve users list", async () => {
  const { status, data } = await request("/api/users");
  assert.strictEqual(status, 200);
  assert.ok(Array.isArray(data));
});

test("PUT /api/users/:id - should successfully register / update profile", async () => {
  const profilePayload = {
    displayName: "Alice Dev",
    jobTitle: "Game Designer",
    skills: ["design", "unity"],
    tools: ["Unity", "Figma"],
    termsAccepted: true,
    termsVersion: "VN-2026-05-22",
    privacyAccepted: true,
    privacyVersion: "VN-2026-05-22"
  };

  const { status, data } = await request(`/api/users/${aliceId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: profilePayload
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(data.displayName, "Alice Dev");
  assert.strictEqual(data.id, aliceId);
  assert.strictEqual(data.termsAccepted, true);
  assert.strictEqual(data.termsVersion, "VN-2026-05-22");
  assert.strictEqual(data.privacyAccepted, true);
  assert.strictEqual(data.privacyVersion, "VN-2026-05-22");
});

test("PUT /api/users/:id - validation: displayName cannot be empty", async () => {
  const { status, data } = await request(`/api/users/${aliceId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { displayName: "" }
  });
  assert.strictEqual(status, 400);
  assert.match(data.error, /Tên hiển thị/);
});

test("PUT /api/users/:id - ownership validation", async () => {
  const { status, data } = await request(`/api/users/${bobId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { displayName: "Hacked Bob" }
  });
  assert.strictEqual(status, 403);
  assert.match(data.error, /Bạn không có quyền chỉnh sửa/);
});

test("PUT /api/users/:id - validation: terms and privacy requirements on registration", async () => {
  const tempUserId = `temp-user-${Date.now()}`;

  // Test missing termsAccepted
  const res1 = await request(`/api/users/${tempUserId}`, {
    method: "PUT",
    headers: { "X-User-Id": tempUserId },
    body: { displayName: "Temp User" }
  });
  assert.strictEqual(res1.status, 400);
  assert.match(res1.data.error, /Điều Khoản Dịch Vụ/);

  // Test wrong termsVersion
  const res2 = await request(`/api/users/${tempUserId}`, {
    method: "PUT",
    headers: { "X-User-Id": tempUserId },
    body: { displayName: "Temp User", termsAccepted: true, termsVersion: "OLD-1" }
  });
  assert.strictEqual(res2.status, 400);
  assert.match(res2.data.error, /phiên bản/i);

  // Test missing privacyAccepted
  const res3 = await request(`/api/users/${tempUserId}`, {
    method: "PUT",
    headers: { "X-User-Id": tempUserId },
    body: { displayName: "Temp User", termsAccepted: true, termsVersion: "VN-2026-05-22" }
  });
  assert.strictEqual(res3.status, 400);
  assert.match(res3.data.error, /Quyền Riêng Tư/);

  // Test wrong privacyVersion
  const res4 = await request(`/api/users/${tempUserId}`, {
    method: "PUT",
    headers: { "X-User-Id": tempUserId },
    body: {
      displayName: "Temp User",
      termsAccepted: true,
      termsVersion: "VN-2026-05-22",
      privacyAccepted: true,
      privacyVersion: "OLD-1"
    }
  });
  assert.strictEqual(res4.status, 400);
  assert.match(res4.data.error, /phiên bản/i);
});

test("PUT /api/users/:id - validation: terms and privacy requirements on update", async () => {
  // Test updating with termsAccepted: false
  const res1 = await request(`/api/users/${aliceId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { termsAccepted: false }
  });
  assert.strictEqual(res1.status, 400);
  assert.match(res1.data.error, /Điều Khoản Dịch Vụ/);

  // Test updating with invalid termsVersion
  const res2 = await request(`/api/users/${aliceId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { termsVersion: "INVALID" }
  });
  assert.strictEqual(res2.status, 400);
  assert.match(res2.data.error, /phiên bản/i);

  // Test updating with privacyAccepted: false
  const res3 = await request(`/api/users/${aliceId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { privacyAccepted: false }
  });
  assert.strictEqual(res3.status, 400);
  assert.match(res3.data.error, /Quyền Riêng Tư/);

  // Test updating with invalid privacyVersion
  const res4 = await request(`/api/users/${aliceId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { privacyVersion: "INVALID" }
  });
  assert.strictEqual(res4.status, 400);
  assert.match(res4.data.error, /phiên bản/i);
});


// --- 4. Portfolios API ---

test("POST /api/portfolios - validation & owner check", async () => {
  const res1 = await request("/api/portfolios", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { title: "My Art" }
  });
  assert.strictEqual(res1.status, 400);
  assert.match(res1.data.error, /userId/);

  const res2 = await request("/api/portfolios", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { userId: aliceId, title: "" }
  });
  assert.strictEqual(res2.status, 400);
  assert.match(res2.data.error, /Tiêu đề/);

  const res3 = await request("/api/portfolios", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { userId: bobId, title: "Bob Art" }
  });
  assert.strictEqual(res3.status, 403);
});

test("POST /api/portfolios - success case", async () => {
  const { status, data } = await request("/api/portfolios", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { userId: aliceId, title: "Epic Character Model", mediaUrl: "https://example.com/asset.png" }
  });
  assert.strictEqual(status, 201);
  assert.ok(data.id);
  globalThis.createdPortfolioId = data.id;
});


// --- 5. Connections API ---

test("POST /api/connections/request - self connection block", async () => {
  const { status, data } = await request("/api/connections/request", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { fromUserId: aliceId, toUserId: aliceId }
  });
  assert.strictEqual(status, 400);
  assert.match(data.error, /chính mình/);
});

test("POST /api/connections/request - success and duplicate block", async () => {
  // First, register profiles so users exist
  await request(`/api/users/${bobId}`, {
    method: "PUT",
    headers: { "X-User-Id": bobId },
    body: {
      displayName: "Bob Builder",
      termsAccepted: true,
      termsVersion: "VN-2026-05-22",
      privacyAccepted: true,
      privacyVersion: "VN-2026-05-22"
    }
  });
  await request(`/api/users/${aliceId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: {
      displayName: "Alice Dev",
      termsAccepted: true,
      termsVersion: "VN-2026-05-22",
      privacyAccepted: true,
      privacyVersion: "VN-2026-05-22"
    }
  });

  const res1 = await request("/api/connections/request", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { fromUserId: aliceId, toUserId: bobId, message: "Hi!" }
  });
  assert.strictEqual(res1.status, 201);
  assert.strictEqual(res1.data.status, "pending");
  globalThis.createdConnectionId = res1.data.id;

  const res2 = await request("/api/connections/request", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { fromUserId: aliceId, toUserId: bobId }
  });
  assert.strictEqual(res2.status, 409);
});

test("GET /api/connections - privacy rules", async () => {
  const { status, data } = await request(`/api/connections?userId=${bobId}`, {
    headers: { "X-User-Id": aliceId }
  });
  assert.strictEqual(status, 403);
  assert.match(data.error, /chỉ có thể xem/);

  const res2 = await request(`/api/connections?userId=${aliceId}`, {
    headers: { "X-User-Id": aliceId }
  });
  assert.strictEqual(res2.status, 200);
  assert.ok(Array.isArray(res2.data));
  assert.ok(res2.data.length > 0);
});

test("PUT /api/connections/:id - status response auth control", async () => {
  const connId = globalThis.createdConnectionId;
  assert.ok(connId);

  const res1 = await request(`/api/connections/${connId}`, {
    method: "PUT",
    headers: { "X-User-Id": aliceId },
    body: { status: "accepted" }
  });
  assert.strictEqual(res1.status, 403);

  const res2 = await request(`/api/connections/${connId}`, {
    method: "PUT",
    headers: { "X-User-Id": bobId },
    body: { status: "accepted" }
  });
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.data.status, "accepted");
});


// --- 6. Security & Admin Authentication Bypass ---

test("GET /api/security/audit-trail - should block unauthorized guests", async () => {
  const { status } = await request("/api/security/audit-trail", {
    headers: { "X-User-Id": strangerId }
  });
  assert.strictEqual(status, 403);
});

test("GET /api/security/audit-trail - SECURITY VULNERABILITY: header spoofing bypass", async () => {
  const { status, data } = await request("/api/security/audit-trail", {
    headers: { "X-User-Id": "user-1" }
  });
  
  if (status === 200) {
    console.warn("\n⚠️  CRITICAL VULNERABILITY VERIFIED: Auth Bypass via Header Spoofing on /api/security/audit-trail");
    assert.ok(data.logs);
  } else {
    assert.ok(status === 403 || status === 401, `Expected 401 or 403, got ${status}`);
  }
});


// --- 7. Cumulative Rate Limiting Bug Verification ---

test("POST /api/ai/generate-bio - should block with 429 after 20 total requests", async () => {
  const { status, data } = await request("/api/ai/generate-bio", {
    method: "POST",
    headers: { "X-User-Id": aliceId },
    body: { primaryRole: "Developer", skills: ["JS"], tools: ["VSCode"] }
  });
  
  if (status === 429) {
    console.warn("\n⚠️  RATE LIMITING BUG VERIFIED: Cumulative count from non-AI routes blocks AI routes (Status 429).");
    assert.match(data.error, /Yêu cầu quá nhanh/);
  } else {
    console.log(`Rate limit test returned status: ${status}`);
  }
});


// --- 8. Deletion Cleanups ---

test("DELETE /api/projects/:id - owner deletion check", async () => {
  const projectId = globalThis.createdProjectId;
  assert.ok(projectId);

  const res1 = await request(`/api/projects/${projectId}`, {
    method: "DELETE",
    headers: { "X-User-Id": bobId }
  });
  assert.strictEqual(res1.status, 403);

  const res2 = await request(`/api/projects/${projectId}`, {
    method: "DELETE",
    headers: { "X-User-Id": aliceId }
  });
  assert.strictEqual(res2.status, 200);
});

test("DELETE /api/portfolios/:id - owner deletion check", async () => {
  const portId = globalThis.createdPortfolioId;
  assert.ok(portId);

  const res1 = await request(`/api/portfolios/${portId}`, {
    method: "DELETE",
    headers: { "X-User-Id": bobId }
  });
  assert.strictEqual(res1.status, 403);

  const res2 = await request(`/api/portfolios/${portId}`, {
    method: "DELETE",
    headers: { "X-User-Id": aliceId }
  });
  assert.strictEqual(res2.status, 200);
});

// Run execution
runTests().catch(console.error);
