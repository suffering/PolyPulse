"use client";

import { useEffect, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function formatTime(ts: Date) {
  return ts.toLocaleTimeString("en-US", { hour12: false });
}

export type BuildContextResult = {
  context: unknown;
  pathname: string;
};

export function AiChatPanel({
  resetKey,
  title,
  subtitle,
  suggestedPrompts,
  buildContextForMessage,
}: {
  resetKey: string;
  title: string;
  subtitle: string | null;
  suggestedPrompts: string[];
  buildContextForMessage: (userMessage: string) => BuildContextResult;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset conversation when navigating to a different page context
    setMessages([]);
    setInput("");
    setError(null);
    setIsLoading(false);
    setIsOpen(false);
  }, [resetKey]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setError(null);

    const now = new Date();
    const userMessage: Message = {
      id: `${now.getTime()}-user`,
      role: "user",
      content: text.trim(),
      timestamp: formatTime(now),
    };

    const historyForApi = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const { context, pathname } = buildContextForMessage(userMessage.content);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: historyForApi,
          context,
          pathname,
        }),
      });

      const json = (await res.json()) as { message?: string; error?: string };

      if (!res.ok || !json.message) {
        setError(json.error ?? "Something went wrong, please try again");
        return;
      }

      const assistantNow = new Date();
      const assistantMessage: Message = {
        id: `${assistantNow.getTime()}-assistant`,
        role: "assistant",
        content: json.message,
        timestamp: formatTime(assistantNow),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("AI chat error:", err);
      setError("Something went wrong, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 rounded-full border border-primary/60 bg-primary/20 px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-lg backdrop-blur hover:bg-primary/30 transition-colors glow-primary"
      >
        <span className="h-[8px] w-[8px] rounded-full bg-primary shadow-[0_0_8px_rgba(75,75,247,0.8)] animate-pulse-dot" />
        Ask AI
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 backdrop-blur-sm sm:items-center sm:justify-end">
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-card shadow-2xl sm:mr-3 sm:mb-3 sm:rounded-xl">
            <header className="flex items-center justify-between border-b border-border px-3 py-2">
              <div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-border bg-card-elevated px-2 py-1 text-xs text-foreground hover:bg-muted transition-colors"
              >
                Close
              </button>
            </header>

            <div className="flex max-h-[60vh] flex-col">
              <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2 text-xs">
                {messages.length === 0 && suggestedPrompts.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="rounded-full border border-border bg-card-elevated px-2 py-0.5 text-[11px] text-foreground hover:bg-muted hover:border-primary/30 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-md px-2 py-1.5 ${
                        m.role === "user"
                          ? "bg-primary/20 text-foreground"
                          : "bg-card-elevated text-foreground"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-[11px]">
                        {m.content}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {m.role === "user" ? "You" : "AI"} · {m.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex h-[6px] w-[6px] animate-pulse rounded-full bg-primary" />
                    AI is thinking...
                  </div>
                )}

                {error && <div className="mt-0.5 text-[11px] text-destructive">{error}</div>}
              </div>

              <form
                className="flex items-center gap-1.5 border-t border-border px-2 py-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage(input);
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-md border border-border bg-primary/20 px-2 py-1 text-xs text-foreground hover:bg-primary/30 disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

