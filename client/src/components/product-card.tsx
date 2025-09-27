import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@shared/schema";
import EnvImpactChart from "./env-impact-chart";
import ShareButton from "./share-button";

export default function ProductCard({ product }: { product: Product }) {
  const { name, brand, environmentalImpact: impact } = product;

  return (
    <Card>
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
                impact.ecoScore >= 70
                  ? "text-green-600"
                  : impact.ecoScore >= 40
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {impact.ecoScore}/100
            </span>
          </div>
          <EnvImpactChart impact={impact} />
        </div>
        
        <div className="flex justify-end mt-4">
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
