import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Coffee, Wallet, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import PayPalButton from "@/components/PayPalButton";
import TokenDisplay from "@/components/token-display";
import ProfileDropdown from "@/components/profile-dropdown";

const bg = { background: "linear-gradient(145deg, #021c1b 0%, #043231 55%, #062e2c 100%)" };
const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" };
const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm bg-white/8 border border-white/15 text-white placeholder:text-white/30 outline-none focus:border-[#c0fa79]/50 focus:bg-white/10 transition-colors";
const cryptoWalletAddress = "0xa152Cf668fBe86De6F6d05d96c072Cd58F002eC0";

export default function SupportPage() {
  const { toast } = useToast();
  const [donationAmount, setDonationAmount] = useState("5.00");
  const [showPayPal, setShowPayPal] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(cryptoWalletAddress).catch(() => {});
    toast({ title: "Copied!", description: "Wallet address copied to clipboard" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={bg}>
      {/* Nav */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-[72px] flex-none">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <img src="/logo.png" alt="VirtusGreen" className="h-8 w-auto object-contain brightness-0 invert" />
        </div>
        <div className="flex items-center gap-3">
          <TokenDisplay />
          <ProfileDropdown />
        </div>
      </header>

      <main className="flex-1 px-6 sm:px-8 pb-16 max-w-2xl mx-auto w-full pt-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "rgba(192,250,121,0.12)" }}>
            <Coffee className="w-6 h-6 text-[#c0fa79]" />
          </div>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Support VirtusGreen
          </h1>
          <p className="text-white/45 text-sm mt-1 max-w-xs mx-auto">Your support helps us build tools that make eco-friendly shopping easier for everyone</p>
        </div>

        <div className="space-y-4">
          {/* PayPal card */}
          <div className="rounded-2xl p-5" style={cardStyle} data-testid="card-paypal-donation">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: "rgba(0,112,186,0.18)" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0070BA">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.743a.77.77 0 0 1 .76-.634h8.236c2.97 0 5.018 1.328 5.018 4.456 0 3.741-2.568 5.835-6.094 5.835H9.726l-1.367 7.636a.641.641 0 0 1-.633.634h-.65z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">PayPal Donation</p>
                <p className="text-xs text-white/40">Quick and secure</p>
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Choose Amount (USD)</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {["5.00", "10.00", "25.00"].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDonationAmount(amount)}
                  className="py-2 rounded-xl text-sm font-semibold transition-all"
                  style={donationAmount === amount
                    ? { background: "#c0fa79", color: "#043231" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                  data-testid={`button-amount-${amount}`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className={inputClass + " mb-3"}
              placeholder="Custom amount"
              min="1"
              step="0.01"
              data-testid="input-custom-amount"
            />

            {!showPayPal ? (
              <button
                onClick={() => setShowPayPal(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: "#0070BA" }}
                data-testid="button-show-paypal"
              >
                Donate with PayPal
              </button>
            ) : (
              <div className="space-y-2">
                <PayPalButton amount={donationAmount} currency="USD" intent="CAPTURE" />
                <button
                  onClick={() => setShowPayPal(false)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/15 hover:border-white/25 transition-all"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  data-testid="button-cancel-paypal"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Crypto card */}
          <div className="rounded-2xl p-5" style={cardStyle} data-testid="card-crypto-donation">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-none" style={{ background: "rgba(192,250,121,0.12)" }}>
                <Wallet className="w-4 h-4 text-[#c0fa79]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Crypto Donation</p>
                <p className="text-xs text-white/40">ETH or USDC on Base Network</p>
              </div>
            </div>

            {/* QR code on white background */}
            <div className="flex justify-center rounded-xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.95)" }}>
              <QRCodeSVG value={cryptoWalletAddress} size={180} level="H" includeMargin />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Wallet Address</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={cryptoWalletAddress}
                readOnly
                className={inputClass + " font-mono text-xs"}
                data-testid="input-wallet-address"
              />
              <button
                onClick={copyAddress}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold flex-none transition-all"
                style={{ background: "rgba(192,250,121,0.12)", color: "#c0fa79", border: "1px solid rgba(192,250,121,0.2)" }}
                data-testid="button-copy-address"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "rgba(192,250,121,0.07)", border: "1px solid rgba(192,250,121,0.15)" }}>
              <p className="font-semibold text-[#c0fa79]/90 mb-1.5">Important</p>
              {["Only send ETH or USDC", "Use Base network only", "Double-check the address before sending", "Transactions are irreversible"].map((note) => (
                <p key={note} className="text-white/50 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#c0fa79]/40 flex-none mt-1.5" />
                  {note}
                </p>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center py-2">
            <p className="text-xs text-white/35">💚 Every contribution helps keep VirtusGreen free for everyone</p>
          </div>
        </div>
      </main>
    </div>
  );
}
