import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PolyPulse +EV Engine",
  description: "Find positive expected value bets on Polymarket vs sportsbooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0d1117]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
