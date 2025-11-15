import dotenv from "dotenv";
dotenv.config();

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
export const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI ?? "http://localhost:3001/auth/github/callback";