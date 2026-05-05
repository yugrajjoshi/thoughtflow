import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!uid || !token) {
      setMessage('Missing reset parameters.');
    }
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMessage('Password updated. Redirecting to login...');
        setTimeout(() => navigate('/'), 1400);
      } else {
        setMessage(data.error || data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setMessage('Request failed');
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <img
        src="src/assets/logo.svg"
        alt="Logo Image"
        className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-cover rounded-lg mb-6"
      />
      <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Set a new password</h2>
        {message ? <p className="mb-3 text-sm">{message}</p> : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="p-2 rounded bg-black text-white"
          />
          <button type="submit" disabled={newPassword.length < 8} className="px-4 py-2 bg-green-700 rounded disabled:opacity-50">Set password</button>
          {newPassword.length > 0 && newPassword.length < 8 ? <p className="text-sm text-zinc-400">Password must be at least 8 characters.</p> : null}
        </form>
      </div>
    </main>
  );
}

export default ResetPassword;
