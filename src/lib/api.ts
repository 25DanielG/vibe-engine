// API Client - Replaces AWS Amplify client

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getToken(): string | null {
  return localStorage.getItem('authToken');
}

// Set auth token
function setToken(token: string): void {
  localStorage.setItem('authToken', token);
}

// Remove auth token
function removeToken(): void {
  localStorage.removeItem('authToken');
}

// Base fetch function with auth
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized - clear token and redirect to login
    removeToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response;
}

// Auth API
export const authApi = {
  register: async (email: string, password: string) => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  getMe: async () => {
    const response = await apiFetch('/auth/me');
    return response.json();
  },

  logout: () => {
    removeToken();
  },
};

// GitHub API
export const githubApi = {
  getOAuthUrl: async () => {
    const response = await apiFetch('/github/oauth/url');
    return response.json();
  },

  connectGithub: async (code: string, userId: string) => {
    const response = await apiFetch('/github/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, userId }),
    });
    return response.json();
  },

  getStatus: async () => {
    const response = await apiFetch('/github/status');
    return response.json();
  },

  getRepos: async () => {
    const response = await apiFetch('/github/repos');
    return response.json();
  },

  getRepoFiles: async (owner: string, repo: string) => {
    const response = await apiFetch(`/github/repos/${owner}/${repo}/files`);
    return response.json();
  },

  getFileContent: async (owner: string, repo: string, path: string, ref: string = 'main') => {
    const response = await apiFetch(`/github/repos/${owner}/${repo}/content?path=${encodeURIComponent(path)}&ref=${encodeURIComponent(ref)}`);
    return response.json();
  },

  connectRepo: async (full_name: string) => {
    const response = await apiFetch('/github/repos/connect', {
      method: 'POST',
      body: JSON.stringify({ full_name }),
    });
    return response.json();
  },

  createWebhook: async (owner: string, repo: string) => {
    const response = await apiFetch('/github/webhook', {
      method: 'POST',
      body: JSON.stringify({ owner, repo }),
    });
    return response.json();
  },
};

// Projects API
export const projectsApi = {
  list: async () => {
    const response = await apiFetch('/projects');
    return response.json();
  },

  get: async (id: string) => {
    const response = await apiFetch(`/projects/${id}`);
    return response.json();
  },

  create: async (repoId: string) => {
    const response = await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ repoId }),
    });
    return response.json();
  },

  getFeatures: async (projectId: string) => {
    const response = await apiFetch(`/projects/${projectId}/features`);
    return response.json();
  },

  saveFeatures: async (projectId: string, features: any[]) => {
    const response = await apiFetch(`/projects/${projectId}/features`, {
      method: 'POST',
      body: JSON.stringify({ features }),
    });
    return response.json();
  },
};

// Workflows API
export const workflowsApi = {
  startOnboarding: async (input: string) => {
    const response = await apiFetch('/workflows/onboarding', {
      method: 'POST',
      body: input,
    });
    return response.json();
  },

  startModification: async (input: string) => {
    const response = await apiFetch('/workflows/modification', {
      method: 'POST',
      body: input,
    });
    return response.json();
  },

  getStatus: async (executionArn: string) => {
    const response = await apiFetch(`/workflows/status/${executionArn}`);
    return response.json();
  },
};

// Gemini API (if needed directly)
export const geminiApi = {
  generate: async (promptType: number, input: any, context: any = {}) => {
    const response = await apiFetch('/gemini/generate', {
      method: 'POST',
      body: JSON.stringify({ promptType, input, context }),
    });
    return response.json();
  },
};

