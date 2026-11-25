import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePasswordSchema, updateProfileFormSchema, Character } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, ArrowLeft, LogOut, User } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import ProfileCompletion from "@/components/profile-completion";
import SocialMediaVerification from "@/components/social-media-verification";
import { EvmWalletVerification } from "@/components/evm-wallet-verification";
import { TelegramVerification } from "@/components/telegram-verification";
import AvatarSelector from "@/components/avatar-selector";
import ProfileDisplaySelector from "@/components/profile-display-selector";
import { parseApiError } from "@/lib/errors";
import TokenDisplay from "@/components/token-display";
import { z } from "zod";

type UpdatePasswordForm = { currentPassword: string; newPassword: string; confirmNewPassword: string };
type UpdateProfileForm = z.infer<typeof updateProfileFormSchema>;

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","East Timor","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","North Korea","South Korea","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const formatDateToDDMMYYYY = (date: string | Date | null): string => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const parseDDMMYYYY = (s: string): string => {
  const p = s.split("/");
  if (p.length !== 3) return "";
  return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
};

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" };
const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm bg-white/8 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-[#c0fa79]/50 focus:bg-white/10 transition-colors";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  // Handle LinkedIn OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedin = params.get("linkedin");
    const error = params.get("error");
    if (linkedin === "verified") {
      toast({ title: "LinkedIn Connected! 🎉", description: `You earned ${params.get("tokens") || 10} tokens for verifying your LinkedIn account.` });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (linkedin === "already_verified") {
      toast({ title: "Already verified", description: "Your LinkedIn account was already connected." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (error?.startsWith("linkedin")) {
      toast({ title: "LinkedIn connection failed", description: "Please try again.", variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  const [copied, setCopied] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "🐶");
  const [displayPreference, setDisplayPreference] = useState<"avatar" | "character" | "custom">((user?.displayPreference as any) || "avatar");
  const [customProfileImage, setCustomProfileImage] = useState<string | null>(user?.customProfileImage || null);

  const passwordForm = useForm<UpdatePasswordForm>({ resolver: zodResolver(updatePasswordSchema) });
  const profileForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      dateOfBirth: user?.dateOfBirth ? formatDateToDDMMYYYY(user.dateOfBirth) : "",
      country: user?.country || "",
      city: user?.city || "",
      gender: (user?.gender as any) || undefined,
    },
  });

  const { data: characters } = useQuery<Character[]>({ queryKey: ["/api/characters"] });
  const { data: ownedCharacters } = useQuery<Character[]>({ queryKey: ["/api/users/characters"], enabled: !!user });
  const currentCharacter = characters?.find(c => c.id === user?.currentCharacterId);

  const equipMutation = useMutation({
    mutationFn: async (characterId: number) => apiRequest("POST", `/api/characters/${characterId}/equip`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Character equipped successfully" });
    },
    onError: (error: any) => toast({ title: "Error", description: parseApiError(error), variant: "destructive" }),
  });

  const profileMutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => apiRequest("POST", "/api/user/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/completion-status"] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error) => toast({ title: "Error", description: parseApiError(error), variant: "destructive" }),
  });

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Referral code copied to clipboard" });
    }
  };

  const onPasswordSubmit = async (data: UpdatePasswordForm) => {
    try {
      await apiRequest("POST", "/api/user/password", data);
      passwordForm.reset();
      toast({ title: "Success", description: "Password updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: parseApiError(error), variant: "destructive" });
    }
  };

  const onProfileSubmit = (data: UpdateProfileForm) => {
    profileMutation.mutate({
      ...data,
      dateOfBirth: data.dateOfBirth ? parseDDMMYYYY(data.dateOfBirth) : undefined,
      avatar: selectedAvatar,
      displayPreference,
      ...(customProfileImage ? { customProfileImage } : {}),
    } as any);
  };

  return (
    <div className="min-h-screen flex flex-col" style={bg}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <img src="/logo.png" alt="VirtusGreen" className="h-8 w-auto object-contain brightness-0 invert" />
        </div>
        <div className="flex items-center gap-3">
          <TokenDisplay />
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-8 pb-16 max-w-2xl mx-auto w-full pt-8 space-y-4">

        {/* Characters */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Your Characters</p>
          {ownedCharacters && ownedCharacters.length > 0 ? (
            <div className="space-y-4">
              {currentCharacter && (
                <div className="rounded-xl p-4" style={{ background: "rgba(192,250,121,0.07)", border: "1px solid rgba(192,250,121,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c0fa79]" />
                    <span className="text-xs font-bold text-[#c0fa79]">Currently Equipped</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={currentCharacter.ipfsLink} alt={currentCharacter.title} className="w-16 h-16 rounded-full object-cover ring-2 ring-[#c0fa79]/40 flex-none" data-testid="img-current-character" />
                    <div>
                      <p className="font-semibold text-white" data-testid="text-character-title">{currentCharacter.title}</p>
                      <p className="text-xs text-white/50 mt-0.5 leading-relaxed" data-testid="text-character-description">{currentCharacter.description}</p>
                    </div>
                  </div>
                </div>
              )}
              {ownedCharacters.filter(c => c.id !== user?.currentCharacterId).length > 0 && (
                <div>
                  <p className="text-xs text-white/35 mb-3">Switch character:</p>
                  <div className="grid grid-cols-4 gap-3">
                    {ownedCharacters.filter(c => c.id !== user?.currentCharacterId).map(character => (
                      <button
                        key={character.id}
                        onClick={() => equipMutation.mutate(character.id)}
                        disabled={equipMutation.isPending}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all border border-white/8 hover:border-[#c0fa79]/30 hover:bg-[#c0fa79]/05 disabled:opacity-50"
                        data-testid={`button-equip-character-${character.id}`}
                      >
                        <img src={character.ipfsLink} alt={character.title} className="w-12 h-12 rounded-full object-cover" data-testid={`img-character-${character.id}`} />
                        <span className="text-[11px] text-white/60 text-center leading-tight" data-testid={`text-character-name-${character.id}`}>{character.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <User className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm mb-4">You haven't purchased a character yet.</p>
              <Link href="/rewards">
                <button className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: "#c0fa79", color: "#043231" }} data-testid="button-browse-characters">
                  Browse Characters
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Account</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/35 mb-1">Username</p>
              <p className="text-sm text-white">{user?.username}</p>
            </div>
            <div>
              <p className="text-xs text-white/35 mb-1">Email</p>
              <p className="text-sm text-white">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-white/35 mb-1">Referral Code</p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 rounded-lg text-sm font-mono text-[#c0fa79]" style={{ background: "rgba(192,250,121,0.1)" }}>
                  {user?.referralCode}
                </code>
                <button onClick={copyReferralCode} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Change Password</p>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
            {(["currentPassword", "newPassword", "confirmNewPassword"] as const).map((field) => (
              <div key={field}>
                <input
                  id={field}
                  type="password"
                  className={inputClass}
                  placeholder={field === "currentPassword" ? "Current password" : field === "newPassword" ? "New password" : "Confirm new password"}
                  {...passwordForm.register(field)}
                />
                {passwordForm.formState.errors[field] && (
                  <p className="text-xs text-red-400 mt-1">{passwordForm.formState.errors[field]?.message}</p>
                )}
              </div>
            ))}
            <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: "#c0fa79", color: "#043231" }}>
              Update Password
            </button>
          </form>
        </div>

        {/* Edit Profile */}
        <div className="rounded-2xl p-5" style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">Edit Profile</p>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <ProfileDisplaySelector
              currentAvatar={selectedAvatar}
              currentCharacter={currentCharacter}
              currentDisplayPreference={displayPreference}
              customProfileImage={customProfileImage}
              onDisplayPreferenceChange={setDisplayPreference}
              onCustomImageChange={setCustomProfileImage}
            />
            <div className="border-t border-white/8 pt-4">
              <AvatarSelector currentAvatar={selectedAvatar} onSelect={setSelectedAvatar} />
            </div>
            <div className="border-t border-white/8 pt-4 grid gap-3 sm:grid-cols-2">
              {[
                { id: "firstName", label: "First Name", testId: "input-first-name" },
                { id: "lastName", label: "Last Name", testId: "input-last-name" },
              ].map(({ id, label, testId }) => (
                <div key={id}>
                  <label className="text-xs text-white/35 mb-1.5 block">{label}</label>
                  <input
                    id={id}
                    className={inputClass}
                    data-testid={testId}
                    {...profileForm.register(id as any)}
                  />
                  {(profileForm.formState.errors as any)[id] && (
                    <p className="text-xs text-red-400 mt-1">{(profileForm.formState.errors as any)[id]?.message}</p>
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs text-white/35 mb-1.5 block">Date of Birth</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="dd/mm/yyyy"
                  data-testid="input-date-of-birth"
                  {...profileForm.register("dateOfBirth")}
                />
                {profileForm.formState.errors.dateOfBirth && (
                  <p className="text-xs text-red-400 mt-1">{profileForm.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-white/35 mb-1.5 block">Gender</label>
                <Select onValueChange={(v) => profileForm.setValue("gender", v as any)} defaultValue={profileForm.getValues("gender")}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-white/8 border-white/15 text-white text-sm" data-testid="select-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Male", "Female", "Non-binary", "Prefer not to say"].map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/35 mb-1.5 block">Country</label>
                <Select onValueChange={(v) => profileForm.setValue("country", v)} defaultValue={profileForm.getValues("country")}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-white/8 border-white/15 text-white text-sm" data-testid="select-country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-white/35 mb-1.5 block">City</label>
                <input
                  id="city"
                  className={inputClass}
                  data-testid="input-city"
                  {...profileForm.register("city")}
                />
                {profileForm.formState.errors.city && (
                  <p className="text-xs text-red-400 mt-1">{profileForm.formState.errors.city.message}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
              style={{ background: "#c0fa79", color: "#043231" }}
              data-testid="button-save-profile"
            >
              {profileMutation.isPending ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Social / wallet verifications */}
        <ProfileCompletion />
        <SocialMediaVerification />
        <EvmWalletVerification />
        <TelegramVerification />
      </main>
    </div>
  );
}
