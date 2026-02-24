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
import { withRetry } from "./error-handler";
import type { WalletState, WalletApprovals } from "./types";
import { DEFAULT_WALLET_STATE } from "./types";

const POLYGON_PARAMS = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"],
};

function getEthereum(): unknown {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: unknown }).ethereum;
}

export class WalletService {
  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;

  async connectBrowserWallet(): Promise<WalletState> {
    const ethereum = getEthereum() as { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
    if (!ethereum?.request) {
      throw new Error("No Web3 wallet found. Please install a Web3 wallet to connect.");
    }

    try {
      // 1. Request accounts first so MetaMask shows the connect approval popup immediately
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[] | undefined;
      if (!accounts?.length) {
        throw new Error("Connection cancelled");
      }

      // 2. Create provider and check current network (after user has approved connection)
      this.provider = new BrowserProvider(ethereum as import("ethers").Eip1193Provider);
      const network = await this.provider.getNetwork();

      // 3. If not on Polygon, prompt to switch
      if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
        try {
          await this.switchToPolygon();
          const networkAfter = await this.provider.getNetwork();
          if (Number(networkAfter.chainId) !== POLYGON_CHAIN_ID) {
            this.provider = null;
            this.signer = null;
            throw new Error("Please switch to Polygon network.");
          }
        } catch (switchErr) {
          this.provider = null;
          this.signer = null;
          const msg = switchErr instanceof Error ? switchErr.message : String(switchErr);
          if (msg.includes("rejected") || msg.includes("denied") || msg.includes("User denied")) {
            throw new Error("Please switch to Polygon network.");
          }
          throw new Error("Please switch to Polygon network.");
        }
      }

      // 4. Get signer and address, then fetch balance and approvals using the wallet's provider (MetaMask's RPC)
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();

      let balance = 0;
      let approvals: WalletApprovals = { usdc: false, ctf: false };
      try {
        [balance, approvals] = await Promise.all([
          this.getUSDCBalance(address, this.provider),
          this.getApprovals(address, this.provider),
        ]);
      } catch {
        // Don't block connection if balance/approvals RPC fails; user is still connected
      }

      return {
        address,
        balance,
        isConnected: true,
        chainId: POLYGON_CHAIN_ID,
        lastSync: new Date(),
        approvals,
        connectionType: "browser_extension",
      };
    } catch (err) {
      this.provider = null;
      this.signer = null;
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.signer = null;
    this.provider = null;
  }

  getConnectionState(): WalletState {
    return DEFAULT_WALLET_STATE;
  }

  async verifyPolygonNetwork(): Promise<boolean> {
    const ethereum = getEthereum();
    if (!ethereum) return false;
    const provider = new BrowserProvider(ethereum as import("ethers").Eip1193Provider);
    const network = await provider.getNetwork();
    return Number(network.chainId) === POLYGON_CHAIN_ID;
  }

  async switchToPolygon(): Promise<void> {
    const ethereum = getEthereum() as { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
    if (!ethereum?.request) throw new Error("Cannot switch network");
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_PARAMS.chainId }],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Unrecognized chain") || message.includes("chain has not been added")) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_PARAMS],
        });
      } else {
        throw err;
      }
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
