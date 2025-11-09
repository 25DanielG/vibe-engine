import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Feature } from '../models/Feature.js';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

const router = Router();
router.use(authenticateToken);

// Start onboarding workflow (analyze repository and generate feature map)
router.post('/onboarding', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { owner, repo, repoId, projectId, files, userId: inputUserId } = req.body;

    if (!userId || userId !== inputUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!owner || !repo || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get user's GitHub token
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    const octokit = new Octokit({ auth: user.githubToken });

    // Process files in batches and generate features
    const allFeatures: any[] = [];
    const batchSize = 5; // Process 5 files at a time

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      for (const file of batch) {
        try {
          // Get file content
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: file.path,
          });

          if (Array.isArray(data) || data.type !== 'file') continue;

          const content = Buffer.from(data.content, 'base64').toString('utf-8');

          const featureResponse = (await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/gemini/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers['authorization'] || '',
            },
            body: JSON.stringify({
              promptType: 1,
              input: JSON.stringify({ path: file.path, content }),
              context: { fileName: file.path },
            }),
          }).then(res => res.json())) as {
            features?: any[];
          };

          if (featureResponse.features && Array.isArray(featureResponse.features)) {
            allFeatures.push(...featureResponse.features);
          }
        } catch (error: any) {
          console.error(`Error processing file ${file.path}:`, error.message);
        }
      }
    }

    const relationshipResponse = (await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      body: JSON.stringify({
        promptType: 2,
        input: JSON.stringify(allFeatures),
      }),
    }).then(res => res.json())) as {
      relationships?: {
        source?: string;
        from?: string;
        target?: string;
        to?: string;
      }[];
    };



    // Save features to database
    if (projectId) {
      const featureMap = new Map();
      const createdFeatures = [];

      for (const featureData of allFeatures) {
        const feature = new Feature({
          projectId,
          featureName: featureData.name,
          userSummary: featureData.user_description || '',
          aiSummary: featureData.technical_description || '',
          filenames: featureData.file_references || [],
          neighbors: [],
        });

        await feature.save();
        featureMap.set(featureData.name, feature._id);
        createdFeatures.push(feature);
      }

      // Process relationships
      if (relationshipResponse.relationships && Array.isArray(relationshipResponse.relationships)) {
        for (const rel of relationshipResponse.relationships) {
          const sourceFeature = featureMap.get(rel.source || rel.from);
          const targetFeature = featureMap.get(rel.target || rel.to);



          if (sourceFeature && targetFeature) {
            const feature = await Feature.findById(sourceFeature);
            if (feature && !feature.neighbors.includes(targetFeature)) {
              feature.neighbors.push(targetFeature);
              await feature.save();
            }
          }
        }
      }
    }

    res.json({
      success: true,
      executionArn: `onboarding-${Date.now()}`,
      message: 'Onboarding workflow started',
    });
  } catch (error: any) {
    console.error('Error starting onboarding workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to start workflow' });
  }
});

// Start modification workflow (AI code changes)
router.post('/modification', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { userInput, owner, repo, userId: inputUserId, featureMap } = req.body;

    if (!userId || userId !== inputUserId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!userInput || !owner || !repo) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get user's GitHub token
    const user = await User.findById(userId);
    if (!user || !user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected' });
    }

    // Gather context (determine which files to read)
    const contextResponse = (await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      body: JSON.stringify({
        promptType: 3,
        input: userInput,
        context: { featureMap },
      }),
    }).then(res => res.json())) as {
      requestedFiles?: string[];
    };

    const requestedFiles = contextResponse.requestedFiles || [];

    const octokit = new Octokit({ auth: user.githubToken });

    // Read requested files
    const fileContents: any[] = [];
    for (const filePath of requestedFiles) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: filePath,
        });

        if (Array.isArray(data) || data.type !== 'file') continue;

        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        fileContents.push({
          path: filePath,
          content,
          sha: data.sha,
        });
      } catch (error: any) {
        console.error(`Error reading file ${filePath}:`, error.message);
      }
    }

    // Generate code changes
    const codeResponse = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      body: JSON.stringify({
        promptType: 4,
        input: userInput,
        context: {
          fileContents: JSON.stringify(fileContents),
          featureMap,
          githubToken: user.githubToken,
        },
      }),
    }).then(res => res.json());

    res.json({
      success: true,
      executionArn: `modification-${Date.now()}`,
      output: codeResponse,
    });
  } catch (error: any) {
    console.error('Error starting modification workflow:', error);
    res.status(500).json({ error: error.message || 'Failed to start workflow' });
  }
});

// Get workflow status (simplified - returns completed status)
router.get('/status/:executionArn', async (req: AuthRequest, res) => {
  try {
    const { executionArn } = req.params;

    // For simplicity, assume workflows complete immediately
    // In production, you'd track workflow state in database
    res.json({
      status: 'SUCCEEDED',
      executionArn,
    });
  } catch (error: any) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({ error: error.message || 'Failed to get status' });
  }
});

export default router;

