import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { githubApi } from '@/lib/api';

export default function RequireAuth({ 
  children, 
  requireGitHub = false 
}: { 
  children: JSX.Element;
  requireGitHub?: boolean;
}) {
  const { user, loading } = useAuth();
  const [hasGitHub, setHasGitHub] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (user && requireGitHub) {
      githubApi.getStatus()
        .then((status) => {
          setHasGitHub(status.connected);
        })
        .catch(() => {
          setHasGitHub(false);
        });
    } else if (user) {
      setHasGitHub(true); // Not required, so pass through
    }
  }, [user, requireGitHub]);

  if (loading || (requireGitHub && hasGitHub === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (requireGitHub && !hasGitHub) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

