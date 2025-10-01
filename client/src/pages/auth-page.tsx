import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, loginSchema, InsertUser, LoginCredentials } from "@shared/schema";
import { PasswordRecoveryModal } from "@/components/PasswordRecoveryModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Redirect } from "wouter";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LanguageSelector from "@/components/language-selector";
import { useTranslation } from "react-i18next";
export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [emailVerificationDialogOpen, setEmailVerificationDialogOpen] = useState(false);
  const [userEmailForVerification, setUserEmailForVerification] = useState("");
  const [showVerificationLink, setShowVerificationLink] = useState(false);

  const loginForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  // Mutation for resending verification email
  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/resend-verification-email", { email });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('auth.verificationEmailSent'),
        description: data.message || t('auth.checkEmailForVerification'),
      });
      setEmailVerificationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.errorSendingEmail'),
        description: error.message || t('auth.failedToSendEmail'),
        variant: "destructive",
      });
    },
  });

  // Handle login form submission with email verification error handling
  const handleLogin = async (data: LoginCredentials) => {
    try {
      await loginMutation.mutateAsync(data);
      setShowVerificationLink(false); // Hide link on successful login
    } catch (error: any) {
      console.log("Login error caught:", error);
      
      // Check if it's a 403 email verification error
      try {
        const errorData = JSON.parse(error.message);
        console.log("Parsed error data:", errorData);
        
        if (errorData.emailNotVerified) {
          setUserEmailForVerification(data.usernameOrEmail);
          setEmailVerificationDialogOpen(true);
          setShowVerificationLink(true); // Show link after verification error
          return;
        }
      } catch (parseError) {
        console.log("Error parsing:", parseError);
        
        // Check if error message contains verification text directly
        if (error.message && error.message.includes("User not verified")) {
          setUserEmailForVerification(data.usernameOrEmail);
          setEmailVerificationDialogOpen(true);
          setShowVerificationLink(true); // Show link after verification error
          return;
        }
      }
      
      // For other errors, show regular toast
      toast({
        title: t('auth.loginFailed'),
        description: error.message || t('auth.loginError'),
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <img src="/logo.jpg" alt="VirtusGreen" className="h-16 w-auto" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="usernameOrEmail">{t('auth.usernameOrEmail')}</Label>
                    <Input
                      id="usernameOrEmail"
                      {...loginForm.register("usernameOrEmail")}
                      placeholder={t('auth.enterUsernameOrEmail')}
                      data-testid="input-username-email"
                      required
                    />
                    {loginForm.formState.errors.usernameOrEmail && (
                      <p className="text-sm text-red-600">
                        {loginForm.formState.errors.usernameOrEmail.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showLoginPassword ? "text" : "password"}
                        {...loginForm.register("password")}
                        data-testid="input-password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        data-testid="button-toggle-password-visibility"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-600">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                    <div className={`${showVerificationLink ? 'flex justify-between' : 'text-right'} text-sm`}>
                      {showVerificationLink && (
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          data-testid="link-verify-email"
                          onClick={() => {
                            setUserEmailForVerification("");
                            setEmailVerificationDialogOpen(true);
                          }}
                        >
                          {t('auth.verifyEmailAgain')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        data-testid="link-forgot-password"
                        onClick={() => setForgotPasswordOpen(true)}
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? t('auth.loggingIn') : t('auth.login')}
                  </Button>
                </form>

                {/* SSO Section - referenced from blueprint integration */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('auth.orContinueWith')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.location.href = "/api/oauth/google/login"}
                      className="w-full"
                      data-testid="button-google-login"
                    >
                      <FaGoogle className="mr-2 h-4 w-4" />
                      {t('auth.continueWithGoogle')}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={registerForm.handleSubmit((data) =>
                    registerMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">{t('auth.username')}</Label>
                    <Input
                      id="reg-username"
                      {...registerForm.register("username")}
                      data-testid="input-register-username"
                      required
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-red-600">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerForm.register("email")}
                      data-testid="input-register-email"
                      required
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-red-600">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        {...registerForm.register("password")}
                        data-testid="input-register-password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        data-testid="button-toggle-register-password-visibility"
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-red-600">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        {...registerForm.register("confirmPassword")}
                        data-testid="input-confirm-password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password-visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-code">{t('auth.referralCode')}</Label>
                    <Input
                      id="referral-code"
                      {...registerForm.register("usedReferralCode")}
                      placeholder="Enter referral code"
                      data-testid="input-referral-code"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? t('auth.registering') : t('auth.register')}
                  </Button>
                </form>

                {/* SSO Section for Registration */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('auth.orContinueWith')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.location.href = "/api/oauth/google/login"}
                      className="w-full"
                      data-testid="button-google-register"
                    >
                      <FaGoogle className="mr-2 h-4 w-4" />
                      {t('auth.continueWithGoogle')}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {t('auth.trackImpactTitle')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('auth.trackImpactDescription')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-2">
                {t('auth.productScanningTitle')}
              </h3>
              <p className="text-sm text-gray-500">
                {t('auth.productScanningDesc')}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-2">
                {t('auth.earnRewardsTitle')}
              </h3>
              <p className="text-sm text-gray-500">
                {t('auth.earnRewardsDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      <PasswordRecoveryModal 
        open={forgotPasswordOpen} 
        onOpenChange={setForgotPasswordOpen}
      />

      {/* Email Verification Dialog */}
      <Dialog open={emailVerificationDialogOpen} onOpenChange={setEmailVerificationDialogOpen}>
        <DialogContent data-testid="dialog-email-verification">
          <DialogHeader>
            <DialogTitle>{t('auth.emailVerificationRequired')}</DialogTitle>
            <DialogDescription>
              {t('auth.userNotVerified')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              {userEmailForVerification ? 
                t('auth.verificationEmailSentMessage') :
                t('auth.enterEmailForVerification')
              }
            </p>
            {!userEmailForVerification && (
              <div className="space-y-2">
                <Label htmlFor="verification-email">{t('auth.emailAddress')}</Label>
                <Input
                  id="verification-email"
                  type="email"
                  placeholder={t('auth.enterEmailAddress')}
                  onChange={(e) => setUserEmailForVerification(e.target.value)}
                  data-testid="input-verification-email"
                />
              </div>
            )}
            <p className="text-sm text-gray-600">
              {userEmailForVerification ? 
                t('auth.verificationLinkResend') :
                t('auth.verificationLinkWillSend')
              }
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEmailVerificationDialogOpen(false);
                setUserEmailForVerification("");
              }}
              data-testid="button-dialog-close"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (userEmailForVerification) {
                  resendVerificationMutation.mutate(userEmailForVerification);
                }
              }}
              disabled={resendVerificationMutation.isPending || !userEmailForVerification}
              data-testid="button-resend-verification"
            >
              {resendVerificationMutation.isPending ? t('common.loading') : t('auth.resendEmail')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}