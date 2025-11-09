import { useState } from "react";
import ConnectGitHub from "~/components/ConnectGithub";
import FeatureMapVisualization from "~/components/FeatureMapVisualization";
import ChatInterface from "~/components/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import UserMenu from "~/components/UserMenu";

const FEATURES_LIST = [
    {
        featureId: "feature-1",
        featureName: "Authentication & OAuth",
        userSummary:
            "Users can sign up with email/password or sign in using GitHub. Sessions persist across reloads and logouts work reliably.",
        aiSummary:
            "Implements JWT-based auth with HTTP-only refresh tokens, bcrypt password hashing, and GitHub OAuth via the GitHub REST API. Includes middleware for route protection, role-based guards, and token rotation on each refresh.",
        filenames: [
            "server/routes/auth.ts",
            "server/middleware/authenticateToken.ts",
            "server/services/authService.ts",
            "server/services/githubOAuthService.ts",
            "server/utils/jwt.ts",
            "client/app/components/Navbar.tsx",
            "client/app/components/UserMenu.tsx",
            "client/app/routes/login.tsx"
        ],
        neighbors: ["feature-2", "feature-3", "feature-6"]
    },
    {
        featureId: "feature-2",
        featureName: "User Profiles & Settings",
        userSummary:
            "Users can edit their profile (name, avatar, bio), manage notification preferences, and connect or disconnect their GitHub account.",
        aiSummary:
            "Provides RESTful CRUD endpoints for user profiles backed by a PostgreSQL users table. Handles avatar uploads to S3-compatible storage, stores public GitHub metadata, and exposes typed hooks on the React side using React Query for optimistic updates.",
        filenames: [
            "server/routes/profile.ts",
            "server/services/profileService.ts",
            "server/models/User.ts",
            "server/integrations/objectStorage.ts",
            "client/app/sections/Profile.tsx",
            "client/app/components/profile/ProfileForm.tsx",
            "client/app/lib/api/profile.ts"
        ],
        neighbors: ["feature-1", "feature-6"]
    },
    {
        featureId: "feature-3",
        featureName: "Repository Integration & Sync",
        userSummary:
            "After signing in with GitHub, users can see a list of their repositories, select one, and trigger an analysis run for that repo.",
        aiSummary:
            "Uses the GitHub API with per-user access tokens to fetch repositories, supports pagination and filtering by owner/permissions, and stores a cached snapshot of selected repos. The React client uses a debounced search input and a virtualized dropdown to handle large repo lists, with error and rate-limit handling.",
        filenames: [
            "server/routes/github.ts",
            "server/services/githubRepoService.ts",
            "server/models/Repository.ts",
            "server/middleware/rateLimit.ts",
            "client/app/components/ConnectGitHub.tsx",
            "client/app/lib/api/github.ts",
            "client/app/hooks/useGitHubRepos.ts"
        ],
        neighbors: ["feature-1", "feature-4", "feature-5", "feature-6"]
    },
    {
        featureId: "feature-4",
        featureName: "Feature Map & Dashboard Analytics",
        userSummary:
            "Displays a feature map for the selected repository along with metrics like file counts, feature dependencies, and recent analysis runs.",
        aiSummary:
            "Express endpoints aggregate analysis results from a `feature_maps` and `analysis_runs` table, using Prisma with optimized joins and indexes. The React dashboard renders interactive graphs with Recharts, supports drill-down views per feature, and uses WebSocket-based live updates when a new analysis run completes.",
        filenames: [
            "server/routes/analytics.ts",
            "server/services/featureMapService.ts",
            "server/models/FeatureMap.ts",
            "server/integrations/websocketServer.ts",
            "client/app/sections/Dashboard.tsx",
            "client/app/components/FeatureMapVisualization.tsx",
            "client/app/components/Stats/MetricCards.tsx",
            "client/app/lib/api/analytics.ts"
        ],
        neighbors: ["feature-3", "feature-5", "feature-7"]
    },
    {
        featureId: "feature-5",
        featureName: "Background Jobs & Code Analysis Pipeline",
        userSummary:
            "When a repo is selected, the app queues an analysis job that runs in the background and updates the dashboard when finished.",
        aiSummary:
            "Implements a worker process using BullMQ and Redis to run CPU-intensive code analysis outside the main Express process. Jobs consume GitHub repo metadata, clone repositories to a temporary workspace, run static analysis (AST parsing, dependency graph building), and persist normalized results to PostgreSQL. Includes retry/backoff policies and dead-letter queues.",
        filenames: [
            "server/jobs/queue.ts",
            "server/jobs/analyzeRepositoryJob.ts",
            "server/workers/worker.ts",
            "server/config/redis.ts",
            "server/services/analysisPipeline.ts",
            "server/scripts/run-worker.ts"
        ],
        neighbors: ["feature-3", "feature-4", "feature-6", "feature-8"]
    },
    {
        featureId: "feature-6",
        featureName: "Database & Persistence Layer",
        userSummary:
            "Centralized data storage for users, repositories, feature maps, and queued analysis runs.",
        aiSummary:
            "Uses PostgreSQL with Prisma as the ORM. Includes connection pooling, environment-specific configurations, migrations, and seed scripts. Defines models for users, sessions, repositories, feature maps, and analysis runs, with compound indexes to speed up dashboard queries.",
        filenames: [
            "server/db/client.ts",
            "server/db/migrate.ts",
            "server/db/seed.ts",
            "prisma/schema.prisma",
            "prisma/migrations/",
            "server/models/User.ts",
            "server/models/Repository.ts",
            "server/models/AnalysisRun.ts"
        ],
        neighbors: ["feature-1", "feature-2", "feature-3", "feature-5"]
    },
    {
        featureId: "feature-7",
        featureName: "Notifications & Webhooks",
        userSummary:
            "Users get notified when an analysis run finishes and the app can react to GitHub webhook events like new commits or pull requests.",
        aiSummary:
            "Exposes a signed GitHub webhook endpoint that validates HMAC signatures, processes events for push and pull_request, and enqueues analysis jobs when relevant files change. Stores notification records with read/unread flags and pushes real-time updates to the client via a WebSocket channel, with email fallback using a transactional email provider.",
        filenames: [
            "server/routes/webhooks.ts",
            "server/routes/notifications.ts",
            "server/services/webhookService.ts",
            "server/services/notificationService.ts",
            "server/integrations/emailProvider.ts",
            "client/app/components/NotificationBell.tsx",
            "client/app/lib/api/notifications.ts"
        ],
        neighbors: ["feature-4", "feature-8"]
    },
    {
        featureId: "feature-8",
        featureName: "Observability, Config & Error Handling",
        userSummary:
            "Keeps the system stable and debuggable with consistent logging, error pages, and environment-specific configuration.",
        aiSummary:
            "Centralized configuration module for server and client using environment variables with schema validation. Integrates structured logging, request logging middleware, and error-handling middleware that maps internal errors to user-friendly messages. Client-side React components display toast notifications and fallback error boundaries for failed API calls or component crashes.",
        filenames: [
            "server/config/env.ts",
            "server/config/logger.ts",
            "server/middleware/errorHandler.ts",
            "server/middleware/requestLogger.ts",
            "client/app/lib/config.ts",
            "client/app/components/ui/sonner.tsx",
            "client/app/root.tsx"
        ],
        neighbors: ["feature-5", "feature-7"]
    }
];

type Feature = {
    featureId: string;
    featureName: string;
    userSummary: string;
    aiSummary: string;
    filenames: string[];
    neighbors: string[];
};

export default function Dashboard() {
    const [features] = useState<Feature[]>(FEATURES_LIST); // Using static data
    const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string; repoId?: string } | null>({
        owner: "example",
        repo: "react-app"
    });
    const [loading] = useState(false);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<
        { role: "user" | "assistant"; content: string }[]
    >([]);

    const API_BASE_URL = (() => {
        const configured = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
        if (configured) return configured;
        return import.meta.env.DEV ? "http://localhost:3001" : "";
    })();

    const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = chatInput.trim();
        if (!trimmed) return;

        setIsChatOpen(true);

        const userMessage = { role: "user" as const, content: trimmed };
        setChatMessages((prev) => [...prev, userMessage]);
        setChatInput("");

        try {
            const res = await fetch(apiUrl("/api/gemini/dummy"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: trimmed }),
            });

            const data = await res.json();
            console.log("Gemini response data:", data);
            const replyText =
                data?.reply ??
                "Dummy Gemini: I got your message, but the backend did not return a 'reply' field.";

            const assistantMessage = { role: "assistant" as const, content: replyText };
            setChatMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            console.error(err);
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Oops, something went wrong talking to the dummy Gemini endpoint.",
                },
            ]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-24">
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
                <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="app/assets/full_logo.png" alt="VibeEngine" className="h-8 ml-2 mt-1" />
                        <span className="ml-3 hidden sm:inline text-xs rounded-full border border-purple-700 px-2 py-0.5 text-purple-400">
                            Dashboard
                        </span>
                    </div>

                    <UserMenu />
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-8 space-y-6">
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 bg-gray-800/50 border-gray-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-white">Welcome</CardTitle>
                            <CardDescription className="text-gray-400">
                                Select a repository to analyze its features and make AI-powered modifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-400 space-y-1">
                            <p>• Interactive feature map visualization</p>
                            <p>• AI-powered code analysis</p>
                            <p>• Natural language code modifications</p>
                            <p>• Automatic commit tracking</p>
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-2">
                        <ConnectGitHub />
                    </div>
                </section>

                {selectedRepo && (
                    <>
                        <section>
                            {loading && features.length === 0 ? (
                                <Card className="h-[600px] bg-gray-800/50 border-gray-700">
                                    <CardHeader>
                                        <CardTitle className="text-white">Feature Map</CardTitle>
                                        <CardDescription className="text-gray-400">Loading feature map...</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Skeleton className="h-12 w-full bg-gray-700" />
                                        <Skeleton className="h-12 w-full bg-gray-700" />
                                        <Skeleton className="h-12 w-full bg-gray-700" />
                                    </CardContent>
                                </Card>
                            ) : (
                                <FeatureMapVisualization features={features} />
                            )}
                        </section>
                    </>
                )}

                {!selectedRepo && (
                    <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white">Get Started</CardTitle>
                            <CardDescription className="text-gray-400">
                                Select a repository above to view its feature map and start making AI-powered modifications.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </main>

            {/* Fixed Chat Interface at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur border-t border-gray-800">
                <div
                    className={`
      mx-auto max-w-7xl px-5
      transition-all duration-300 ease-out
      ${isChatOpen ? "py-4 h-80" : "py-3 h-24"}
    `}
                >
                    <div className="flex flex-col h-full">
                        {/* Expanded Header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                </span>
                            </div>

                            {/* Collapsed Header (open button) */}
                            {!isChatOpen && (
                                <div className="flex flex-col items-center justify-center text-center cursor-pointer"
                                    onClick={() => setIsChatOpen(true)}>
                                    <span className="text-xs text-purple-300 inline-flex items-center justify-center font-medium hover:text-purple-200">
                                        Open Chat
                                    </span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsChatOpen(false)}
                                className="text-gray-400 hover:text-gray-200 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Chat messages area */}
                        {isChatOpen && (
                            <div className="flex-1 mb-3 overflow-y-auto rounded-md border border-gray-800 bg-gray-900/90 p-3 space-y-2 text-sm">
                                {chatMessages.length === 0 && (
                                    <p className="text-gray-500 text-xs">
                                        Ask something and Gemini will assist you.
                                    </p>
                                )}

                                {chatMessages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-lg px-3 py-2 text-xs ${msg.role === "user"
                                                ? "bg-purple-600 text-white"
                                                : "bg-gray-800 text-gray-100"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input row (always visible) */}
                        <form className="flex items-center gap-3" onSubmit={handleChatSubmit}>
                            <Input
                                type="text"
                                placeholder="Chat with Gemini..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                            />
                            <Button
                                type="submit"
                                disabled={!chatInput.trim()}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Send
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
