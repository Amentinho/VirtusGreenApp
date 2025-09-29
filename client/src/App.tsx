import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import RewardsPage from "@/pages/marketplace";
import ProfilePage from "@/pages/profile-page";
import ReferralPage from "@/pages/referral-page";
import MyRewardsPage from "@/pages/my-rewards-page";
import MyTokensPage from "@/pages/my-tokens-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import ProductDetailPage from "@/pages/product-detail";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/product/:barcode" component={ProductDetailPage} />
      <ProtectedRoute path="/rewards" component={RewardsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/referral" component={ReferralPage} />
      <ProtectedRoute path="/my-tokens" component={MyTokensPage} />
      <ProtectedRoute path="/my-rewards" component={MyRewardsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;