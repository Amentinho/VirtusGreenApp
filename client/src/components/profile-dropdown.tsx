import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, LogOut, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ReferralStats {
  referralCount: number;
  tokensEarned: number;
}

export default function ProfileDropdown() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralStats } = useQuery<ReferralStats>({
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          data-testid="button-profile-dropdown"
          className="relative h-8 w-8 rounded-full"
        >
          <User className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="w-full">
            <User className="mr-2 h-4 w-4" />
            <span data-testid="text-my-profile">My Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={copyReferralCode}
          className="cursor-pointer"
          data-testid="button-my-referral-code"
        >
          <div className="flex flex-col w-full">
            <div className="flex items-center">
              <Copy className="mr-2 h-4 w-4" />
              <span>My Referral Code</span>
            </div>
            {user?.referralCode && (
              <div className="mt-2 ml-6 space-y-1">
                <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {user.referralCode}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span data-testid="text-referral-count">
                      {referralStats?.referralCount || 0} referrals
                    </span>
                  </div>
                  <div data-testid="text-tokens-earned">
                    {referralStats?.tokensEarned || 0} tokens earned
                  </div>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}