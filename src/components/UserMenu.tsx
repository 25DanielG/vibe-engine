import { useEffect, useState } from "react";
import { signOut, fetchUserAttributes } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserMenu() {
    const [email, setEmail] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const attrs = await fetchUserAttributes();
                setEmail(attrs.email ?? "");
            } catch {
                setEmail("");
            }
        })();
    }, []);

    async function handleSignOut() {
        try {
            await signOut();
        } finally {
            navigate("/");
        }
    }

    const initials = email ? email[0].toUpperCase() : "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
                >
                    <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm">{email || "User"}</span>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="space-y-1">
                    <div className="text-xs text-muted-foreground">Signed in as</div>
                    <div className="truncate">{email || "—"}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}