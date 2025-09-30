import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePasswordSchema, updateProfileFormSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ArrowLeft, LogOut } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import ProfileCompletion from "@/components/profile-completion";
import SocialMediaVerification from "@/components/social-media-verification";
import { EvmWalletVerification } from "@/components/evm-wallet-verification";
import { TelegramVerification } from "@/components/telegram-verification";
import { z } from "zod";

type UpdatePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type UpdateProfileForm = z.infer<typeof updateProfileFormSchema>;

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "North Korea", "South Korea", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia",
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macedonia",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco",
  "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Helper function to format date from yyyy-mm-dd or Date to dd/mm/yyyy
const formatDateToDDMMYYYY = (date: string | Date | null): string => {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to parse dd/mm/yyyy to yyyy-mm-dd
const parseDDMMYYYY = (dateString: string): string => {
  const parts = dateString.split('/');
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const passwordForm = useForm<UpdatePasswordForm>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const profileForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      dateOfBirth: user?.dateOfBirth ? formatDateToDDMMYYYY(user.dateOfBirth) : "",
      country: user?.country || "",
      city: user?.city || "",
      gender: user?.gender as any || undefined,
    },
  });

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const profileMutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
      return apiRequest("POST", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/completion-status"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onPasswordSubmit = async (data: UpdatePasswordForm) => {
    try {
      await apiRequest("POST", "/api/user/password", data);
      passwordForm.reset();
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const onProfileSubmit = (data: UpdateProfileForm) => {
    // Convert dd/mm/yyyy to yyyy-mm-dd for backend
    const formattedData = {
      ...data,
      dateOfBirth: data.dateOfBirth ? parseDDMMYYYY(data.dateOfBirth) : undefined,
    };
    profileMutation.mutate(formattedData);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-green-600">Profile</h1>
            </div>
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Username</Label>
                <p className="text-gray-600">{user?.username}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-gray-600">{user?.email}</p>
              </div>
              <div>
                <Label>Referral Code</Label>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {user?.referralCode}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyReferralCode}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-600">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-600">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    {...passwordForm.register("confirmNewPassword")}
                  />
                  {passwordForm.formState.errors.confirmNewPassword && (
                    <p className="text-sm text-red-600">
                      {passwordForm.formState.errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Edit Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      data-testid="input-first-name"
                      {...profileForm.register("firstName")}
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      data-testid="input-last-name"
                      {...profileForm.register("lastName")}
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      data-testid="input-date-of-birth"
                      {...profileForm.register("dateOfBirth")}
                    />
                    {profileForm.formState.errors.dateOfBirth && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      onValueChange={(value) => profileForm.setValue("gender", value as any)}
                      defaultValue={profileForm.getValues("gender")}
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.gender && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.gender.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      onValueChange={(value) => profileForm.setValue("country", value)}
                      defaultValue={profileForm.getValues("country")}
                    >
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.country && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.country.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      data-testid="input-city"
                      {...profileForm.register("city")}
                    />
                    {profileForm.formState.errors.city && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.city.message}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={profileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {profileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <ProfileCompletion />
            <SocialMediaVerification />
            <EvmWalletVerification />
            <TelegramVerification />
          </div>
        </div>
      </main>
    </div>
  );
}