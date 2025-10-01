import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TokenEarningsHistory from "@/components/token-earnings-history";

export default function MyTokensPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <img src="/virtusgreen-logo.png" alt="VirtusGreen" className="h-8 w-8" />
                <span className="text-2xl font-bold text-primary">VirtusGreen</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <TokenEarningsHistory />
      </main>
    </div>
  );
}