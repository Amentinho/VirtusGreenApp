import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import TokenEarningsHistory from "@/components/token-earnings-history";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };

export default function MyTokensPage() {
  return (
    <div className="min-h-screen flex flex-col" style={bg}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <img src="/logo.png" alt="VirtusGreen" className="h-8 w-auto object-contain brightness-0 invert" />
        </div>
        <div className="flex items-center gap-3">
          <TokenDisplay />
          <ProfileDropdown />
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-8 pb-16 max-w-2xl mx-auto w-full pt-8">
        <TokenEarningsHistory />
      </main>
    </div>
  );
}
