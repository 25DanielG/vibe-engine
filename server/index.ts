import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { FRONTEND_URL } from './env.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import geminiRoutes from './routes/gemini.js';

// console.log('GITHUB_CLIENT_ID from env:', process.env.GITHUB_CLIENT_ID);
// console.log('GITHUB_REDIRECT_URI from env:', process.env.GITHUB_REDIRECT_URI);

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiatl';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/gemini', geminiRoutes);

//app.use('/api/workflows', workflowsRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Frontend URL: ${FRONTEND_URL}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;

