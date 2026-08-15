'use client';

import { useEffect, useMemo, useState } from 'react';

const FAST_API = 'https://hyulsxhzukqcmkodlgsi.supabase.co/functions/v1/fluxora-canvas-device-fast';
const FAST_PAGE = 'https://www.fluxora.wiki/device-check-fast.html?v=33';
const TOOL_ID = 'product-affiliate';
const TEST_DEVICE_KEY = 'fluxora.deviceTest.legacyId.v1';

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function flowToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function browserLabel() {
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'Browser';
}

function platformLabel() {
  return String((navigator as any).userAgentData?.platform || navigator.platform || 'Unknown').slice(0, 120);
}

async function post(body: Record<string, unknown>) {
  const response = await fetch(FAST_API, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: any = null;
  try { data = await response.json(); } catch {}
  if (!response.ok || !data || data.success === false) {
    const error: any = new Error(data?.message || `Fast device request failed (${response.status}).`);
    error.backend = data || null;
    throw error;
  }
  return data;
}

export default function DeviceTestPage() {
  const [code, setCode] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('Ready. Enter a Fluxora code.');
  const [busy, setBusy] = useState(false);
  const [lastCredential, setLastCredential] = useState('');
  const [previousCredential, setPreviousCredential] = useState('');
  const [tier, setTier] = useState('');
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(TEST_DEVICE_KEY) || '';
    if (id.length < 12) {
      id = randomId();
      localStorage.setItem(TEST_DEVICE_KEY, id);
    }
    setDeviceId(id);
  }, []);

  const matched = useMemo(() => {
    if (!previousCredential || !lastCredential) return null;
    return previousCredential === lastCredential;
  }, [previousCredential, lastCredential]);

  async function runCheck() {
    const normalized = code.trim().toLowerCase().replace(/\s+/g, '');
    if (!normalized || busy) return;

    const token = flowToken();
    const popup = window.open(
      `${FAST_PAGE}#flow=${encodeURIComponent(token)}`,
      'FluxoraDeviceTestFast',
      'popup=yes,width=500,height=520,resizable=yes,scrollbars=yes'
    );
    if (!popup) {
      setStatus('Pop-up blocked. Allow pop-ups for Fluxora and try again.');
      return;
    }

    const startedAt = performance.now();
    let flowStarted = false;
    setBusy(true);
    setTier('');
    setElapsed(null);
    setStatus('Fast check running…');

    try {
      const start = await post({
        action: 'authorizeStart',
        flowToken: token,
        toolId: TOOL_ID,
        accessCode: normalized,
        deviceId,
        browser: browserLabel(),
        platform: platformLabel(),
      });
      flowStarted = true;

      const deadline = Date.now() + 16000;
      let verified: any = null;
      while (Date.now() < deadline) {
        const state = await post({ action: 'status', flowToken: token });
        if (state.status === 'verified' && state.authorized === true && state.deviceCredentialId) {
          verified = state;
          break;
        }
        if (['failed', 'cancelled', 'expired'].includes(String(state.status || ''))) {
          throw new Error(state.message || `Device flow ${state.status}.`);
        }
        if (popup.closed) throw new Error('Device-check window closed before verification completed.');
        await new Promise(r => setTimeout(r, 100));
      }
      if (!verified) throw new Error('Fast device verification timed out.');

      const ms = Math.round(performance.now() - startedAt);
      setElapsed(ms);
      setPreviousCredential(lastCredential || previousCredential);
      setLastCredential(String(verified.deviceCredentialId));
      setTier(String(verified.tier || start.tier || 'Member'));
      setStatus(`PASS — secure device verified in ${(ms / 1000).toFixed(2)}s.`);
    } catch (error: any) {
      const ms = Math.round(performance.now() - startedAt);
      setElapsed(ms);
      setStatus(`FAIL after ${(ms / 1000).toFixed(2)}s — ${String(error?.message || error || 'Unknown error')}`);
      if (!flowStarted) {
        try { if (!popup.closed) popup.close(); } catch {}
      }
    } finally {
      setBusy(false);
    }
  }

  function simulateGeminiReset() {
    const next = randomId();
    localStorage.setItem(TEST_DEVICE_KEY, next);
    setDeviceId(next);
    if (lastCredential) setPreviousCredential(lastCredential);
    setLastCredential('');
    setTier('');
    setElapsed(null);
    setCode('');
    setStatus('Gemini storage reset simulated. Enter the SAME code again.');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fbf7f2', color: '#6f1830', padding: 24, fontFamily: 'Inter, Arial, sans-serif' }}>
      <section style={{ maxWidth: 720, margin: '40px auto', background: '#fffdfa', border: '1px solid #ead8d4', borderRadius: 24, padding: 28, boxShadow: '0 20px 60px rgba(87,31,43,.10)' }}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: '#bd8f97', marginBottom: 8 }}>FLUXORA V33 DEVICE TEST</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, margin: '0 0 8px' }}>Fast registered-device benchmark</h1>
        <p style={{ color: '#9a6570', lineHeight: 1.5, marginTop: 0 }}>
          Uses the v33 fast backend and lightweight Fluxora device page. The timer starts when you press Check Device and stops when the credential-bound v3 session is ready.
        </p>

        <label style={{ display: 'block', fontWeight: 700, margin: '22px 0 8px' }}>Access code</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runCheck(); }} placeholder="ACCESS CODE" autoComplete="off" style={{ flex: '1 1 300px', minWidth: 0, height: 50, borderRadius: 14, border: '1px solid #e3d0c6', padding: '0 16px', background: '#f6eee3', fontSize: 16, letterSpacing: 2 }} />
          <button disabled={busy || !code.trim()} onClick={runCheck} style={{ height: 50, border: 0, borderRadius: 14, padding: '0 22px', background: '#8e2948', color: '#fff', fontWeight: 800, cursor: 'pointer', opacity: busy ? .65 : 1 }}>{busy ? 'CHECKING…' : 'CHECK DEVICE'}</button>
        </div>

        <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: '#fff6f3', border: '1px solid #edd9d3', lineHeight: 1.5 }}>
          <strong>Status:</strong> {status}
          {elapsed !== null && <div style={{ marginTop: 8 }}><strong>Elapsed:</strong> {elapsed} ms</div>}
        </div>

        <div style={{ display: 'grid', gap: 10, marginTop: 18, fontSize: 13 }}>
          <div><strong>Simulated Canvas legacy ID:</strong> <code style={{ wordBreak: 'break-all' }}>{deviceId || 'loading…'}</code></div>
          <div><strong>Current crypto credential:</strong> <code style={{ wordBreak: 'break-all' }}>{lastCredential || '—'}</code></div>
          <div><strong>Previous crypto credential:</strong> <code style={{ wordBreak: 'break-all' }}>{previousCredential || '—'}</code></div>
          {tier && <div><strong>Tier:</strong> {tier}</div>}
        </div>

        {matched === true && <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: '#edf6ef', color: '#28613b', fontWeight: 800 }}>PASS: Same physical-browser crypto credential survived the simulated Gemini reset.</div>}
        {matched === false && <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: '#fff0f2', color: '#9b1c34', fontWeight: 800 }}>FAIL: A different crypto credential was created after the simulated Gemini reset.</div>}

        <button onClick={simulateGeminiReset} disabled={busy} style={{ width: '100%', marginTop: 22, minHeight: 48, borderRadius: 14, border: '1px solid #d9bfc5', background: '#fff', color: '#8e2948', fontWeight: 800, cursor: 'pointer' }}>SIMULATE GEMINI CANVAS RESET</button>
        <p style={{ marginBottom: 0, marginTop: 14, color: '#ad7b85', fontSize: 12, lineHeight: 1.5 }}>Success auto-closes the device-check window. Device-limit failures stay open with Manage Registered Devices.</p>
      </section>
    </main>
  );
}
