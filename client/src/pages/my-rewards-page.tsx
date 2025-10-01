import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { UserPurchase, Reward } from "@shared/schema";

interface PurchaseWithReward extends UserPurchase {
  reward: Reward;
}

export default function MyRewardsPage() {
  const { user } = useAuth();

  const { data: purchases, isLoading } = useQuery<PurchaseWithReward[]>({
    queryKey: ["/api/user/purchases"],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <img src="/logo.jpg" alt="VirtusGreen" className="h-20 w-auto" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-8">Loading your rewards...</div>
        ) : purchases && purchases.length > 0 ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-green-600" data-testid="text-total-purchased-rewards">
                {purchases.length}
              </div>
              <div className="text-sm text-gray-600">Total Rewards Purchased</div>
            </div>

            <div className="grid gap-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id} data-testid={`card-purchased-reward-${purchase.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-green-600" />
                        {purchase.reward.name}
                      </CardTitle>
                      <Badge variant="secondary" data-testid={`badge-token-cost-${purchase.id}`}>
                        {purchase.reward.tokenCost} tokens
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-600">{purchase.reward.description}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`text-purchase-date-${purchase.id}`}>
                          Purchased on {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="pt-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ✓ Purchased
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-4">
              <Gift className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Rewards Yet</h2>
            <p className="text-gray-500 mb-6">
              You haven't purchased any rewards yet. Start exploring available rewards!
            </p>
            <Link href="/rewards">
              <Button data-testid="button-browse-rewards">
                Browse Rewards
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}