import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Feature } from '../models/Feature.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get all projects for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const projects = await Project.find({ userId }).sort({ updatedAt: -1 });

    res.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:projectId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch project' });
  }
});

// Get features for a project
router.get('/:projectId/features', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const features = await Feature.find({ projectId }).populate('neighbors', 'featureName');

    res.json(features);
  } catch (error: any) {
    console.error('Error fetching features:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch features' });
  }
});

// Create or update features (bulk)
router.post('/:projectId/features', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { projectId } = req.params;
    const { features, relationships } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Process features
    const featureMap = new Map();
    const createdFeatures = [];

    for (const featureData of features || []) {
      const feature = new Feature({
        projectId,
        featureName: featureData.name || featureData.featureName,
        userSummary: featureData.user_description || featureData.userSummary || '',
        aiSummary: featureData.technical_description || featureData.aiSummary || '',
        filenames: featureData.file_references || featureData.filenames || [],
        neighbors: [],
      });

      await feature.save();
      featureMap.set(featureData.name || featureData.featureName, feature._id);
      createdFeatures.push(feature);
    }

    // Process relationships
    if (relationships && Array.isArray(relationships)) {
      for (const rel of relationships) {
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

    res.json({
      success: true,
      features: createdFeatures,
      count: createdFeatures.length,
    });
  } catch (error: any) {
    console.error('Error creating features:', error);
    res.status(500).json({ error: error.message || 'Failed to create features' });
  }
});

// Update a feature
router.put('/:projectId/features/:featureId', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { projectId, featureId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const feature = await Feature.findOne({ _id: featureId, projectId });
    if (!feature) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    // Update fields
    if (updates.featureName) feature.featureName = updates.featureName;
    if (updates.userSummary) feature.userSummary = updates.userSummary;
    if (updates.aiSummary) feature.aiSummary = updates.aiSummary;
    if (updates.filenames) feature.filenames = updates.filenames;
    if (updates.neighbors) feature.neighbors = updates.neighbors;

    await feature.save();

    res.json(feature);
  } catch (error: any) {
    console.error('Error updating feature:', error);
    res.status(500).json({ error: error.message || 'Failed to update feature' });
  }
});

export default router;

