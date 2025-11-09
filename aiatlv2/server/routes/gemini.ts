import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Octokit } from '@octokit/rest';
import type { AuthRequest } from '../middleware/auth.js';
import type { Feature } from '../models/Feature.js';

import { getPrompts } from '../utils/prompts.js'
import { fetchAllFilesFromRepo } from '../utils/getGitHub.js'
import { fillPrompt } from '../utils/fillPrompt.js'
import type { RepoFile } from '../utils/getGitHub.js'

const router = Router();
// router.use(authenticateToken);

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

// Gemini API endpoint for creating feature map
router.post("/create-feature-map", async (req: AuthRequest, res) => {
  try {
    const githubUser = req.body.githubUser;
    const repoName = req.body.repoName;
    if (!githubUser || !repoName) {
      throw new Error("Missing required field: repoName");
    }

    //Fetch entire GitHub repository
    const repo: string = await fetchAllFilesFromRepo(githubUser, githubUser);
    
    //Get feature generation markdown and functions, inputted with repository code
    const { markdown, json } = await getPrompts("feature");
    const featurePrompt = fillPrompt(markdown, {"repo" : repo})

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
    
    var featureGroup: typeof Feature[];
    if (response.functionCalls && response.functionCalls.length > 0) {
      response.functionCalls.forEach((func) => {
        const funcName = func.name;
        const funcArgs = func.args;
        //Add feature to group
        if (funcName === "add_feature") {
          featureGroup[funcName] = new Feature()
        //Update feature in group
        } else if (funcName === "update_feature") {

        }
      });
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
async function makeFeatureMap(features: typeof Feature[]) : Promise<any> {
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


// Gemini API endpoint for creating feature map
router.post("/generate-feature", async (req: AuthRequest, res) => {
  try {
    const githubUser = req.body.githubUser;
    const repoName = req.body.repoName;
    const requestedFeature = req.body.requestedFeature;
    if (!githubUser || !repoName) {
      throw new Error("Missing required field: repoName");
    }

    //Fetch entire GitHub repository
    const repo: String = await fetchAllFilesFromRepo(githubUser, repoName);
    
    //Get feature generation markdown and functions, inputted with repository code
    const { markdown, json } = await getPrompts("edit");
    const featurePrompt = fillPrompt(markdown, {
      "requestedFeature" : requestedFeature,
      "featureFormat" : repo,
      "featureMap" : repo, // Need to implement
      "sourceCode" : repo,
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
    
    var featureGroup: typeof Feature[];
    if (response.functionCalls && response.functionCalls.length > 0) {
      response.functionCalls.forEach((func) => {
        const funcName = func.name;
        const funcArgs = func.args;
        //Add feature to group
        if (funcName === "add_feature") {
          featureGroup[funcName] = new Feature()
        //Update feature in group
        } else if (funcName === "update_feature") {

        }
      });
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