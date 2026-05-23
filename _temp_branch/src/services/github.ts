// GitHub API Integration Service
// Requires OAuth token from firebase.ts getAccessToken()

const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  diff_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
    repo: {
      full_name: string;
    };
  };
  base: {
    ref: string;
    sha: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  body: string;
  draft: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
  comments: number;
  review_comments: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
  };
}

export interface GitHubFile {
  filename: string;
  status: "added" | "removed" | "modified" | "renamed";
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface GitHubReview {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED";
  submitted_at: string;
}

export interface GitHubComment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  created_at: string;
  path?: string;
  line?: number;
  position?: number;
}

// Extract owner/repo from GitHub URL
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

// Extract PR number from PR URL
export function parsePRUrl(url: string): { owner: string; repo: string; prNumber: number } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { 
    owner: match[1], 
    repo: match[2], 
    prNumber: parseInt(match[3], 10) 
  };
}

// Fetch PR details
export async function fetchPullRequest(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPR | null> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch PR:", err);
    return null;
  }
}

// Fetch PR commits
export async function fetchPRCommits(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubCommit[]> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/commits`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch commits:", err);
    return [];
  }
}

// Fetch PR files (diff)
export async function fetchPRFiles(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubFile[]> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch PR files:", err);
    return [];
  }
}

// Fetch PR reviews
export async function fetchPRReviews(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubReview[]> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch reviews:", err);
    return [];
  }
}

// Fetch PR comments
export async function fetchPRComments(
  token: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubComment[]> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch comments:", err);
    return [];
  }
}

// Fetch user's recent contributions
export async function fetchUserContributions(
  token: string,
  username: string,
  since?: string,
  until?: string
): Promise<GitHubCommit[]> {
  try {
    const params = new URLSearchParams({
      author: username,
      sort: "updated",
      direction: "desc",
      per_page: "30",
    });
    if (since) params.append("since", since);
    if (until) params.append("until", until);

    // Search commits across all repos
    const res = await fetch(
      `${GITHUB_API_BASE}/search/commits?q=author:${username}&sort=committer-date&order=desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error("Failed to fetch contributions:", err);
    return [];
  }
}

// Post a comment on PR
export async function postPRComment(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error("Failed to post comment:", err);
    return false;
  }
}

// Submit PR review
export async function submitPRReview(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
  body?: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event, body }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error("Failed to submit review:", err);
    return false;
  }
}

// Format diff patch for display
export function formatDiffPatch(patch: string): Array<{
  type: "header" | "add" | "remove" | "context" | "info";
  content: string;
  lineNumber?: number;
}> {
  const lines = patch.split("\n");
  const result: Array<{
    type: "header" | "add" | "remove" | "context" | "info";
    content: string;
    lineNumber?: number;
  }> = [];

  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      // Diff header @@ -oldStart,oldCount +newStart,newCount @@
      const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[3], 10);
      }
      result.push({ type: "header", content: line });
    } else if (line.startsWith("+")) {
      result.push({ type: "add", content: line.slice(1), lineNumber: newLine++ });
    } else if (line.startsWith("-")) {
      result.push({ type: "remove", content: line.slice(1), lineNumber: oldLine++ });
    } else if (line.startsWith(" ")) {
      result.push({ type: "context", content: line.slice(1), lineNumber: newLine });
      oldLine++;
      newLine++;
    } else if (line.startsWith("\\")) {
      result.push({ type: "info", content: line });
    } else {
      result.push({ type: "info", content: line });
    }
  }

  return result;
}
