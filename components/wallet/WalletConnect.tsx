"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet/use-wallet";
import { BalanceDisplay } from "./BalanceDisplay";
import { ApprovalStatus } from "./ApprovalStatus";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { POLYGON_CHAIN_ID } from "@/lib/wallet/constants";

interface WalletConnectProps {
  onClose?: () => void;
  className?: string;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletConnect({ onClose, className }: WalletConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    address,
    balance,
    isConnected,
    chainId,
    approvals,
    connect,
    disconnect,
    switchNetwork,
    resetConnectError,
    isConnecting,
    isDisconnecting,
    error,
    isWrongNetwork,
    refetchBalance,
    refetchApprovals,
  } = useWallet();

  const handleConnect = () => {
    resetConnectError();
    connect();
  };

  useEffect(() => {
    if (isConnected) {
      setIsOpen(false);
      onClose?.();
    }
  }, [isConnected, onClose]);

  const showWrongNetwork = isWrongNetwork || (chainId != null && chainId !== POLYGON_CHAIN_ID);

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((o) => !o)}
        className="border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
      >
        {isConnected ? truncateAddress(address!) : "Connect Wallet"}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed top-14 left-0 right-0 bottom-0 z-40"
            aria-hidden
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute right-0 top-full z-50 mt-2 w-[340px] border-slate-700 bg-slate-900 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Wallet</CardTitle>
              <CardDescription className="text-slate-400">
                View balance and approval status on Polygon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isConnected ? (
                <>
                  {error && (
                    <p className="text-sm text-amber-400">{error.message}</p>
                  )}
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    {isConnecting ? "Connecting…" : "Connect Wallet"}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Install a Web3 wallet to connect.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                    <span className="text-xs text-slate-400">Address</span>
                    <span className="font-mono text-sm text-slate-300">
                      {truncateAddress(address!)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                    <span className="text-xs text-slate-400">USDC Balance</span>
                    <BalanceDisplay balance={balance} />
                  </div>
                  {showWrongNetwork ? (
                    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                      <p className="text-sm text-amber-400 mb-2">
                        Please switch to Polygon network.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => switchNetwork()}
                        className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                      >
                        Switch to Polygon
                      </Button>
                    </div>
                  ) : (
                    <ApprovalStatus
                      usdc={approvals.usdc}
                      ctf={approvals.ctf}
                    />
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        refetchBalance();
                        refetchApprovals();
                      }}
                      className="flex-1 border-slate-600 text-slate-300"
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        disconnect();
                        setIsOpen(false);
                        onClose?.();
                      }}
                      disabled={isDisconnecting}
                      className="flex-1 border-slate-600 text-slate-300"
                    >
                      {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
