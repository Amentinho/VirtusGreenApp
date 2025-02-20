import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, loginSchema, InsertUser, LoginCredentials } from "@shared/schema";
import { Redirect } from "wouter";
import { Leaf } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-3xl font-bold">
              <Leaf className="h-8 w-8 text-green-500" />
              VirtusGreen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={loginForm.handleSubmit((data) =>
                    loginMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...loginForm.register("username")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...loginForm.register("password")}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={registerForm.handleSubmit((data) =>
                    registerMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input
                      id="reg-username"
                      {...registerForm.register("username")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerForm.register("email")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      {...registerForm.register("password")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      {...registerForm.register("confirmPassword")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                    <Input
                      id="referral-code"
                      {...registerForm.register("usedReferralCode")}
                      placeholder="Enter referral code"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Registering..." : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Track Your Environmental Impact
          </h1>
          <p className="text-gray-600 mb-6">
            Join VirtusGreen to discover the environmental impact of your everyday
            products. Earn rewards for making sustainable choices and help build a
            greener future.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-2">
                Product Scanning
              </h3>
              <p className="text-sm text-gray-500">
                Scan barcodes to instantly see environmental impact scores
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-2">
                Earn Rewards
              </h3>
              <p className="text-sm text-gray-500">
                Get tokens for using the app and referring friends
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}