import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Camera, X } from "lucide-react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader } from '@zxing/browser';

type BarcodeScannerProps = {
  onProductFound: (product: Product) => void;
};

export default function BarcodeScanner({ onProductFound }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const { toast } = useToast();

  const { refetch, data: product, error, isLoading } = useQuery<Product>({
    queryKey: [`/api/products?barcode=${barcode}`],
    enabled: false,
  });

  // Handle successful product fetch
  useEffect(() => {
    if (product) {
      onProductFound(product);
      toast({
        title: "Product Found",
        description: `Found: ${product.name} by ${product.brand}`,
      });
    }
  }, [product, onProductFound, toast]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.log("Product search error:", error);
      
      // Check if it's our custom "not found" error
      let errorMessage = "The item is not in the database";
      
      try {
        // Parse error response if it's JSON
        const errorData = JSON.parse((error as any).message);
        if (errorData.errorType === "product_not_found") {
          errorMessage = "The item is not in the database";
        } else {
          errorMessage = errorData.message || "No product found with this barcode";
        }
      } catch {
        // If not JSON, check the raw message
        if ((error as any).message && (error as any).message.includes("Product not found")) {
          errorMessage = "The item is not in the database";
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;

      // Initialize code reader
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Start continuous scanning
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        undefined, // Let browser pick the camera
        videoRef.current,
        (result, err) => {
          if (result) {
            const scannedBarcode = result.getText();
            setBarcode(scannedBarcode);
            stopScanning();
            refetch();
          }
        }
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

  const stopScanning = () => {
    setIsScanning(false);
    if (codeReaderRef.current) {
      // Clean up the code reader
      codeReaderRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
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
            <video
              ref={videoRef}
              className="w-full aspect-video rounded-lg bg-black"
              autoPlay
              playsInline
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
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