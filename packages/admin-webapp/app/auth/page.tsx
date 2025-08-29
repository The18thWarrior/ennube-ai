"use client";
import React, { useState } from 'react';

export default function AuthPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = '/';
      } else {
        const body = await res.json();
        setError(body?.message || 'Invalid');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form onSubmit={submit} className="p-8 bg-white dark:bg-gray-800 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Admin Access</h1>
        <label className="block mb-2 text-sm">Global Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full border rounded px-3 py-2 mb-3 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
          placeholder="Enter global password"
        />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="mt-3 text-xs text-gray-500">This app uses a single global password stored in the server env.</p>
      </form>
    </div>
  );
}
