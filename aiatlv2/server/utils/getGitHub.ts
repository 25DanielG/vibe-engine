import fetch from "node-fetch";

interface GitHubFile {
  path: string;
  type: "blob" | "tree";
  url: string;
}

interface RepoFile {
  path: string;
  content: string;
}

/**
 * Pulls all files (recursively) from a GitHub repo.
 * @param owner The GitHub username or organization
 * @param repo The repository name
 * @param branch The branch to pull from (default: 'main')
 * @param token Optional GitHub token to avoid rate limiting
 * @returns A list of { path, content } for each file
 */
export async function fetchAllFilesFromRepo(
  owner: string,
  repo: string,
  branch = "main",
  token?: string
): Promise<RepoFile[]> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
  };
  if (token) headers["Authorization"] = `token ${token}`;

  // Step 1: Get full repo tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) throw new Error(`Failed to fetch repo tree: ${treeRes.statusText}`);
  const treeData = await treeRes.json() as { tree: GitHubFile[] };

  const files: GitHubFile[] = treeData.tree.filter((item) => item.type === "blob");

  // Step 2: Download each file's contents
  const results: RepoFile[] = [];
  for (const file of files) {
    const fileRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`, {
      headers,
    });
    if (!fileRes.ok) {
      console.warn(`Failed to fetch file ${file.path}`);
      continue;
    }
    const content = await fileRes.text();
    results.push({ path: file.path, content });
  }

  return results;
}

// Example usage
(async () => {
  const files = await fetchAllFilesFromRepo("vercel", "next.js", "canary");
  console.log(`Fetched ${files.length} files.`);
  console.log(files.slice(0, 3)); // show first 3
})();
