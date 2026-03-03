"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { TickerBar } from "@/components/landing/TickerBar";
import { HeroSection } from "@/components/landing/HeroSection";
import {
  EVEngineSection,
  LeaderboardSection,
  CreatorsSection,
  LiveFeedSection,
  VolumeDashboardSection,
  WalletAnalyzerSection,
  MarketsSection,
} from "@/components/landing/FeatureSections";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { UniversalAiAssistant } from "@/components/ai/UniversalAiAssistant";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <TickerBar />
      
      <main>
        <HeroSection />
        <EVEngineSection />
        <LeaderboardSection />
        <CreatorsSection />
        <LiveFeedSection />
        <VolumeDashboardSection />
        <WalletAnalyzerSection />
        <MarketsSection />
        <CTASection />
      </main>
      
      <Footer />
      <UniversalAiAssistant />
    </div>
  );
}
