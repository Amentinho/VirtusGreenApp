import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TokenDisplay from "@/components/token-display";
import { Coupon } from "@shared/schema";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function MarketplacePage() {
  const { toast } = useToast();
  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/coupons"],
  });

  const redeemCoupon = async (couponId: number) => {
    try {
      await apiRequest("POST", `/api/coupons/${couponId}/redeem`);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Coupon redeemed successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redeem coupon",
        variant: "destructive",
      });
    }
  };

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
              <h1 className="text-xl font-bold text-green-600">Marketplace</h1>
            </div>
            <div className="flex items-center">
              <TokenDisplay />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center">Loading coupons...</div>
          ) : (
            coupons?.map((coupon) => (
              <Card key={coupon.id}>
                <CardHeader>
                  <CardTitle>{coupon.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{coupon.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-600">
                      {coupon.tokenCost} tokens
                    </span>
                    <Button
                      onClick={() => redeemCoupon(coupon.id)}
                      disabled={!coupon.available}
                    >
                      Redeem
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
