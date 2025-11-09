import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Octokit } from '@octokit/rest';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { getPrompt } from '../utils/prompts.js';

const router = Router();
router.use(authenticateToken);

const ai = new GoogleGenAI({apiKey: "AIzaSyBsDXpxnZntE-cs8JoCLKmic6zHhrcBrWM"})

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

const functionDeclaration = [
  {
    name: 'get_file',
    description: 'Retrieve the file contents of a GitHub Repository',
    parameters: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING, description: 'Owner of the repository' },
        repo: { type: Type.STRING, description: 'Repository name' },
        file_path: { type: Type.STRING, description: 'Path to the file in the repository' },
        branch: { type: Type.STRING, description: 'Branch name (default: main)' },
      },
      required: ['owner', 'repo', 'file_path'],
    },
  },
  {
    name: 'update_file',
    description: 'Update the contents of a specific file in a GitHub repository.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        owner: { type: Type.STRING, description: 'Repository owner' },
        repo: { type: Type.STRING, description: 'Repository name' },
        path: { type: Type.STRING, description: 'File path' },
        content: { type: Type.STRING, description: 'New file content' },
        message: { type: Type.STRING, description: 'Commit message' },
        branch: { type: Type.STRING, description: 'Branch name (default: main)' },
        sha: { type: Type.STRING, description: 'File SHA from get_file (required for updates)' },
      },
      required: ['owner', 'repo', 'path', 'content', 'message', 'sha'],
    },
  },
  {
    name: 'add_feature',
    description: 'Add a new feature to the feature map',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Feature name' },
        user_description: { type: Type.STRING, description: 'Non-technical description' },
        technical_description: { type: Type.STRING, description: 'Technical description' },
        file_references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of file paths',
        },
      },
      required: ['name', 'user_description', 'technical_description', 'file_references'],
    },
  },
  {
    name: 'update_feature',
    description: 'Update an existing feature in the feature map',
    parameters: {
      type: Type.OBJECT,
      properties: {
        feature_id: { type: Type.STRING, description: 'ID of feature to update' },
        name: { type: Type.STRING, description: 'Feature name' },
        user_description: { type: Type.STRING, description: 'Non-technical description' },
        technical_description: { type: Type.STRING, description: 'Technical description' },
        file_references: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of file paths',
        },
      },
      required: ['feature_id'],
    },
  },
];

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
      res.json(null)
    }
  } catch (error) {
    console.error("Gemini generation error:", error);
    res.status(500).json({ error: "Failed to generate content" });
  }
});

export default router;

