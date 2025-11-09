import { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import ConnectGitHub from "@/components/ConnectGithub";
import FeatureMapVisualization from "@/components/FeatureMapVisualization";
import ChatInterface from "@/components/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toaster } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type Feature = {
    featureId: string;
    featureName: string;
    userSummary: string;
    aiSummary: string;
    filenames: string[];
    neighbors: string[];
};

export default function Dashboard() {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string; repoId?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string>("");
    const [projectId, setProjectId] = useState<string>("");

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary grid place-items-center text-primary-foreground font-bold">
                            V
                        </div>
                        <h1 className="text-lg font-semibold tracking-tight">VibeCode Analyzer</h1>
                        <span className="ml-3 hidden sm:inline text-xs rounded-full border px-2 py-0.5 text-muted-foreground">
                            Dashboard
                        </span>
                    </div>
                    <UserMenu />
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-8 space-y-6">
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Welcome</CardTitle>
                            <CardDescription>
                                Select a repository to analyze its features and make AI-powered modifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-1">
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
                                <Card className="h-[600px]">
                                    <CardHeader>
                                        <CardTitle>Feature Map</CardTitle>
                                        <CardDescription>Loading feature map...</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                        <Skeleton className="h-12 w-full" />
                                    </CardContent>
                                </Card>
                            ) : (
                                <FeatureMapVisualization features={features} />
                            )}
                        </section>
                    </>
                )}

                {!selectedRepo && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Get Started</CardTitle>
                            <CardDescription>
                                Select a repository above to view its feature map and start making AI-powered modifications.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </main>

            <Toaster richColors position="top-right" />
        </div>
    );
}
