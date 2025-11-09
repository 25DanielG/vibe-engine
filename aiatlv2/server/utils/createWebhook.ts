import { Octokit } from "@octokit/rest";

export async function createRepoWebhook(
  token: string,
  owner: string,
  repo: string,
  webhookUrl: string,
) {
  const octokit = new Octokit({ auth: token });

  try {
    const response = await octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: "json",
        insecure_ssl: "0",
      },
      events: [
        "push", // subscribe to ALL events
      ],
      active: true,
    });

    console.log("Webhook created:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("Failed to create webhook:", err.message);
    throw err;
  }
}