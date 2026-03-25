"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";

const HIDDEN_PATHS = ["/ev", "/markets", "/leaderboard", "/creators"];

export function ConditionalHeader() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN_PATHS.includes(pathname)) return null;
  return (
    <>
      <div id="header-portal" />
      <Header />
    </>
  );
}
