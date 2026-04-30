"use client";

import { Wallet } from "lucide-react";
import { useWallet } from "@/lib/wallet/use-wallet";

export function UnauthenticatedPrompt() {
  const { connect } = useWallet();

  return (
    <div className="min-h-screen bg-[#04040a] flex items-center justify-center px-6">
      {/* Square card */}
      <div className="w-[360px] aspect-square rounded-xl border border-[#4B4BF7]/20 bg-[#0d0d14] p-8 flex flex-col items-center justify-between shadow-[0_0_32px_rgba(75,75,247,0.08)]">
        {/* Top: Icon */}
        <div className="flex flex-col items-center gap-5 mt-2">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#4B4BF7]/10 rounded-full blur-lg" />
            <Wallet className="w-10 h-10 text-[#4B4BF7] relative z-10" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-medium text-white text-center">
            Connect your wallet
          </h2>
        </div>

        {/* Middle: single connect button */}
        <button
          type="button"
          onClick={() => connect()}
          className="w-full px-4 py-3 rounded-lg border border-[#4B4BF7]/40 bg-[#4B4BF7]/10 text-[#4B4BF7] text-sm font-semibold tracking-wide hover:bg-[#4B4BF7]/20 hover:border-[#4B4BF7]/60 transition-all duration-150"
        >
          Connect Wallet
        </button>

        {/* Bottom: terms */}
        <p className="text-[11px] text-white/25 text-center font-mono leading-relaxed">
          By connecting you agree to the Terms of Service.
          <br />
          Non-custodial and secure.
        </p>
      </div>
    </div>
  );
}
