# Midnight Counter

> A privacy-preserving ZK dApp on Midnight Network — increment an on-chain counter while keeping your input completely private via zero-knowledge proofs.

## Live Demo

[https://level2-ten.vercel.app/](https://level2-ten.vercel.app/)

## Contract Address

| Network  | Address                                                              |
|----------|----------------------------------------------------------------------|
| Preprod  | `76a1f26ef78965e7180d51b050c911904ece4bb2d2ca876c2bdabaaacde5e01e` |

## What This Does

This dApp connects to a Midnight Preprod smart contract that implements a privacy-preserving counter. Users can:

- **Connect** their Lace wallet to the Midnight Preprod network
- **Call the `increment` circuit** — which generates a zero-knowledge proof locally in the browser using `@midnight-ntwrk/midnight-js-network-provider` and the wallet's built-in proving provider
- **Submit the proof on-chain** — only the new counter total is disclosed; the private increment amount is never revealed

The Midnight.js SDK (`@midnight-ntwrk/midnight-js-network-provider`) is used to:
- Configure the Preprod network endpoints (`ServiceUriConfig`)
- Connect to the Midnight node via `NetworkProvider`
- Query on-chain contract state via `IndexerClient`
- Coordinate proof generation via the wallet's `getProvingProvider()` API

## Privacy Model

### What is PUBLIC (on-chain, visible to anyone):
- The current counter value (`count`) — stored in the ledger, queryable by anyone
- The fact that an increment transaction occurred
- The transaction hash and block it was included in

### What is PRIVATE (private witness, never on-chain):
- `get_increment_amount()` — the exact amount used in `increment()`, generated locally inside the ZK proof engine
- This value lives only in the prover's local WASM environment — it is never transmitted, logged, or shown in the UI

### What the user PROVES without revealing:
- That `incrementAmount > 0` and `incrementAmount <= 1000` (via ZK proof)
- The resulting new counter total is disclosed (via `disclose()`) so the chain can validate the state update
- The actual private value is **never transmitted, stored, or revealed**

## Privacy Claim

**An on-chain observer CAN see:**
- That a counter increment transaction occurred
- The new counter total after the increment
- The transaction hash and block number

**An on-chain observer CANNOT see:**
- The amount by which the counter was incremented
- Any information about the user's private witness value
- The inputs to the ZK circuit

The Midnight protocol's ZK proof system mathematically guarantees that the increment amount remains private — even the blockchain nodes processing the transaction cannot learn the private input.

## Tech Stack

- **Midnight Network** — Privacy-focused blockchain with native ZK proofs
- **Compact** — Smart contract language compiling to ZK circuits
- **`@midnight-ntwrk/midnight-js-network-provider`** — Midnight.js SDK: `NetworkProvider`, `IndexerClient`, `ServiceUriConfig`
- **`@midnight-ntwrk/dapp-connector-api`** — Lace wallet DApp connector (v4)
- **React + Vite** — Frontend with in-browser WASM proof generation
- **Lace wallet** — Midnight DApp connector for wallet connect + proving
- **TypeScript** — Full type-safety
- **Vercel** — Hosting with COOP/COEP headers for SharedArrayBuffer

## Prerequisites

- **Lace wallet** installed with Midnight DApp Connector enabled
  1. Install from [lace.io](https://www.lace.io/)
  2. Open Lace → Settings → DApps → enable **Midnight DApp Connector**
  3. Switch to **Midnight Preprod** network
- **Node.js v22+** — [nodejs.org](https://nodejs.org/)

## Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/Dhanshree-atre/Level2.git
cd Level2

# 2. Install dependencies
#    @midnight-ntwrk packages install from https://npm.midnight.network/
npm install

# 3. Start the development server
npm run dev

# 4. Open http://localhost:5173
#    Make sure Lace is installed and set to Midnight Preprod
```

### Build for production

```bash
npm run build
# Output: dist/
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

The `vercel.json` configures:
- SPA rewrites (all routes → `index.html`)
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

These headers are required for `SharedArrayBuffer` used by the in-browser WASM ZK proof engine.

## File Structure

```
Level2/
├── contracts/
│   └── counter.compact          ← Compact smart contract (ZK circuits)
├── managed/                     ← Compiled by: compact compile contracts/counter.compact managed
│   ├── contract/index.js        ← Contract JS bindings
│   ├── keys/                    ← ZK proving & verifying keys
│   └── zkir/                    ← ZK intermediate representation
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx    ← Lace wallet connect/disconnect UI
│   │   └── CircuitCall.tsx      ← ZK circuit call + result display
│   ├── hooks/
│   │   └── useMidnight.ts       ← Midnight.js SDK hook (NetworkProvider + IndexerClient)
│   ├── types/
│   │   └── midnight-network-provider.d.ts  ← Type declarations for SDK
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vercel.json                  ← COOP/COEP headers for WASM
├── .npmrc                       ← Points @midnight-ntwrk to npm.midnight.network
├── package.json
└── README.md
```

## Demo Video

[PLACEHOLDER — I will add the link after recording]

---

Built for the **Midnight Builder Challenge — Level 2** · [Midnight Network](https://midnight.network)
