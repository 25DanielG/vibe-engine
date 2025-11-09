import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { RotateCcw, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useAgenticWorkflow } from "@/hooks/useAgenticWorkflow";

type Repo = {
    id: number;
    full_name: string;
    private: boolean;
    description: string;
    language: string;
};

export default function ConnectGitHub({ onRepoSelected }: { onRepoSelected?: (owner: string, repo: string) => void }) {
    const [phase, setPhase] = useState<"idle" | "loading" | "connected" | "error">("idle");
    const [repos, setRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const { startWorkflow } = useAgenticWorkflow();

    const connected = phase === "connected";
    const busy = phase === "loading";

    return (
        <Card className="border-muted">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>GitHub Integration</CardTitle>
                    <CardDescription>Connect and select a repository to analyze.</CardDescription>
                </div>
                <Badge variant={connected ? "default" : "secondary"}>
                    {connected ? "Ready" : "Not configured"}
                </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
                {repos.length === 0 ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {busy
                                ? "Loading your repositories..."
                                : "You don't have any repositories, or we couldn't load them."}
                        </p>
                        {busy && <Skeleton className="h-9 w-full" />}
                    </>
                ) : (
                    <>
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <div className="grid gap-2">
                                <Label htmlFor="repo">Repository</Label>
                                {busy ? (
                                    <Skeleton className="h-9 w-full" />
                                ) : (
                                    <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                                        <SelectTrigger id="repo" className="w-full">
                                            <SelectValue placeholder="Choose a repository" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {repos.map((r) => (
                                                <SelectItem key={r.id} value={r.full_name}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{r.full_name}</span>
                                                        {r.private && <Badge variant="outline" className="text-xs">Private</Badge>}
                                                        {r.language && <Badge variant="secondary" className="text-xs">{r.language}</Badge>}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="flex items-end gap-2">
                                <Button variant="outline" size="sm" disabled={busy}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Refresh
                                </Button>
                                <Button size="sm" disabled={!selectedRepo || busy} className="gap-2">
                                    <Rocket className="h-4 w-4" />
                                    Analyze
                                </Button>
                            </div>
                        </div>

                        <Separator />
                        <p className="text-xs text-muted-foreground">
                            We'll analyze your repository to create a feature map and set up webhooks to track changes automatically.
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
