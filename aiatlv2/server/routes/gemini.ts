import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Octokit } from '@octokit/rest';
import type { AuthRequest } from '../middleware/auth.js';
import type { Feature } from '../models/Feature.js';

import { getPrompts } from '../utils/prompts.js'
import { fetchAllFilesFromRepo } from '../utils/getGitHub.js'
import { renderTemplate } from '../utils/fillPrompt.js'
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
    const repo: string = await fetchAllFilesFromRepo(githubUser, repoName);
    
    //Get feature generation markdown and functions, inputted with repository code
    const { markdown, json } = await getPrompts("feature");
    const featurePrompt = renderTemplate(markdown, {"repo" : repo})

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
      return res.json({"feature-map": makeFeatureMap(JSON.stringify(featureGroup))})

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
async function makeFeatureMap(features: string) : Promise<any> {
  const { markdown, json } = await getPrompts("map");
  const mapPrompt = renderTemplate(markdown, {"features" : features})

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

export default router;