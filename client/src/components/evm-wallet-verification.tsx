import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Wallet, Loader2, ExternalLink } from "lucide-react";
import { parseApiError } from "@/lib/errors";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

export function EvmWalletVerification() {
  const [step, setStep] = useState<"idle" | "signing" | "done">("idle");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ["/api/auth/user"] });
  const isAlreadyVerified = (user as any)?.evmWalletVerified;
  const verifiedAddress = (user as any)?.evmWalletAddress;

  const connectAndSignMutation = useMutation({
    mutationFn: async () => {
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask extension.");
      }

      setStep("signing");

      // 1. Request accounts
      const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts.length) throw new Error("No accounts found in MetaMask.");
      const address = accounts[0];

      // 2. Get nonce from server
      const nonceRes = await fetch("/api/verify-evm-wallet/nonce", { credentials: "include" });
      if (!nonceRes.ok) {
        const err = await nonceRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get nonce");
      }
      const { message } = await nonceRes.json();

      // 3. Sign message
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      // 4. Submit to server
      const verifyRes = await fetch("/api/verify-evm-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address, signature }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}));
        throw new Error(err.error || "Verification failed");
      }
      return verifyRes.json();
    },
    onSuccess: (data) => {
      setStep("done");
      toast({
        title: "Wallet Verified! 🎉",
        description: `You've earned ${data.tokensAwarded} tokens for verifying your EVM wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/token-earnings"] });
    },
    onError: (error: any) => {
      setStep("idle");
      toast({
        title: "Verification Failed",
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          EVM Wallet Verification
        </CardTitle>
        <CardDescription>
          Connect your MetaMask wallet and sign a message to earn 10 tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAlreadyVerified ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Wallet verified!</span>
            {verifiedAddress && (
              <span className="text-sm text-muted-foreground ml-2">
                {verifiedAddress.slice(0, 6)}...{verifiedAddress.slice(-4)}
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!window.ethereum && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                MetaMask not detected.{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  Install MetaMask <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click the button below</li>
              <li>Approve the account connection in MetaMask</li>
              <li>Sign the verification message</li>
            </ol>
            <Button
              onClick={() => connectAndSignMutation.mutate()}
              disabled={connectAndSignMutation.isPending || !window.ethereum}
              className="w-full"
              data-testid="button-connect-metamask"
            >
              {connectAndSignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {step === "signing" ? "Waiting for signature…" : "Connecting…"}
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect & Verify with MetaMask
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
