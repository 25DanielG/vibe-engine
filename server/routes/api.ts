import { Router } from 'express';
import { User } from '../models/User.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/feature-map', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Only select the featureMap field for efficiency
    const user = await User.findById(req.userId).select('featureMap');

    if (!user || !user.featureMap) {
      // No feature map yet — return empty list so frontend can fall back
      return res.json({ featureMap: [] });
    }

    let parsed;
    try {
      // featureMap is stored as a string in Mongo
      parsed = JSON.parse(user.featureMap);
    } catch (err) {
      console.error('Failed to JSON.parse featureMap for user', req.userId, err);
      return res.status(500).json({ error: 'Invalid feature map format in database' });
    }

    // Convert object format to array format for frontend
    let featureArray = [];
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Transform Record<string, FeatureEntry> to Feature[]
      featureArray = Object.values(parsed).map((entry: any) => ({
        featureName: entry.name || '',
        userSummary: entry.user_description || '',
        aiSummary: entry.technical_description || '',
        filenames: entry.file_references || [],
        neighbors: entry.neighbors || [],
      }));
    } else if (Array.isArray(parsed)) {
      featureArray = parsed;
    }

    return res.json({ featureMap: featureArray });
  } catch (err: any) {
    console.error('Error in /api/feature-map:', err);
    return res
      .status(500)
      .json({ error: err?.message || 'Failed to load feature map' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      githubConnected: !!user.githubToken,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

router.get('/github/repos', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.githubToken) {
      return res.status(400).json({ error: 'GitHub not connected for this user' });
    }

    const ghResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${user.githubToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!ghResponse.ok) {
      const text = await ghResponse.text();
      console.error('GitHub /user/repos error:', ghResponse.status, text);
      return res.status(502).json({ error: 'Failed to fetch repositories from GitHub' });
    }

    const ghRepos = (await ghResponse.json()) as Array<{
      id: number;
      full_name: string;
      private: boolean;
      description: string | null;
      language: string | null;
    }>;

    const repos = ghRepos.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      private: r.private,
      description: r.description ?? '',
      language: r.language ?? '',
    }));

    return res.json(repos);
  } catch (err: any) {
    console.error('Error in /api/github/repos:', err);
    return res.status(500).json({ error: err?.message || 'Failed to load repositories' });
  }
});

export default router;