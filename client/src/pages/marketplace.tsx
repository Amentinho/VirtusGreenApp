import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Coins, Lock, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";
import { Reward, Character } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { parseApiError } from "@/lib/errors";

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" };

export default function RewardsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({ queryKey: ["/api/rewards"] });
  const { data: characters, isLoading: isLoadingCharacters } = useQuery<Character[]>({ queryKey: ["/api/characters"] });
  const { data: ownedCharacters } = useQuery<Character[]>({ queryKey: ["/api/users/characters"], enabled: !!user });

  const purchaseRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => apiRequest("POST", `/api/rewards/${rewardId}/purchase`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      toast({ title: t("common.success"), description: t("rewards.redeemSuccess") });
    },
    onError: (error: Error) => toast({ title: t("common.error"), description: parseApiError(error), variant: "destructive" }),
  });

  const purchaseCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => apiRequest("POST", `/api/characters/${characterId}/purchase`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/characters"] });
      toast({ title: t("rewards.characterPurchased"), description: t("rewards.characterUpdated") });
    },
    onError: (error: Error) => toast({ title: t("common.error"), description: parseApiError(error), variant: "destructive" }),
  });

  return (
    <div className="min-h-screen flex flex-col" style={bg}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <img src="/logo.png" alt="VirtusGreen" className="h-8 w-auto object-contain brightness-0 invert" />
        </div>
        <div className="flex items-center gap-3">
          <TokenDisplay />
          <ProfileDropdown />
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-8 pb-16 max-w-4xl mx-auto w-full pt-6">
        {/* Token balance + My Rewards link */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={cardStyle}>
            <Coins className="w-4 h-4 text-[#c0fa79]" />
            <span className="text-xs text-white/50">{t("rewards.yourTokens")}:</span>
            <span className="text-sm font-bold text-[#c0fa79]" data-testid="text-available-tokens">{user?.tokens || 0}</span>
          </div>
          <Link href="/my-rewards">
            <button className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-white/70 hover:text-white transition-all" style={cardStyle}>
              My Rewards
            </button>
          </Link>
        </div>

        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 mb-8 rounded-2xl p-1" style={{ background: "rgba(255,255,255,0.06)" }}>
            <TabsTrigger
              value="characters"
              className="rounded-xl text-sm font-semibold text-white/50 data-[state=active]:text-[#043231] data-[state=active]:bg-[#c0fa79] transition-all"
            >
              {t("rewards.characters")}
            </TabsTrigger>
            <TabsTrigger
              value="coupons"
              className="rounded-xl text-sm font-semibold text-white/50 data-[state=active]:text-[#043231] data-[state=active]:bg-[#c0fa79] transition-all"
            >
              {t("rewards.coupons")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters">
            {isLoadingCharacters ? (
              <div className="text-center py-16">
                <div className="w-6 h-6 border-2 border-[#c0fa79]/40 border-t-[#c0fa79] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/40 text-sm">Loading…</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {characters?.map((character) => {
                  const isOwned = ownedCharacters?.some(c => c.id === character.id) || false;
                  const isEquipped = user?.currentCharacterId === character.id;
                  const canAfford = (user?.tokens || 0) >= character.tokenCost;
                  const soldOut = character.purchasedCount >= character.maxAvailable;

                  return (
                    <div key={character.id} className="rounded-2xl p-5 relative flex flex-col" style={cardStyle} data-testid={`card-character-${character.id}`}>
                      {/* Badge */}
                      {isEquipped && (
                        <span className="absolute top-4 right-4 text-[10px] font-bold bg-[#c0fa79] text-[#043231] px-2 py-0.5 rounded-full" data-testid={`badge-equipped-${character.id}`}>
                          Equipped
                        </span>
                      )}
                      {isOwned && !isEquipped && (
                        <span className="absolute top-4 right-4 text-[10px] font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full" data-testid={`badge-owned-${character.id}`}>
                          Owned
                        </span>
                      )}

                      {/* Avatar */}
                      <div className="flex justify-center mb-4">
                        {isOwned ? (
                          <img src={character.ipfsLink} alt={character.title} className="w-24 h-24 rounded-full object-cover ring-2 ring-[#c0fa79]/30" data-testid={`img-character-${character.id}`} />
                        ) : (
                          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }} data-testid={`locked-character-${character.id}`}>
                            <Lock className="w-10 h-10 text-white/20" />
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-white text-center mb-2">{character.title}</p>

                      <p className="text-xs text-white/45 text-center mb-4 leading-relaxed flex-1" data-testid={isOwned ? undefined : `placeholder-description-${character.id}`}>
                        {isOwned ? character.description : t("rewards.purchaseToReveal")}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-[#c0fa79]" data-testid={`text-character-cost-${character.id}`}>{character.tokenCost} tokens</span>
                        <span className="text-xs text-white/40" data-testid={`text-character-available-${character.id}`}>{character.maxAvailable - character.purchasedCount} left</span>
                      </div>

                      <button
                        onClick={() => purchaseCharacterMutation.mutate(character.id)}
                        disabled={isOwned || !canAfford || soldOut || purchaseCharacterMutation.isPending}
                        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={isOwned ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" } : { background: "#c0fa79", color: "#043231" }}
                        data-testid={`button-purchase-character-${character.id}`}
                      >
                        {purchaseCharacterMutation.isPending ? "Purchasing…" : isOwned ? "Already Owned" : !canAfford ? "Insufficient tokens" : soldOut ? "Sold out" : "Purchase"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="coupons">
            {isLoadingRewards ? (
              <div className="text-center py-16">
                <div className="w-6 h-6 border-2 border-[#c0fa79]/40 border-t-[#c0fa79] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/40 text-sm">Loading…</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rewards?.map((reward) => {
                  const canAfford = (user?.tokens || 0) >= reward.tokenCost;
                  const outOfStock = (reward.remainingQuantity || 0) <= 0;

                  return (
                    <div key={reward.id} className="rounded-2xl p-5 flex flex-col" style={cardStyle} data-testid={`card-reward-${reward.id}`}>
                      <p className="text-sm font-semibold text-white mb-2">{reward.name}</p>
                      <p className="text-xs text-white/45 leading-relaxed mb-4 flex-1">{reward.description}</p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-[#c0fa79]" data-testid={`text-token-cost-${reward.id}`}>{reward.tokenCost} tokens</span>
                        <span className="text-xs text-white/40" data-testid={`text-remaining-${reward.id}`}>{reward.remainingQuantity || 0} left</span>
                      </div>

                      <button
                        onClick={() => purchaseRewardMutation.mutate(reward.id)}
                        disabled={!reward.available || !canAfford || outOfStock || purchaseRewardMutation.isPending}
                        className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={!reward.available || !canAfford || outOfStock ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" } : { background: "#c0fa79", color: "#043231" }}
                        data-testid={`button-redeem-${reward.id}`}
                      >
                        {purchaseRewardMutation.isPending ? "Redeeming…" : !canAfford ? "Insufficient tokens" : outOfStock ? "Out of stock" : "Redeem"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
