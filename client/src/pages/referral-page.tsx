import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Copy, Users, Gift, Share2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ShareButton from "@/components/share-button";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";

interface ReferralStats {
  referralCount: number;
  tokensEarned: number;
}

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" };

export default function ReferralPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralStats, isLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/user/referral-stats"],
    enabled: !!user,
  });

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Referral code copied to clipboard" });
    }
  };

  const shareReferralCode = () => {
    if (navigator.share && user?.referralCode) {
      navigator.share({
        title: "Join VirtusGreen",
        text: `Use my referral code ${user.referralCode} to join VirtusGreen and discover eco-friendly products!`,
        url: window.location.origin + "/auth",
      });
    } else {
      copyReferralCode();
    }
  };

  const nextMilestone = (Math.floor((referralStats?.referralCount || 0) / 5) + 1) * 5;
  const toNextMilestone = nextMilestone - (referralStats?.referralCount || 0);

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
            <Share2 className="w-6 h-6 text-[#c0fa79]" />
          </div>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Refer Friends
          </h1>
          <p className="text-white/45 text-sm mt-1">Earn 10 tokens for every friend who signs up</p>
        </div>

        <div className="space-y-4">
          {/* Referral code card */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Your Referral Code</p>
            {user?.referralCode ? (
              <div className="space-y-3">
                <div
                  className="text-center rounded-xl py-4 font-mono text-2xl font-bold tracking-[0.15em] text-[#c0fa79]"
                  style={{ background: "rgba(192,250,121,0.08)", border: "1px dashed rgba(192,250,121,0.3)" }}
                >
                  <span data-testid="text-referral-code">{user.referralCode}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyReferralCode}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-150"
                    style={{ background: "#c0fa79", color: "#043231" }}
                    data-testid="button-copy-referral-code"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                  <button
                    onClick={shareReferralCode}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white border border-white/15 hover:border-white/25 transition-all"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                    data-testid="button-share-referral-code"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
                <ShareButton variant="app" className="w-full" />
              </div>
            ) : (
              <p className="text-center text-white/40 text-sm py-4">No referral code available</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-5 text-center" style={cardStyle}>
              <div className="text-3xl font-bold text-white mb-1" data-testid="text-total-referrals">
                {isLoading ? "—" : (referralStats?.referralCount || 0)}
              </div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Friends Referred</div>
            </div>
            <div className="rounded-2xl p-5 text-center" style={cardStyle}>
              <div className="text-3xl font-bold text-[#c0fa79] mb-1" data-testid="text-total-tokens-earned">
                {isLoading ? "—" : (referralStats?.tokensEarned || 0)}
              </div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Tokens Earned</div>
            </div>
          </div>

          {/* Next milestone */}
          {!isLoading && (
            <div className="rounded-2xl p-4" style={{ background: "rgba(192,250,121,0.07)", border: "1px solid rgba(192,250,121,0.18)" }}>
              <p className="text-xs text-[#c0fa79]/80 text-center">
                {toNextMilestone} more referral{toNextMilestone !== 1 ? "s" : ""} to reach <strong>{nextMilestone}</strong> total
              </p>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">How it works</p>
            <div className="space-y-4">
              {[
                { icon: <Share2 className="w-4 h-4 text-[#c0fa79]" />, title: "Share Your Code", desc: "Share your unique referral code with friends and family" },
                { icon: <Users className="w-4 h-4 text-[#c0fa79]" />, title: "Friends Sign Up", desc: "When they register using your code, they join your network" },
                { icon: <Gift className="w-4 h-4 text-[#c0fa79]" />, title: "Earn Tokens", desc: "Get 10 tokens for each successful referral to spend in rewards" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none" style={{ background: "rgba(192,250,121,0.12)" }}>
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{i + 1}. {step.title}</p>
                    <p className="text-xs text-white/45 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
