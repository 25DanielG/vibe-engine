import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { Octokit } from '@octokit/rest';
import type { AuthRequest } from '../middleware/auth.js';
import type { Feature } from '../models/Feature.js';

import { getPrompts } from '../utils/prompts.js'
import { fetchAllFilesFromRepo } from '../utils/getGitHub.js'
import { renderTemplate } from '../utils/fillPrompt.js'
import type { RepoFile } from '../utils/getGitHub.js'

import { writeFileToRepo } from '../utils/updateGithub.js'

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
    const featurePrompt = renderTemplate(markdown, {
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
    
    if (response.functionCalls && response.functionCalls.length > 0) {
      response.functionCalls.forEach((func) => {
        const funcName = func.name;
        const funcArgs = func.args;
        // Add file to github repository
        if (funcName === "update_file") {
          writeFileToRepo(
            githubUser,
            repoName,
            funcArgs?.filename,
            funcArgs?.content,
            "VibeEngine updated a file in the repository.",
            "main",
            token
          )
        } else if (funcName == "add_file") {
          writeFileToRepo(
            githubUser,
            repoName,
            funcArgs?.filename,
            funcArgs?.content,
            "VibeEngine added a file to the repository.",
            "main",
            token
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