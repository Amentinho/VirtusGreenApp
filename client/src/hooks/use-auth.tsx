import { createContext, ReactNode, useContext, useEffect, useState, useRef } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { LoginCredentials, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LoginStreakDialog } from "@/components/login-streak-dialog";

type StreakData = {
  weekDays: Array<{
    day: string;
    date: Date;
    loggedIn: boolean;
    tokens: number;
  }>;
  consecutiveDays: number;
  totalTokensThisWeek: number;
};

type TodayReward = {
  tokensAwarded: number;
  consecutiveDays: number;
  isNewLogin: boolean;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<{ message: string; emailSent: boolean }, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [todayReward, setTodayReward] = useState<TodayReward | null>(null);
  const lastProcessedUserIdRef = useRef<string | null>(null);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user, i18n]);

  const recordLoginStreak = async () => {
    try {
      const loginRes = await apiRequest("POST", "/api/login-streak");
      const loginData = await loginRes.json();
      
      const streakRes = await apiRequest("GET", "/api/login-streak/current");
      const streakInfo = await streakRes.json();
      
      if (streakInfo.weekDays) {
        streakInfo.weekDays = streakInfo.weekDays.map((day: any) => ({
          ...day,
          date: new Date(day.date)
        }));
      }
      
      if (loginData.isNewLogin && loginData.tokensAwarded > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
      
      setTodayReward(loginData);
      setStreakData(streakInfo);
      
      if (loginData.isNewLogin) {
        setShowStreakDialog(true);
      }
    } catch (err) {
      console.error("Failed to fetch login streak:", err);
    }
  };

  useEffect(() => {
    if (user && user.id && lastProcessedUserIdRef.current !== user.id) {
      lastProcessedUserIdRef.current = user.id;
      recordLoginStreak();
    } else if (!user) {
      lastProcessedUserIdRef.current = null;
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      lastProcessedUserIdRef.current = user.id;
      await recordLoginStreak();
    },
    onError: (error: Error) => {
      throw error;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (data: { message: string; emailSent: boolean }) => {
      // Registration no longer automatically logs in user
      toast({
        title: "Registration Successful!",
        description: data.message || "Please check your email to verify your account.",
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      let showRecoverPassword = false;
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.message === "The account already exists") {
          errorMessage = "The account already exists";
          showRecoverPassword = true;
        }
      } catch {
        // If parsing fails, use the original error message
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
        action: showRecoverPassword ? (
          <button 
            className="text-sm underline"
            onClick={() => {/* TODO: Implement password recovery */}}
          >
            Recover Password
          </button>
        ) : undefined,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
      <LoginStreakDialog
        open={showStreakDialog}
        onOpenChange={setShowStreakDialog}
        streakData={streakData}
        todayReward={todayReward}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}