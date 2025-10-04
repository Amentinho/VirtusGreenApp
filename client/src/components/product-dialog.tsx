import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@shared/schema";
import ProductCard from "./product-card";

type ProductDialogProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ProductDialog({ product, isOpen, onClose }: ProductDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        <ProductCard product={product} />
      </DialogContent>
    </Dialog>
  );
}
