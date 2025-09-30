import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Camera, X } from "lucide-react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { useLocation } from "wouter";

export default function BarcodeScanner() {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { refetch, data: product, error, isLoading } = useQuery<Product>({
    queryKey: [`/api/products?barcode=${barcode}`],
    enabled: false,
  });

  // Handle successful product fetch
  useEffect(() => {
    if (product) {
      // Navigate to product detail page
      setLocation(`/product/${product.barcode}`);
      toast({
        title: "Product Found",
        description: `Found: ${product.name} by ${product.brand}`,
      });
    }
  }, [product, setLocation, toast]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.log("Product search error:", error);
      
      // Check if it's our custom "not found" error
      let errorMessage = "The product is not available in our database, can you please send us a message and we will add it?";
      
      try {
        // Parse error response if it's JSON
        const errorData = JSON.parse((error as any).message);
        if (errorData.errorType === "product_not_found") {
          errorMessage = "The product is not available in our database, can you please send us a message and we will add it?";
        } else {
          errorMessage = errorData.message || "No product found with this barcode";
        }
      } catch {
        // If not JSON, check the raw message
        if ((error as any).message && (error as any).message.includes("Product not found")) {
          errorMessage = "The product is not available in our database, can you please send us a message and we will add it?";
        }
      }
      
      toast({
        title: "Product Not Found",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) {
      toast({
        title: "Error",
        description: "Please enter a barcode",
        variant: "destructive",
      });
      return;
    }
    refetch();
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);

      // Initialize Html5Qrcode scanner
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      // Configure scanner with better settings
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          0,  // EAN_13
          1,  // EAN_8
          2,  // UPC_A
          3,  // UPC_E
          4,  // CODE_39
          5,  // CODE_93
          6,  // CODE_128
          7,  // ITF
          11, // QR_CODE
        ]
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          setBarcode(decodedText);
          stopScanning();
          refetch();
        },
        undefined
      );

    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to access camera",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Enter product barcode..."
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          <Scan className="h-4 w-4 mr-2" />
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </form>

      <div className="relative">
        {isScanning ? (
          <>
            <div 
              id="barcode-reader" 
              className="w-full rounded-lg overflow-hidden"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={stopScanning}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button onClick={startScanning} className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Start Camera Scanning
          </Button>
        )}
      </div>
    </div>
  );
}