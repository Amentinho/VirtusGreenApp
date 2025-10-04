import { useState } from "react";
import { Link } from "wouter";
import { Menu, Home, Gift, User, Coins, Trophy, Coffee, Play, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import TokenDisplay from "@/components/token-display";
import { useTranslation } from "react-i18next";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
  };

  const closeSheet = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-4 mt-6">
          {/* Token Display */}
          <div className="pb-4">
            <TokenDisplay />
          </div>
          
          <Separator />
          
          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link href="/" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-nav-home">
                <Home className="h-4 w-4" />
                {t('nav.home')}
              </Button>
            </Link>
            
            <Link href="/rewards" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-nav-rewards">
                <Gift className="h-4 w-4" />
                {t('nav.rewards')}
              </Button>
            </Link>
            
            <Link href="/profile" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-nav-profile">
                <User className="h-4 w-4" />
                {t('nav.myProfile')}
              </Button>
            </Link>
            
            <Link href="/token-history" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-nav-token-history">
                <Coins className="h-4 w-4" />
                Token History
              </Button>
            </Link>
            
            <Link href="/leaderboard" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-nav-leaderboard">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Button>
            </Link>
            
            <Link href="/watch-ads" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-nav-watch-ads">
                <Play className="h-4 w-4" />
                {t('nav.watchAds')}
              </Button>
            </Link>
            
            <Link href="/support" onClick={closeSheet}>
              <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-nav-support">
                <Coffee className="h-4 w-4" />
                {t('nav.buyMeCoffee')}
              </Button>
            </Link>
          </nav>
          
          <Separator />
          
          {/* Logout */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
