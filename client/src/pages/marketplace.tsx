import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TokenDisplay from "@/components/token-display";
import { Reward } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Coins } from "lucide-react";

export default function RewardsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  const purchaseRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      return await apiRequest("POST", `/api/rewards/${rewardId}/purchase`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({
        title: "Success!",
        description: "Reward redeemed successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem reward",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-green-600">Rewards</h1>
            </div>
            <div className="flex items-center">
              <TokenDisplay />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Available Tokens and My Rewards Display */}
        <div className="mb-8 text-center">
          <div className="flex justify-center gap-4">
            <div className="inline-flex items-center gap-2 bg-white rounded-lg px-6 py-4 shadow-sm border">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-700">Your available tokens:</span>
              <span className="text-2xl font-bold text-green-600" data-testid="text-available-tokens">
                {user?.tokens || 0}
              </span>
            </div>
            <Link href="/my-rewards">
              <div className="inline-flex items-center gap-2 bg-white rounded-lg px-6 py-4 shadow-sm border hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-lg font-semibold text-gray-700">My Rewards</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center">Loading rewards...</div>
          ) : (
            rewards?.map((reward) => (
              <Card key={reward.id} data-testid={`card-reward-${reward.id}`}>
                <CardHeader>
                  <CardTitle>{reward.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{reward.description}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-600" data-testid={`text-token-cost-${reward.id}`}>
                        {reward.tokenCost} tokens
                      </span>
                      <Badge variant="outline" data-testid={`text-remaining-${reward.id}`}>
                        {reward.remainingQuantity || 0} left
                      </Badge>
                    </div>
                    <Button
                      onClick={() => purchaseRewardMutation.mutate(reward.id)}
                      disabled={
                        !reward.available || 
                        (user?.tokens || 0) < reward.tokenCost ||
                        (reward.remainingQuantity || 0) <= 0 ||
                        purchaseRewardMutation.isPending
                      }
                      className="w-full"
                      data-testid={`button-redeem-${reward.id}`}
                    >
                      {purchaseRewardMutation.isPending ? (
                        "Redeeming..."
                      ) : (user?.tokens || 0) < reward.tokenCost ? (
                        "Insufficient tokens"
                      ) : (reward.remainingQuantity || 0) <= 0 ? (
                        "Out of stock"
                      ) : (
                        "Redeem"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
