import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Scan } from "lucide-react";
import ProductCard from "@/components/product-card";
import TokenDisplay from "@/components/token-display";
import { Product } from "@shared/schema";
import { Link } from "wouter";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", search],
  });

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would trigger barcode scanning
    setSearch(barcode);
    setBarcode("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-green-600">EcoTrack</h1>
            </div>
            <div className="flex items-center gap-4">
              <TokenDisplay />
              <Link href="/marketplace">
                <Button variant="outline">Marketplace</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter product barcode..."
                className="flex-1"
              />
              <Button type="submit">
                <Scan className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </form>
          </div>

          <div className="col-span-full">
            <div className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="col-span-full text-center">Loading products...</div>
          ) : (
            products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
