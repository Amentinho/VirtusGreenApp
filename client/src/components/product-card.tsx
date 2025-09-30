import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import ShareButton from "./share-button";
import { ChevronRight, Leaf, Factory } from "lucide-react";

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

  const getCO2Color = (co2: number | string) => {
    if (typeof co2 === 'number') {
      if (co2 < 100) return { bg: "from-emerald-500 to-green-600", text: "text-white", ring: "ring-emerald-200" };
      if (co2 < 300) return { bg: "from-amber-500 to-orange-600", text: "text-white", ring: "ring-amber-200" };
      return { bg: "from-red-500 to-rose-600", text: "text-white", ring: "ring-red-200" };
    }
    return { bg: "from-gray-400 to-gray-500", text: "text-white", ring: "ring-gray-200" };
  };

  const ecoScoreColors = getEcoScoreColor(impact.ecoScore);
  const co2Colors = getCO2Color(impact.co2Emissions);

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/60 backdrop-blur-sm ring-1 ring-emerald-100/50 hover:ring-emerald-200 overflow-hidden" 
      data-testid={`product-card-${product.barcode}`}
    >
      <Link href={`/product/${product.barcode}`} className="block" onClick={handleProductClick}>
        <CardHeader>
          <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors">
            {name}
          </CardTitle>
          <Badge variant="secondary" className="w-fit text-xs">
            {brand}
          </Badge>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Eco Score */}
            <div className={`p-4 rounded-lg bg-gradient-to-br ${ecoScoreColors.bg} shadow-md hover:shadow-lg transition-shadow duration-200`}>
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="h-4 w-4 text-white" />
                <span className="text-xs font-medium text-white/90">Eco Score</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {impact.ecoScore === "NA" ? "NA" : impact.ecoScore}
              </div>
              {impact.ecoScore !== "NA" && (
                <div className="text-xs text-white/80">out of 100</div>
              )}
            </div>

            {/* CO2 Emissions */}
            <div className={`p-4 rounded-lg bg-gradient-to-br ${co2Colors.bg} shadow-md hover:shadow-lg transition-shadow duration-200`}>
              <div className="flex items-center gap-2 mb-2">
                <Factory className="h-4 w-4 text-white" />
                <span className="text-xs font-medium text-white/90">CO₂</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {impact.co2Emissions === "NA" ? "NA" : impact.co2Emissions}
              </div>
              {impact.co2Emissions !== "NA" && (
                <div className="text-xs text-white/80">g/100g</div>
              )}
            </div>
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
