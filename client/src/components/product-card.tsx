import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import EnvImpactChart from "./env-impact-chart";
import ShareButton from "./share-button";
import { ChevronRight } from "lucide-react";

type ProductCardProps = {
  product: Product;
  searchState?: { search: string; activeSearch: string };
};

export default function ProductCard({ product, searchState }: ProductCardProps) {
  const { name, brand, environmentalImpact: impact } = product;

  const handleProductClick = () => {
    if (searchState) {
      sessionStorage.setItem('virtusgreen_search', searchState.search);
      sessionStorage.setItem('virtusgreen_activeSearch', searchState.activeSearch);
      sessionStorage.setItem('virtusgreen_from_product', 'true');
    }
  };

  const getEcoScoreColor = (score: number | string) => {
    if (typeof score === 'number') {
      if (score >= 70) return { bg: "from-emerald-500 to-green-600", text: "text-white", ring: "ring-emerald-200" };
      if (score >= 40) return { bg: "from-amber-500 to-orange-600", text: "text-white", ring: "ring-amber-200" };
      return { bg: "from-red-500 to-rose-600", text: "text-white", ring: "ring-red-200" };
    }
    return { bg: "from-gray-400 to-gray-500", text: "text-white", ring: "ring-gray-200" };
  };

  const colors = getEcoScoreColor(impact.ecoScore);

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/60 backdrop-blur-sm ring-1 ring-emerald-100/50 hover:ring-emerald-200 overflow-hidden" 
      data-testid={`product-card-${product.barcode}`}
    >
      <Link href={`/product/${product.barcode}`} className="block" onClick={handleProductClick}>
        {/* Eco Score Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${colors.bg} shadow-lg ${colors.ring} ring-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${colors.text}`}>
                {impact.ecoScore === "NA" ? "NA" : impact.ecoScore}
              </div>
              {impact.ecoScore !== "NA" && (
                <div className={`text-[10px] ${colors.text} opacity-90`}>/ 100</div>
              )}
            </div>
          </div>
        </div>

        <CardHeader className="pr-28">
          <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors">
            {name}
          </CardTitle>
          <Badge variant="secondary" className="w-fit text-xs">
            {brand}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-50/50 to-lime-50/30 dark:from-emerald-900/20 dark:to-lime-900/10 rounded-lg p-3 -mx-1">
            <EnvImpactChart impact={impact} />
          </div>
        </CardContent>
      </Link>
      
      <CardContent className="pt-0 pb-4">
        <div className="flex items-center justify-between">
          <ShareButton
            productId={product.barcode}
            productName={product.name}
            variant="product"
          />
          <div className="flex items-center text-xs text-muted-foreground group-hover:text-emerald-600 transition-colors">
            <span className="mr-1">View details</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
