"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet/use-wallet";

type CardState = "idle" | "connecting" | "success";

export function UnauthenticatedPrompt() {
  const { connect, address } = useWallet();
  const [state, setState] = useState<CardState>("idle");

  // Simulated 2.5s connection delay
  useEffect(() => {
    if (state !== "connecting") return;
    const t = setTimeout(() => setState("success"), 2500);
    return () => clearTimeout(t);
  }, [state]);

  const handleConnectClick = () => {
    setState("connecting");
  };

  const handleCancel = () => {
    setState("idle");
  };

  const handleViewPortfolio = () => {
    // Trigger the real wallet connection — parent will swap us out for the dashboard.
    connect();
  };

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "0x68db...e12b";

  return (
    <div className="min-h-screen bg-[#04040a] flex items-center justify-center px-6">
      {/* Card stage — same dimensions across all states. Layered absolutes with cross-fade. */}
      <div className="relative w-[360px] aspect-square">
        {/* IDLE */}
        <CardSurface visible={state === "idle"} accent="indigo">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Soft indigo underglow */}
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
            onClick={handleConnectClick}
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
            {/* Spinner: 96px circle with rotating 270° indigo arc */}
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
              <p className="text-[11px] text-white/40 font-mono ev-pulse-text">
                Approve the connection in your wallet...
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

        {/* SUCCESS */}
        <CardSurface visible={state === "success"} accent="green">
          <div className="flex flex-col items-center gap-4">
            {/* Checkmark in pulsing circle */}
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
            onClick={handleViewPortfolio}
            className="w-full px-4 py-3 rounded-lg bg-[#4B4BF7] text-white text-sm font-semibold tracking-wide hover:bg-[#5a5af7] active:scale-[0.99] transition-all duration-150"
          >
            View Portfolio →
          </button>
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
