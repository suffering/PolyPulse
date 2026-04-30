"use client";

import { Wallet } from "lucide-react";
import { useWallet } from "@/lib/wallet/use-wallet";

export function UnauthenticatedPrompt() {
  const { connect } = useWallet();

  const wallets = [
    {
      id: "metamask",
      name: "MetaMask",
      tag: "Popular",
      icon: "🦊",
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      tag: "Mobile",
      icon: "📱",
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      tag: "Hardware",
      icon: "🔐",
    },
  ];

  const handleConnect = (walletId: string) => {
    // Connect with the specified wallet provider
    connect();
  };

  return (
    <div className="min-h-screen bg-[#04040a] flex items-center justify-center px-6">
      {/* Centered floating card with subtle indigo glow */}
      <div className="w-full max-w-sm rounded-xl border border-[#4B4BF7]/20 bg-[#0d0d14] p-8 shadow-[0_0_32px_rgba(75,75,247,0.08)]">
        {/* Wallet icon with soft indigo bloom */}
        <div className="flex justify-center mb-6">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Soft indigo radial bloom */}
            <div className="absolute inset-0 bg-gradient-radial from-[#4B4BF7]/10 to-transparent rounded-full blur-lg" />
            {/* Icon */}
            <Wallet className="w-10 h-10 text-[#4B4BF7] relative z-10" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium text-white mb-2">
            Connect your wallet
          </h2>
          <p className="text-sm text-white/40 font-mono">
            View your Polymarket portfolio, PnL, open positions, and trade history.
          </p>
        </div>

        {/* Wallet buttons */}
        <div className="space-y-2 mb-6">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet.id)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-[#1a1a2e] bg-[#161622] hover:bg-[#1e1e2e] hover:border-[#4B4BF7]/50 transition-all duration-150"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{wallet.icon}</span>
                <span className="text-sm font-medium text-white">{wallet.name}</span>
              </div>
              <span className="text-xs text-white/30 font-mono uppercase tracking-widest">
                {wallet.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1a1a2e] mb-4" />

        {/* Terms text */}
        <p className="text-xs text-white/30 text-center font-mono leading-relaxed">
          By connecting you agree to the Terms of Service. Non-custodial and secure.
        </p>
      </div>
    </div>
  );
}
