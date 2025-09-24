import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { LoginCredentials, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      let isEmailNotVerified = false;
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.emailNotVerified) {
          errorMessage = "User not verified, please verify your email";
          isEmailNotVerified = true;
        }
      } catch {
        // If parsing fails, use the original error message
      }
      
      if (isEmailNotVerified) {
        // Custom handling for email verification error will be handled in the component
        throw new Error(JSON.stringify({ emailNotVerified: true, message: errorMessage }));
      } else {
        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
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