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
  const { toast } = useToast();

  const { refetch } = useQuery<Product>({
    queryKey: ["/api/products", barcode],
    enabled: false,
    onSuccess: (product) => {
      if (product) {
        onProductFound(product);
        toast({
          title: "Product Found",
          description: `Found: ${product.name} by ${product.brand}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Product Not Found",
        description: "No product found with this barcode",
        variant: "destructive",
      });
    },
  });

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
      const codeReader = new BrowserMultiFormatReader();
      const videoInputDevices = await codeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        throw new Error('No camera found');
      }

      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        });
        videoRef.current.srcObject = stream;

        codeReader.decodeFromVideoElement(videoRef.current, (result, error) => {
          if (result) {
            setBarcode(result.getText());
            stopScanning();
            refetch();
          }
        });
      }
    } catch (error) {
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
        <Button type="submit">
          <Scan className="h-4 w-4 mr-2" />
          Search
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