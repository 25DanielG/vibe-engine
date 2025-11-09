# Migration Plan: AWS Amplify → Express + MongoDB

## STEP 1: CURRENT PROJECT ANALYSIS

### Data Entities

1. **User**
   - `id`: string (Cognito user ID/sub)
   - `githubToken`: string (optional, GitHub OAuth token)
   - `projects`: hasMany relationship to Project

2. **Project**
   - `id`: string
   - `userId`: string (foreign key to User)
   - `repoId`: string (GitHub repository identifier, e.g., "owner/repo")
   - `features`: hasMany relationship to Feature

3. **Feature**
   - `id`: string
   - `projectId`: string (foreign key to Project)
   - `featureName`: string
   - `userSummary`: string
   - `aiSummary`: string
   - `filenames`: string[] (array of file paths)
   - `neighbors`: string[] (array of feature IDs)

### Current Operations

**GraphQL Queries:**
- `listGithubRepos(userId)` - List user's GitHub repositories
- `getRepoFiles(owner, repo, userId)` - Get all files in a repository
- `getGithubOAuthUrl(userId)` - Get GitHub OAuth authorization URL
- `agenticWorkflow(input, workflowType)` - Start AI workflow (onboarding/modification)
- `getWorkflowStatus(executionArn)` - Check workflow execution status

**GraphQL Mutations:**
- `connectGithub(code, userId, state)` - Connect GitHub account via OAuth callback
- `createWebhook(owner, repo, userId)` - Create GitHub webhook

**Model Operations:**
- `User.get({ id })` - Get user by ID
- `User.create({ id, githubToken })` - Create user
- `User.update({ id, githubToken })` - Update user
- `Project.list({ filter })` - List projects with filters
- `Project.create({ userId, repoId })` - Create project
- `Feature.list({ filter })` - List features with filters

**Lambda Functions:**
- `gemini` - AI content generation (4 prompt types)
- `github` - Get GitHub file content
- `github-oauth` - Handle GitHub OAuth flow
- `github-repos` - List GitHub repositories
- `github-files` - Get repository file list
- `github-webhook` - Create GitHub webhooks
- `stepfunction` - Orchestrate workflows
- `workflow-status` - Check workflow status
- `feature-map-db` - Save feature maps to database

### Current Auth Flow

1. **Registration/Login:**
   - User signs up with email/password via `signUp()`
   - Email confirmation via `confirmSignUp()`
   - Auto sign-in after confirmation
   - User ID is Cognito `sub` attribute

2. **GitHub Connection:**
   - After login, user redirected to `/onboarding`
   - User clicks "Connect GitHub" → redirects to GitHub OAuth
   - GitHub redirects to `/auth/callback` with code
   - Backend exchanges code for token, stores in User model

3. **Protected Routes:**
   - `RequireAuth` component checks `getCurrentUser()`
   - If `requireGitHub=true`, also checks if user has `githubToken`
   - Redirects to `/onboarding` if GitHub not connected
   - Redirects to `/` if not authenticated

---

## STEP 2: NEW ARCHITECTURE DESIGN

### Backend Structure (Express + MongoDB)

```
server/
├── index.ts                 # Entry point
├── models/
│   ├── User.ts              # Mongoose User model
│   ├── Project.ts           # Mongoose Project model
│   └── Feature.ts           # Mongoose Feature model
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── github.ts            # GitHub OAuth & repo operations
│   ├── projects.ts          # Project CRUD
│   ├── features.ts          # Feature CRUD
│   ├── workflows.ts         # Workflow orchestration
│   └── gemini.ts            # Gemini AI integration
├── middleware/
│   └── auth.ts              # JWT authentication middleware
└── utils/
    └── prompts.ts           # Prompt file loading
```

### REST API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout (client-side token removal)

**GitHub:**
- `GET /api/github/oauth/url` - Get GitHub OAuth URL
- `POST /api/github/oauth/callback` - Handle OAuth callback
- `GET /api/github/status` - Check GitHub connection status
- `GET /api/github/repos` - List user repositories
- `GET /api/github/repos/:owner/:repo/files` - Get repository files
- `GET /api/github/repos/:owner/:repo/content` - Get file content
- `POST /api/github/webhook` - Create GitHub webhook

**Projects:**
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

**Features:**
- `GET /api/projects/:projectId/features` - List features for project
- `POST /api/projects/:projectId/features` - Create features (bulk)
- `PUT /api/projects/:projectId/features/:featureId` - Update feature
- `DELETE /api/projects/:projectId/features/:featureId` - Delete feature

**Workflows:**
- `POST /api/workflows/onboarding` - Start onboarding workflow
- `POST /api/workflows/modification` - Start modification workflow
- `GET /api/workflows/status/:executionArn` - Get workflow status

**Gemini:**
- `POST /api/gemini/generate` - Generate AI content

### MongoDB Schemas

**User:**
```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  password: string (hashed),
  githubToken?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Project:**
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  repoId: string (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Feature:**
```typescript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Project, indexed),
  featureName: string,
  userSummary: string,
  aiSummary: string,
  filenames: string[],
  neighbors: ObjectId[] (ref: Feature),
  createdAt: Date,
  updatedAt: Date
}
```

### Frontend Changes

**API Client:**
- Create `src/lib/api.ts` with REST API functions
- Replace all `generateClient<Schema>()` calls
- Replace all `client.models.*` calls
- Replace all `client.queries.*` calls
- Replace all `client.mutations.*` calls

**Authentication:**
- Create `src/contexts/AuthContext.tsx` for auth state
- Replace `getCurrentUser()`, `fetchUserAttributes()` with API calls
- Replace `signIn()`, `signUp()`, `signOut()` with API calls
- Store JWT token in localStorage
- Add token to all API requests via Authorization header

**Components to Update:**
- `RequireAuth.tsx` - Use new auth context
- `LoginForm.tsx` - Use new auth API
- `UserMenu.tsx` - Use new auth context
- `Onboarding.tsx` - Use new GitHub API
- `GithubCallback.tsx` - Use new OAuth API
- `ConnectGithub.tsx` - Use new GitHub API
- `Dashboard.tsx` - Use new Projects/Features API
- `ChatInterface.tsx` - Use new Workflows API
- `useAgenticWorkflow.ts` - Use new Workflows API

---

## STEP 3: IMPLEMENTATION

Starting implementation now...

