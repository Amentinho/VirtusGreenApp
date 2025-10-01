import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Camera, Flame } from "lucide-react";
import ProductCard from "@/components/product-card";
import TokenDisplay from "@/components/token-display";
import BarcodeScanner from "@/components/barcode-scanner";
import ProfileDropdown from "@/components/profile-dropdown";
import { LoginStreakDialog } from "@/components/login-streak-dialog";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
export default function HomePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const [streakData, setStreakData] = useState<any>(null);
  const [todayReward, setTodayReward] = useState<any>(null);

  useEffect(() => {
    const fromProduct = sessionStorage.getItem('virtusgreen_from_product');
    if (fromProduct === 'true') {
      const savedSearch = sessionStorage.getItem('virtusgreen_search');
      const savedActiveSearch = sessionStorage.getItem('virtusgreen_activeSearch');
      if (savedSearch) setSearch(savedSearch);
      if (savedActiveSearch) setActiveSearch(savedActiveSearch);
      sessionStorage.removeItem('virtusgreen_from_product');
    }
  }, []);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: activeSearch ? ["/api/products", "search", activeSearch] : ["/api/products"],
    queryFn: () => {
      const url = activeSearch 
        ? `/api/products?search=${encodeURIComponent(activeSearch)}`
        : "/api/products";
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
    enabled: !!activeSearch,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSearch = () => {
    setActiveSearch(search);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStreakClick = async () => {
    try {
      const streakRes = await apiRequest("GET", "/api/login-streak/current");
      const streakInfo = await streakRes.json();
      
      // Convert date strings back to Date objects
      if (streakInfo.weekDays) {
        streakInfo.weekDays = streakInfo.weekDays.map((day: any) => ({
          ...day,
          date: new Date(day.date)
        }));
      }
      
      setStreakData(streakInfo);
      setTodayReward({ tokensAwarded: 0, isNewLogin: false, consecutiveDays: streakInfo.currentStreak });
      setShowStreakDialog(true);
    } catch (err) {
      console.error("Failed to fetch login streak:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.jpg" alt="VirtusGreen" className="h-12 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStreakClick}
                data-testid="button-daily-streak"
              >
                <Flame className="h-4 w-4 mr-2 text-orange-500" />
                {t('loginStreak.title')}
              </Button>
              <TokenDisplay />
              <Link href="/rewards">
                <Button variant="outline">{t('nav.rewards')}</Button>
              </Link>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Primary Action: Scan Barcode */}
          <div className="text-center space-y-3">
            <div className="relative inline-block w-full">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsla(142,70%,45%,.18),transparent_60%)]" />
              <Button 
                size="lg"
                onClick={() => setShowScanner(true)}
                className="w-full h-auto py-6 px-8 text-xl font-bold rounded-full bg-primary hover:bg-primary/90 shadow-[0_10px_20px_-5px_hsla(142,70%,45%,.4),0_4px_8px_-2px_hsla(0,0%,0%,.2)] hover:shadow-[0_14px_28px_-8px_hsla(142,70%,45%,.5),0_8px_12px_-4px_hsla(0,0%,0%,.25)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 border-0"
                data-testid="button-scan-barcode"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <Camera className="h-6 w-6" />
                  </div>
                  <span>{t('home.scanBarcode')}</span>
                </div>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('home.scanSubtitle')}
            </p>
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500 font-medium">{t('home.orDivider')}</span>
            </div>
          </div>

          {/* Secondary Action: Search */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('home.searchPlaceholder')}
                className="flex-1"
                data-testid="input-product-search"
              />
              <Button variant="outline" onClick={handleSearch} data-testid="button-search">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Results */}
            {activeSearch && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">
                  {t('home.searchResults')} "{activeSearch}"
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8">{t('common.loading')}</div>
                  ) : products && products.length > 0 ? (
                    products.map((product) => (
                      <ProductCard 
                        key={product.id}
                        product={product} 
                        searchState={{ search, activeSearch }}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {t('home.noProducts')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('scanner.title')}</DialogTitle>
          </DialogHeader>
          <BarcodeScanner />
        </DialogContent>
      </Dialog>

      {/* Login Streak Dialog */}
      {streakData && todayReward && (
        <LoginStreakDialog
          open={showStreakDialog}
          onOpenChange={setShowStreakDialog}
          streakData={streakData}
          todayReward={todayReward}
        />
      )}
    </div>
  );
}
