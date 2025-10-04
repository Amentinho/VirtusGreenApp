import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenDisplay from "@/components/token-display";
import { Reward, Character } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Coins, User, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { parseApiError } from "@/lib/errors";
import ProfileDropdown from "@/components/profile-dropdown";
import MobileNav from "@/components/mobile-nav";

export default function RewardsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  const { data: characters, isLoading: isLoadingCharacters } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const { data: ownedCharacters } = useQuery<Character[]>({
    queryKey: ["/api/users/characters"],
    enabled: !!user,
  });

  const purchaseRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      return await apiRequest("POST", `/api/rewards/${rewardId}/purchase`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({
        title: t('common.success'),
        description: t('rewards.redeemSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  const purchaseCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      return await apiRequest("POST", `/api/characters/${characterId}/purchase`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/characters"] });
      toast({
        title: t('rewards.characterPurchased'),
        description: t('rewards.characterUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            <div className="flex items-center gap-2 md:gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <img src="/logo.jpg" alt="VirtusGreen" className="h-14 md:h-20 w-auto" />
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <TokenDisplay />
              <ProfileDropdown />
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Available Tokens and My Rewards Display */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <div className="inline-flex items-center gap-2 bg-white rounded-lg px-6 py-4 shadow-sm border">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-700">{t('rewards.yourTokens')}:</span>
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

        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="characters">{t('rewards.characters')}</TabsTrigger>
            <TabsTrigger value="coupons">{t('rewards.coupons')}</TabsTrigger>
          </TabsList>

          <TabsContent value="characters">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingCharacters ? (
                <div className="col-span-full text-center">Loading characters...</div>
              ) : (
                characters?.map((character) => {
                  const isOwned = ownedCharacters?.some(c => c.id === character.id) || false;
                  const isEquipped = user?.currentCharacterId === character.id;

                  return (
                    <Card key={character.id} data-testid={`card-character-${character.id}`} className="relative flex flex-col h-full">
                      {isEquipped && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge className="bg-primary" data-testid={`badge-equipped-${character.id}`}>
                            Equipped
                          </Badge>
                        </div>
                      )}
                      {isOwned && !isEquipped && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="secondary" data-testid={`badge-owned-${character.id}`}>
                            Owned
                          </Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex justify-center mb-4">
                          {isOwned ? (
                            <img
                              src={character.ipfsLink}
                              alt={character.title}
                              className="w-32 h-32 rounded-full object-cover"
                              data-testid={`img-character-${character.id}`}
                            />
                          ) : (
                            <div 
                              className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center"
                              data-testid={`locked-character-${character.id}`}
                            >
                              <Lock className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-center">{character.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        {isOwned ? (
                          <p className="text-gray-600 mb-4 text-sm flex-1">{character.description}</p>
                        ) : (
                          <p 
                            className="text-gray-400 mb-4 text-sm italic flex-1"
                            data-testid={`placeholder-description-${character.id}`}
                          >
                            {t('rewards.purchaseToReveal')}
                          </p>
                        )}
                        <div className="space-y-3 mt-auto">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-green-600" data-testid={`text-character-cost-${character.id}`}>
                              {character.tokenCost} tokens
                            </span>
                            <Badge variant="outline" data-testid={`text-character-available-${character.id}`}>
                              {character.maxAvailable - character.purchasedCount} left
                            </Badge>
                          </div>
                          <Button
                            onClick={() => purchaseCharacterMutation.mutate(character.id)}
                            disabled={
                              isOwned ||
                              (user?.tokens || 0) < character.tokenCost ||
                              character.purchasedCount >= character.maxAvailable ||
                              purchaseCharacterMutation.isPending
                            }
                            className="w-full"
                            data-testid={`button-purchase-character-${character.id}`}
                          >
                            {purchaseCharacterMutation.isPending ? (
                              "Purchasing..."
                            ) : isOwned ? (
                              "Already Owned"
                            ) : (user?.tokens || 0) < character.tokenCost ? (
                              "Insufficient tokens"
                            ) : character.purchasedCount >= character.maxAvailable ? (
                              "Sold out"
                            ) : (
                              "Purchase"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="coupons">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingRewards ? (
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
