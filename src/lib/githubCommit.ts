/**
 * Server-side GitHub commit helper (Git Data API — blobs → tree → commit → ref).
 * Requires env: GITHUB_TOKEN (contents:write), optional GITHUB_REPO / GITHUB_BRANCH.
 * All files land in a single atomic commit.
 */

export interface GitHubFile {
  path: string;
  content: string; // plain text (JSON/CSV); base64-encoded before upload
}

export interface GitHubCommitResult {
  ok: boolean;
  sha?: string;
  url?: string;
  message: string;
}

const GITHUB_API = 'https://api.github.com';

function getRepo(): { owner: string; repo: string } {
  const full = process.env.GITHUB_REPO || 'Satwik-1234/SatwiksN250-Tracker';
  const [owner, repo] = full.split('/');
  if (!owner || !repo) throw new Error(`Invalid GITHUB_REPO "${full}" — expected "owner/repo"`);
  return { owner, repo };
}

interface RepoInfo { default_branch: string }
interface RefInfo { object: { sha: string } }
interface CommitInfo { sha: string; tree: { sha: string }; html_url?: string }
interface ShaInfo { sha: string }

async function gh<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${init?.method || 'GET'} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

async function commitOnce(
  token: string,
  branch: string | undefined,
  files: GitHubFile[],
  message: string
): Promise<GitHubCommitResult> {
  const { owner, repo } = getRepo();
  const base = `/repos/${owner}/${repo}`;

  // 1. Repo + current head
  const repoInfo = await gh<RepoInfo>(token, base);
  const targetBranch = branch || repoInfo.default_branch;
  const ref = await gh<RefInfo>(token, `${base}/git/ref/heads/${encodeURIComponent(targetBranch)}`);
  const headSha = ref.object.sha;
  const headCommit = await gh<CommitInfo>(token, `${base}/git/commits/${headSha}`);

  // 2. Blobs
  const blobShas: string[] = [];
  for (const file of files) {
    const blob = await gh<ShaInfo>(token, `${base}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: Buffer.from(file.content, 'utf8').toString('base64'),
        encoding: 'base64',
      }),
    });
    blobShas.push(blob.sha);
  }

  // 3. Tree (relative to head tree => untouched files stay put)
  const tree = await gh<ShaInfo>(token, `${base}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: headCommit.tree.sha,
      tree: files.map((file, i) => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobShas[i],
      })),
    }),
  });

  // 4. Commit
  const commit = await gh<CommitInfo>(token, `${base}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [headSha],
    }),
  });

  // 5. Move branch (409 = raced with another writer → caller retries)
  await gh<RefInfo>(token, `${base}/git/refs/heads/${encodeURIComponent(targetBranch)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return {
    ok: true,
    sha: commit.sha,
    url: commit.html_url,
    message,
  };
}

export async function commitFilesToGitHub(
  files: GitHubFile[],
  message: string
): Promise<GitHubCommitResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { ok: false, message: 'GITHUB_TOKEN is not configured on the server' };
  }
  if (files.length === 0) {
    return { ok: false, message: 'No files to commit' };
  }

  try {
    return await commitOnce(token, process.env.GITHUB_BRANCH, files, message);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // One retry on ref race (409) or transient failure
    if (/409|422|conflict/i.test(msg)) {
      return await commitOnce(token, process.env.GITHUB_BRANCH, files, message);
    }
    return { ok: false, message: msg };
  }
}
