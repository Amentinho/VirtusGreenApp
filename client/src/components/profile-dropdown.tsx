import { Link } from "wouter";
import { User, LogOut, Copy, Gift, Coins, Trophy, Coffee, Play, Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Character } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ProfileDropdown() {
  const { user, logoutMutation } = useAuth();
  const { i18n } = useTranslation();

  const { data: characters } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
  });

  const currentCharacter = characters?.find(c => c.id === user?.currentCharacterId);

  const languageMutation = useMutation({
    mutationFn: async (language: "en" | "es" | "it") => {
      return await apiRequest("POST", "/api/user/profile", { language });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const handleLanguageChange = (language: "en" | "es" | "it") => {
    i18n.changeLanguage(language);
    languageMutation.mutate(language);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "it", name: "Italian", nativeName: "Italiano" },
  ] as const;

  const renderProfileIcon = () => {
    const displayPref = user?.displayPreference || "avatar";
    
    switch (displayPref) {
      case "avatar":
        return (
          <div className="text-xl">
            {user?.avatar || "🐶"}
          </div>
        );
      case "character":
        return currentCharacter ? (
          <img
            src={currentCharacter.ipfsLink}
            alt="Character"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <User className="h-4 w-4" />
        );
      case "custom":
        return user?.customProfileImage ? (
          <img
            src={user.customProfileImage}
            alt="Profile"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <User className="h-4 w-4" />
        );
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          data-testid="button-profile-dropdown"
          className="relative h-8 w-8 rounded-full overflow-hidden bg-green-50"
        >
          {renderProfileIcon()}
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

        <DropdownMenuItem asChild>
          <Link href="/referral" className="w-full">
            <Copy className="mr-2 h-4 w-4" />
            <span data-testid="text-my-referral-code">My Referral Code</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/my-tokens" className="w-full">
            <Coins className="mr-2 h-4 w-4" />
            <span data-testid="text-my-tokens">My Tokens</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/my-rewards" className="w-full">
            <Gift className="mr-2 h-4 w-4" />
            <span data-testid="text-my-rewards">My Rewards</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/leaderboard" className="w-full">
            <Trophy className="mr-2 h-4 w-4" />
            <span data-testid="text-leaderboard">Leaderboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/support" className="w-full">
            <Coffee className="mr-2 h-4 w-4" />
            <span data-testid="text-buy-me-coffee">Buy Me a Coffee</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/watch-ads" className="w-full">
            <Play className="mr-2 h-4 w-4" />
            <span data-testid="text-watch-ads">Watch Ads</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>Language</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="cursor-pointer"
                >
                  <Check className={`mr-2 h-4 w-4 ${i18n.language === lang.code ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{lang.nativeName}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        
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