/**
 * CircuitCall.tsx
 * Button that triggers an `increment` circuit call on the Midnight contract.
 *
 * PRIVACY GUARANTEE:
 *   - The private increment amount is generated inside the ZK proof engine.
 *   - It is NEVER passed as a prop, state value, or rendered anywhere in this component.
 *   - Only the public result (new counter value) and the transaction hash are shown.
 */

import React from 'react';
import type { CircuitCallState } from '../hooks/useMidnight';

interface CircuitCallProps {
  circuitState: CircuitCallState;
  walletConnected: boolean;
  contractAddress: string;
  onCall: () => void;
  onReset: () => void;
}

export function CircuitCall({
  circuitState,
  walletConnected,
  contractAddress,
  onCall,
  onReset,
}: CircuitCallProps) {
  const isProving = circuitState.status === 'generating-proof';
  const isSubmitting = circuitState.status === 'submitting';
  const isBusy = isProving || isSubmitting;
  const isSuccess = circuitState.status === 'success';
  const isError = circuitState.status === 'error';

  const buttonLabel = () => {
    if (isProving) return 'Generating ZK Proof…';
    if (isSubmitting) return 'Submitting Transaction…';
    return 'Increment Counter (ZK Proof)';
  };

  return (
    <div className="card" id="circuit-card">
      <div className="card-label">Step 2 — Circuit</div>
      <h2 className="card-title">Call Increment Circuit</h2>
      <p className="card-desc">
        Generates a zero-knowledge proof locally in your browser, then submits the
        transaction on-chain. The private increment amount is <strong>never visible</strong>{' '}
        to anyone — not even the Midnight network.
      </p>

      {/* ── Privacy badge ─────────────────────────────────────── */}
      <div className="privacy-badge" id="privacy-badge">
        <LockIcon />
        Proved without revealing your input
      </div>

      {/* ── Contract address strip ────────────────────────────── */}
      <div className="network-strip" id="contract-strip" style={{ marginBottom: '1.25rem' }}>
        <div className="network-item">
          <span className="network-label">Network</span>
          <span className="network-value">Midnight Preprod</span>
        </div>
        <div className="network-item" style={{ flex: 1, minWidth: 0 }}>
          <span className="network-label">Contract Address</span>
          <span className="network-value addr" title={contractAddress}>
            {contractAddress}
          </span>
        </div>
      </div>

      {/* ── Main action button ────────────────────────────────── */}
      <button
        id="call-circuit-btn"
        className="btn btn-primary"
        onClick={onCall}
        disabled={!walletConnected || isBusy}
        aria-label="Call increment circuit and generate ZK proof"
        aria-busy={isBusy}
      >
        {isBusy ? (
          <>
            <span className="spinner" />
            {buttonLabel()}
          </>
        ) : (
          <>
            <CircuitIcon />
            {buttonLabel()}
          </>
        )}
      </button>

      {!walletConnected && (
        <p
          style={{
            fontSize: '0.775rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            marginTop: '0.625rem',
          }}
        >
          Connect your wallet first to call the circuit.
        </p>
      )}

      {/* ── Proof step progress ───────────────────────────────── */}
      {isProving && circuitState.status === 'generating-proof' && (
        <p className="loading-step" id="proof-step-label" aria-live="polite">
          {circuitState.step}
        </p>
      )}
      {isSubmitting && (
        <p className="loading-step" aria-live="polite">
          Broadcasting transaction to Midnight Preprod…
        </p>
      )}

      {/* ── Success result ────────────────────────────────────── */}
      {isSuccess && circuitState.status === 'success' && (
        <div className="circuit-result success" id="circuit-result" role="alert">
          <div className="result-row">
            <span className="result-key">Status</span>
            <span className="result-val" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              ✓ Transaction confirmed
            </span>
          </div>

          <div className="result-row">
            <span className="result-key">New counter value</span>
            <span className="result-val highlight" id="counter-value">
              {circuitState.newCount}
            </span>
          </div>

          <div className="result-row">
            <span className="result-key">Tx hash</span>
            <span className="result-val tx-hash" id="tx-hash" title={circuitState.txHash}>
              {circuitState.txHash.slice(0, 16)}…{circuitState.txHash.slice(-8)}
            </span>
          </div>

          <div className="divider" />

          {/* ── Privacy confirmation — NO private value shown ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-accent-glow)',
              border: '1px solid hsla(195,90%,50%,0.2)',
            }}
            id="privacy-confirmation"
          >
            <LockIcon style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-accent)', lineHeight: 1.5 }}>
              <strong>Proved without revealing your input</strong> — the{' '}
              {circuitState.provedWithout} was used locally to generate a valid ZK proof.
              Only the new counter total was disclosed on-chain.
            </span>
          </div>

          <button
            id="call-again-btn"
            className="btn btn-secondary"
            onClick={onReset}
            style={{ marginTop: '0.75rem' }}
          >
            Call again
          </button>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────── */}
      {isError && circuitState.status === 'error' && (
        <div className="circuit-result failure" id="circuit-error" role="alert">
          <div className="error-box" style={{ margin: 0, border: 'none', background: 'transparent', padding: 0 }}>
            <span className="error-icon">⚠</span>
            <span className="error-text">{circuitState.message}</span>
          </div>
          <button
            id="retry-circuit-btn"
            className="btn btn-secondary"
            onClick={onReset}
            style={{ marginTop: '0.75rem' }}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function LockIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CircuitIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
