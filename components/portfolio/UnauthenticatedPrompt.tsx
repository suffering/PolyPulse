"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@/lib/wallet/use-wallet";
import { normalizeWalletError } from "@/lib/wallet/error-handler";
import type { ConnectPhase, WalletErrorCode, WalletState } from "@/lib/wallet/types";

type CardState =
  | "idle"
  | "connecting"
  | "success"
  | "no_provider"
  | "error";

type ErrorKind =
  | "USER_REJECTED"
  | "WRONG_NETWORK"
  | "SIGNATURE_REJECTED"
  | "RPC_FAILED"
  | "UNKNOWN";

const PHASE_COPY: Record<ConnectPhase, string> = {
  accounts: "Approve the connection in your wallet...",
  network: "Confirm Polygon network in your wallet...",
  signing: "Sign the login message in your wallet...",
};

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function toErrorKind(code: WalletErrorCode): ErrorKind {
  if (code === "USER_REJECTED") return "USER_REJECTED";
  if (code === "WRONG_NETWORK") return "WRONG_NETWORK";
  if (code === "SIGNATURE_REJECTED") return "SIGNATURE_REJECTED";
  if (code === "RPC_FAILED") return "RPC_FAILED";
  return "UNKNOWN";
}

const ERROR_COPY: Record<ErrorKind, { title: string; detail: string }> = {
  USER_REJECTED: {
    title: "Connection rejected",
    detail: "You rejected the wallet connection request.",
  },
  WRONG_NETWORK: {
    title: "Wrong network",
    detail: "Switch to Polygon mainnet to continue.",
  },
  SIGNATURE_REJECTED: {
    title: "Signature rejected",
    detail: "You rejected the login signature. Connection cancelled.",
  },
  RPC_FAILED: {
    title: "Network error",
    detail: "Couldn't reach Polygon. Check your connection and try again.",
  },
  UNKNOWN: {
    title: "Connection failed",
    detail: "Something went wrong. Please try again.",
  },
};

export function UnauthenticatedPrompt() {
  const { authenticate, activateSession, switchNetwork } = useWallet();
  const [state, setState] = useState<CardState>("idle");
  const [phase, setPhase] = useState<ConnectPhase>("accounts");
  const [pendingSession, setPendingSession] = useState<WalletState | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>("UNKNOWN");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [hasProvider, setHasProvider] = useState(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const detected = Boolean(
      (window as unknown as { ethereum?: { request?: unknown } }).ethereum?.request
    );
    setHasProvider(detected);
    if (!detected) setState("no_provider");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const resetToIdle = useCallback(() => {
    setPendingSession(null);
    setErrorDetail(null);
    setPhase("accounts");
    setIsActivating(false);
    setState(hasProvider ? "idle" : "no_provider");
  }, [hasProvider]);

  const handleConnectClick = async () => {
    const detected = Boolean(
      (window as unknown as { ethereum?: { request?: unknown } }).ethereum?.request
    );
    setHasProvider(detected);
    if (!detected) {
      setState("no_provider");
      return;
    }

    const requestId = ++requestIdRef.current;
    setErrorDetail(null);
    setPendingSession(null);
    setPhase("accounts");
    setState("connecting");

    try {
      const session = await authenticate((nextPhase) => {
        if (requestId === requestIdRef.current) setPhase(nextPhase);
      });
      if (requestId !== requestIdRef.current) return;
      if (!session.address || !session.auth) {
        throw new Error("Could not verify wallet signature");
      }
      setPendingSession(session);
      setState("success");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const normalized = normalizeWalletError(err);
      if (normalized.code === "NO_WALLET") {
        setHasProvider(false);
        setState("no_provider");
        return;
      }
      if (normalized.code === "SIGNATURE_REJECTED") {
        setToast("Signature rejected — connection cancelled");
        resetToIdle();
        return;
      }
      setErrorKind(toErrorKind(normalized.code));
      setErrorDetail(normalized.message);
      setState("error");
    }
  };

  const handleCancel = () => {
    requestIdRef.current += 1;
    resetToIdle();
  };

  const handleViewPortfolio = async () => {
    if (!pendingSession?.auth) return;
    setIsActivating(true);
    try {
      await activateSession(pendingSession);
      // Parent portfolio page will unmount this prompt once isConnected is true.
    } catch {
      setToast("Failed to save wallet session. Please try again.");
      setIsActivating(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      setState("idle");
      setErrorDetail(null);
    } catch {
      setErrorKind("WRONG_NETWORK");
      setErrorDetail("Please switch to Polygon network");
      setState("error");
    }
  };

  const displayAddress = pendingSession?.address
    ? truncateAddress(pendingSession.address)
    : "";

  const errorUi = ERROR_COPY[errorKind];

  return (
    <div className="min-h-screen bg-[#04040a] flex items-center justify-center px-6 relative">
      {toast && (
        <div
          role="status"
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm px-4 py-2.5 rounded-lg border border-amber-500/40 bg-[#12121a] text-amber-200 text-xs font-mono shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        >
          {toast}
        </div>
      )}

      {/* Card stage — same dimensions across all states. Layered absolutes with cross-fade. */}
      <div className="relative w-[360px] aspect-square">
        {/* IDLE */}
        <CardSurface visible={state === "idle"} accent="indigo">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#7536C6]/40 rounded-full blur-xl scale-150" />
              <div className="absolute inset-0 bg-[#4B4BF7]/25 rounded-full blur-md" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wallet-icon.svg"
                alt=""
                className="relative z-10 w-12 h-12"
              />
            </div>
            <h2 className="text-base font-semibold text-white text-center">
              Connect your wallet
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void handleConnectClick()}
            className="px-5 py-2 rounded-lg bg-[#4B4BF7] text-white text-xs font-semibold tracking-wide hover:bg-[#5a5af7] active:scale-[0.99] transition-all duration-150"
          >
            Connect Wallet
          </button>

          <p className="text-[10px] text-white/25 text-center font-mono leading-relaxed">
            By connecting you agree to the Terms of Service.
          </p>
        </CardSurface>

        {/* CONNECTING */}
        <CardSurface visible={state === "connecting"} accent="indigo">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#7536C6]/30 rounded-full blur-xl scale-125" />
              <div className="absolute inset-0 bg-[#4B4BF7]/15 rounded-full blur-md" />
              <div className="absolute inset-0 rounded-full bg-[#0a0a12] border border-[#1a1a2e]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wallet-icon.svg"
                alt=""
                className="relative z-10 w-12 h-12"
              />
              <svg
                className="absolute inset-0 w-full h-full ev-spin"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#4B4BF7"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="217 289"
                  pathLength="289"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="text-sm text-white font-medium">
                Connecting wallet
              </p>
              <p className="text-[11px] text-white/40 font-mono ev-pulse-text text-center px-4">
                {PHASE_COPY[phase]}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-white/35 hover:text-white/70 font-mono transition-colors"
          >
            Cancel
          </button>
        </CardSurface>

        {/* SUCCESS — only after verified signed session */}
        <CardSurface visible={state === "success"} accent="green">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#4ade80]/10 rounded-full blur-md" />
              <div
                className={`absolute inset-0 rounded-full bg-[#0a0a12] border border-[#4ade80]/40 ${
                  state === "success" ? "ev-circle-pulse" : ""
                }`}
              />
              <svg
                className="relative z-10 w-12 h-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M4 12.5l5 5L20 6"
                  className={state === "success" ? "ev-check-draw" : ""}
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-white">Wallet Connected</p>
              <p className="text-[11px] text-[#4ade80] font-mono">{displayAddress}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isActivating || !pendingSession}
            onClick={() => void handleViewPortfolio()}
            className="px-5 py-2 rounded-lg bg-[#4B4BF7] text-white text-xs font-semibold tracking-wide hover:bg-[#5a5af7] active:scale-[0.99] transition-all duration-150 shadow-[0_0_20px_rgba(117,54,198,0.45)] hover:shadow-[0_0_28px_rgba(117,54,198,0.6)] disabled:opacity-60"
          >
            {isActivating ? "Loading…" : "View Portfolio →"}
          </button>
        </CardSurface>

        {/* NO PROVIDER */}
        <CardSurface visible={state === "no_provider"} accent="indigo">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#7536C6]/40 rounded-full blur-xl scale-150" />
              <div className="absolute inset-0 bg-[#4B4BF7]/25 rounded-full blur-md" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wallet-icon.svg"
                alt=""
                className="relative z-10 w-12 h-12 opacity-70"
              />
            </div>
            <div className="flex flex-col items-center gap-1.5 px-2">
              <h2 className="text-base font-semibold text-white text-center">
                No wallet detected
              </h2>
              <p className="text-[11px] text-white/40 text-center font-mono leading-relaxed">
                Install MetaMask (or another injected wallet) to connect.
              </p>
            </div>
          </div>

          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-lg bg-[#4B4BF7] text-white text-xs font-semibold tracking-wide hover:bg-[#5a5af7] active:scale-[0.99] transition-all duration-150"
          >
            Install MetaMask
          </a>

          <button
            type="button"
            onClick={() => {
              const detected = Boolean(
                (window as unknown as { ethereum?: { request?: unknown } }).ethereum
                  ?.request
              );
              setHasProvider(detected);
              if (detected) setState("idle");
              else window.location.reload();
            }}
            className="text-xs text-white/35 hover:text-white/70 font-mono transition-colors"
          >
            {hasProvider ? "Try again" : "Refresh after installing"}
          </button>
        </CardSurface>

        {/* ERROR */}
        <CardSurface visible={state === "error"} accent="indigo">
          <div className="flex flex-col items-center gap-3 px-2">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
              <div className="w-12 h-12 rounded-full border border-amber-500/40 bg-[#0a0a12] flex items-center justify-center text-amber-400 text-lg font-semibold">
                !
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <h2 className="text-base font-semibold text-white text-center">
                {errorUi.title}
              </h2>
              <p className="text-[11px] text-white/40 text-center font-mono leading-relaxed">
                {errorDetail ?? errorUi.detail}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {errorKind === "WRONG_NETWORK" ? (
              <button
                type="button"
                onClick={() => void handleSwitchNetwork()}
                className="px-5 py-2 rounded-lg bg-[#4B4BF7] text-white text-xs font-semibold tracking-wide hover:bg-[#5a5af7] active:scale-[0.99] transition-all duration-150"
              >
                Switch to Polygon
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleConnectClick()}
                className="px-5 py-2 rounded-lg bg-[#4B4BF7] text-white text-xs font-semibold tracking-wide hover:bg-[#5a5af7] active:scale-[0.99] transition-all duration-150"
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={resetToIdle}
              className="text-xs text-white/35 hover:text-white/70 font-mono transition-colors"
            >
              Cancel
            </button>
          </div>
        </CardSurface>
      </div>

      <style jsx global>{`
        @keyframes ev-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .ev-spin {
          animation: ev-spin 900ms linear infinite;
          transform-origin: 50% 50%;
        }
        @keyframes ev-pulse-text {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        .ev-pulse-text {
          animation: ev-pulse-text 1.5s ease-in-out infinite;
        }
        @keyframes ev-circle-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
          }
        }
        .ev-circle-pulse {
          animation: ev-circle-pulse 300ms ease-out 200ms;
        }
        @keyframes ev-check-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .ev-check-draw {
          animation: ev-check-draw 400ms ease-out 250ms forwards;
        }
        @keyframes ev-card-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ev-card-enter {
          animation: ev-card-enter 200ms ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Single state-card surface. Stacks absolutely on top of siblings, fades in/out
 * with a subtle translateY for a gentle slide-into-place effect.
 */
function CardSurface({
  visible,
  accent,
  children,
}: {
  visible: boolean;
  accent: "indigo" | "green";
  children: React.ReactNode;
}) {
  const borderClass =
    accent === "indigo" ? "border-[#4B4BF7]/20" : "border-[#4ade80]/25";
  const shadowClass =
    accent === "indigo"
      ? "shadow-[0_0_32px_rgba(75,75,247,0.08)]"
      : "shadow-[0_0_32px_rgba(74,222,128,0.08)]";

  return (
    <div
      aria-hidden={!visible}
      className={`absolute inset-0 rounded-xl border ${borderClass} bg-[#0d0d14] ${shadowClass} p-6 flex flex-col items-center justify-between transition-all duration-150 ease-out ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
}
