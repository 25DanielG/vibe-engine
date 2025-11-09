'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type NavItem = { name: string; href: string };

export default function Navigation({
    navigation,
    onOpenLogin,
}: {
    navigation: NavItem[];
    onOpenLogin: () => void;
}) {
    const [username, setUsername] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        /* async function checkAuth() {
            try {
                await getCurrentUser();
                const attributes = await fetchUserAttributes();
                setUsername(attributes.preferred_username || attributes.email || 'User');
            } catch {
                setUsername(null);
            } finally {
                setChecking(false);
            }
        } */

        checkAuth();
    }, []);

    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <a href="#" className="-m-1.5 p-1.5">
                        <span className="sr-only">Your Company</span>
                        <img
                            alt=""
                            src="/assets/full_logo.png"
                            className="h-8 w-auto"
                        />
                    </a>
                </div>

                <div className="hidden lg:flex lg:gap-x-12">
                    {navigation.map((item) => (
                        <a key={item.name} href={item.href} className="text-sm/6 font-semibold text-white">
                            {item.name}
                        </a>
                    ))}
                </div>

                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    {checking ? (
                        <span className="text-sm/6 font-semibold text-white/70">…</span>
                    ) : username ? (
                        <div className="flex items-center gap-4">
                            <Button asChild variant="secondary" className="text-sm font-semibold">
                                <Link to="/dashboard">Dashboard</Link>
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            className="text-sm font-semibold text-white hover:bg-white/10 hover:text-white"
                            onClick={onOpenLogin}
                            type="button"
                        >
                            Sign In
                        </Button>
                    )}
                </div>
            </nav>
        </header>
    );
}
