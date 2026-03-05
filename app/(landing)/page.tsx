"use client";

import { Sidebar } from "@/components/landing/Sidebar";
import { HeroContent } from "@/components/landing/HeroContent";
import { UniversalAiAssistant } from "@/components/ai/UniversalAiAssistant";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content - offset by sidebar width */}
      <main className="ml-[200px]">
        <HeroContent />
      </main>
      
      <UniversalAiAssistant />
    </div>
  );
}
