"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bgStyle = {
    backgroundColor: '#fef7ff',
    backgroundImage: 'radial-gradient(#e040a0 0.5px, transparent 0.5px), radial-gradient(#40c0ee 0.5px, transparent 0.5px)',
    backgroundSize: '40px 40px',
    backgroundPosition: '0 0, 20px 20px',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      // Successful login/registration, redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 relative w-full" style={bgStyle}>
      {/* Abstract floating accent circles */}
      <div className="absolute top-1/4 left-1/10 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/10 w-64 h-64 bg-secondary/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main card */}
      <div className="w-full max-w-md bg-white rounded-3xl border-4 border-on-surface shadow-[8px_8px_0_#2e1a28] p-8 md:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-[12px_12px_0_#2e1a28] hover:-translate-y-0.5 z-10">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary via-tertiary to-secondary"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 mt-4 text-center">
          <div className="flex items-center gap-3 mb-2">
            <Image 
              src="/logo.png" 
              alt="PRD.ai Logo" 
              width={48} 
              height={48} 
              className="rounded-2xl object-cover border-2 border-primary shadow-[3px_3px_0_#e040a0]" 
            />
            <h1 className="font-headline text-3xl font-black text-primary tracking-tight">PRD.ai</h1>
          </div>
          <p className="text-on-surface-variant text-sm font-bold">
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to start writing specs.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-container-high border-2 border-on-surface rounded-2xl p-1 mb-8 font-bold text-sm">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              isLogin
                ? 'bg-primary text-white border border-on-surface shadow-[2px_2px_0_#2e1a28]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              !isLogin
                ? 'bg-primary text-white border border-on-surface shadow-[2px_2px_0_#2e1a28]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 mb-6 shadow-[3px_3px_0_#ef4444] text-left">
            <div className="flex items-start gap-2.5 text-red-700">
              <span className="material-symbols-outlined text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <p className="text-xs md:text-sm font-bold">{error}</p>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          
          {/* Name Field (Register only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg">person</span>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border-2 border-on-surface text-sm focus:outline-none focus:border-primary shadow-[2px_2px_0_#2e1a28] font-bold"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-on-surface" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg">mail</span>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border-2 border-on-surface text-sm focus:outline-none focus:border-primary shadow-[2px_2px_0_#2e1a28] font-bold"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-on-surface" htmlFor="password">
                Password
              </label>
              {isLogin && (
                <Link href="#" className="text-xs text-primary font-bold hover:underline">
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg">lock</span>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border-2 border-on-surface text-sm focus:outline-none focus:border-primary shadow-[2px_2px_0_#2e1a28] font-bold"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="pop-btn w-full text-white font-black rounded-xl py-3.5 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center justify-center gap-2 select-none"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>


      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fef7ff] font-headline text-2xl font-black text-primary animate-pulse">
        Loading Auth...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
