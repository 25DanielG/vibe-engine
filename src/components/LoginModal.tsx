'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import LoginForm from './LoginForm';

export default function LoginModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) onClose();
            }}
        >
            <DialogContent className="bg-gray-900 border border-gray-700 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">
                        Sign In
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Sign in with your email and password. After signing in, you'll be
                        asked to connect your GitHub account.
                    </DialogDescription>
                </DialogHeader>

                <LoginForm onSignedIn={onClose} />
            </DialogContent>
        </Dialog>
    );
}
