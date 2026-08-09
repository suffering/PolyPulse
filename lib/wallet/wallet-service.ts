import {
  BrowserProvider,
  Contract,
  type Signer,
  type Provider,
} from "ethers";
import {
  POLYGON_CHAIN_ID,
  CONTRACT_ADDRESSES,
  USDC_DECIMALS,
  ERC20_ABI,
  ERC1155_APPROVAL_ABI,
} from "./constants";
import { executeWithFailover } from "./rpc-manager";
import { withRetry, getProviderErrorCode } from "./error-handler";
import type { ConnectPhase, WalletState, WalletApprovals } from "./types";
import { DEFAULT_WALLET_STATE } from "./types";
import { createAuthMessageForAddress, verifyAuthSignature } from "./auth";

const POLYGON_PARAMS = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: ["https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"],
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const ethereum = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
  if (!ethereum?.request) return undefined;
  return ethereum;
}

function rejectionError(kind: "connect" | "signature", cause?: unknown): Error {
  if (kind === "signature") {
    const err = new Error("SIGNATURE_REJECTED: User rejected the signature");
    err.name = "SIGNATURE_REJECTED";
    (err as Error & { cause?: unknown }).cause = cause;
    return err;
  }
  const err = new Error("Connection cancelled");
  (err as Error & { cause?: unknown }).cause = cause;
  return err;
}

export class WalletService {
  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;
  private accountsHandler: ((...args: unknown[]) => void) | null = null;
  private chainHandler: ((...args: unknown[]) => void) | null = null;

  hasInjectedProvider(): boolean {
    return Boolean(getEthereum());
  }

  async connectBrowserWallet(
    onPhase?: (phase: ConnectPhase) => void
  ): Promise<WalletState> {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error("No wallet detected — install MetaMask");
    }

    try {
      onPhase?.("accounts");
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[] | undefined;
      if (!accounts?.length) {
        throw rejectionError("connect");
      }

      this.provider = new BrowserProvider(ethereum as import("ethers").Eip1193Provider);

      onPhase?.("network");
      await this.ensurePolygonNetwork(ethereum);

      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      onPhase?.("signing");
      const { nonce, issuedAt, message } = createAuthMessageForAddress(address);
      let signature: string;
      try {
        signature = await this.signer.signMessage(message);
      } catch (signErr) {
        this.provider = null;
        this.signer = null;
        const code = getProviderErrorCode(signErr);
        if (
          code === 4001 ||
          (signErr instanceof Error &&
            /user rejected|user denied|rejected the request/i.test(signErr.message))
        ) {
          throw rejectionError("signature", signErr);
        }
        throw signErr;
      }

      if (!verifyAuthSignature(message, signature, address)) {
        this.provider = null;
        this.signer = null;
        throw new Error("Could not verify wallet signature");
      }

      let balance = 0;
      let approvals: WalletApprovals = { usdc: false, ctf: false };
      try {
        [balance, approvals] = await Promise.all([
          this.getUSDCBalance(address, this.provider),
          this.getApprovals(address, this.provider),
        ]);
      } catch {
        // Don't block auth if balance/approvals RPC fails
      }

      return {
        address,
        balance,
        isConnected: true,
        chainId: POLYGON_CHAIN_ID,
        lastSync: new Date(),
        approvals,
        connectionType: "browser_extension",
        auth: { nonce, issuedAt, message, signature },
      };
    } catch (err) {
      this.provider = null;
      this.signer = null;
      const code = getProviderErrorCode(err);
      if (
        code === 4001 &&
        !(err instanceof Error && err.name === "SIGNATURE_REJECTED")
      ) {
        throw rejectionError("connect", err);
      }
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.unsubscribeProviderEvents();
    this.signer = null;
    this.provider = null;
  }

  getConnectionState(): WalletState {
    return DEFAULT_WALLET_STATE;
  }

  async verifyPolygonNetwork(): Promise<boolean> {
    const ethereum = getEthereum();
    if (!ethereum) return false;
    try {
      const chainIdHex = (await ethereum.request({ method: "eth_chainId" })) as string;
      return Number.parseInt(chainIdHex, 16) === POLYGON_CHAIN_ID;
    } catch {
      return false;
    }
  }

  async switchToPolygon(): Promise<void> {
    const ethereum = getEthereum();
    if (!ethereum) throw new Error("Cannot switch network");
    await this.ensurePolygonNetwork(ethereum);
    if (this.provider) {
      this.provider = new BrowserProvider(ethereum as import("ethers").Eip1193Provider);
      this.signer = await this.provider.getSigner();
    }
  }

  /**
   * Subscribe to accountsChanged / chainChanged on the injected provider.
   * Replaces any previous handlers registered by this service.
   */
  subscribeProviderEvents(handlers: {
    onAccountsChanged: (accounts: string[]) => void;
    onChainChanged: (chainIdHex: string) => void;
  }): void {
    const ethereum = getEthereum();
    if (!ethereum?.on) return;

    this.unsubscribeProviderEvents();

    this.accountsHandler = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0])
        ? (args[0] as string[])
        : [];
      handlers.onAccountsChanged(accounts);
    };
    this.chainHandler = (...args: unknown[]) => {
      const chainIdHex = typeof args[0] === "string" ? args[0] : String(args[0] ?? "");
      handlers.onChainChanged(chainIdHex);
    };

    ethereum.on("accountsChanged", this.accountsHandler);
    ethereum.on("chainChanged", this.chainHandler);
  }

  unsubscribeProviderEvents(): void {
    const ethereum = getEthereum();
    if (!ethereum?.removeListener) {
      this.accountsHandler = null;
      this.chainHandler = null;
      return;
    }
    if (this.accountsHandler) {
      ethereum.removeListener("accountsChanged", this.accountsHandler);
    }
    if (this.chainHandler) {
      ethereum.removeListener("chainChanged", this.chainHandler);
    }
    this.accountsHandler = null;
    this.chainHandler = null;
  }

  private async ensurePolygonNetwork(ethereum: EthereumProvider): Promise<void> {
    const chainIdHex = (await ethereum.request({ method: "eth_chainId" })) as string;
    if (Number.parseInt(chainIdHex, 16) === POLYGON_CHAIN_ID) {
      return;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_PARAMS.chainId }],
      });
    } catch (err) {
      const code = getProviderErrorCode(err);
      const message = err instanceof Error ? err.message : String(err);
      const needsAdd =
        code === 4902 ||
        /unrecognized chain|chain has not been added|wallet_addethereumchain/i.test(
          message
        );

      if (needsAdd) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [POLYGON_PARAMS],
          });
        } catch (addErr) {
          const addCode = getProviderErrorCode(addErr);
          if (addCode === 4001) {
            throw new Error("Please switch to Polygon network.");
          }
          throw new Error("Please switch to Polygon network.");
        }
      } else if (code === 4001) {
        throw new Error("Please switch to Polygon network.");
      } else {
        throw new Error("Please switch to Polygon network.");
      }
    }

    // Recreate provider after network change so ethers sees the new chain.
    this.provider = new BrowserProvider(ethereum as import("ethers").Eip1193Provider);
    const networkAfter = await this.provider.getNetwork();
    if (Number(networkAfter.chainId) !== POLYGON_CHAIN_ID) {
      this.provider = null;
      this.signer = null;
      throw new Error("Please switch to Polygon network.");
    }
  }

  private async runWithProvider<T>(
    address: string,
    provider: Provider | null,
    operation: (provider: Provider) => Promise<T>
  ): Promise<T> {
    if (provider) {
      return operation(provider);
    }
    return withRetry(() =>
      executeWithFailover((failoverProvider: Provider) => operation(failoverProvider))
    );
  }

  async getUSDCBalance(address: string, provider?: Provider | null): Promise<number> {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return 0;
    return this.runWithProvider(address, provider ?? null, async (prov) => {
      const contract = new Contract(
        CONTRACT_ADDRESSES.USDC,
        ERC20_ABI,
        prov
      );
      const balance = (await contract.balanceOf(address)) as bigint;
      const decimals = (await contract.decimals()) as number;
      const divisor = 10 ** (decimals ?? USDC_DECIMALS);
      return Number(balance) / divisor;
    });
  }

  async checkUSDCApproval(address: string, provider?: Provider | null): Promise<boolean> {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
    return this.runWithProvider(address, provider ?? null, async (prov) => {
      const contract = new Contract(
        CONTRACT_ADDRESSES.USDC,
        ERC20_ABI,
        prov
      );
      const allowance = (await contract.allowance(
        address,
        CONTRACT_ADDRESSES.CLOB_EXCHANGE
      )) as bigint;
      return allowance > 0n;
    });
  }

  async checkCTFApproval(address: string, provider?: Provider | null): Promise<boolean> {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
    return this.runWithProvider(address, provider ?? null, async (prov) => {
      const contract = new Contract(
        CONTRACT_ADDRESSES.CTF,
        ERC1155_APPROVAL_ABI,
        prov
      );
      return contract.isApprovedForAll(
        address,
        CONTRACT_ADDRESSES.CLOB_EXCHANGE
      ) as Promise<boolean>;
    });
  }

  async getApprovals(address: string, provider?: Provider | null): Promise<WalletApprovals> {
    const [usdc, ctf] = await Promise.all([
      this.checkUSDCApproval(address, provider),
      this.checkCTFApproval(address, provider),
    ]);
    return { usdc, ctf };
  }

  async executeWithFailover<T>(operation: (provider: Provider) => Promise<T>): Promise<T> {
    return executeWithFailover(operation);
  }
}

let walletServiceInstance: WalletService | null = null;

export function getWalletService(): WalletService {
  if (!walletServiceInstance) {
    walletServiceInstance = new WalletService();
  }
  return walletServiceInstance;
}
