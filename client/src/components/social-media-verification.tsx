import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Check } from "lucide-react";
import { SiInstagram, SiLinkedin, SiX } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface VerificationResponse {
  verificationCode: string;
  message: string;
}

interface VerifyResponse {
  verified: boolean;
  tokensAwarded: number;
  tokens: number;
}

export default function SocialMediaVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verificationCodes, setVerificationCodes] = useState<Record<string, string>>({});
  const [inputCodes, setInputCodes] = useState<Record<string, string>>({});

  const initiateVerificationMutation = useMutation({
    mutationFn: async ({ platform, handle }: { platform: string; handle?: string }): Promise<VerificationResponse> => {
      const response = await fetch("/api/social/initiate-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ platform, handle }),
      });
      
      if (!response.ok) {
        throw new Error(await response.text() || "Failed to initiate verification");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      setVerificationCodes(prev => ({
        ...prev,
        [variables.platform]: data.verificationCode
      }));
      
      toast({
        title: "Verification Started!",
        description: data.message,
        duration: 10000, // Show longer for instructions
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to start verification",
        variant: "destructive",
      });
    },
  });

  const verifyFollowMutation = useMutation({
    mutationFn: async ({ platform, verificationCode }: { platform: string; verificationCode: string }): Promise<VerifyResponse> => {
      const response = await fetch("/api/social/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ platform, verificationCode }),
      });
      
      if (!response.ok) {
        throw new Error(await response.text() || "Failed to verify follow");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate user data to refresh token count
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.verified) {
        toast({
          title: "Verification Successful!",
          description: `Great! You earned ${data.tokensAwarded} tokens for following us on ${variables.platform}.`,
        });
        
        // Clear the codes for this platform
        setVerificationCodes(prev => {
          const newCodes = { ...prev };
          delete newCodes[variables.platform];
          return newCodes;
        });
        setInputCodes(prev => {
          const newCodes = { ...prev };
          delete newCodes[variables.platform];
          return newCodes;
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "We couldn't verify your follow. Please make sure you've posted the verification code and try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify follow",
        variant: "destructive",
      });
    },
  });

  const handleInitiateVerification = (platform: string) => {
    initiateVerificationMutation.mutate({ platform });
  };

  const handleVerifyFollow = (platform: string) => {
    const code = inputCodes[platform];
    if (!code) {
      toast({
        title: "Verification Code Required",
        description: "Please enter the verification code from your post.",
        variant: "destructive",
      });
      return;
    }

    verifyFollowMutation.mutate({ platform, verificationCode: code });
  };

  const platforms = [
    {
      id: "instagram",
      name: "Instagram",
      icon: <SiInstagram className="h-5 w-5" />,
      color: "text-pink-600",
      url: "https://instagram.com/virtusgreen",
      instructions: "Follow us and post a story mentioning @virtusgreen with your code"
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <SiLinkedin className="h-5 w-5" />,
      color: "text-blue-600",
      url: "https://linkedin.com/company/virtusgreen",
      instructions: "Follow our company page and post about us with your code"
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: <SiX className="h-5 w-5" />,
      color: "text-blue-400",
      url: "https://twitter.com/virtusgreen",
      instructions: "Follow us and tweet your verification code mentioning @virtusgreen"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-blue-600" />
          Social Media Verification (10 points each)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {platforms.map((platform) => {
          const hasCode = verificationCodes[platform.id];
          
          return (
            <div key={platform.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={platform.color}>{platform.icon}</span>
                  <span className="font-medium">{platform.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(platform.url, "_blank")}
                  data-testid={`button-visit-${platform.id}`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              </div>

              <p className="text-sm text-gray-600">{platform.instructions}</p>

              {!hasCode ? (
                <Button
                  onClick={() => handleInitiateVerification(platform.id)}
                  disabled={initiateVerificationMutation.isPending}
                  className="w-full"
                  data-testid={`button-start-verification-${platform.id}`}
                >
                  {initiateVerificationMutation.isPending 
                    ? "Starting..." 
                    : "Start Verification"
                  }
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded border">
                    <Label className="text-sm font-medium">Your Verification Code:</Label>
                    <code className="block mt-1 text-lg font-mono font-bold text-blue-700">
                      {verificationCodes[platform.id]}
                    </code>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`code-${platform.id}`}>
                      Enter the code you posted:
                    </Label>
                    <Input
                      id={`code-${platform.id}`}
                      value={inputCodes[platform.id] || ""}
                      onChange={(e) => setInputCodes(prev => ({
                        ...prev,
                        [platform.id]: e.target.value
                      }))}
                      placeholder="Enter verification code"
                      data-testid={`input-code-${platform.id}`}
                    />
                  </div>
                  
                  <Button
                    onClick={() => handleVerifyFollow(platform.id)}
                    disabled={verifyFollowMutation.isPending}
                    className="w-full"
                    data-testid={`button-verify-${platform.id}`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {verifyFollowMutation.isPending ? "Verifying..." : "Verify & Claim 10 Tokens"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        <div className="text-xs text-gray-500 text-center">
          Note: Each platform can only be verified once. Make sure to follow us and post the verification code before clicking verify.
        </div>
      </CardContent>
    </Card>
  );
}