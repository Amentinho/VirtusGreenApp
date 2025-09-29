import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Leaf, Droplets, Factory, Recycle, Zap, Mountain, Mail } from "lucide-react";
import { Link } from "wouter";
import EnvImpactChart from "@/components/env-impact-chart";
import ShareButton from "@/components/share-button";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ProductDetailPage() {
  const [match, params] = useRoute("/product/:barcode");
  const barcode = params?.barcode;
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  const { toast } = useToast();

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

  const contactMutation = useMutation({
    mutationFn: async (formData: typeof contactForm) => {
      return apiRequest("POST", "/api/contact", {
        ...formData,
        productName: product?.name
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your request has been sent to VirtusGreen team!",
      });
      setContactForm({ name: "", email: "", message: "" });
      setShowContactForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
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
      value: impact.ecoScore === "NA" ? "NA" : `${impact.ecoScore}/100`,
      description: "Overall environmental friendliness"
    },
    { 
      icon: <Factory className="h-5 w-5 text-gray-600" />, 
      label: "CO₂ Emissions", 
      value: impact.co2Emissions === "NA" ? "NA" : `${impact.co2Emissions}g/100g`,
      description: "Carbon footprint from OpenFoodFacts"
    },
    { 
      icon: <Zap className="h-5 w-5 text-yellow-600" />, 
      label: "Renewable Energy", 
      value: impact.renewableEnergy,
      description: "Use of clean energy in production"
    },
    { 
      icon: <Recycle className="h-5 w-5 text-blue-600" />, 
      label: "Recyclable Materials", 
      value: impact.recyclableMaterials,
      description: "Packaging recyclability"
    },
    { 
      icon: <Droplets className="h-5 w-5 text-blue-400" />, 
      label: "Water Usage", 
      value: impact.waterUsage,
      description: "Water efficiency in production"
    },
    { 
      icon: <Mountain className="h-5 w-5 text-green-700" />, 
      label: "Land Usage", 
      value: impact.landUsage,
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
                    typeof impact.ecoScore === 'number' && impact.ecoScore >= 70
                      ? "text-green-600"
                      : typeof impact.ecoScore === 'number' && impact.ecoScore >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}>
                    {impact.ecoScore === "NA" ? "NA" : `${impact.ecoScore}/100`}
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

          {/* Data Source Information and Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Data Source & Additional Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Environmental data disclaimer:</strong> This is an estimation of eco scoring coming from OpenFoodFacts. 
                    Only metrics with real data from OpenFoodFacts are displayed. 
                    Metrics showing "NA" indicate no data is available from the source.
                  </p>
                </div>
                
                <Separator />
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    If you want VirtusGreen to analyze the other metrics, please drop us a message.
                  </p>
                  
                  {!showContactForm ? (
                    <Button 
                      onClick={() => setShowContactForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-contact-analysis"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Request Additional Analysis
                    </Button>
                  ) : (
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <Input
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({...prev, name: e.target.value}))}
                          placeholder="Your name"
                          data-testid="input-contact-name"
                        />
                      </div>
                      
                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({...prev, email: e.target.value}))}
                          placeholder="your.email@example.com"
                          data-testid="input-contact-email"
                        />
                      </div>
                      
                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1">Message</label>
                        <Textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm(prev => ({...prev, message: e.target.value}))}
                          placeholder="Please analyze additional environmental metrics for this product..."
                          rows={4}
                          data-testid="textarea-contact-message"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => contactMutation.mutate(contactForm)}
                          disabled={!contactForm.name || !contactForm.email || !contactForm.message || contactMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-send-contact"
                        >
                          {contactMutation.isPending ? "Sending..." : "Send Message"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowContactForm(false)}
                          data-testid="button-cancel-contact"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Data source: OpenFoodFacts.org</span>
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}