import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Octokit } from '@octokit/rest';
import type { AuthRequest } from '../middleware/auth.js';
import type { Feature } from '../models/Feature.js';

import { getPrompts } from '../utils/prompts.js'

const router = Router();
// router.use(authenticateToken);

const ai = new GoogleGenAI({ apiKey: "AIzaSyBsDXpxnZntE-cs8JoCLKmic6zHhrcBrWM" })

interface GetFileArgs {
  owner: string;
  repo: string;
  file_path: string;
  branch?: string;
}

interface UpdateFileArgs {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
  sha: string;
}

const githubFunctions = {
  get_file: async (octokit: Octokit, { owner, repo, file_path, branch = 'main' }: GetFileArgs) => {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: file_path,
        ref: branch,
      });
      const content = Buffer.from((data as any).content, 'base64').toString('utf-8');
      return {
        content,
        sha: (data as any).sha,
        path: file_path,
      };
    } catch (error: any) {
      return {
        error: `Failed to get file: ${error.message}`,
        content: null,
        sha: null,
        path: file_path,
      };
    }
  },
  update_file: async (octokit: Octokit, { owner, repo, path, content, message, branch = 'main', sha }: UpdateFileArgs) => {
    try {
      const result = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
      });
      return {
        success: true,
        commit: result.data.commit.html_url,
        sha: result.data.content?.sha,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to update file: ${error.message}`,
      };
    }
  },
};

async function executeFunctionCall(call: any, octokit: Octokit | null): Promise<any> {
  console.log(`Executing function: ${call.name}`, call.args);

  try {
    if (call.name === 'get_file') {
      if (!octokit) {
        return { error: 'GitHub token required for get_file' };
      }
      return await githubFunctions.get_file(octokit, call.args);
    } else if (call.name === 'update_file') {
      if (!octokit) {
        return { error: 'GitHub token required for update_file' };
      }
      return await githubFunctions.update_file(octokit, call.args);
    } else if (call.name === 'add_feature') {
      return {
        action: 'add',
        feature: call.args,
      };
    } else if (call.name === 'update_feature') {
      return {
        action: 'update',
        feature: call.args,
      };
    }
    return { error: `Unknown function: ${call.name}` };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Gemini API endpoint
router.post("/generate", async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body; // Expect JSON { prompt: "..." }
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Conversation history can just include the single prompt or multiple messages

    // Generate content using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{
          //@ts-ignore
          functionDeclarations: functionDeclaration
        }],
      },
    });


    // The response object may vary depending on Gemini client version
    // Typically output text is in response.output_text
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0]; // Assuming one function call
      res.json({ functionName: functionCall.name, result: functionCall.args })
    } else {
      console.log(response.text)
      res.json(null)
    }
  } catch (error) {
    console.error("Gemini generation error:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

// Generate feature map from disconnected features with Gemini
async function makeFeatureMap(features: typeof Feature[]): Promise<any> {
  const { markdown, json } = await getPrompts("feature");

  // Generate content using Gemini
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: markdown,
    config: {
      tools: [{
        //@ts-ignore
        functionDeclarations: json
      }],
    },
  });


  // The response object may vary depending on Gemini client version
  // Typically output text is in response.output_text
  if (response.functionCalls && response.functionCalls.length > 0) {
    const functionCall = response.functionCalls[0]; // Assuming one function call
    return { functionName: functionCall.name, result: functionCall.args }
  } else {
    console.log(response.text)
    return null;
  }
}

router.post("/dummy", async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body ?? {};

    const replyText = `Dummy Gemini response: I received your message "${
      prompt ?? "no prompt provided"
    }". This is just test text from the backend.`;

    return res.json({ reply: replyText });
  } catch (error) {
    console.error("Dummy Gemini generation error:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

export default router;

