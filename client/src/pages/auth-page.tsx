import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, loginSchema, InsertUser, LoginCredentials } from "@shared/schema";
import { PasswordRecoveryModal } from "@/components/PasswordRecoveryModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Redirect } from "wouter";
import { Eye, EyeOff, Sparkles, QrCode } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LanguageSelector from "@/components/language-selector";
import { useTranslation } from "react-i18next";
import { parseApiError } from "@/lib/errors";

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
        description: parseApiError(error),
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (data: LoginCredentials) => {
    try {
      await loginMutation.mutateAsync(data);
      setShowVerificationLink(false);
    } catch (error: any) {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.emailNotVerified) {
          setUserEmailForVerification(data.usernameOrEmail);
          setEmailVerificationDialogOpen(true);
          setShowVerificationLink(true);
          return;
        }
      } catch {
        if (error.message && error.message.includes("User not verified")) {
          setUserEmailForVerification(data.usernameOrEmail);
          setEmailVerificationDialogOpen(true);
          setShowVerificationLink(true);
          return;
        }
      }
      toast({
        title: t('auth.loginFailed'),
        description: parseApiError(error),
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl text-sm bg-white/8 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-[#c0fa79]/50 focus:bg-white/10 transition-colors";
  const labelClass = "block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wide";
  const errorClass = "text-xs text-red-400 mt-1";

  return (
    <div
      className="min-h-screen grid md:grid-cols-2"
      style={{ background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" }}
    >
      {/* Language selector */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      {/* Left — form panel */}
      <div className="flex flex-col justify-center px-8 py-16 md:py-0">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <img
              src="/logo.png"
              alt="VirtusGreen"
              className="h-9 w-auto object-contain brightness-0 invert"
            />
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Tabs defaultValue="login">
              <TabsList
                className="grid w-full grid-cols-2 mb-6 p-1 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-sm font-semibold text-white/50 data-[state=active]:text-[#043231] data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-login"
                >
                  {t('auth.login')}
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="rounded-lg text-sm font-semibold text-white/50 data-[state=active]:text-[#043231] data-[state=active]:shadow-sm transition-all"
                  data-testid="tab-register"
                >
                  {t('auth.register')}
                </TabsTrigger>
              </TabsList>

              {/* ── Login ── */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div>
                    <label className={labelClass}>{t('auth.usernameOrEmail')}</label>
                    <input
                      {...loginForm.register("usernameOrEmail")}
                      placeholder={t('auth.enterUsernameOrEmail')}
                      data-testid="input-username-email"
                      required
                      className={inputClass}
                    />
                    {loginForm.formState.errors.usernameOrEmail && (
                      <p className={errorClass}>{loginForm.formState.errors.usernameOrEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>{t('auth.password')}</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        {...loginForm.register("password")}
                        data-testid="input-password"
                        required
                        className={inputClass + " pr-10"}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        data-testid="button-toggle-password-visibility"
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className={errorClass}>{loginForm.formState.errors.password.message}</p>
                    )}
                    <div className={`mt-2 ${showVerificationLink ? 'flex justify-between' : 'text-right'} text-xs`}>
                      {showVerificationLink && (
                        <button
                          type="button"
                          className="text-[#c0fa79]/70 hover:text-[#c0fa79]"
                          data-testid="link-verify-email"
                          onClick={() => { setUserEmailForVerification(""); setEmailVerificationDialogOpen(true); }}
                        >
                          {t('auth.verifyEmailAgain')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-[#c0fa79]/70 hover:text-[#c0fa79]"
                        data-testid="link-forgot-password"
                        onClick={() => setForgotPasswordOpen(true)}
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50"
                    style={{ background: "#c0fa79", color: "#043231" }}
                  >
                    {loginMutation.isPending ? t('auth.loggingIn') : t('auth.login')}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className="px-3 text-[10px] uppercase tracking-widest text-white/30"
                      style={{ background: "#043231" }}
                    >
                      {t('auth.orContinueWith')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.href = "/api/oauth/google/login"}
                  data-testid="button-google-login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white border border-white/15 hover:border-white/25 transition-all"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <FaGoogle className="h-4 w-4" />
                  {t('auth.continueWithGoogle')}
                </button>
              </TabsContent>

              {/* ── Register ── */}
              <TabsContent value="register" className="space-y-4">
                <form
                  onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div>
                    <label className={labelClass}>{t('auth.username')}</label>
                    <input
                      {...registerForm.register("username")}
                      data-testid="input-register-username"
                      required
                      className={inputClass}
                    />
                    {registerForm.formState.errors.username && (
                      <p className={errorClass}>{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>{t('auth.email')}</label>
                    <input
                      type="email"
                      {...registerForm.register("email")}
                      data-testid="input-register-email"
                      required
                      className={inputClass}
                    />
                    {registerForm.formState.errors.email && (
                      <p className={errorClass}>{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>{t('auth.password')}</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        {...registerForm.register("password")}
                        data-testid="input-register-password"
                        required
                        className={inputClass + " pr-10"}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        data-testid="button-toggle-register-password-visibility"
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className={errorClass}>{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>{t('auth.confirmPassword')}</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        {...registerForm.register("confirmPassword")}
                        data-testid="input-confirm-password"
                        required
                        className={inputClass + " pr-10"}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password-visibility"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className={errorClass}>{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>{t('auth.referralCode')}</label>
                    <input
                      {...registerForm.register("usedReferralCode")}
                      placeholder="Enter referral code (optional)"
                      data-testid="input-referral-code"
                      className={inputClass}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50"
                    style={{ background: "#c0fa79", color: "#043231" }}
                  >
                    {registerMutation.isPending ? t('auth.registering') : t('auth.register')}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className="px-3 text-[10px] uppercase tracking-widest text-white/30"
                      style={{ background: "#043231" }}
                    >
                      {t('auth.orContinueWith')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.location.href = "/api/oauth/google/login"}
                  data-testid="button-google-register"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white border border-white/15 hover:border-white/25 transition-all"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <FaGoogle className="h-4 w-4" />
                  {t('auth.continueWithGoogle')}
                </button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Right — marketing panel (desktop only) */}
      <div className="hidden md:flex flex-col justify-center px-12 py-16 relative overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(192,250,121,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-sm">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase text-[#c0fa79] bg-[#c0fa79]/10 border border-[#c0fa79]/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c0fa79] animate-pulse" />
            {t('auth.eyebrow', 'Know your food')}
          </span>

          <h1
            className="text-4xl font-light text-white mb-4 leading-[1.1]"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {t('auth.trackImpactTitle', 'Track Your Environmental Impact')}
          </h1>
          <p className="text-white/50 text-base leading-relaxed font-light mb-10">
            {t('auth.trackImpactDescription', 'Scan any product, see its full CO₂, water and energy footprint — powered by OpenFoodFacts.')}
          </p>

          <div className="space-y-4">
            <div
              className="flex items-start gap-4 rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-none mt-0.5"
                style={{ background: "rgba(192,250,121,0.12)" }}
              >
                <QrCode className="w-4 h-4 text-[#c0fa79]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">
                  {t('auth.productScanningTitle', 'Instant product scanning')}
                </p>
                <p className="text-xs text-white/45 leading-relaxed">
                  {t('auth.productScanningDesc', 'Scan any barcode and get full environmental data in seconds — no account needed.')}
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-4 rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-none mt-0.5"
                style={{ background: "rgba(192,250,121,0.12)" }}
              >
                <Sparkles className="w-4 h-4 text-[#c0fa79]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">
                  {t('auth.earnRewardsTitle', 'Earn Green Tokens')}
                </p>
                <p className="text-xs text-white/45 leading-relaxed">
                  {t('auth.earnRewardsDesc', 'Register free to earn tokens for every scan and climb the leaderboard.')}
                </p>
              </div>
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
        <DialogContent
          data-testid="dialog-email-verification"
          style={{
            background: "linear-gradient(145deg, #021c1b, #043231)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "white",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">{t('auth.emailVerificationRequired')}</DialogTitle>
            <DialogDescription className="text-white/50">
              {t('auth.userNotVerified')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-white/60">
              {userEmailForVerification
                ? t('auth.verificationEmailSentMessage')
                : t('auth.enterEmailForVerification')}
            </p>
            {!userEmailForVerification && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wide">
                  {t('auth.emailAddress')}
                </label>
                <input
                  id="verification-email"
                  type="email"
                  placeholder={t('auth.enterEmailAddress')}
                  onChange={(e) => setUserEmailForVerification(e.target.value)}
                  data-testid="input-verification-email"
                  className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/8 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-[#c0fa79]/50 transition-colors"
                />
              </div>
            )}
            <p className="text-sm text-white/50">
              {userEmailForVerification
                ? t('auth.verificationLinkResend')
                : t('auth.verificationLinkWillSend')}
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white/70 border border-white/15 hover:border-white/25 transition-all"
              style={{ background: "rgba(255,255,255,0.05)" }}
              onClick={() => { setEmailVerificationDialogOpen(false); setUserEmailForVerification(""); }}
              data-testid="button-dialog-close"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => { if (userEmailForVerification) resendVerificationMutation.mutate(userEmailForVerification); }}
              disabled={resendVerificationMutation.isPending || !userEmailForVerification}
              data-testid="button-resend-verification"
              className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
              style={{ background: "#c0fa79", color: "#043231" }}
            >
              {resendVerificationMutation.isPending ? t('common.loading') : t('auth.resendEmail')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
