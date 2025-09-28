import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Wallet } from "lucide-react";

export function EvmWalletVerification() {
  const [walletAddress, setWalletAddress] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const verifyWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await apiRequest("POST", "/api/verify-evm-wallet", {
        walletAddress,
      });
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "EVM Wallet Verified! 🎉",
        description: `Congratulations! You've earned ${response.tokensAwarded} tokens for verifying your EVM wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/token-earnings"] });
      setWalletAddress("");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify EVM wallet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid EVM wallet address.",
        variant: "destructive",
      });
      return;
    }
    verifyWalletMutation.mutate(walletAddress.trim());
  };

  const isAlreadyVerified = (user as any)?.evmWalletVerified;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          EVM Wallet Verification
        </CardTitle>
        <CardDescription>
          Connect your Ethereum/EVM-compatible wallet to earn 10 tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAlreadyVerified ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">EVM wallet already verified!</span>
            {(user as any)?.evmWalletAddress && (
              <span className="text-sm text-muted-foreground ml-2">
                ({(user as any).evmWalletAddress.slice(0, 6)}...{(user as any).evmWalletAddress.slice(-4)})
              </span>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="wallet-address" className="text-sm font-medium">
                Wallet Address
              </Label>
              <Input
                id="wallet-address"
                type="text"
                placeholder="0x1234567890abcdef..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="mt-1"
                data-testid="input-wallet-address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your Ethereum or EVM-compatible wallet address
              </p>
            </div>
            <Button
              type="submit"
              disabled={verifyWalletMutation.isPending}
              className="w-full"
              data-testid="button-verify-wallet"
            >
              {verifyWalletMutation.isPending ? "Verifying..." : "Verify Wallet"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}