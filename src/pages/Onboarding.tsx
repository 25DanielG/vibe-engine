import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>();

/**
 * Onboarding page - requires GitHub OAuth connection before accessing dashboard
 * Users cannot proceed until GitHub is connected
 */
export default function Onboarding() {
    const navigate = useNavigate();
    const [userId, setUserId] = useState<string>('');
    const [hasGitHubToken, setHasGitHubToken] = useState<boolean>(false);
    const [checking, setChecking] = useState<boolean>(true);
    const [connecting, setConnecting] = useState<boolean>(false);

    useEffect(() => {
        checkGitHubConnection();
    }, []);

    // Refresh when coming back from OAuth callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('githubConnected') === 'true') {
            window.history.replaceState({}, '', window.location.pathname);
            checkGitHubConnection();
        }
    }, []);

    async function checkGitHubConnection() {
        try {
            setChecking(true);
            const userAttrs = await fetchUserAttributes();
            const uid = userAttrs.sub || '';
            setUserId(uid);

            if (!uid) {
                navigate('/');
                return;
            }

            // Check if user has GitHub token by trying to list repos
            try {
                const response = await client.queries.listGithubRepos({ userId: uid });
                const repoData = JSON.parse(response.data as string);

                if (repoData.error && repoData.error === 'GitHub not connected') {
                    setHasGitHubToken(false);
                } else {
                    setHasGitHubToken(true);
                    // If GitHub is connected, redirect to dashboard after a moment
                    toast.success('GitHub already connected!');
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);
                }
            } catch (e: any) {
                // If error, assume GitHub is not connected
                setHasGitHubToken(false);
            }
        } catch (error) {
            console.error('Error checking GitHub connection:', error);
            navigate('/');
        } finally {
            setChecking(false);
        }
    }

    async function connectGitHub() {
        try {
            if (!userId) {
                toast.error("Please sign in first");
                return;
            }

            setConnecting(true);

            const clientId = "Iv23liOmjcrnk8e1z4Nf";
            const redirectUri = "http://localhost:5173/auth/callback";

            if (!clientId || !redirectUri) {
                throw new Error("GitHub OAuth is not configured (missing client ID or redirect URI).");
            }

            // Build state so backend can validate and associate with user
            const statePayload = {
                userId,
                // you can add anything else you want here (e.g. nonce)
            };

            const state = encodeURIComponent(btoa(JSON.stringify(statePayload)));

            const params = new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: "repo user", // or whatever scopes you need
                state,
                // optionally: allow_signup: "false",
            });

            const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

            console.log("Redirecting to GitHub:", authUrl);
            window.location.assign(authUrl);
        } catch (e: any) {
            console.error("connectGitHub error:", e);
            setConnecting(false);
            toast.error("Failed to initiate GitHub connection", {
                description: e?.message ?? "Please check your GitHub OAuth configuration.",
            });
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-4">
                            Checking GitHub connection...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to VibeCode Analyzer</CardTitle>
                    <CardDescription className="text-base">
                        Connect your GitHub account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {hasGitHubToken ? (
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500" />
                            </div>
                            <p className="text-lg font-medium">GitHub Connected!</p>
                            <p className="text-sm text-muted-foreground">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold">Why connect GitHub?</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                                        <li>Access your repositories for analysis</li>
                                        <li>Generate feature maps of your codebase</li>
                                        <li>Make AI-powered code modifications</li>
                                        <li>Track changes automatically with webhooks</li>
                                    </ul>
                                </div>

                                <div className="space-y-2 p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-medium">What we'll access:</p>
                                    <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                                        <li>Repository read access (to analyze your code)</li>
                                        <li>Repository write access (to commit changes)</li>
                                        <li>Webhook management (to track repository updates)</li>
                                    </ul>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        We only request the minimum permissions needed to analyze and modify your code.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={connectGitHub}
                                    disabled={connecting || !userId}
                                    className="w-full gap-2 h-12 text-base"
                                    size="lg"
                                >
                                    {connecting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Github className="h-5 w-5" />
                                            Connect GitHub Account
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    You'll be redirected to GitHub to authorize access.
                                    After authorization, you'll be brought back to complete setup.
                                </p>
                            </div>

                            <div className="pt-4 border-t">
                                <p className="text-xs text-center text-muted-foreground">
                                    <strong>Note:</strong> You must connect your GitHub account to proceed.
                                    This step cannot be skipped.
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

