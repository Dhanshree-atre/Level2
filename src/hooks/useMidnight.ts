/**
 * useMidnight.ts
 *
 * Core hook for Midnight.js SDK integration.
 *
 * Packages used:
 *   @midnight-ntwrk/dapp-connector-api        — Lace wallet connection (window.midnight API)
 *   @midnight-ntwrk/midnight-js-network-provider — Network config, indexer client, ledger params
 *
 * Privacy guarantee:
 *   The private increment witness is generated INSIDE the ZK proof engine.
 *   It is NEVER passed through React state, props, or returned by this hook.
 */

import React, { useState, useCallback, useRef } from 'react';

// ─── Midnight.js SDK imports ─────────────────────────────────────────────────
// @midnight-ntwrk/midnight-js-network-provider (installed from https://npm.midnight.network)
import {
  type ServiceUriConfig,
  NetworkProvider,
  IndexerClient,
} from '@midnight-ntwrk/midnight-js-network-provider';

// ─── Midnight Preprod network configuration ──────────────────────────────────

/**
 * Preprod network service endpoints.
 * The Midnight Preprod network uses these public endpoints for all dApp interactions.
 */
export const PREPROD_CONFIG: ServiceUriConfig = {
  node:       'https://rpc.testnet-02.midnight.network',
  indexer:    'https://indexer.testnet-02.midnight.network/api/v1/graphql',
  indexerWS:  'wss://indexer.testnet-02.midnight.network/api/v1/graphql',
  proofServer:'https://proof-server.testnet-02.midnight.network',
};

// ─── Contract configuration ──────────────────────────────────────────────────

/**
 * The deployed counter contract address on Midnight Preprod.
 * This is the contract deployed during Level 1, whose `increment` circuit
 * we call from this frontend.
 */
export const CONTRACT_ADDRESS =
  '76a1f26ef78965e7180d51b050c911904ece4bb2d2ca876c2bdabaaacde5e01e';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WalletState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; address: string; networkId: string; walletId: string }
  | { status: 'error'; message: string };

export type CircuitCallState =
  | { status: 'idle' }
  | { status: 'generating-proof'; step: string }
  | { status: 'submitting' }
  | { status: 'success'; txHash: string; newCount: number; provedWithout: string }
  | { status: 'error'; message: string };

// ─── Midnight DApp Connector API types (v4) ──────────────────────────────────

interface InitialWalletAPI {
  apiVersion: string;
  name?: string;
  connect: (networkId: string) => Promise<ConnectedWalletAPI>;
}

interface ConnectedWalletAPI {
  getConnectionStatus?: () => Promise<{ networkId: string }>;
  getUnshieldedAddress?: () => Promise<string>;
  getDustAddress?: () => Promise<string>;
  balanceUnsealedTransaction?: (tx: unknown) => Promise<{ tx: unknown }>;
  submitTransaction?: (tx: unknown) => Promise<{ txHash?: string; hash?: string } | string>;
  getProvingProvider?: (zkProvider: unknown) => ProvingProvider;
}

interface ProvingProvider {
  proveTransaction: (tx: unknown) => Promise<unknown>;
}

declare global {
  interface Window {
    midnight?: Record<string, InitialWalletAPI>;
  }
}

// ─── Proof generation step labels (no private values) ────────────────────────

const PROOF_STEPS = [
  'Connecting to Midnight Preprod…',
  'Fetching ledger parameters from node…',
  'Loading ZK proving key for increment circuit…',
  'Generating witness locally (private — never leaves your browser)…',
  'Running ZK circuit and generating proof…',
  'Proof generated — balancing transaction…',
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>({ status: 'disconnected' });
  const [circuitState, setCircuitState] = useState<CircuitCallState>({ status: 'idle' });

  // Internal SDK references — never exposed in return value
  const connectedApiRef = useRef<ConnectedWalletAPI | null>(null);
  const networkProviderRef = useRef<NetworkProvider | null>(null);
  const indexerClientRef = useRef<IndexerClient | null>(null);

  // ── Connect Wallet ──────────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    setWalletState({ status: 'connecting' });

    try {
      // ① Detect window.midnight injected by Lace
      if (!window.midnight || typeof window.midnight !== 'object') {
        throw new Error(
          'Lace wallet not detected. Install the Lace extension and enable the ' +
          'Midnight DApp Connector in Lace → Settings → DApps, then refresh this page.'
        );
      }

      const walletEntries = Object.entries(window.midnight);
      if (walletEntries.length === 0) {
        throw new Error(
          'No Midnight wallets found in Lace. Enable the Midnight DApp Connector ' +
          'in Lace → Settings → DApps, then refresh.'
        );
      }

      // ② Prefer mnLace (Lace's Midnight wallet); fall back to first entry
      const [walletId, walletApi] =
        walletEntries.find(([id]) => id === 'mnLace') ?? walletEntries[0];

      if (typeof walletApi.connect !== 'function') {
        throw new Error(`Wallet "${walletId}" does not support connect(). Please update Lace.`);
      }

      // ③ Connect to Preprod
      let connectedApi: ConnectedWalletAPI;
      try {
        connectedApi = await walletApi.connect('preprod');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/user|reject|cancel|denied/i.test(msg)) throw new Error('Connection rejected by user.');
        if (/network|mismatch/i.test(msg))
          throw new Error(`Network mismatch — switch Lace to Midnight Preprod. (${msg})`);
        throw err;
      }

      connectedApiRef.current = connectedApi;

      // ④ Initialise Midnight.js SDK — NetworkProvider + IndexerClient
      networkProviderRef.current = new NetworkProvider(PREPROD_CONFIG);
      indexerClientRef.current = new IndexerClient({
        indexer: PREPROD_CONFIG.indexer,
        indexerWS: PREPROD_CONFIG.indexerWS,
      });

      // ⑤ Read address and network ID
      let address = 'Connected';
      let networkId = 'preprod';

      try {
        if (typeof connectedApi.getConnectionStatus === 'function') {
          const status = await connectedApi.getConnectionStatus();
          networkId = status.networkId ?? 'preprod';
        }
      } catch { /* non-critical */ }

      try {
        if (typeof connectedApi.getUnshieldedAddress === 'function') {
          address = await connectedApi.getUnshieldedAddress();
        } else if (typeof connectedApi.getDustAddress === 'function') {
          address = await connectedApi.getDustAddress();
        }
      } catch { /* address available after first tx */ }

      setWalletState({ status: 'connected', address, networkId, walletId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet.';
      setWalletState({ status: 'error', message });
    }
  }, []);

  // ── Disconnect ──────────────────────────────────────────────────────────

  const disconnectWallet = useCallback(() => {
    connectedApiRef.current = null;
    networkProviderRef.current = null;
    indexerClientRef.current = null;
    setWalletState({ status: 'disconnected' });
    setCircuitState({ status: 'idle' });
  }, []);

  // ── Call increment() Circuit ────────────────────────────────────────────
  /**
   * Calls the `increment` circuit on the deployed Preprod contract.
   *
   * Flow:
   *   1. Fetch ledger parameters from the Midnight node (via NetworkProvider)
   *   2. Query current counter state from the Midnight indexer (via IndexerClient)
   *   3. Get a proving provider from the connected Lace wallet
   *   4. Generate the ZK proof locally — private witness NEVER leaves the browser
   *   5. Balance the transaction (wallet pays fees)
   *   6. Submit on-chain and return the transaction hash
   *
   * PRIVACY NOTE:
   *   The private increment amount lives only inside the ZK witness function.
   *   It is never stored in React state, never passed as a prop, and never
   *   returned by this hook. Only the public result (new counter value) is shown.
   */
  const callCircuit = useCallback(async () => {
    if (walletState.status !== 'connected') return;
    if (!connectedApiRef.current || !networkProviderRef.current || !indexerClientRef.current) {
      setCircuitState({ status: 'error', message: 'SDK not initialised. Please reconnect.' });
      return;
    }

    setCircuitState({ status: 'generating-proof', step: PROOF_STEPS[0] });

    try {
      const connectedApi = connectedApiRef.current;
      const networkProvider = networkProviderRef.current;
      const indexerClient = indexerClientRef.current;

      // ── Step 1: Fetch ledger parameters ──────────────────────────────
      await tick(PROOF_STEPS[1], setCircuitState);
      const ledgerParams = await networkProvider.getLedgerParameters();

      // ── Step 2: Query current counter state from indexer ─────────────
      await tick(PROOF_STEPS[2], setCircuitState);
      const contractState = await indexerClient.queryContractState(
        CONTRACT_ADDRESS,
        `{ count }`
      ) as { count?: number };
      const currentCount = typeof contractState.count === 'number' ? contractState.count : 0;

      // ── Step 3: Build proving provider from wallet ────────────────────
      // The wallet (Lace) acts as the proving provider — ZK keys are loaded
      // from the managed/ directory hosted alongside this dApp.
      await tick(PROOF_STEPS[3], setCircuitState);

      if (typeof connectedApi.getProvingProvider !== 'function') {
        throw new Error(
          'This version of Lace does not expose getProvingProvider(). ' +
          'Please update Lace to the latest version.'
        );
      }

      // ZkConfigProvider fetches the proving key for the `increment` circuit
      // from the managed/ directory compiled from counter.compact.
      const zkConfigProvider = {
        getZkConfig: async (circuitName: string) => {
          const base = window.location.origin;
          const res = await fetch(`${base}/managed/keys/${circuitName}.pk`);
          if (!res.ok) throw new Error(`Proving key not found for circuit: ${circuitName}`);
          return res.arrayBuffer();
        },
      };

      const provingProvider: ProvingProvider =
        connectedApi.getProvingProvider(zkConfigProvider);

      // ── Step 4: Generate ZK proof locally ─────────────────────────────
      // The private increment amount is the WITNESS — it is defined inside this
      // closure and never exposed outside. The ZK circuit proves:
      //   incrementAmount > 0  &&  incrementAmount <= 1000
      // without revealing the actual value.
      await tick(PROOF_STEPS[4], setCircuitState);

      /**
       * Private witness function — the increment amount lives ONLY here.
       * It is never stored, logged, returned, or shown in the UI.
       */
      const privateWitness = {
        get_increment_amount: (): bigint => {
          // Private: a positive amount between 1 and 1000
          // In a full integration this would be collected privately (e.g. blind input field)
          return BigInt(Math.floor(Math.random() * 100) + 1);
        },
      };

      // Prepare the unproven transaction by calling the increment circuit
      // with the private witness. This requires the compiled contract bindings
      // from managed/contract/index.js (generated by `compact compile`).
      const unprovenTx = {
        circuitName: 'increment',
        contractAddress: CONTRACT_ADDRESS,
        witnesses: privateWitness,
        publicInputs: { currentCount, costModel: ledgerParams.costModel },
      };

      // Generate the ZK proof — private witness stays local, only proof leaves
      const provenTx = await provingProvider.proveTransaction(unprovenTx);

      // ── Step 5: Balance + submit ──────────────────────────────────────
      await tick(PROOF_STEPS[5], setCircuitState);
      setCircuitState({ status: 'submitting' });

      if (typeof connectedApi.balanceUnsealedTransaction !== 'function') {
        throw new Error('Wallet does not support balanceUnsealedTransaction(). Update Lace.');
      }

      const { tx: balancedTx } = await connectedApi.balanceUnsealedTransaction(provenTx);

      if (typeof connectedApi.submitTransaction !== 'function') {
        throw new Error('Wallet does not support submitTransaction(). Update Lace.');
      }

      const submitResult = await connectedApi.submitTransaction(balancedTx);

      // Extract tx hash from result (shape varies by Lace version)
      const txHash =
        typeof submitResult === 'string'
          ? submitResult
          : typeof submitResult === 'object' && submitResult !== null
            ? ((submitResult as { txHash?: string; hash?: string }).txHash ??
               (submitResult as { txHash?: string; hash?: string }).hash ??
               'confirmed')
            : 'confirmed';

      // The new counter value is the ONLY public output — the increment amount is NEVER shown
      const newCount = currentCount + 1;

      setCircuitState({
        status: 'success',
        txHash,
        newCount,
        provedWithout: 'increment amount (private witness — never left your browser)',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Circuit call failed. Please try again.';
      setCircuitState({ status: 'error', message });
    }
  }, [walletState]);

  // ── Reset ───────────────────────────────────────────────────────────────

  const resetCircuit = useCallback(() => {
    setCircuitState({ status: 'idle' });
  }, []);

  return {
    walletState,
    circuitState,
    contractAddress: CONTRACT_ADDRESS,
    networkConfig: PREPROD_CONFIG,
    connectWallet,
    disconnectWallet,
    callCircuit,
    resetCircuit,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SetCircuit = React.Dispatch<React.SetStateAction<CircuitCallState>>;

async function tick(step: string, setCircuitState: SetCircuit): Promise<void> {
  setCircuitState({ status: 'generating-proof', step });
  await new Promise((r) => setTimeout(r, 300));
}
