'use client';

import { useEffect, useState } from 'react';

const VAULT_API = 'https://hyulsxhzukqcmkodlgsi.supabase.co/functions/v1/fluxora-canvas-device-vault';
const DB_NAME = 'fluxora-top-level-device-vault-v1';
const STORE_NAME = 'keys';
const KEY_ID = 'device-p256';

type VaultState = 'checking' | 'success' | 'error';

function flowTokenFromHash() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams((window.location.hash || '').replace(/^#/, '')).get('flow') || '';
}

async function api(action: string, flowToken: string, extra: Record<string, unknown> = {}) {
  const response = await fetch(VAULT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ action, flowToken, ...extra }),
  });
  let data: any = null;
  try { data = await response.json(); } catch {}
  if (!response.ok || !data || data.success === false) {
    throw new Error(data?.message || `Secure device check failed (${response.status}).`);
  }
  return data;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

function openDb(): Promise<IDBDatabase> {
  return withTimeout(new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DB_NAME, 1); }
    catch (error) { reject(error); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Device storage unavailable.'));
    request.onblocked = () => reject(new Error('Device storage is blocked.'));
  }), 3500, 'Device storage timed out.');
}

async function getKeyRecord(): Promise<any | null> {
  const db = await openDb();
  try {
    return await withTimeout(new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(KEY_ID);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Device key read failed.'));
    }), 3000, 'Device key read timed out.');
  } finally {
    try { db.close(); } catch {}
  }
}

async function putKeyRecord(record: any) {
  const db = await openDb();
  try {
    await withTimeout(new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Device key write failed.'));
      tx.onabort = () => reject(tx.error || new Error('Device key write aborted.'));
    }), 3000, 'Device key write timed out.');
  } finally {
    try { db.close(); } catch {}
  }
}

async function ensureKey() {
  if (!window.crypto?.subtle) throw new Error('Web Crypto is unavailable in this browser.');
  const existing = await getKeyRecord();
  if (existing?.privateKey && existing?.publicKey) {
    return { privateKey: existing.privateKey as CryptoKey, publicKey: existing.publicKey as CryptoKey, state: 'restored' };
  }
  const pair = await withTimeout(
    window.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']) as Promise<CryptoKeyPair>,
    4000,
    'Device key generation timed out.',
  );
  await putKeyRecord({ id: KEY_ID, privateKey: pair.privateKey, publicKey: pair.publicKey, createdAt: new Date().toISOString() });
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, state: 'created' };
}

function base64Url(bytes: Uint8Array) {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function waitForStarted(flowToken: string) {
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    const state = await api('status', flowToken);
    if (state.status === 'started' || state.status === 'challenge' || state.status === 'verified') return state;
    if (['failed', 'cancelled', 'expired'].includes(String(state.status || ''))) {
      throw new Error(state.message || 'Device verification was cancelled.');
    }
    await new Promise(resolve => window.setTimeout(resolve, 300));
  }
  throw new Error('Fluxora approval did not reach this device window in time.');
}

export default function DeviceCheckPage() {
  const [state, setState] = useState<VaultState>('checking');
  const [message, setMessage] = useState('Keep this window open for a moment. Your Fluxora code stays in the main tool.');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const flowToken = flowTokenFromHash();
      if (!/^[A-Za-z0-9_-]{40,100}$/.test(flowToken)) throw new Error('Invalid device verification flow.');

      const started = await waitForStarted(flowToken);
      if (started.status === 'verified') {
        if (!cancelled) {
          setState('success');
          setMessage('Fluxora access is ready. This window will close automatically.');
          window.setTimeout(() => { try { window.close(); } catch {} }, 700);
        }
        return;
      }

      const key = await ensureKey();
      const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', key.publicKey);
      const enrollment = await api('enroll', flowToken, { publicKeyJwk });
      const challenge = String(enrollment.challenge || '');
      if (!challenge) throw new Error('Fluxora did not return a device challenge.');

      const signature = new Uint8Array(await withTimeout(
        window.crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key.privateKey, new TextEncoder().encode(challenge)),
        4000,
        'Device signing timed out.',
      ));
      await api('verify', flowToken, { deviceSignature: base64Url(signature) });

      if (!cancelled) {
        setState('success');
        setMessage(`Device verified${key.state === 'restored' ? ' using this browser’s registered key' : ' and registered to this browser'}. This window will close automatically.`);
        window.setTimeout(() => { try { window.close(); } catch {} }, 700);
      }
    })().catch((error) => {
      if (!cancelled) {
        setState('error');
        setMessage(String(error?.message || error || 'Device verification failed.'));
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#fbf7f2', color: '#6f1830', fontFamily: 'Inter, Arial, sans-serif' }}>
      <section style={{ width: 'min(440px, 100%)', background: '#fffdfa', border: '1px solid #ead8d4', borderRadius: 24, padding: 28, boxShadow: '0 20px 60px rgba(87,31,43,.12)', textAlign: 'center' }}>
        {state === 'checking' && <div aria-label="Checking device" style={{ width: 48, height: 48, margin: '0 auto 18px', borderRadius: '50%', border: '4px solid #ead8d4', borderTopColor: '#8e2948', animation: 'spin 1s linear infinite' }} />}
        {state === 'success' && <div style={{ width: 48, height: 48, margin: '0 auto 18px', borderRadius: '50%', background: '#edf6ef', color: '#2e6f43', fontSize: 30, lineHeight: '48px', fontWeight: 700 }}>✓</div>}
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, margin: '0 0 10px' }}>{state === 'success' ? 'Device verified' : state === 'error' ? 'Device check failed' : 'Verifying this device'}</h1>
        <p style={{ color: state === 'error' ? '#9b1c34' : '#a96772', lineHeight: 1.5, margin: 0 }}>{message}</p>
        {state === 'error' && <p style={{ marginTop: 16, fontSize: 13, color: '#9b1c34' }}>Return to the Fluxora tool, close this window, and press Check Code again.</p>}
        <div style={{ fontSize: 12, color: '#bd8f97', marginTop: 16 }}>Fluxora secure device check</div>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </section>
    </main>
  );
}
