import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Leaf, Droplets, Factory, Recycle, Zap, Mountain, Mail, User, Info } from "lucide-react";
import { Link } from "wouter";
import EnvImpactChart from "@/components/env-impact-chart";
import ShareButton from "@/components/share-button";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getCO2Comparison } from "@shared/co2-comparisons";

export default function ProductDetailPage() {
  const [match, params] = useRoute("/product/:barcode");
  const barcode = params?.barcode;
  
  // Scroll to top when page loads or barcode changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [barcode]);
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
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  data-testid="button-back"
                  onClick={() => {
                    sessionStorage.setItem('virtusgreen_from_product', 'true');
                    window.location.href = '/';
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <img src="/logo.jpg" alt="VirtusGreen" className="ml-4 h-12 w-auto" />
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="icon" data-testid="button-profile-nav">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
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
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  data-testid="button-back"
                  onClick={() => {
                    sessionStorage.setItem('virtusgreen_from_product', 'true');
                    window.location.href = '/';
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <img src="/logo.jpg" alt="VirtusGreen" className="ml-4 h-12 w-auto" />
              </div>
              <Link href="/profile">
                <Button variant="ghost" size="icon" data-testid="button-profile-nav">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
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
      icon: <Leaf className="h-5 w-5" />, 
      label: "Eco Score", 
      value: impact.ecoScore === "NA" ? "NA" : `${impact.ecoScore}/100`,
      description: "Overall environmental friendliness",
      isNA: impact.ecoScore === "NA"
    },
    { 
      icon: <Factory className="h-5 w-5" />, 
      label: "CO₂ Emissions", 
      value: impact.co2Emissions === "NA" ? "NA" : `${impact.co2Emissions}g/100g`,
      description: "Carbon footprint from OpenFoodFacts",
      isNA: impact.co2Emissions === "NA"
    },
    { 
      icon: <Zap className="h-5 w-5" />, 
      label: "Renewable Energy", 
      value: impact.renewableEnergy === "NA" ? "NA" : `${impact.renewableEnergy}%`,
      description: "Use of clean energy in production",
      isNA: impact.renewableEnergy === "NA"
    },
    { 
      icon: <Recycle className="h-5 w-5" />, 
      label: "Recyclable Materials", 
      value: impact.recyclableMaterials === "NA" ? "NA" : `${impact.recyclableMaterials}%`,
      description: "Packaging recyclability",
      isNA: impact.recyclableMaterials === "NA"
    },
    { 
      icon: <Droplets className="h-5 w-5" />, 
      label: "Water Usage", 
      value: impact.waterUsage === "NA" ? "NA" : `${impact.waterUsage}%`,
      description: "Water efficiency in production",
      isNA: impact.waterUsage === "NA"
    },
    { 
      icon: <Mountain className="h-5 w-5" />, 
      label: "Land Usage", 
      value: impact.landUsage === "NA" ? "NA" : `${impact.landUsage}%`,
      description: "Sustainable land management",
      isNA: impact.landUsage === "NA"
    },
  ];

  const getEcoScoreColor = (score: number | string) => {
    if (typeof score === 'number') {
      if (score >= 70) return "from-emerald-500 to-green-600";
      if (score >= 40) return "from-amber-500 to-orange-600";
      return "from-red-500 to-rose-600";
    }
    return "from-gray-400 to-gray-500";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                data-testid="button-back"
                onClick={() => {
                  sessionStorage.setItem('virtusgreen_from_product', 'true');
                  window.location.href = '/';
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <img src="/virtusgreen-logo.png" alt="VirtusGreen" className="ml-4 h-10 w-auto" />
            </div>
            <Link href="/profile">
              <Button variant="ghost" size="icon" data-testid="button-profile-nav">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Product Hero Header */}
          <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-lime-50 to-green-50 dark:from-emerald-900/30 dark:via-lime-900/20 dark:to-green-900/30 ring-1 ring-emerald-100/50">
            <CardHeader className="relative pb-8">
              <div className="absolute top-4 right-4">
                <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getEcoScoreColor(impact.ecoScore)} shadow-2xl ring-4 ring-white/50 flex items-center justify-center`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {impact.ecoScore === "NA" ? "NA" : impact.ecoScore}
                    </div>
                    {impact.ecoScore !== "NA" && (
                      <div className="text-xs text-white/90">/ 100</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pr-32">
                <CardTitle className="text-3xl mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent" data-testid="product-name">
                  {name}
                </CardTitle>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 ring-1 ring-emerald-200/50" data-testid="product-brand">
                    {brand}
                  </span>
                  <span className="px-3 py-1 bg-white/40 backdrop-blur-sm rounded-full text-xs text-gray-600">
                    {barcode}
                  </span>
                </div>
                <ShareButton
                  productId={product.barcode}
                  productName={product.name}
                  variant="product"
                />
              </div>
            </CardHeader>
          </Card>

          {/* CO2 Impact Circle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>CO₂ Impact</CardTitle>
                {impact.co2Emissions !== "NA" && typeof impact.co2Emissions === 'number' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-testid="button-co2-info"
                      >
                        <Info className="h-5 w-5 text-gray-600" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>CO₂ Impact Comparison</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
                          <p className="text-sm text-gray-600 mb-2">
                            This product's CO₂ emissions of <span className="font-bold text-green-700">{impact.co2Emissions}g/100g</span> is equivalent to:
                          </p>
                          <p className="text-lg font-semibold text-gray-900 flex items-start gap-2">
                            <Leaf className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                            <span>{getCO2Comparison(impact.co2Emissions, product.barcode)}</span>
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          💡 This comparison helps you understand the environmental impact in everyday terms
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {impact.co2Emissions === "NA" ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No CO₂ emissions data available</p>
                  <p className="text-sm mt-2">Data not found in OpenFoodFacts</p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div 
                    className={`relative w-48 h-48 rounded-full flex items-center justify-center shadow-2xl ring-8 ring-opacity-20 transition-all duration-300 hover:scale-105 ${
                      typeof impact.co2Emissions === 'number' && impact.co2Emissions < 100
                        ? "bg-gradient-to-br from-emerald-400 to-green-500 ring-emerald-200"
                        : typeof impact.co2Emissions === 'number' && impact.co2Emissions < 300
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 ring-amber-200"
                        : "bg-gradient-to-br from-red-400 to-rose-500 ring-red-200"
                    }`}
                    data-testid="co2-impact-circle"
                  >
                    <div className="text-center text-white">
                      <div className="text-5xl font-bold mb-2">
                        {impact.co2Emissions}
                      </div>
                      <div className="text-lg font-medium opacity-90">
                        g/100g
                      </div>
                      <div className="text-xs mt-2 opacity-80">
                        {typeof impact.co2Emissions === 'number' && impact.co2Emissions < 100
                          ? "Low Impact"
                          : typeof impact.co2Emissions === 'number' && impact.co2Emissions < 300
                          ? "Medium Impact"
                          : "High Impact"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                    className={`flex items-start gap-3 p-4 rounded-lg transition-all duration-200 ${
                      metric.isNA 
                        ? "border border-dashed border-gray-300 bg-gray-50/50" 
                        : "border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-md hover:border-emerald-200"
                    }`}
                    data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className={`mt-1 p-2 rounded-lg ${
                      metric.isNA 
                        ? "bg-gray-200 text-gray-400" 
                        : "bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600"
                    }`}>
                      {metric.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{metric.label}</span>
                        <span className={`font-bold ${
                          metric.isNA 
                            ? "text-gray-400" 
                            : "text-transparent bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text"
                        }`}>
                          {metric.value}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{metric.description}</p>
                      {metric.isNA && (
                        <p className="text-xs text-gray-400 mt-1 italic">No data from OpenFoodFacts</p>
                      )}
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
                      className="bg-primary hover:bg-primary/90"
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
                          className="bg-primary hover:bg-primary/90"
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