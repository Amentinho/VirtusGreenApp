import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Copy, Users, Gift, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import ShareButton from "@/components/share-button";

interface ReferralStats {
  referralCount: number;
  tokensEarned: number;
}

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
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <img src="/attached_assets/aaa_1759351925198.jpg" alt="VirtusGreen" className="h-12 w-auto" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Referral Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                Your Referral Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.referralCode ? (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-lg border-2 border-dashed border-green-300">
                      <span data-testid="text-referral-code">{user.referralCode}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={copyReferralCode} 
                      className="flex-1"
                      data-testid="button-copy-referral-code"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copied ? "Copied!" : "Copy Code"}
                    </Button>
                    <Button 
                      onClick={shareReferralCode} 
                      variant="outline"
                      data-testid="button-share-referral-code"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <div className="mt-4">
                    <ShareButton variant="app" className="w-full" />
                  </div>

                  <div className="text-sm text-gray-600 text-center">
                    Share this code with friends to earn 10 tokens when they sign up!
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  No referral code available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Referral Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading statistics...</div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600" data-testid="text-total-referrals">
                      {referralStats?.referralCount || 0}
                    </div>
                    <div className="text-sm text-gray-600">People Referred</div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600" data-testid="text-total-tokens-earned">
                      {referralStats?.tokensEarned || 0}
                    </div>
                    <div className="text-sm text-gray-600">Tokens Earned</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 text-center">
                      <strong>Next milestone:</strong>
                      <br />
                      {((Math.floor((referralStats?.referralCount || 0) / 5) + 1) * 5) - (referralStats?.referralCount || 0)} more referrals 
                      to reach {(Math.floor((referralStats?.referralCount || 0) / 5) + 1) * 5} total referrals!
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it Works Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>How Referrals Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Share2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Share Your Code</h3>
                  <p className="text-sm text-gray-600">
                    Share your unique referral code with friends and family
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Friends Sign Up</h3>
                  <p className="text-sm text-gray-600">
                    When they register using your code, they become part of your network
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Earn Tokens</h3>
                  <p className="text-sm text-gray-600">
                    Get 10 tokens for each successful referral to spend in the rewards section
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}