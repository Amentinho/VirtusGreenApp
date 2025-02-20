import { useAuth } from "@/hooks/use-auth";
import { Coins } from "lucide-react";

export default function TokenDisplay() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
      <Coins className="h-4 w-4 text-green-600" />
      <span className="font-medium text-green-600">{user?.tokens || 0}</span>
    </div>
  );
}
