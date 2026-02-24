"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  walletKeys,
  fetchConnectionState,
  fetchBalance,
  fetchApprovals,
} from "./wallet-queries";
import type { WalletState } from "./types";
import { DEFAULT_WALLET_STATE } from "./types";
import { getWalletService } from "./wallet-service";
import { saveWalletToStorage, clearWalletStorage } from "./storage";
import { getSessionMonitor } from "./session-monitor";
import { normalizeWalletError } from "./error-handler";
import { POLYGON_CHAIN_ID } from "./constants";

export function useWallet() {
  const queryClient = useQueryClient();
  const service = getWalletService();
  const sessionMonitor = getSessionMonitor();

  const connectionQuery = useQuery({
    queryKey: walletKeys.connection(),
    queryFn: fetchConnectionState,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const address = connectionQuery.data?.address ?? null;
  const chainId = connectionQuery.data?.chainId ?? null;
  const isConnected = Boolean(address);

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

  const connectMutation = useMutation({
    mutationFn: async (): Promise<WalletState> => {
      const connectPromise = (async () => {
        const state = await service.connectBrowserWallet();
        await saveWalletToStorage({
          address: state.address!,
          chainId: state.chainId!,
          lastConnected: Date.now(),
          connectionType: "browser_extension",
        });
        sessionMonitor.start(() => {
          clearWalletStorage();
          sessionMonitor.stop();
          queryClient.setQueryData(walletKeys.connection(), DEFAULT_WALLET_STATE);
        });
        return state;
      })();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection timed out. Please try again.")), CONNECT_TIMEOUT_MS);
      });
      return Promise.race([connectPromise, timeoutPromise]);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(walletKeys.connection(), data);
      queryClient.setQueryData(walletKeys.balance(data.address!), data.balance);
      queryClient.setQueryData(walletKeys.approvals(data.address!), data.approvals);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await service.disconnect();
      clearWalletStorage();
      sessionMonitor.stop();
    },
    onSuccess: () => {
      queryClient.setQueryData(walletKeys.connection(), DEFAULT_WALLET_STATE);
      queryClient.removeQueries({ queryKey: walletKeys.all });
    },
  });

  const connect = () => connectMutation.mutate();
  const disconnect = () => disconnectMutation.mutate();

  const switchNetwork = async () => {
    await service.switchToPolygon();
    queryClient.invalidateQueries({ queryKey: walletKeys.connection() });
  };

  const refetchBalance = () => queryClient.invalidateQueries({ queryKey: walletKeys.balance(address ?? "") });
  const refetchApprovals = () => queryClient.invalidateQueries({ queryKey: walletKeys.approvals(address ?? "") });

  const balance = balanceQuery.data ?? connectionQuery.data?.balance ?? 0;
  const approvals = approvalsQuery.data ?? connectionQuery.data?.approvals ?? { usdc: false, ctf: false };

  const error =
    connectMutation.error != null
      ? normalizeWalletError(connectMutation.error)
      : null;

  const isWrongNetwork = chainId != null && chainId !== POLYGON_CHAIN_ID;

  const resetConnectError = () => connectMutation.reset();

  return {
    address,
    balance,
    isConnected,
    chainId,
    lastSync: connectionQuery.data?.lastSync ?? null,
    approvals,
    connectionType: connectionQuery.data?.connectionType ?? null,

    connect,
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
