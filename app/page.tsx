'use client';

import { useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

type Result = {
  verified?: boolean;
  error?: string;
};

export default function Home() {
  const [username, setUsername] = useState('demo');
  const [status, setStatus] = useState('Ready.');

  const handleRegister = async () => {
    try {
      setStatus('Requesting registration options...');
      const optionsRes = await fetch('/api/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setStatus(options.error || 'Failed to get options.');
        return;
      }

      const attestation = await startRegistration(options);

      setStatus('Verifying registration...');
      const verifyRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: attestation })
      });

      const verifyResult: Result = await verifyRes.json();
      if (verifyRes.ok && verifyResult.verified) {
        setStatus('Passkey registered!');
      } else {
        setStatus(verifyResult.error || 'Registration failed.');
      }
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const handleLogin = async () => {
    try {
      setStatus('Requesting login options...');
      const optionsRes = await fetch('/api/webauthn/login/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setStatus(options.error || 'Failed to get options.');
        return;
      }

      const assertion = await startAuthentication(options);

      setStatus('Verifying login...');
      const verifyRes = await fetch('/api/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: assertion })
      });

      const verifyResult: Result = await verifyRes.json();
      if (verifyRes.ok && verifyResult.verified) {
        setStatus('Logged in with passkey!');
      } else {
        setStatus(verifyResult.error || 'Login failed.');
      }
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <main>
      <h1>Passkey Minimal Example</h1>
      <p>Enter a username to register a passkey, then log in.</p>

      <label>
        Username
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="demo"
        />
      </label>

      <div className="actions">
        <button onClick={handleRegister}>Register Passkey</button>
        <button className="secondary" onClick={handleLogin}>
          Log in
        </button>
      </div>

      <div className="status">{status}</div>
    </main>
  );
}
