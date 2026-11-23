import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Gift } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserPurchase, Reward } from "@shared/schema";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";

interface PurchaseWithReward extends UserPurchase {
  reward: Reward;
}

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" };

export default function MyRewardsPage() {
  const { user } = useAuth();

  const { data: purchases, isLoading } = useQuery<PurchaseWithReward[]>({
    queryKey: ["/api/user/purchases"],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen flex flex-col" style={bg}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all" data-testid="button-back-home">
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

      <main className="flex-1 px-6 sm:px-8 pb-16 max-w-2xl mx-auto w-full pt-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "rgba(192,250,121,0.12)" }}>
            <Gift className="w-6 h-6 text-[#c0fa79]" />
          </div>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            My Rewards
          </h1>
          {purchases && (
            <p className="text-white/45 text-sm mt-1">{purchases.length} reward{purchases.length !== 1 ? "s" : ""} purchased</p>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-[#c0fa79]/40 border-t-[#c0fa79] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading…</p>
          </div>
        ) : purchases && purchases.length > 0 ? (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="rounded-2xl p-5" style={cardStyle} data-testid={`card-purchased-reward-${purchase.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: "rgba(192,250,121,0.12)" }}>
                      <Gift className="w-4 h-4 text-[#c0fa79]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{purchase.reward.name}</p>
                      <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{purchase.reward.description}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-white/35">
                        <Calendar className="w-3 h-3" />
                        <span data-testid={`text-purchase-date-${purchase.id}`}>
                          {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-none">
                    <span className="text-xs font-bold text-[#c0fa79]" data-testid={`badge-token-cost-${purchase.id}`}>
                      {purchase.reward.tokenCost} tokens
                    </span>
                    <span className="text-[10px] font-semibold text-[#c0fa79]/70 bg-[#c0fa79]/10 border border-[#c0fa79]/20 px-2 py-0.5 rounded-full">
                      ✓ Purchased
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Gift className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white/70 mb-2">No rewards yet</h2>
            <p className="text-white/40 text-sm mb-6">Earn tokens and redeem them for rewards.</p>
            <Link href="/rewards">
              <button
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-150"
                style={{ background: "#c0fa79", color: "#043231" }}
                data-testid="button-browse-rewards"
              >
                Browse Rewards
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
