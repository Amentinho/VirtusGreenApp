import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Play, Gift, TrendingUp, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";

interface AdStats {
  adsWatchedToday: number;
  dailyLimit: number;
  tokensEarnedToday: number;
}

interface WatchAdResponse {
  success: boolean;
  tokensAwarded: number;
  adsWatchedToday: number;
  dailyLimit: number;
}

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" };

export default function WatchAdsPage() {
  const { toast } = useToast();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adCompleted, setAdCompleted] = useState(false);

  const { data: adStats, isLoading } = useQuery<AdStats>({
    queryKey: ["/api/ad-stats"],
  });

  const watchAdMutation = useMutation<WatchAdResponse>({
    mutationFn: async () => {
      const response = await apiRequest("/api/watch-ad", "POST", {});
      return response as unknown as WatchAdResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Tokens Earned!",
          description: `You earned ${data.tokensAwarded} tokens! ${data.adsWatchedToday}/${data.dailyLimit} ads watched today.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/ad-stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        toast({
          title: "Daily Limit Reached",
          description: `You've watched ${data.adsWatchedToday}/${data.dailyLimit} ads today. Come back tomorrow!`,
          variant: "destructive",
        });
      }
      setIsWatchingAd(false);
      setAdProgress(0);
      setAdCompleted(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record ad view. Please try again.", variant: "destructive" });
      setIsWatchingAd(false);
      setAdProgress(0);
      setAdCompleted(false);
    },
  });

  const startWatchingAd = () => {
    if (adStats && adStats.adsWatchedToday >= adStats.dailyLimit) {
      toast({ title: "Daily Limit Reached", description: `You've watched all ${adStats.dailyLimit} ads today. Come back tomorrow!`, variant: "destructive" });
      return;
    }
    setIsWatchingAd(true);
    setAdProgress(0);
    setAdCompleted(false);

    const duration = 30000;
    const interval = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setAdProgress((elapsed / duration) * 100);
      if (elapsed >= duration) {
        clearInterval(timer);
        setAdCompleted(true);
      }
    }, interval);
  };

  const remainingAds = adStats ? adStats.dailyLimit - adStats.adsWatchedToday : 0;
  const canWatchMore = remainingAds > 0;
  const secondsLeft = Math.ceil(30 - (adProgress / 100) * 30);

  return (
    <div className="min-h-screen flex flex-col" style={bg}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all" data-testid="button-back-to-menu">
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
            <Play className="w-6 h-6 text-[#c0fa79]" />
          </div>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Watch & Earn
          </h1>
          <p className="text-white/45 text-sm mt-1">Watch a 30-second ad to earn 100 tokens</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-[#c0fa79]/40 border-t-[#c0fa79] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Watched Today", value: adStats?.adsWatchedToday || 0, accent: false },
                { label: "Daily Limit", value: adStats?.dailyLimit || 1, accent: false },
                { label: "Tokens Today", value: adStats?.tokensEarnedToday || 0, accent: true },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl p-4 text-center" style={cardStyle}>
                  <div className={`text-2xl font-bold mb-1 ${stat.accent ? "text-[#c0fa79]" : "text-white"}`}>{stat.value}</div>
                  <div className="text-[11px] text-white/40 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Ad player */}
            <div className="rounded-2xl overflow-hidden" style={cardStyle}>
              {!isWatchingAd && !adCompleted && (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(192,250,121,0.12)" }}>
                    <Gift className="w-8 h-8 text-[#c0fa79]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {canWatchMore
                        ? `${remainingAds} ad${remainingAds !== 1 ? "s" : ""} remaining today`
                        : "Daily limit reached"}
                    </p>
                    <p className="text-white/40 text-sm mt-1">
                      {canWatchMore ? "Earn 100 tokens per ad" : "Come back tomorrow for more rewards"}
                    </p>
                  </div>
                  <button
                    onClick={startWatchingAd}
                    disabled={!canWatchMore}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={canWatchMore ? { background: "#c0fa79", color: "#043231" } : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
                    data-testid="button-watch-ad"
                  >
                    <Play className="w-4 h-4" />
                    {canWatchMore ? "Watch Advertisement" : "Come Back Tomorrow"}
                  </button>
                </div>
              )}

              {isWatchingAd && (
                <div>
                  {/* Simulated ad screen */}
                  <div className="aspect-video bg-black flex items-center justify-center relative">
                    <div className="text-center space-y-3 p-8">
                      <p className="text-white text-xl font-bold">VirtusGreen Partner Advertisement</p>
                      <p className="text-white/60">Make eco-friendly choices for a better tomorrow</p>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      {secondsLeft}s
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="p-5 space-y-2">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Please wait for the ad to finish…</span>
                      <span>{Math.round(adProgress)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${adProgress}%`, background: "#c0fa79" }}
                        data-testid="progress-ad"
                      />
                    </div>
                  </div>
                </div>
              )}

              {adCompleted && (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center space-y-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(192,250,121,0.12)" }}>
                    <CheckCircle2 className="w-8 h-8 text-[#c0fa79]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Advertisement Completed!</p>
                    <p className="text-white/40 text-sm mt-1">Claim your 100 token reward</p>
                  </div>
                  <button
                    onClick={() => watchAdMutation.mutate()}
                    disabled={watchAdMutation.isPending}
                    className="px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                    style={{ background: "#c0fa79", color: "#043231" }}
                    data-testid="button-claim-reward"
                  >
                    {watchAdMutation.isPending ? "Claiming…" : "Claim 100 Tokens"}
                  </button>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">How it works</p>
              <div className="space-y-3">
                {[
                  "Click \"Watch Advertisement\" to start a 30-second ad",
                  "Wait for the ad to complete — no skipping allowed!",
                  "Claim your 100 tokens reward after the ad finishes",
                  "You can watch up to 1 ad per day",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="font-bold text-[#c0fa79] flex-none w-4">{i + 1}.</span>
                    <span className="text-white/55">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
