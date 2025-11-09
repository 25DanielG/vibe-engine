import { Router } from 'express';
import { User } from '../models/User.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/api/auth/github/start', (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI ?? 'http://localhost:3001/auth/github/callback';

  console.log('clientId in route:', clientId);
  console.log('redirectUri in route:', redirectUri);

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    allow_signup: 'true',
  });

  const authorizeUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.redirect(authorizeUrl);
});

// --- GitHub OAuth: callback ---
router.get('/auth/callback', async (req, res) => {
  const code = req.query.code as string | undefined;

  if (!code) {
    return res.status(400).json({ error: 'Missing code from GitHub' });
  }

  try {
    // 1) Exchange code for access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      }),
    });

    const tokenJson = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenResponse.ok || !tokenJson.access_token) {
      console.error('GitHub token exchange error:', tokenJson);
      return res
        .status(500)
        .json({ error: tokenJson.error || 'Failed to get GitHub access token' });
    }

    const accessToken = tokenJson.access_token;

    // 2) Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!userResponse.ok) {
      const text = await userResponse.text();
      console.error('GitHub user fetch error:', text);
      return res.status(500).json({ error: 'Failed to fetch GitHub user' });
    }

    const ghUser = (await userResponse.json()) as {
      id: number;
      login: string;
      avatar_url?: string;
      name?: string;
      email?: string | null;
    };

    // 3) Try to get email if not present
    let email = ghUser.email ?? undefined;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (emailsResponse.ok) {
        const emailsJson = (await emailsResponse.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
          visibility: string | null;
        }>;

        const primary = emailsJson.find((e) => e.primary && e.verified);
        email = primary?.email ?? emailsJson[0]?.email;
      }
    }

    // 4) Find or create local user
    const githubId = String(ghUser.id);

    let user = await User.findOne({ githubId });
    if (!user && email) {
      // Fallback: maybe user existed before via email/password
      user = await User.findOne({ email });
    }

    if (!user) {
      user = new User({
        email: email ?? `${ghUser.login}@users.noreply.github.com`,
        githubId,
        githubToken: accessToken,
      });
    } else {
      // update GitHub-related fields
      user.githubId = githubId;
      user.githubToken = accessToken;
      if (!user.email && email) {
        user.email = email;
      }
    }

    await user.save();

    // 5) Issue your JWT
    const token = generateToken(user._id.toString());

    // 6) Redirect back to frontend with ?token=...
    const redirectUrl = new URL(process.env.FRONTEND_URL + '/dashboard');
    redirectUrl.searchParams.set('token', token);

    return res.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('GitHub callback error:', error);
    return res
      .status(500)
      .json({ error: error?.message || 'GitHub authentication failed' });
  }
});

// --- Get current user (unchanged except we skip password) ---
router.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
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

router.post('/api/auth/logout', authenticateToken, (_req: AuthRequest, res) => {
  res.status(204).send();
});

export default router;