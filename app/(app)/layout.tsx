import { Header } from "@/components/Header";
import { UniversalAiAssistant } from "@/components/ai/UniversalAiAssistant";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div id="header-portal" />
      <Header />
      {children}
      <UniversalAiAssistant />
    </>
  );
}
