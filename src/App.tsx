/**
 * App.tsx
 * Root application component — composes WalletConnect + CircuitCall
 * using the useMidnight hook for shared state.
 */

import React from 'react';
import { WalletConnect } from './components/WalletConnect';
import { CircuitCall } from './components/CircuitCall';
import { useMidnight } from './hooks/useMidnight';

export default function App() {
  const {
    walletState,
    circuitState,
    contractAddress,
    connectWallet,
    disconnectWallet,
    callCircuit,
    resetCircuit,
  } = useMidnight();

  const isConnected = walletState.status === 'connected';

  return (
    <div className="app-shell">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="app-header" role="banner">
        <a href="/" className="app-logo" aria-label="Midnight Counter home">
          <div className="logo-icon" aria-hidden="true">⬡</div>
          <span className="logo-text">Midnight Counter</span>
          <span className="logo-badge">ZK</span>
        </a>

        {/* Connection status chip in header */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          aria-live="polite"
          aria-label="Wallet connection status"
        >
          <span
            className={`status-dot ${isConnected ? 'online' : 'offline'}`}
            aria-hidden="true"
          />
          <span
            style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
          >
            {isConnected && walletState.status === 'connected'
              ? `${walletState.address.slice(0, 10)}…`
              : 'Not connected'}
          </span>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="app-main" role="main" id="main-content">
        {/* Hero */}
        <section className="app-hero" aria-labelledby="hero-heading">
          <h1 className="hero-title" id="hero-heading">
            Privacy-Preserving Counter{' '}
            <span>on Midnight</span>
          </h1>
          <p className="hero-subtitle">
            Increment an on-chain counter while keeping your input completely private — powered
            by zero-knowledge proofs generated locally in your browser.
          </p>
        </section>

        {/* Cards grid */}
        <div className="cards-grid">
          <WalletConnect
            walletState={walletState}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
          <CircuitCall
            circuitState={circuitState}
            walletConnected={isConnected}
            contractAddress={contractAddress}
            onCall={callCircuit}
            onReset={resetCircuit}
          />
        </div>

        {/* Network info strip */}
        <div className="network-strip" role="complementary" aria-label="Network information">
          <div className="network-item">
            <span className="network-label">Network</span>
            <span className="network-value">Midnight Preprod</span>
          </div>
          <div className="network-item">
            <span className="network-label">Contract</span>
            <span className="network-value addr" title={contractAddress}>
              {contractAddress}
            </span>
          </div>
          <div className="network-item">
            <span className="network-label">Proof engine</span>
            <span className="network-value">In-browser WASM</span>
          </div>
          <div className="network-item">
            <span className="network-label">Privacy</span>
            <span className="network-value" style={{ color: 'var(--color-success)' }}>
              ZK — inputs never revealed
            </span>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="app-footer" role="contentinfo">
        <span className="footer-text">
          Built on{' '}
          <a
            href="https://midnight.network"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Midnight Network
          </a>{' '}
          · Midnight Builder Challenge Level 2
        </span>
        <span className="footer-text">
          <a
            href="https://github.com/Dhanshree-atre/midnight-new-moon"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            View on GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}
