"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-3">
        <div className="relative bg-card border border-border rounded-xl p-6 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 radial-gradient-overlay opacity-50" />
          <div className="absolute inset-0 grid-pattern opacity-30" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/30 rounded-full mb-2">
                <Zap className="w-[14px] h-[14px] text-primary" />
                <span className="text-xs text-primary font-medium">Start Trading Smarter</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 text-balance">
                Ready to find your edge?
              </h2>
              <p className="text-muted-foreground max-w-lg text-pretty">
                Join thousands of traders using PolyPulse to discover +EV opportunities 
                and make data-driven decisions on Polymarket.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Link
                href="/ev"
                className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors glow-primary"
              >
                Explore +EV Bets
                <ArrowRight className="w-[16px] h-[16px]" />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-card-elevated border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Connect Wallet
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
