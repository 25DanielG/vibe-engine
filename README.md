# AIATL - Migrated to Express + MongoDB

This is the migrated version of the AIATL application from AWS Amplify (DynamoDB) to Express.js + MongoDB.

## Architecture

- **Backend**: Express.js REST API with MongoDB
- **Frontend**: React with Vite
- **Authentication**: JWT-based authentication
- **Database**: MongoDB with Mongoose

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- GitHub OAuth App credentials
- Google Gemini API key

### Backend Setup

1. Navigate to the server directory:
```bash
cd react-copy/server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/aiatl
JWT_SECRET=your-secret-key-change-in-production
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback
GEMINI_KEY=your_gemini_api_key
```

5. Start MongoDB (if running locally):
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or use MongoDB Atlas (cloud)
```

6. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory (from project root):
```bash
cd react-copy
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### GitHub
- `GET /api/github/oauth/url` - Get GitHub OAuth URL
- `POST /api/github/oauth/callback` - Handle OAuth callback
- `GET /api/github/status` - Check GitHub connection status
- `GET /api/github/repos` - List user repositories
- `GET /api/github/repos/:owner/:repo/files` - Get repository files
- `GET /api/github/repos/:owner/:repo/content` - Get file content
- `POST /api/github/repos/connect` - Connect repository

### Gemini AI
- `POST /api/gemini/generate` - Generate content with Gemini AI

### Projects
- `GET /api/projects` - List user projects
- `GET /api/projects/:projectId` - Get project details
- `GET /api/projects/:projectId/features` - Get project features
- `POST /api/projects/:projectId/features` - Create/update features

### Workflows
- `POST /api/workflows/onboarding` - Start onboarding workflow
- `POST /api/workflows/modification` - Start modification workflow
- `GET /api/workflows/status/:executionArn` - Get workflow status

## Migration Notes

### Key Changes from AWS Amplify

1. **Authentication**: 
   - Before: AWS Cognito
   - After: JWT tokens with bcrypt password hashing

2. **Database**:
   - Before: DynamoDB with GraphQL
   - After: MongoDB with Mongoose

3. **API**:
   - Before: GraphQL queries/mutations
   - After: REST API endpoints

4. **Frontend**:
   - Before: `aws-amplify` SDK, `generateClient`
   - After: Custom API client (`src/lib/api.ts`)

5. **State Management**:
   - Before: Amplify Auth hooks
   - After: React Context (`AuthContext`)

### Data Migration

User IDs are now MongoDB ObjectIds instead of Cognito sub IDs. You'll need to:
1. Export data from DynamoDB
2. Transform user IDs
3. Import into MongoDB

## Development

### Backend
```bash
cd server
npm run dev    # Development with hot reload
npm run build  # Build for production
npm start      # Run production build
```

### Frontend
```bash
npm run dev    # Development server
npm run build  # Build for production
npm preview    # Preview production build
```

## Project Structure

```
react-copy/
├── server/              # Express backend
│   ├── src/
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth middleware
│   │   └── index.ts     # Server entry point
│   └── package.json
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities and API client
│   └── main.tsx         # App entry point
└── README.md
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network access if using MongoDB Atlas

### GitHub OAuth Issues
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Check `GITHUB_REDIRECT_URI` matches GitHub app settings
- Ensure redirect URI is whitelisted in GitHub OAuth app

### CORS Issues
- Verify `FRONTEND_URL` in server `.env` matches frontend URL
- Check CORS configuration in `server/src/index.ts`

## License

Same as original project.

