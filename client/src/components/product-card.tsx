import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@shared/schema";
import { Link } from "wouter";
import EnvImpactChart from "./env-impact-chart";
import ShareButton from "./share-button";

type ProductCardProps = {
  product: Product;
  searchState?: { search: string; activeSearch: string };
};

export default function ProductCard({ product, searchState }: ProductCardProps) {
  const { name, brand, environmentalImpact: impact } = product;

  const handleProductClick = () => {
    // Save search state before navigating to product page
    if (searchState) {
      sessionStorage.setItem('virtusgreen_search', searchState.search);
      sessionStorage.setItem('virtusgreen_activeSearch', searchState.activeSearch);
      sessionStorage.setItem('virtusgreen_from_product', 'true');
    }
  };

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-lg" data-testid={`product-card-${product.barcode}`}>
      <Link href={`/product/${product.barcode}`} className="block" onClick={handleProductClick}>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <p className="text-sm text-gray-500">{brand}</p>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Eco Score</span>
              <span
                className={`text-lg font-bold ${
                  typeof impact.ecoScore === 'number' && impact.ecoScore >= 70
                    ? "text-green-600"
                    : typeof impact.ecoScore === 'number' && impact.ecoScore >= 40
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {impact.ecoScore === "NA" ? "NA" : `${impact.ecoScore}/100`}
              </span>
            </div>
            <EnvImpactChart impact={impact} />
          </div>
        </CardContent>
      </Link>
      
      <CardContent className="pt-0">
        <div className="flex justify-end">
          <ShareButton
            productId={product.barcode}
            productName={product.name}
            variant="product"
          />
        </div>
      </CardContent>
    </Card>
  );
}
