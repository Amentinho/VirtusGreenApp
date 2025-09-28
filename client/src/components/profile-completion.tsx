import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileCompletionStatus {
  complete: boolean;
  missingFields: string[];
}

interface ClaimResponse {
  awarded: boolean;
  tokensEarned: number;
  tokens: number;
}

export default function ProfileCompletion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: completionStatus, isLoading } = useQuery<ProfileCompletionStatus>({
    queryKey: ["/api/profile/completion-status"],
  });

  const claimMutation = useMutation({
    mutationFn: async (): Promise<ClaimResponse> => {
      const response = await fetch("/api/profile/claim-completion", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(await response.text() || "Failed to claim completion bonus");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate user data to refresh token count
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/completion-status"] });
      
      if (data.awarded) {
        toast({
          title: "Profile Completion Bonus!",
          description: `Congratulations! You earned ${data.tokensEarned} tokens for completing your profile.`,
        });
      } else {
        toast({
          title: "Already Claimed",
          description: "You've already claimed your profile completion bonus.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim profile completion bonus",
        variant: "destructive",
      });
    },
  });

  const handleClaimBonus = () => {
    if (completionStatus?.complete) {
      claimMutation.mutate();
    }
  };

  const getFieldDisplayName = (field: string) => {
    switch (field) {
      case "firstName":
        return "First Name";
      case "lastName":
        return "Last Name";
      case "dateOfBirth":
        return "Date of Birth";
      case "country":
        return "Country";
      case "city":
        return "City";
      case "gender":
        return "Gender";
      default:
        return field;
    }
  };

  const allFields = ["firstName", "lastName", "dateOfBirth", "country", "city", "gender"];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading profile completion status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-green-600" />
          Profile Completion (5 points)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {allFields.map((field) => {
            const isCompleted = !completionStatus?.missingFields.includes(field);
            return (
              <div key={field} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
                <span className={isCompleted ? "text-green-700" : "text-gray-600"}>
                  {getFieldDisplayName(field)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          {completionStatus?.complete ? (
            <Button
              onClick={handleClaimBonus}
              disabled={claimMutation.isPending}
              className="w-full"
              data-testid="button-claim-profile-completion"
            >
              {claimMutation.isPending ? "Claiming..." : "Claim 5 Tokens"}
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Complete your profile to earn 5 tokens!
              </p>
              <p className="text-xs text-gray-500">
                Missing: {completionStatus?.missingFields.map(getFieldDisplayName).join(", ")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}