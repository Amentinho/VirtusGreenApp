import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Leaf, Droplets, Factory, Recycle, Zap, Mountain } from "lucide-react";
import { Link } from "wouter";
import EnvImpactChart from "@/components/env-impact-chart";
import ShareButton from "@/components/share-button";
import { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const [match, params] = useRoute("/product/:barcode");
  const barcode = params?.barcode;

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["/api/products", barcode],
    queryFn: async () => {
      const response = await fetch(`/api/products/${barcode}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Product not found");
      }
      return response.json();
    },
    enabled: !!barcode,
  });

  if (!match || !barcode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Invalid Product URL</h2>
            <p className="text-gray-600 mb-4">The product barcode is missing or invalid.</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="ml-4 text-xl font-bold text-green-600">Loading Product...</h1>
            </div>
          </div>
        </nav>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="ml-4 text-xl font-bold text-green-600">Product Not Found</h1>
            </div>
          </div>
        </nav>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find a product with barcode: <code className="bg-gray-100 px-2 py-1 rounded">{barcode}</code>
              </p>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { name, brand, environmentalImpact: impact } = product;

  const impactMetrics = [
    { 
      icon: <Leaf className="h-5 w-5 text-green-600" />, 
      label: "Eco Score", 
      value: `${impact.ecoScore}/100`,
      description: "Overall environmental friendliness"
    },
    { 
      icon: <Factory className="h-5 w-5 text-gray-600" />, 
      label: "CO₂ Emissions", 
      value: `${impact.co2Emissions}/100`,
      description: "Carbon footprint score"
    },
    { 
      icon: <Zap className="h-5 w-5 text-yellow-600" />, 
      label: "Renewable Energy", 
      value: `${impact.renewableEnergy}/100`,
      description: "Use of clean energy in production"
    },
    { 
      icon: <Recycle className="h-5 w-5 text-blue-600" />, 
      label: "Recyclable Materials", 
      value: `${impact.recyclableMaterials}/100`,
      description: "Packaging recyclability"
    },
    { 
      icon: <Droplets className="h-5 w-5 text-blue-400" />, 
      label: "Water Usage", 
      value: `${impact.waterUsage}/100`,
      description: "Water efficiency in production"
    },
    { 
      icon: <Mountain className="h-5 w-5 text-green-700" />, 
      label: "Land Usage", 
      value: `${impact.landUsage}/100`,
      description: "Sustainable land management"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="ml-4 text-xl font-bold text-green-600">Product Details</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Product Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2" data-testid="product-name">{name}</CardTitle>
                  <p className="text-lg text-gray-600" data-testid="product-brand">{brand}</p>
                  <p className="text-sm text-gray-500 mt-1">Barcode: {barcode}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`text-3xl font-bold ${
                    impact.ecoScore >= 70
                      ? "text-green-600"
                      : impact.ecoScore >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}>
                    {impact.ecoScore}/100
                  </div>
                  <ShareButton
                    productId={product.barcode}
                    productName={product.name}
                    variant="product"
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Environmental Impact Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <EnvImpactChart impact={impact} />
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {impactMetrics.map((metric, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-4 border rounded-lg"
                    data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="mt-1">{metric.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{metric.label}</span>
                        <span className="font-bold text-green-600">{metric.value}</span>
                      </div>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>About This Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p>
                  This product has been analyzed for its environmental impact across multiple dimensions. 
                  The eco-score provides an overall assessment, while individual metrics show specific 
                  areas of environmental performance.
                </p>
                <Separator className="my-4" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                  <span>Data source: OpenFoodFacts & VirtusGreen Analysis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}