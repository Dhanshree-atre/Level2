/**
 * WalletConnect.tsx
 * Lace wallet connect / disconnect UI.
 * Shows connected address, network, and handles errors gracefully.
 */

import React from 'react';
import type { WalletState } from '../hooks/useMidnight';

// Helper: get a human-readable label for the wallet ID
function walletLabel(walletId: string): string {
  if (walletId === 'mnLace') return 'Lace';
  return walletId;
}

interface WalletConnectProps {
  walletState: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ walletState, onConnect, onDisconnect }: WalletConnectProps) {
  const isConnecting = walletState.status === 'connecting';
  const isConnected = walletState.status === 'connected';
  const hasError = walletState.status === 'error';

  // Shorten address for display: first 10 … last 6
  function formatAddress(addr: string): string {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 18)}…${addr.slice(-8)}`;
  }

  return (
    <div className="card" id="wallet-card">
      <div className="card-label">Step 1 — Wallet</div>
      <h2 className="card-title">Connect Lace Wallet</h2>
      <p className="card-desc">
        Connect your Lace wallet to interact with the Midnight Preprod network. Your private
        data never leaves your browser.
      </p>

      {/* ── Status indicator ─────────────────────────────────── */}
      <div
        className={`wallet-status ${
          isConnected ? 'connected' : hasError ? 'error' : 'disconnected'
        }`}
        id="wallet-status-indicator"
      >
        <span
          className={`status-dot ${
            isConnected ? 'online' : hasError ? 'error-dot' : 'offline'
          }`}
        />
        <div className="status-info">
          <div className="status-label">
            {isConnected ? 'Wallet connected' : hasError ? 'Connection error' : 'Not connected'}
          </div>

          {isConnected && walletState.status === 'connected' && (
            <div className="status-value address" id="wallet-address-display" title={walletState.address}>
              {formatAddress(walletState.address)}
            </div>
          )}

          {!isConnected && !hasError && (
            <div className="status-value">Lace wallet required</div>
          )}

          {hasError && walletState.status === 'error' && (
            <div className="status-value" style={{ color: 'var(--color-error)', whiteSpace: 'normal' }}>
              {walletState.message}
            </div>
          )}
        </div>

        {isConnected && walletState.status === 'connected' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
            <span
              className="logo-badge"
              style={{ background: 'var(--color-success-dim)', borderColor: 'hsla(150,70%,45%,0.4)', color: 'var(--color-success)' }}
            >
              {walletLabel(walletState.walletId)}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {walletState.networkId}
            </span>
          </div>
        )}
      </div>

      {/* ── Action buttons ───────────────────────────────────── */}
      {!isConnected ? (
        <button
          id="connect-wallet-btn"
          className="btn btn-primary"
          onClick={onConnect}
          disabled={isConnecting}
          aria-label="Connect Lace wallet"
        >
          {isConnecting ? (
            <>
              <span className="spinner" />
              Connecting…
            </>
          ) : (
            <>
              <WalletIcon />
              Connect Lace Wallet
            </>
          )}
        </button>
      ) : (
        <button
          id="disconnect-wallet-btn"
          className="btn btn-danger"
          onClick={onDisconnect}
          aria-label="Disconnect wallet"
        >
          <DisconnectIcon />
          Disconnect
        </button>
      )}

      {/* ── Install hint ─────────────────────────────────────── */}
      {!isConnected && !isConnecting && (
        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
            Don&apos;t have Lace?{' '}
            <a href="https://www.lace.io/" target="_blank" rel="noopener noreferrer" className="footer-link">
              Install it here
            </a>
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            After installing, open Lace → Settings → <strong style={{ color: 'var(--color-text-secondary)' }}>DApps</strong> → enable{' '}
            <strong style={{ color: 'var(--color-text-accent)' }}>Midnight DApp Connector</strong>, then refresh this page.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function WalletIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12h.01" />
    </svg>
  );
}

function DisconnectIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
