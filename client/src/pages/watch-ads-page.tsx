import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Gift, TrendingUp, CheckCircle2 } from "lucide-react";

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

interface User {
  tokens: number;
  [key: string]: any;
}

export default function WatchAdsPage() {
  const { toast } = useToast();
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adCompleted, setAdCompleted] = useState(false);

  // Fetch ad stats
  const { data: adStats, isLoading } = useQuery<AdStats>({
    queryKey: ["/api/ad-stats"],
  });

  // Fetch user data for token display
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Watch ad mutation
  const watchAdMutation = useMutation<WatchAdResponse>({
    mutationFn: async () => {
      const response = await apiRequest("/api/watch-ad", "POST", {});
      return response as unknown as WatchAdResponse;
    },
    onSuccess: (data: WatchAdResponse) => {
      if (data.success) {
        toast({
          title: "🎉 Tokens Earned!",
          description: `You earned ${data.tokensAwarded} tokens! ${data.adsWatchedToday}/${data.dailyLimit} ads watched today.`,
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/ad-stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        toast({
          title: "Daily Limit Reached",
          description: `You've watched ${data.adsWatchedToday}/${data.dailyLimit} ads today. Come back tomorrow for more rewards!`,
          variant: "destructive",
        });
      }
      setIsWatchingAd(false);
      setAdProgress(0);
      setAdCompleted(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record ad view. Please try again.",
        variant: "destructive",
      });
      setIsWatchingAd(false);
      setAdProgress(0);
      setAdCompleted(false);
    },
  });

  const startWatchingAd = () => {
    if (adStats && adStats.adsWatchedToday >= adStats.dailyLimit) {
      toast({
        title: "Daily Limit Reached",
        description: `You've watched all ${adStats.dailyLimit} ads today. Come back tomorrow!`,
        variant: "destructive",
      });
      return;
    }

    setIsWatchingAd(true);
    setAdProgress(0);
    setAdCompleted(false);

    // Simulate 30-second ad with progress updates
    const duration = 30000; // 30 seconds
    const interval = 100; // Update every 100ms
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const progress = (elapsed / duration) * 100;
      setAdProgress(progress);

      if (elapsed >= duration) {
        clearInterval(timer);
        setAdCompleted(true);
      }
    }, interval);
  };

  const claimReward = () => {
    watchAdMutation.mutate();
  };

  const remainingAds = adStats ? adStats.dailyLimit - adStats.adsWatchedToday : 0;
  const canWatchMore = remainingAds > 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="p-8">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Watch Ads & Earn Tokens</h1>
        <p className="text-muted-foreground">
          Watch advertisements to earn 100 tokens per ad. Up to 5 ads per day!
        </p>
      </div>

      {/* Current Balance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Token Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">{user?.tokens || 0} Tokens</p>
        </CardContent>
      </Card>

      {/* Ad Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ads Watched Today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{adStats?.adsWatchedToday || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Daily Limit</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{adStats?.dailyLimit || 5}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tokens Earned Today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{adStats?.tokensEarnedToday || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ad Player */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-6 w-6" />
            Advertisement Player
          </CardTitle>
          <CardDescription>
            Watch a 30-second advertisement to earn 100 tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isWatchingAd && !adCompleted && (
            <div className="flex flex-col items-center justify-center p-12 bg-muted rounded-lg space-y-4">
              <Gift className="h-16 w-16 text-primary" />
              <p className="text-lg font-medium">
                {canWatchMore 
                  ? `${remainingAds} ad${remainingAds !== 1 ? 's' : ''} remaining today`
                  : "Daily limit reached"}
              </p>
              <Button
                size="lg"
                onClick={startWatchingAd}
                disabled={!canWatchMore}
                data-testid="button-watch-ad"
              >
                <Play className="mr-2 h-5 w-5" />
                {canWatchMore ? "Watch Advertisement" : "Come Back Tomorrow"}
              </Button>
            </div>
          )}

          {isWatchingAd && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Simulated ad content */}
                <div className="text-center space-y-4 p-8">
                  <div className="text-white text-2xl font-bold">
                    VirtusGreen Partner Advertisement
                  </div>
                  <div className="text-white/80 text-lg">
                    Make eco-friendly choices for a better tomorrow
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded">
                    {Math.ceil((30 - (adProgress / 100) * 30))}s
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Please wait for the ad to finish...</span>
                  <span>{Math.round(adProgress)}%</span>
                </div>
                <Progress value={adProgress} data-testid="progress-ad" />
              </div>
            </div>
          )}

          {adCompleted && (
            <div className="flex flex-col items-center justify-center p-12 bg-green-50 dark:bg-green-950 rounded-lg space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <p className="text-lg font-medium">Advertisement Completed!</p>
              <Button
                size="lg"
                onClick={claimReward}
                disabled={watchAdMutation.isPending}
                data-testid="button-claim-reward"
              >
                {watchAdMutation.isPending ? "Claiming..." : "Claim 100 Tokens"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <p>Click "Watch Advertisement" to start a 30-second ad</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <p>Wait for the ad to complete (no skipping allowed!)</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <p>Claim your 100 tokens reward after the ad finishes</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <p>You can watch up to 5 ads per day for a total of 500 tokens</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
