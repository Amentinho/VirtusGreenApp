import { Coffee, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PayPalButton from "@/components/PayPalButton";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SupportPage() {
  const [donationAmount, setDonationAmount] = useState("5.00");
  const [showPayPal, setShowPayPal] = useState(false);
  const { toast } = useToast();
  
  const cryptoWalletAddress = "0xa152Cf668fBe86De6F6d05d96c072Cd58F002eC0";
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(cryptoWalletAddress);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-green-500 p-4 rounded-full">
              <Coffee className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Buy Me a Coffee ☕
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Thank you for using VirtusGreen! Your support helps us continue building tools 
            that make eco-friendly shopping easier for everyone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 hover:border-green-500 transition-colors" data-testid="card-paypal-donation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.743a.77.77 0 0 1 .76-.634h8.236c2.97 0 5.018 1.328 5.018 4.456 0 3.741-2.568 5.835-6.094 5.835H9.726l-1.367 7.636a.641.641 0 0 1-.633.634h-.65zm7.657-13.395h-1.854l-.854 4.756h1.854c1.654 0 3.017-.854 3.017-2.757 0-1.654-.987-2.07-2.163-2.07z" />
                </svg>
                PayPal Donation
              </CardTitle>
              <CardDescription>
                Support via PayPal - Quick and secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Choose Amount (USD)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["5.00", "10.00", "25.00"].map((amount) => (
                    <Button
                      key={amount}
                      variant={donationAmount === amount ? "default" : "outline"}
                      onClick={() => setDonationAmount(amount)}
                      data-testid={`button-amount-${amount}`}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="Custom amount"
                    min="1"
                    step="0.01"
                    data-testid="input-custom-amount"
                  />
                </div>
              </div>
              
              {!showPayPal ? (
                <Button 
                  onClick={() => setShowPayPal(true)} 
                  className="w-full bg-[#0070BA] hover:bg-[#005ea6]"
                  data-testid="button-show-paypal"
                >
                  Donate with PayPal
                </Button>
              ) : (
                <div className="space-y-2">
                  <PayPalButton 
                    amount={donationAmount}
                    currency="USD"
                    intent="CAPTURE"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPayPal(false)}
                    className="w-full"
                    data-testid="button-cancel-paypal"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 transition-colors" data-testid="card-crypto-donation">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                Crypto Donation
              </CardTitle>
              <CardDescription>
                ETH or USDC on Base Network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={cryptoWalletAddress}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Wallet Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cryptoWalletAddress}
                    readOnly
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-mono text-xs"
                    data-testid="input-wallet-address"
                  />
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline"
                    data-testid="button-copy-address"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Important:
                </p>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Only send ETH or USDC</li>
                  <li>Use Base network only</li>
                  <li>Double-check the address before sending</li>
                  <li>Transactions are irreversible</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                💚 Every contribution helps us maintain and improve VirtusGreen
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                All donations go directly to supporting development and keeping the app free for everyone
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
