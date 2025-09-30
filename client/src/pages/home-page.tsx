import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import ProductCard from "@/components/product-card";
import TokenDisplay from "@/components/token-display";
import BarcodeScanner from "@/components/barcode-scanner";
import ProfileDropdown from "@/components/profile-dropdown";
import { Product } from "@shared/schema";
import { Link } from "wouter";

export default function HomePage() {
  // Restore search only if coming from a product detail page
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromProduct = sessionStorage.getItem('virtusgreen_from_product');
      if (fromProduct === 'true') {
        return sessionStorage.getItem('virtusgreen_search') || "";
      }
    }
    return "";
  });
  
  const [activeSearch, setActiveSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromProduct = sessionStorage.getItem('virtusgreen_from_product');
      if (fromProduct === 'true') {
        return sessionStorage.getItem('virtusgreen_activeSearch') || "";
      }
    }
    return "";
  });

  // Clean up sessionStorage after both states are initialized
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fromProduct = sessionStorage.getItem('virtusgreen_from_product');
      if (fromProduct === 'true') {
        sessionStorage.removeItem('virtusgreen_from_product');
      } else {
        // Clear search if NOT coming from product page
        sessionStorage.removeItem('virtusgreen_search');
        sessionStorage.removeItem('virtusgreen_activeSearch');
      }
    }
  }, []);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: activeSearch ? ["/api/products", "search", activeSearch] : ["/api/products"],
    queryFn: () => {
      const url = activeSearch 
        ? `/api/products?search=${encodeURIComponent(activeSearch)}`
        : "/api/products";
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes to avoid re-fetching
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const handleSearch = () => {
    setActiveSearch(search);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-green-600">VirtusGreen</h1>
            </div>
            <div className="flex items-center gap-4">
              <TokenDisplay />
              <Link href="/rewards">
                <Button variant="outline">Rewards</Button>
              </Link>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full space-y-6">
            <BarcodeScanner />

            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search products by name, brand, or barcode..."
                className="flex-1"
                data-testid="input-product-search"
              />
              <Button variant="outline" onClick={handleSearch} data-testid="button-search">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="col-span-full">
            <h2 className="text-lg font-semibold mb-4">
              {activeSearch ? `Search Results for "${activeSearch}"` : "All Products"}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full text-center">Loading products...</div>
              ) : (
                products?.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product} 
                    searchState={{ search, activeSearch }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}