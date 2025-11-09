import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { githubApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Onboarding page - requires GitHub OAuth connection before accessing dashboard
 * Users cannot proceed until GitHub is connected
 */
export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasGitHubToken, setHasGitHubToken] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);

  useEffect(() => {
    checkGitHubConnection();
  }, [user]);

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
      
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user has GitHub token
      try {
        const status = await githubApi.getStatus();
        if (status.connected) {
          setHasGitHubToken(true);
          toast.success('GitHub already connected!');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          setHasGitHubToken(false);
        }
      } catch (e: any) {
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
      if (!user) {
        toast.error("Please sign in first");
        return;
      }

      setConnecting(true);

      // Get OAuth URL from backend
      const { authUrl } = await githubApi.getOAuthUrl();
      
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
                  disabled={connecting || !user}
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

