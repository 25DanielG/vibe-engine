import { Octokit } from "@octokit/rest";
/**
 * Creates or updates a file in a GitHub repo using Octokit.
 * COMPLETELY REPLACES the file contents.
 * - If file exists: Updates it (requires SHA)
 * - If file doesn't exist: Creates it (no SHA needed)
 */
export async function writeFileToRepo(owner, repo, path, content, message, branch = "main", token) {
    const octokit = new Octokit({
        auth: token,
    });
    // Convert content to base64 (required by GitHub API)
    const base64Content = Buffer.from(content).toString("base64");
    console.log("=".repeat(60));
    console.log("📝 Writing file to GitHub:");
    console.log("   Owner:", owner);
    console.log("   Repo:", repo);
    console.log("   Path:", path);
    console.log("   Branch:", branch);
    console.log("   Content length:", content.length, "bytes");
    console.log("=".repeat(60));
    let sha = undefined;
    let fileExists = false;
    // Step 1: Check if file exists to get SHA
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        // File exists - extract SHA for update
        if (data && !Array.isArray(data) && 'sha' in data) {
            sha = data.sha;
            fileExists = true;
            console.log(`✅ File EXISTS - Will REPLACE content (SHA: ${sha.substring(0, 7)}...)`);
        }
    }
    catch (err) {
        if (err.status === 404) {
            // File doesn't exist - we'll create it
            fileExists = false;
            console.log("✨ File DOES NOT EXIST - Will CREATE new file");
        }
        else {
            console.error("❌ Error checking file:", err.message);
            throw new Error(`Failed checking file existence: ${err.message}`);
        }
    }
    // Step 2: Create or Update file using PUT
    // GitHub API uses PUT for BOTH create and update operations
    try {
        const params = {
            owner,
            repo,
            path,
            message,
            content: base64Content,
            branch,
        };
        // IMPORTANT: Include SHA only when updating existing file
        if (fileExists && sha) {
            params.sha = sha;
        }
        console.log(`🚀 ${fileExists ? 'UPDATING' : 'CREATING'} file...`);
        // Use createOrUpdateFileContents which handles both cases
        const response = await octokit.repos.createOrUpdateFileContents(params);
        console.log(`✅ SUCCESS - File ${fileExists ? 'UPDATED' : 'CREATED'}`);
        console.log(`📦 Commit: ${response.data.commit.html_url}`);
        console.log("=".repeat(60));
        return;
    }
    catch (err) {
        console.error("=".repeat(60));
        console.error(`❌ FAILED: ${owner}/${repo}/${path}`);
        console.error(`   Status: ${err.status}`);
        console.error(`   Message: ${err.message}`);
        if (err.response?.data) {
            console.error(`   Details:`, err.response.data);
        }
        console.error("=".repeat(60));
        // Handle specific errors
        if (err.status === 403) {
            throw new Error(`Permission denied: Token lacks write access to ${owner}/${repo}. ` +
                `Reconnect GitHub with 'repo' scope.`);
        }
        if (err.status === 404) {
            throw new Error(`Repository not found: ${owner}/${repo}`);
        }
        if (err.status === 409) {
            throw new Error(`Conflict: File was modified. Try again.`);
        }
        throw new Error(`Failed to write file: ${err.message}` +
            (err.response?.data?.message ? ` - ${err.response.data.message}` : ''));
    }
}
