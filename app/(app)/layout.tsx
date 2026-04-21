import { AppShell } from "@/components/AppShell";
import { UniversalAiAssistant } from "@/components/ai/UniversalAiAssistant";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <UniversalAiAssistant />
    </>
  );
}
