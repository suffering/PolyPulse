"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type PageAiState =
  | { kind: "none" }
  | { kind: "ev"; state: unknown }
  | { kind: "leaderboard"; state: unknown }
  | { kind: "volume"; state: unknown }
  | { kind: "live"; state: unknown }
  | { kind: "extra"; state: unknown }
  | { kind: "trader"; state: unknown };

type PageAiContextValue = {
  pageAiState: PageAiState;
  setPageAiState: (state: PageAiState) => void;
};

const PageAiContext = createContext<PageAiContextValue | null>(null);

export function PageAiProvider({ children }: { children: React.ReactNode }) {
  const [pageAiState, setPageAiStateInternal] = useState<PageAiState>({
    kind: "none",
  });

  const setPageAiState = useCallback((state: PageAiState) => {
    setPageAiStateInternal(state);
  }, []);

  const value = useMemo(
    () => ({
      pageAiState,
      setPageAiState,
    }),
    [pageAiState, setPageAiState],
  );

  return <PageAiContext.Provider value={value}>{children}</PageAiContext.Provider>;
}

export function usePageAiState() {
  const ctx = useContext(PageAiContext);
  if (!ctx) {
    throw new Error("usePageAiState must be used within PageAiProvider");
  }
  return ctx.pageAiState;
}

export function useSetPageAiState() {
  const ctx = useContext(PageAiContext);
  if (!ctx) {
    throw new Error("useSetPageAiState must be used within PageAiProvider");
  }
  return ctx.setPageAiState;
}

