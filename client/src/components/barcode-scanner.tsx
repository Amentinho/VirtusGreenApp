import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Scan } from "lucide-react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type BarcodeScannerProps = {
  onProductFound: (product: Product) => void;
};

export default function BarcodeScanner({ onProductFound }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", barcode],
    enabled: barcode.length > 0,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) {
      toast({
        title: "Error",
        description: "Please enter a barcode",
        variant: "destructive",
      });
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        placeholder="Enter product barcode..."
        className="flex-1"
      />
      <Button type="submit" disabled={isLoading}>
        <Scan className="h-4 w-4 mr-2" />
        {isLoading ? "Scanning..." : "Scan"}
      </Button>
    </form>
  );
}
