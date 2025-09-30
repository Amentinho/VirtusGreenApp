import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle } from "lucide-react";
import { SiWhatsapp, SiTelegram, SiInstagram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShareButtonProps {
  productId?: string;
  productName?: string;
  variant?: "product" | "app";
  className?: string;
}

export default function ShareButton({ 
  productId, 
  productName, 
  variant = "product",
  className = "" 
}: ShareButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSharing, setIsSharing] = useState(false);

  const shareProductMutation = useMutation({
    mutationFn: async ({ platform }: { platform: string }) => {
      const response = await fetch(`/api/share/${variant}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ productId, platform }),
      });
      
      if (!response.ok) {
        throw new Error(await response.text() || "Failed to record share");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate user data to refresh token count
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (variant === "product" && data.awarded > 0) {
        toast({
          title: "Points Earned!",
          description: `You earned ${data.awarded} tokens for sharing! ${data.sharesLeftToday} shares left today.`,
        });
      } else if (variant === "product" && data.awarded === 0) {
        toast({
          title: "Daily Limit Reached",
          description: "You've reached your daily sharing limit (5 shares per day).",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Sharing Failed",
        description: error.message || "Failed to record share",
        variant: "destructive",
      });
    },
  });

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    
    try {
      if (variant === "app") {
        // For app sharing, get the share URL first
        const response = await fetch("/api/share/app", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ platform }),
        });
        
        if (!response.ok) {
          throw new Error(await response.text() || "Failed to record app share");
        }
        
        const result = await response.json();
        const shareUrl = result.shareUrl;
        const shareText = `Check out VirtusGreen - discover eco-friendly products! Use my referral code to join: ${shareUrl}`;
        
        await shareToSocialMedia(platform, shareText, shareUrl);
      } else {
        // For product sharing, record the share and then share
        await shareProductMutation.mutateAsync({ platform });
        
        const shareText = productName 
          ? `Check out this eco-friendly product: ${productName} on VirtusGreen!`
          : "Check out this eco-friendly product on VirtusGreen!";
        const shareUrl = window.location.href;
        
        await shareToSocialMedia(platform, shareText, shareUrl);
      }
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const shareToSocialMedia = async (platform: string, text: string, url: string) => {
    const shareContent = `${text}\n\n${url}`;
    
    // Try native share first on mobile for better UX
    if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: variant === "app" ? "Join VirtusGreen" : productName || "Eco-Friendly Product",
          text: shareContent,
        });
        return;
      } catch (err: any) {
        // User cancelled or share failed, continue to platform-specific sharing
        if (err.name !== 'AbortError') {
          console.log('Native share failed, falling back to platform-specific', err);
        } else {
          return; // User cancelled, don't show error
        }
      }
    }
    
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    const fullMessage = encodeURIComponent(shareContent);
    
    switch (platform) {
      case "whatsapp":
        // Use mobile app URL scheme if on mobile, web URL otherwise
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = `whatsapp://send?text=${fullMessage}`;
          // Fallback to web version if app not installed
          setTimeout(() => {
            window.open(`https://wa.me/?text=${fullMessage}`, "_blank");
          }, 1000);
        } else {
          window.open(`https://wa.me/?text=${fullMessage}`, "_blank");
        }
        break;
      case "telegram":
        // Telegram mobile and web URLs
        const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        window.location.href = `tg://msg?text=${fullMessage}`;
        // Fallback to web version
        setTimeout(() => {
          window.open(telegramUrl, "_blank");
        }, 1000);
        break;
      case "instagram":
        // Instagram doesn't have direct URL sharing, copy to clipboard
        try {
          await navigator.clipboard.writeText(shareContent);
          toast({
            title: "Copied to Clipboard!",
            description: "Share text copied! You can now paste it in your Instagram story or post.",
          });
        } catch (err) {
          // Fallback for browsers that don't support clipboard API
          const textArea = document.createElement("textarea");
          textArea.value = shareContent;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            toast({
              title: "Copied to Clipboard!",
              description: "Share text copied! You can now paste it in your Instagram story or post.",
            });
          } catch (e) {
            toast({
              title: "Copy Failed",
              description: "Please manually copy the link from the browser address bar.",
              variant: "destructive",
            });
          }
          document.body.removeChild(textArea);
        }
        break;
      default:
        // Fallback to Web Share API or clipboard
        if (navigator.share) {
          try {
            await navigator.share({
              title: variant === "app" ? "Join VirtusGreen" : productName || "Eco-Friendly Product",
              text: shareContent,
            });
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              throw err;
            }
          }
        } else {
          await navigator.clipboard.writeText(shareContent);
          toast({
            title: "Copied to Clipboard!",
            description: "Share link copied to clipboard",
          });
        }
        break;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "whatsapp":
        return <SiWhatsapp className="h-4 w-4" />;
      case "telegram":
        return <SiTelegram className="h-4 w-4" />;
      case "instagram":
        return <SiInstagram className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isSharing}
          className={className}
          data-testid={`button-share-${variant}`}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share ({variant === "product" ? "5 pts" : "10 pts"})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleShare("whatsapp")} data-testid="share-whatsapp">
          <SiWhatsapp className="h-4 w-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("telegram")} data-testid="share-telegram">
          <SiTelegram className="h-4 w-4 mr-2 text-blue-600" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("instagram")} data-testid="share-instagram">
          <SiInstagram className="h-4 w-4 mr-2 text-pink-600" />
          Instagram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}