import { Octokit } from "@octokit/rest";
import { existsSync } from "fs";

const TARGET_DOMAIN = "";

async function isWebhookExists(octokit: Octokit, owner: string, repo: string) {
    try {
        // 1. Get existing webhooks
        const hooks = await octokit.repos.listWebhooks({ owner, repo });

        // 2. Detect if one matches the same domain
        const existingHook = hooks.data.find((hook) => {
        try {
            if (!hook.config?.url) return false;
            const hookDomain = new URL(hook.config.url).hostname;
            return hookDomain === TARGET_DOMAIN;
        } catch {
            return false;
        }
        });

        return existingHook != null;
    } catch (err: any) {
        console.error("Failed to create webhook:", err.message);
        throw err;
    }
    return true;
}

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
