import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Octokit } from '@octokit/rest';
import type { AuthRequest } from '../middleware/auth.js';
import type { Feature } from '../models/Feature.js';
import { authenticateToken } from '../middleware/auth.js';

import { getPrompts } from '../utils/prompts.js'
import { fetchAllFilesFromRepo } from '../utils/getGitHub.js'
import { renderTemplate } from '../utils/fillPrompt.js'
import type { RepoFile } from '../utils/getGitHub.js'

import { writeFileToRepo } from '../utils/updateGithub.js'
import { getGithubTokenForUser } from '../services/githubToken.js';

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

// Gemini API endpoint for creating feature map
router.post("/create-feature-map", async (req: AuthRequest, res) => {
  try {
    const githubUser = req.body.githubUser;
    const repoName = req.body.repoName;
    if (!githubUser || !repoName) {
      throw new Error("Missing required field: repoName");
    }

    //Fetch entire GitHub repository
    const repo: string = await fetchAllFilesFromRepo({ owner: githubUser, repo: repoName });

    //Get feature generation markdown and functions, inputted with repository code
    const { markdown, json } = await getPrompts("feature");
    const featurePrompt = renderTemplate(markdown, { "repo": repo })

    // Generate feature groups using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: featurePrompt,
      config: {
        tools: [{
          //@ts-ignore
          functionDeclarations: json
        }],
      },
    });

    var featureGroup: any;
    if (response.functionCalls && response.functionCalls.length > 0) {
      //Process all returned functions for adding/updating features
      response.functionCalls.forEach((func) => {
        const funcName = func.name;
        const funcArgs = func.args;

        //Add feature to group
        if (funcName) {
          featureGroup[funcName] = {
            name: funcArgs?.name,
            user_description: funcArgs?.user_description,
            technical_description: funcArgs?.technical_description,
            file_references: funcArgs?.file_references
          };
        }
      });
      //Create feature map
      return res.json({ "feature-map": makeFeatureMap(JSON.stringify(featureGroup)) })

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
async function makeFeatureMap(features: string): Promise<any> {
  const { markdown, json } = await getPrompts("map");
  const mapPrompt = renderTemplate(markdown, { "features": features })

  // Generate content using Gemini
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: mapPrompt,
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
    return functionCall
  } else {
    console.log(response.text)
    return null;
  }
}

router.post("/generate-feature", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { githubUser, repoName, requestedFeature } = req.body;

    console.log("githubUser:", githubUser);
    console.log("repoName:", repoName);
    console.log("requestedFeature:", requestedFeature);

    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!githubUser || !repoName) {
      return res.status(400).json({ error: 'Missing githubUser or repoName' });
    }

    const githubToken = await getGithubTokenForUser(req.userId);
    console.log("GitHub Token:", githubToken);
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub not connected for this user' });
    }

    const repo: String = await fetchAllFilesFromRepo({
      owner: githubUser,
      repo: repoName,
      token: githubToken,
    });

    //Get feature generation markdown and functions, inputted with repository code
    const { markdown, json } = await getPrompts("edit");
    const featurePrompt = renderTemplate(markdown, {
      "requestedFeature": requestedFeature,
      "featureFormat": repo,
      "featureMap": repo, // Need to implement
      "sourceCode": repo,
    })
    // Generate feature groups using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: featurePrompt,
      config: {
        tools: [{
          //@ts-ignore
          functionDeclarations: json
        }],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      response.functionCalls.forEach((func) => {
        const funcName = func.name;
        const funcArgs = func.args as { filename?: string; content?: string };
        if (funcName === "update_file") {
          writeFileToRepo(
            githubUser,
            repoName,
            funcArgs?.filename ?? "",
            funcArgs?.content ?? "",
            "VibeEngine updated a file in the repository.",
            "main",
            githubToken
          )
        } else if (funcName == "add_file") {
          writeFileToRepo(
            githubUser,
            repoName,
            funcArgs?.filename ?? "",
            funcArgs?.content ?? "",
            "VibeEngine added a file to the repository.",
            "main",
            githubToken
          )
        }
      });
      // Debug
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




export default router;