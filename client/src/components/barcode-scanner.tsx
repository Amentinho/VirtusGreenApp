import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan, Camera, X, Send } from "lucide-react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { parseApiError } from "@/lib/errors";

export default function BarcodeScanner() {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { refetch, data: product, error, isLoading } = useQuery<Product>({
    queryKey: [`/api/products?barcode=${barcode}`],
    enabled: false,
  });

  const requestProductMutation = useMutation({
    mutationFn: async (data: { barcode: string; message: string }) => {
      return await apiRequest("POST", "/api/product-requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Request Sent",
        description: "Thank you! We'll add this product to our database soon.",
      });
      setShowRequestDialog(false);
      setRequestMessage("");
      setMissingBarcode("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: parseApiError(error),
        variant: "destructive",
      });
    },
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
      
      // Show request dialog for missing products
      setMissingBarcode(barcode);
      setShowRequestDialog(true);
    }
  }, [error, barcode]);

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

      // Check if camera permissions are available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Request camera permission first
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (permError) {
          console.error('Permission error:', permError);
          throw new Error("Camera permission denied. Please allow camera access in your browser settings and try again.");
        }
      } else {
        throw new Error("Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.");
      }

      // Initialize Html5Qrcode scanner
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      // Configure scanner with optimized settings for faster detection
      const config = {
        fps: 10, // Balance between speed and accuracy
        qrbox: { width: 250, height: 250 }, // Square box for better barcode detection
        aspectRatio: 1.777778, // 16:9 aspect ratio for better camera compatibility
        formatsToSupport: [
          0,  // EAN_13 (most common for products)
          1,  // EAN_8
          2,  // UPC_A
          3,  // UPC_E
          6,  // CODE_128
        ],
        disableFlip: false, // Allow scanning upside-down barcodes
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Use native barcode detector if available
        }
      };

      await scanner.start(
        { 
          facingMode: "environment"
        },
        config,
        (decodedText) => {
          console.log('Barcode detected:', decodedText);
          setBarcode(decodedText);
          stopScanning();
          // Trigger search immediately
          setTimeout(() => refetch(), 100);
        },
        (errorMessage) => {
          // Silently handle scanning errors (too verbose otherwise)
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('Scan error:', errorMessage);
          }
        }
      );

    } catch (error) {
      console.error('Camera error:', error);
      
      let errorMessage = "Failed to access camera";
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("Permission") || error.message.includes("NotAllowedError")) {
          errorMessage = "Camera permission denied. Please allow camera access in your browser settings and try again.";
        } else if (error.message.includes("NotFoundError")) {
          errorMessage = "No camera found on this device. Please make sure your device has a camera.";
        } else if (error.message.includes("NotReadableError")) {
          errorMessage = "Camera is already in use by another application. Please close other apps using the camera and try again.";
        } else if (error.message.includes("OverconstrainedError")) {
          errorMessage = "Camera constraints not supported. Try using a different camera.";
        } else if (error.message.includes("SecurityError") || error.message.includes("secure")) {
          errorMessage = "Camera access requires HTTPS. Please make sure you're accessing the app via HTTPS.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
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
    // Auto-start scanning when component mounts
    startScanning();
    
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        {isScanning ? (
          <>
            <div 
              id="barcode-reader" 
              className="w-full rounded-lg overflow-hidden"
            />
            <div className="mt-3 text-center text-sm text-gray-600">
              Position the barcode within the scanning area
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto mb-3 text-gray-400 animate-pulse" />
            <p className="text-sm text-gray-600">Initializing camera...</p>
          </div>
        )}
      </div>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Not Found</DialogTitle>
            <DialogDescription>
              We don't have this product in our database yet. Please help us by providing some information about it, and we'll add it soon!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Barcode</label>
              <Input value={missingBarcode} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Additional Information (Optional)</label>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Product name, brand, or any other details..."
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRequestDialog(false);
                setRequestMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => requestProductMutation.mutate({ barcode: missingBarcode, message: requestMessage })}
              disabled={requestProductMutation.isPending}
              data-testid="button-send-request"
            >
              <Send className="h-4 w-4 mr-2" />
              {requestProductMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}