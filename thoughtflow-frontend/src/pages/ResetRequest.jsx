import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import API_BASE from '../config';

function ResetRequest() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [lookupState, setLookupState] = useState('idle');
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState(null);
  const [sending, setSending] = useState(false);

  const lookupAccount = async (event) => {
    event.preventDefault();
    setMessage('');
    setAccount(null);

    if (!identifier.trim()) {
      setLookupState('idle');
      setMessage('Enter a username or email first.');
      return;
    }

    setLookupState('loading');
    try {
      const response = await fetch(`${API_BASE}/api/password-reset/lookup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLookupState('idle');
        setMessage(data.error || data.detail || 'Unable to find that account.');
        return;
      }

      if (!data.found) {
        setLookupState('missing');
        setMessage(data.detail || 'No account matched that username or email.');
        return;
      }

      setAccount(data);
      setLookupState('found');
      setMessage(`Account found: ${data.username}${data.email_hint ? ` (${data.email_hint})` : ''}`);
    } catch {
      setLookupState('idle');
      setMessage('Lookup failed. Please try again.');
    }
  };

  const sendResetLink = async () => {
    setSending(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/password-reset/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || data.detail || 'Failed to send reset link.');
        return;
      }

      setMessage(data.detail || 'If that account exists, a reset link was sent to the email on file.');
    } catch {
      setMessage('Failed to send reset link.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <Logo className="w-24 h-24 md:w-1/2 md:h-screen object-cover rounded-none shrink-0" alt="ThoughtFlow logo" />
      <section className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/40 overflow-hidden">
          <div className="px-6 py-7 sm:px-8 sm:py-9 bg-linear-to-br from-zinc-900 via-zinc-950 to-black">
            <p className="text-sm uppercase tracking-[0.35em] text-blue-300">Account recovery</p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">Find your account first</h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-300 max-w-lg">
              Enter your username or email. We&apos;ll look up the account and only then ask if you want us to send a password reset link.
            </p>

            <form onSubmit={lookupAccount} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Username or email</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. yugraj or yugrajjoshi185@gmail.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={lookupState === 'loading'}
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {lookupState === 'loading' ? 'Looking up...' : 'Find account'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Back to login
                </button>
              </div>
            </form>

            {message ? (
              <div className={`mt-6 rounded-2xl border px-4 py-4 text-sm ${lookupState === 'missing' ? 'border-amber-400/30 bg-amber-400/10 text-amber-100' : 'border-white/10 bg-white/5 text-zinc-200'}`}>
                {message}
              </div>
            ) : null}

            {account ? (
              <div className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-blue-200">Account found</p>
                <div className="mt-3 space-y-2 text-sm text-zinc-100">
                  <p><span className="text-zinc-400">Username:</span> {account.username}</p>
                  {account.email_hint ? <p><span className="text-zinc-400">Email:</span> {account.email_hint}</p> : null}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={sendResetLink}
                    disabled={sending}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? 'Sending...' : 'Send reset link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAccount(null);
                      setLookupState('idle');
                      setMessage('');
                    }}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Search again
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ResetRequest;
