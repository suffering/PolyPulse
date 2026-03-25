import { ConditionalHeader } from "@/components/ConditionalHeader";
import { UniversalAiAssistant } from "@/components/ai/UniversalAiAssistant";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConditionalHeader />
      {children}
      <UniversalAiAssistant />
    </>
  );
}
