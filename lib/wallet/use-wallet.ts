"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  walletKeys,
  fetchConnectionState,
  fetchBalance,
  fetchApprovals,
} from "./wallet-queries";
import type { ConnectPhase, WalletState } from "./types";
import { DEFAULT_WALLET_STATE } from "./types";
import { getWalletService } from "./wallet-service";
import { saveWalletToStorage, clearWalletStorage } from "./storage";
import { getSessionMonitor } from "./session-monitor";
import { normalizeWalletError } from "./error-handler";
import { POLYGON_CHAIN_ID } from "./constants";

async function persistAuthenticatedSession(state: WalletState): Promise<void> {
  if (!state.address || !state.chainId || !state.auth) {
    throw new Error("Cannot persist session without a verified signature");
  }
  await saveWalletToStorage({
    address: state.address,
    chainId: state.chainId,
    lastConnected: Date.now(),
    connectionType: "browser_extension",
    nonce: state.auth.nonce,
    issuedAt: state.auth.issuedAt,
    message: state.auth.message,
    signature: state.auth.signature,
  });
}

export function useWallet() {
  const queryClient = useQueryClient();
  const service = getWalletService();
  const sessionMonitor = getSessionMonitor();
  const monitorArmedRef = useRef(false);

  const connectionQuery = useQuery({
    queryKey: walletKeys.connection(),
    queryFn: fetchConnectionState,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const address = connectionQuery.data?.address ?? null;
  const chainId = connectionQuery.data?.chainId ?? null;
  const auth = connectionQuery.data?.auth ?? null;
  const isConnected = Boolean(address && auth);

  const balanceQuery = useQuery({
    queryKey: walletKeys.balance(address ?? ""),
    queryFn: () => fetchBalance(address!),
    enabled: Boolean(address),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const approvalsQuery = useQuery({
    queryKey: walletKeys.approvals(address ?? ""),
    queryFn: () => fetchApprovals(address!),
    enabled: Boolean(address),
    staleTime: 5 * 60 * 1000,
  });

  const CONNECT_TIMEOUT_MS = 60_000;

  const clearSession = useCallback(() => {
    clearWalletStorage();
    sessionMonitor.stop();
    monitorArmedRef.current = false;
    service.unsubscribeProviderEvents();
    queryClient.setQueryData(walletKeys.connection(), DEFAULT_WALLET_STATE);
  }, [queryClient, service, sessionMonitor]);

  const startSessionMonitor = useCallback(() => {
    sessionMonitor.start(() => {
      clearSession();
    });
    monitorArmedRef.current = true;
  }, [sessionMonitor, clearSession]);

  useEffect(() => {
    if (address && auth && !connectionQuery.isLoading && !monitorArmedRef.current) {
      startSessionMonitor();
    }
  }, [address, auth, connectionQuery.isLoading, startSessionMonitor]);

  const applySession = useCallback(
    async (state: WalletState) => {
      await persistAuthenticatedSession(state);
      startSessionMonitor();
      queryClient.setQueryData(walletKeys.connection(), state);
      queryClient.setQueryData(walletKeys.balance(state.address!), state.balance);
      queryClient.setQueryData(walletKeys.approvals(state.address!), state.approvals);
    },
    [queryClient, startSessionMonitor]
  );

  const runAuthenticatedConnect = useCallback(
    async (onPhase?: (phase: ConnectPhase) => void): Promise<WalletState> => {
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
      }, CONNECT_TIMEOUT_MS);

      try {
        const state = await Promise.race([
          service.connectBrowserWallet(onPhase),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Connection timed out. Please try again.")),
              CONNECT_TIMEOUT_MS
            )
          ),
        ]);

        clearTimeout(timeoutId);

        if (timedOut) {
          throw new Error("Connection timed out. Please try again.");
        }

        if (!state.auth) {
          throw new Error("Could not verify wallet signature");
        }

        return state;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    },
    [service]
  );

  const connectMutation = useMutation({
    mutationFn: async (): Promise<WalletState> => {
      const state = await runAuthenticatedConnect();
      await applySession(state);
      return state;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await service.disconnect();
      clearWalletStorage();
      sessionMonitor.stop();
      monitorArmedRef.current = false;
    },
    onSuccess: () => {
      queryClient.setQueryData(walletKeys.connection(), DEFAULT_WALLET_STATE);
      queryClient.removeQueries({ queryKey: walletKeys.all });
    },
  });

  // Provider account / chain event listeners while authenticated.
  useEffect(() => {
    if (!isConnected || !address) {
      service.unsubscribeProviderEvents();
      return;
    }

    service.subscribeProviderEvents({
      onAccountsChanged: (accounts) => {
        if (!accounts.length) {
          void service.disconnect();
          clearSession();
          return;
        }
        const next = accounts[0];
        if (next && next.toLowerCase() !== address.toLowerCase()) {
          void service.disconnect();
          clearSession();
        }
      },
      onChainChanged: (chainIdHex) => {
        const nextChainId = Number.parseInt(chainIdHex, 16);
        if (Number.isNaN(nextChainId)) return;
        queryClient.setQueryData(
          walletKeys.connection(),
          (prev: WalletState | undefined) => {
            if (!prev?.address) return prev ?? DEFAULT_WALLET_STATE;
            return { ...prev, chainId: nextChainId, lastSync: new Date() };
          }
        );
      },
    });

    return () => {
      service.unsubscribeProviderEvents();
    };
  }, [isConnected, address, service, clearSession, queryClient]);

  const connect = () => connectMutation.mutate();
  const connectAsync = () => connectMutation.mutateAsync();
  const disconnect = () => disconnectMutation.mutate();

  /** Full connect + sign without writing session — for deferred portfolio UI. */
  const authenticate = useCallback(
    (onPhase?: (phase: ConnectPhase) => void) => runAuthenticatedConnect(onPhase),
    [runAuthenticatedConnect]
  );

  const activateSession = useCallback(
    async (state: WalletState) => {
      await applySession(state);
    },
    [applySession]
  );

  const switchNetwork = async () => {
    await service.switchToPolygon();
    queryClient.setQueryData(
      walletKeys.connection(),
      (prev: WalletState | undefined) => {
        if (!prev?.address) return prev ?? DEFAULT_WALLET_STATE;
        return { ...prev, chainId: POLYGON_CHAIN_ID, lastSync: new Date() };
      }
    );
  };

  const refetchBalance = () =>
    queryClient.invalidateQueries({ queryKey: walletKeys.balance(address ?? "") });
  const refetchApprovals = () =>
    queryClient.invalidateQueries({ queryKey: walletKeys.approvals(address ?? "") });

  const balance = balanceQuery.data ?? connectionQuery.data?.balance ?? 0;
  const approvals =
    approvalsQuery.data ?? connectionQuery.data?.approvals ?? { usdc: false, ctf: false };

  const error =
    connectMutation.error != null
      ? normalizeWalletError(connectMutation.error)
      : null;

  const isWrongNetwork = chainId != null && chainId !== POLYGON_CHAIN_ID;

  const resetConnectError = () => connectMutation.reset();

  const hasProvider =
    typeof window !== "undefined" ? service.hasInjectedProvider() : false;

  return {
    address,
    balance,
    isConnected,
    chainId,
    lastSync: connectionQuery.data?.lastSync ?? null,
    approvals,
    connectionType: connectionQuery.data?.connectionType ?? null,
    auth,
    hasProvider,

    connect,
    connectAsync,
    authenticate,
    activateSession,
    disconnect,
    switchNetwork,
    resetConnectError,

    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isLoading: connectionQuery.isLoading,
    error: error ? { code: error.code, message: error.message } : null,
    isWrongNetwork,

    refetchBalance,
    refetchApprovals,
    refetch: connectionQuery.refetch,
  };
}
