import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import { Amplify } from "aws-amplify";
import outputs from "../../amplify_outputs.json";

Amplify.configure(outputs);

const client = generateClient<Schema>();

/**
 * OAuth Callback page for GitHub repository authorization
 * This handles the callback from GitHub OAuth flow for repository access
 */
export default function GithubCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Processing GitHub authorization...');

    useEffect(() => {
        handleCallback();
    }, []);

    async function handleCallback() {
        try {
            // Get OAuth code and state from URL
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');

            if (error) {
                throw new Error(`GitHub authorization error: ${error}`);
            }

            if (!code) {
                throw new Error('No authorization code received from GitHub');
            }

            // Get current user
            const userAttrs = await fetchUserAttributes();
            const userId = userAttrs.sub;

            if (!userId) {
                throw new Error('User not authenticated');
            }

            let expectedUserId = userId;

            if (state) {
                try {
                    const decoded = JSON.parse(atob(decodeURIComponent(state)));
                    if (decoded?.userId) {
                        expectedUserId = decoded.userId;
                    }
                } catch (e) {
                    console.warn("Failed to decode state; falling back to Cognito userId", e);
                }
            }


            // Connect GitHub account with the authorization code
            setMessage('Connecting your GitHub account...');

            const response = await client.mutations.connectGithub({
                code,
                userId: expectedUserId,
                state: state || ''
            });

            // If the call failed, there may be no data
            if (!response.data) {
                console.error("connectGithub response with no data:", response);
                throw new Error("Failed to connect GitHub (no data returned from API).");
            }

            let result: any;
            try {
                result = typeof response.data === "string"
                    ? JSON.parse(response.data as string)
                    : response.data;
            } catch {
                console.error("Failed to parse connectGithub response:", response.data);
                throw new Error("Unexpected response format from connectGithub.");
            }

            if (result?.error) {
                throw new Error(result.error);
            }

            setStatus('success');
            setMessage('GitHub account connected successfully!');
            toast.success('GitHub connected', {
                description: 'You can now access your repositories'
            });

            // Redirect to onboarding with success parameter to trigger refresh
            // Onboarding will then redirect to dashboard if GitHub is connected
            setTimeout(() => {
                navigate('/onboarding?githubConnected=true');
            }, 2000);
        } catch (err: any) {
            console.error('OAuth callback error:', err);
            setStatus('error');
            setMessage(err.message || 'Failed to connect GitHub account');
            toast.error('Connection failed', {
                description: err.message || 'Please try again'
            });

            // Redirect to dashboard after error
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>GitHub Authorization</CardTitle>
                    <CardDescription>Processing your GitHub authorization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'processing' && (
                        <>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-600">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <p className="font-medium">Success!</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{message}</p>
                            <p className="text-xs text-muted-foreground">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-600">
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                                <p className="font-medium">Error</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{message}</p>
                            <p className="text-xs text-muted-foreground">
                                Redirecting to dashboard...
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

