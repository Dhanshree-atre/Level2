/**
 * Type declarations for @midnight-ntwrk/midnight-js-network-provider
 *
 * These declarations mirror the actual package types so TypeScript can compile
 * while the package is resolved from the Midnight private npm registry
 * (https://npm.midnight.network/).
 *
 * When the package is installed, these declarations will be superseded by the
 * package's own bundled types.
 */
declare module '@midnight-ntwrk/midnight-js-network-provider' {
  /**
   * Endpoint configuration for connecting to the Midnight network services:
   * the blockchain node (RPC), indexer (GraphQL), and proof server.
   */
  export interface ServiceUriConfig {
    /** HTTP URL of the Midnight blockchain node RPC endpoint */
    node: string;
    /** HTTP URL of the Midnight indexer GraphQL endpoint */
    indexer: string;
    /** WebSocket URL of the Midnight indexer GraphQL subscription endpoint */
    indexerWS: string;
    /** HTTP URL of the Midnight proof server */
    proofServer: string;
  }

  /**
   * Network provider that connects to the Midnight blockchain node.
   * Used to read ledger state and submit transactions.
   */
  export class NetworkProvider {
    constructor(config: ServiceUriConfig);
    /** Fetch the current ledger parameters (cost model, etc.) from the node */
    getLedgerParameters(): Promise<LedgerParameters>;
    /** Submit a proven transaction to the Midnight network */
    submitTransaction(tx: unknown): Promise<{ txHash: string }>;
  }

  /**
   * Indexer client for querying on-chain contract state via GraphQL.
   */
  export class IndexerClient {
    constructor(config: Pick<ServiceUriConfig, 'indexer' | 'indexerWS'>);
    /** Query the current ledger state of a deployed contract */
    queryContractState(
      contractAddress: string,
      query: string
    ): Promise<Record<string, unknown>>;
  }

  /** Ledger parameters returned by the Midnight node (required for proving) */
  export interface LedgerParameters {
    costModel: unknown;
    protocolVersion: string;
  }

  /**
   * Well-known network configurations for Midnight networks.
   */
  export const networks: {
    /** Midnight Preprod testnet */
    preprod: ServiceUriConfig;
    /** Midnight Preview testnet */
    preview: ServiceUriConfig;
    /** Midnight Mainnet */
    mainnet: ServiceUriConfig;
  };
}
