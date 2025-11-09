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
        featureName: "User Authentication",
        userSummary: "Allows users to sign up, log in, and manage their accounts securely.",
        aiSummary: "Implements JWT-based authentication with refresh tokens, password hashing using bcrypt, and session management with middleware protection.",
        filenames: ["src/auth/login.ts", "src/auth/signup.ts", "src/middleware/auth.ts", "src/utils/jwt.ts"],
        neighbors: ["feature-2", "feature-3", "feature-5"]
    },
    {
        featureId: "feature-2",
        featureName: "User Profile",
        userSummary: "Users can view and edit their profile information including avatar and bio.",
        aiSummary: "RESTful API endpoints for CRUD operations on user profiles, with image upload support via S3 and profile validation.",
        filenames: ["src/profile/profile.controller.ts", "src/profile/profile.service.ts", "src/profile/upload.ts"],
        neighbors: ["feature-1", "feature-4", "feature-6"]
    },
    {
        featureId: "feature-3",
        featureName: "Dashboard Analytics",
        userSummary: "Displays key metrics and statistics about user activity and engagement.",
        aiSummary: "Aggregates data from multiple sources using Redis caching, renders interactive charts with recharts library and real-time data updates.",
        filenames: ["src/analytics/dashboard.tsx", "src/analytics/metrics.service.ts", "src/analytics/charts.tsx"],
        neighbors: ["feature-1", "feature-4", "feature-5"]
    },
    {
        featureId: "feature-4",
        featureName: "Notifications",
        userSummary: "Sends real-time notifications to users about important events.",
        aiSummary: "WebSocket-based notification system with fallback to polling, stores notifications in PostgreSQL with read/unread tracking.",
        filenames: ["src/notifications/notification.service.ts", "src/notifications/websocket.ts", "src/notifications/model.ts"],
        neighbors: ["feature-2", "feature-3", "feature-6"]
    },
    {
        featureId: "feature-5",
        featureName: "API Gateway",
        userSummary: "Central entry point for all API requests with routing and load balancing.",
        aiSummary: "Express-based API gateway with rate limiting, request validation, CORS handling, and routing to microservices.",
        filenames: ["src/gateway/server.ts", "src/gateway/routes.ts", "src/middleware/rate-limit.ts"],
        neighbors: ["feature-1", "feature-3", "feature-6"]
    },
    {
        featureId: "feature-6",
        featureName: "Database Layer",
        userSummary: "Manages all database connections and queries for the application.",
        aiSummary: "PostgreSQL connection pooling with Prisma ORM, includes migrations, seeders, and query optimization with indexing.",
        filenames: ["src/db/client.ts", "src/db/migrations/", "prisma/schema.prisma"],
        neighbors: ["feature-2", "feature-4", "feature-5"]
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

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-24">
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
                <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-purple-600 grid place-items-center text-white font-bold">
                            V
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight text-white">
                            VibeCode Analyzer
                        </h1>
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
                <div className="mx-auto max-w-7xl px-5 py-4">
                    <form
                        className="flex items-center gap-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            // No implementation - just prevent default
                        }}
                    >
                        <Input
                            type="text"
                            placeholder="Chat with Gemini..."
                            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                        />
                        <Button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6"
                        >
                            Send
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
