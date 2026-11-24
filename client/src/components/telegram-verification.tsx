import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, MessageCircle, Copy, RefreshCw, Loader2 } from "lucide-react";
import { parseApiError } from "@/lib/errors";

export function TelegramVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>("VirtusGreenBot");

  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });
  const isAlreadyVerified = (user as any)?.telegramVerified;
  const verifiedHandle = (user as any)?.telegramUsername;

  const initiateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get verification code");
      }
      return res.json() as Promise<{ code: string; botUsername: string; message: string }>;
    },
    onSuccess: (data) => {
      setPendingCode(data.code);
      setBotUsername(data.botUsername);
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  // Polling: check if the webhook verified the user yet
  const checkStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.telegramVerified) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/token-earnings"] });
        setPendingCode(null);
        toast({
          title: "Telegram Verified! 🎉",
          description: "You've earned 10 tokens for verifying your Telegram account.",
        });
      } else {
        toast({
          title: "Not verified yet",
          description: "Make sure you sent the command to the bot and try again.",
          variant: "destructive",
        });
      }
    },
  });

  const copyCode = () => {
    if (!pendingCode) return;
    navigator.clipboard.writeText(`/verify ${pendingCode}`).then(() => {
      toast({ title: "Copied!", description: `Command copied to clipboard.` });
    }).catch(() => {
      toast({ title: "Copy failed", description: `Send: /verify ${pendingCode}` });
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Telegram Verification
        </CardTitle>
        <CardDescription>
          Verify your Telegram account to earn 10 tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAlreadyVerified ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Telegram verified!</span>
            {verifiedHandle && (
              <span className="text-sm text-muted-foreground ml-2">(@{verifiedHandle})</span>
            )}
          </div>
        ) : !pendingCode ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Click below to get a one-time code, then send it to our Telegram bot to prove ownership.
            </p>
            <Button
              onClick={() => initiateMutation.mutate()}
              disabled={initiateMutation.isPending}
              className="w-full"
              data-testid="button-get-telegram-code"
            >
              {initiateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Getting code…</>
              ) : (
                <><MessageCircle className="h-4 w-4 mr-2" /> Get Verification Code</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 space-y-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                1. Open Telegram and start a chat with{" "}
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  @{botUsername}
                </a>
              </p>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                2. Send this command to the bot:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-lg font-bold text-blue-900 dark:text-blue-100 bg-white dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded px-3 py-2">
                  /verify {pendingCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode} title="Copy command">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Code expires in 15 minutes.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => checkStatusMutation.mutate()}
                disabled={checkStatusMutation.isPending}
                data-testid="button-check-telegram-status"
              >
                {checkStatusMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking…</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> I've sent it — Check status</>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => initiateMutation.mutate()}
                disabled={initiateMutation.isPending}
                title="Get a new code"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
