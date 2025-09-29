import { useAuth } from "@/hooks/use-auth";
import { Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TokenDisplay() {
  const { user } = useAuth();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full hover:bg-green-100 transition-colors">
          <Coins className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">{user?.tokens || 0}</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Token Earnings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-green-600 mb-2">Current Balance</h3>
            <div className="flex items-center gap-2 text-lg">
              <Coins className="h-5 w-5 text-green-600" />
              <span className="font-bold">{user?.tokens || 0} tokens</span>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-green-600 mb-2">How to Earn Tokens</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Share your referral code with friends - earn 10 tokens when they sign up!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Share products on social media - earn 5 tokens per product (max 5 per day)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Share the VirtusGreen app with referral code - earn 10 tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Complete your profile - earn 5 tokens (one-time bonus)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Verify social media accounts (Instagram, LinkedIn, Twitter) - earn 10 tokens each</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Verify your EVM wallet - earn 10 tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>Verify your Telegram account - earn 10 tokens</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-green-600 mb-2">Use Your Tokens</h3>
            <p className="text-sm text-gray-600">
              Visit the marketplace to redeem your tokens for exclusive discounts and rewards from our partners!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}