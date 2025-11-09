import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function RequireAuth({ children, requireGitHub = false }: { 
    children: JSX.Element;
    requireGitHub?: boolean;
}) {
    const [status, setStatus] = useState<'checking' | 'authed' | 'guest' | 'needsGitHub'>('checking');
    const location = useLocation();

    useEffect(() => {
        async function checkAuth() {
            try {
                // Check if user is authenticated
                await getCurrentUser();
                const userAttrs = await fetchUserAttributes();
                const userId = userAttrs.sub;

                if (!userId) {
                    setStatus('guest');
                    return;
                }

                // If GitHub is required, check if user has GitHub token
                if (requireGitHub) {
                    try {
                        const response = await client.queries.listGithubRepos({ userId });
                        const repoData = JSON.parse(response.data as string);
                        
                        if (repoData.error && repoData.error === 'GitHub not connected') {
                            setStatus('needsGitHub');
                        } else {
                            setStatus('authed');
                        }
                    } catch (e: any) {
                        // If error, assume GitHub is not connected
                        setStatus('needsGitHub');
                    }
                } else {
                    setStatus('authed');
                }
            } catch (error) {
                console.log('User not authenticated:', error);
                setStatus('guest');
            }
        }

        checkAuth();
    }, [requireGitHub]);

    if (status === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (status === 'guest') {
        return <Navigate to="/" replace state={{ from: location.pathname }} />;
    }

    if (status === 'needsGitHub') {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
}
