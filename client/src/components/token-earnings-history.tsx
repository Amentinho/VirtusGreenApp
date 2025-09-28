import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TokenEarning {
  id: number;
  userId: string;
  source: string;
  amount: number;
  description: string;
  earnedAt: string;
}

const sourceLabels: Record<string, { label: string; color: string }> = {
  referral: { label: "Referral", color: "bg-green-100 text-green-800" },
  referral_signup: { label: "Welcome Bonus", color: "bg-blue-100 text-blue-800" },
  product_share: { label: "Product Share", color: "bg-orange-100 text-orange-800" },
  app_share: { label: "App Share", color: "bg-purple-100 text-purple-800" },
  profile_completion: { label: "Profile Complete", color: "bg-indigo-100 text-indigo-800" },
  social_follow: { label: "Social Follow", color: "bg-pink-100 text-pink-800" },
};

export default function TokenEarningsHistory() {
  const { data: earnings, isLoading } = useQuery<TokenEarning[]>({
    queryKey: ["/api/user/token-earnings"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            Token Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!earnings || earnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            Token Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Coins className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No token earnings yet</p>
            <p className="text-sm">Start sharing products and completing actions to earn tokens!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEarned = earnings.reduce((sum, earning) => sum + earning.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-600" />
            Token Earnings History
          </div>
          <Badge variant="outline" className="text-yellow-700 border-yellow-300">
            Total: {totalEarned} tokens
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-80 overflow-y-auto" data-testid="earnings-list">
          {earnings.map((earning) => {
            const sourceInfo = sourceLabels[earning.source] || { 
              label: earning.source, 
              color: "bg-gray-100 text-gray-800" 
            };
            
            return (
              <div 
                key={earning.id} 
                className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                data-testid={`earning-${earning.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${sourceInfo.color}`}>
                      {sourceInfo.label}
                    </Badge>
                    <span className="font-medium text-yellow-600">
                      +{earning.amount} tokens
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {earning.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(earning.earnedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {earnings.length > 5 && (
          <div className="text-xs text-gray-500 text-center mt-4 pt-4 border-t">
            Showing {earnings.length} earnings • Latest first
          </div>
        )}
      </CardContent>
    </Card>
  );
}