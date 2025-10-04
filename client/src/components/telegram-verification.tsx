import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, MessageCircle } from "lucide-react";
import { parseApiError } from "@/lib/errors";

export function TelegramVerification() {
  const [telegramUsername, setTelegramUsername] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const verifyTelegramMutation = useMutation({
    mutationFn: async (telegramUsername: string) => {
      const response = await apiRequest("POST", "/api/verify-telegram", {
        telegramUsername,
      });
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Telegram Verified! 🎉",
        description: `Congratulations! You've earned ${response.tokensAwarded} tokens for verifying your Telegram account.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/token-earnings"] });
      setTelegramUsername("");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramUsername.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid Telegram username.",
        variant: "destructive",
      });
      return;
    }
    verifyTelegramMutation.mutate(telegramUsername.trim());
  };

  const isAlreadyVerified = (user as any)?.telegramVerified;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Telegram Verification
        </CardTitle>
        <CardDescription>
          Connect your Telegram account to earn 10 tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAlreadyVerified ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Telegram already verified!</span>
            {(user as any)?.telegramUsername && (
              <span className="text-sm text-muted-foreground ml-2">
                (@{(user as any).telegramUsername})
              </span>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="telegram-username" className="text-sm font-medium">
                Telegram Username
              </Label>
              <Input
                id="telegram-username"
                type="text"
                placeholder="your_username"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                className="mt-1"
                data-testid="input-telegram-username"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your Telegram username (without the @ symbol)
              </p>
            </div>
            <Button
              type="submit"
              disabled={verifyTelegramMutation.isPending}
              className="w-full"
              data-testid="button-verify-telegram"
            >
              {verifyTelegramMutation.isPending ? "Verifying..." : "Verify Telegram"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}