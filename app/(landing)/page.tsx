"use client";

import { Sidebar } from "@/components/landing/Sidebar";
import { HeroContent } from "@/components/landing/HeroContent";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content - offset by sidebar width */}
      <main className="ml-[220px]">
        <HeroContent />
      </main>
    </div>
  );
}
