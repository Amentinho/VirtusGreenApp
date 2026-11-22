import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Camera, ArrowRight, QrCode, Sparkles } from "lucide-react";
import ProductCard from "@/components/product-card";
import BarcodeScanner from "@/components/barcode-scanner";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";
import LanguageSelector from "@/components/language-selector";

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: activeSearch ? ["/api/products", "search", activeSearch] : ["/api/products"],
    queryFn: () => {
      const url = activeSearch
        ? `/api/products?search=${encodeURIComponent(activeSearch)}`
        : "/api/products";
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
    enabled: !!activeSearch,
    staleTime: 5 * 60 * 1000,
  });

  const handleSearch = () => {
    if (search.trim()) setActiveSearch(search.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" }}
    >
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <img
          src="/logo.png"
          alt="VirtusGreen"
          className="h-9 w-auto object-contain brightness-0 invert"
        />
        <div className="flex items-center gap-3">
          <LanguageSelector />
          {user ? (
            <>
              <TokenDisplay />
              <ProfileDropdown />
            </>
          ) : (
            <Link href="/auth">
              <button
                className="text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
                style={{ background: "#c0fa79", color: "#043231" }}
              >
                Sign in
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex-none text-center pt-14 pb-12 px-6">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase text-[#c0fa79] bg-[#c0fa79]/10 border border-[#c0fa79]/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c0fa79] animate-pulse" />
          {t("home.eyebrow", "OpenFoodFacts · Environmental Impact · EU Compliance")}
        </span>
        <h1
          className="text-4xl sm:text-5xl font-light text-white mb-4 leading-[1.08]"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {t("home.headline", "Know what's in")}<br />
          <em className="not-italic" style={{ color: "#c0fa79" }}>
            {t("home.headlineAccent", "your food.")}
          </em>
        </h1>
        <p className="text-white/55 text-lg max-w-md mx-auto leading-relaxed font-light mb-10">
          {t("home.subheadline", "Scan any product barcode or search by name to see its full environmental impact — CO₂, water, energy — powered by OpenFoodFacts.")}
        </p>

        {/* Scan button */}
        <button
          onClick={() => setShowScanner(true)}
          data-testid="button-scan-barcode"
          className="group inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-base font-bold transition-all duration-200 hover:gap-4 shadow-[0_10px_30px_-5px_rgba(192,250,121,0.35)]"
          style={{ background: "#c0fa79", color: "#043231" }}
        >
          <Camera className="w-5 h-5" />
          {t("home.scanBarcode", "Scan a Product")}
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </section>

      {/* Search */}
      <section className="flex-none px-6 pb-10 max-w-2xl mx-auto w-full">
        <div className="relative flex justify-center text-sm mb-6">
          <span className="px-4 text-white/30 font-medium text-xs uppercase tracking-widest">
            {t("home.orDivider", "— or search by name —")}
          </span>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("home.searchPlaceholder", "Search product name, brand…")}
              data-testid="input-product-search"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/8 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-[#c0fa79]/50 focus:bg-white/10 transition-colors"
            />
          </div>
          <button
            type="submit"
            data-testid="button-search"
            className="rounded-xl px-5 py-3 text-sm font-semibold text-[#043231] transition-all duration-150 hover:opacity-90"
            style={{ background: "#c0fa79" }}
          >
            {t("home.searchButton", "Search")}
          </button>
        </form>
      </section>

      {/* Results */}
      {activeSearch && (
        <section className="flex-1 px-6 pb-16 max-w-2xl mx-auto w-full">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-5">
            {t("home.searchResults", "Results for")} "{activeSearch}"
          </h2>
          {isLoading ? (
            <div className="text-center py-12 text-white/40">
              <div className="w-6 h-6 border-2 border-[#c0fa79]/40 border-t-[#c0fa79] rounded-full animate-spin mx-auto mb-3" />
              {t("common.loading", "Loading…")}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  searchState={{ search, activeSearch }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">
              {t("home.noProducts", "No products found. Try a different search.")}
            </div>
          )}
        </section>
      )}

      {/* Guest token upsell — only when not logged in */}
      {!user && (
        <div className="px-6 pb-12 max-w-2xl mx-auto w-full">
          <div
            className="rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
            style={{
              background: "rgba(192,250,121,0.07)",
              border: "1px solid rgba(192,250,121,0.18)",
            }}
          >
            <Sparkles className="w-6 h-6 text-[#c0fa79] flex-none" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white mb-0.5">
                {t("home.tokenCtaTitle", "Earn Green Tokens for every scan")}
              </p>
              <p className="text-xs text-white/50">
                {t("home.tokenCtaDesc", "Create a free account to track your impact, earn tokens, and join the leaderboard.")}
              </p>
            </div>
            <Link href="/auth">
              <button
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold flex-none transition-all duration-150"
                style={{ background: "#c0fa79", color: "#043231" }}
              >
                Register free <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-white/20 border-t border-white/5">
        © {new Date().getFullYear()} VirtusGreen ·{" "}
        <a href="mailto:hello@virtusgreen.com" className="hover:text-white/40 transition-colors">
          hello@virtusgreen.com
        </a>
      </footer>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("scanner.title", "Scan Barcode")}</DialogTitle>
          </DialogHeader>
          <BarcodeScanner />
        </DialogContent>
      </Dialog>
    </div>
  );
}
