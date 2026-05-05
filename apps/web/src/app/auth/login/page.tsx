'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      login(data.access_token, data.user);
      router.push(callbackUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-zinc-900/80 p-10 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-headline font-bold text-coicine-gold mb-2">Chào mừng trở lại</h1>
        <p className="text-gray-400">Đăng nhập để đặt vé ngay</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-coicine-gold text-black font-bold py-4 rounded-xl hover:bg-yellow-400 transition-all transform active:scale-95 shadow-lg shadow-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
        </button>
      </form>
      
      <p className="text-center mt-8 text-gray-500 text-sm">
        Chưa có tài khoản? <Link href="/auth/register" className="text-coicine-gold hover:underline">Đăng ký ngay</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-coicine-charcoal flex items-center justify-center px-6">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
