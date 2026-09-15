'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      // Auto-login after successful registration
      if (data.access_token && data.user) {
        login(data.access_token, data.user);
        router.push('/');
      } else {
        // If backend doesn't return token, redirect to login
        router.push('/auth/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-coicine-charcoal flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-zinc-900/80 p-10 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-headline font-bold text-coicine-gold mb-2">Tạo tài khoản</h1>
          <p className="text-gray-400">Đăng ký để bắt đầu đặt vé với CoiCine</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Họ và tên</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-coicine-gold transition-colors text-white"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-coicine-gold transition-colors text-white"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-coicine-gold transition-colors text-white"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-coicine-gold transition-colors text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-coicine-gold text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition-all transform active:scale-95 shadow-lg shadow-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng Ký'}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-500 text-sm">
          Đã có tài khoản?{' '}
          <Link href="/auth/login" className="text-coicine-gold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
