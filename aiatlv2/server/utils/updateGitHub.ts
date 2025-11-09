import fetch from "node-fetch";

interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding: string;
  [key: string]: any;
}

interface GitHubCommitResponse {
  commit: {
    html_url: string;
  };
  content: {
    sha: string;
  };
}

/**
 * Creates or updates a file in a GitHub repo.
 * @param owner GitHub username or organization
 * @param repo Repository name
 * @param path File path within the repo (e.g. "src/index.ts")
 * @param content File content (plain text)
 * @param message Commit message
 * @param branch Target branch (default: "main")
 * @param token GitHub Personal Access Token (required)
 */
export async function writeFileToRepo(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch = "main",
  token: string
): Promise<void> {
  const headers = {
    "Authorization": `token ${token}`,
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // Step 1: Try to get the existing file SHA (if updating)
  let sha: string | undefined;
  
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );

    if (getRes.ok) {
      const fileData = await getRes.json() as GitHubFileResponse;
      sha = fileData.sha; // needed for updates
      console.log(`📝 File exists, will update with SHA: ${sha.substring(0, 7)}...`);
    } else if (getRes.status === 404) {
      // File doesn't exist, which is fine - we'll create it
      console.log(`✨ File doesn't exist, will create new file`);
    } else {
      // Some other error (auth, permissions, rate limit, etc.)
      const errText = await getRes.text();
      throw new Error(
        `Failed to check file existence: ${getRes.status} ${getRes.statusText} - ${errText}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error checking if file exists: ${error.message}`);
    }
    throw error;
  }

  // Step 2: Create or update the file
  const body = {
    message,
    content: Buffer.from(content).toString("base64"), // GitHub expects base64
    branch,
    ...(sha && { sha }), // only include sha if it exists
  };

  try {
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      }
    );

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(
        `Failed to write file: ${putRes.status} ${putRes.statusText} - ${errText}`
      );
    }

    const data = await putRes.json() as GitHubCommitResponse;
    console.log(`✅ File ${path} successfully written to ${branch}`);
    console.log(`📦 Commit: ${data.commit.html_url}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error writing file to GitHub: ${error.message}`);
    }
    throw error;
  }
}

// Example usage with proper error handling and environment variable
(async () => {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error("❌ Error: GITHUB_TOKEN environment variable is required");
    process.exit(1);
  }

  try {
    await writeFileToRepo(
      "your-username",
      "your-repo",
      "test/example.txt",
      "Hello GitHub from TypeScript!",
      "Add example.txt via API",
      "main",
      token
    );
  } catch (error) {
    console.error("❌ Failed to write file:", error);
    process.exit(1);
  }
})();