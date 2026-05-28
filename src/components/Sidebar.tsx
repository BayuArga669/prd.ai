"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '#') return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
    { href: '/editor', label: 'Documents', icon: 'description' },
    { href: '/templates', label: 'Templates', icon: 'auto_awesome_motion' },
    { href: '/analytics', label: 'Analytics', icon: 'bar_chart' },
  ];

  const footerItems = [
    { href: '/settings', label: 'Settings', icon: 'settings' },
    { href: '#', label: 'Support', icon: 'contact_support' },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-surface border-r-4 border-on-surface p-4 gap-2 z-40 relative shadow-[2px_0_0_rgba(46,26,40,0.05)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        <Image 
          src="/logo.png" 
          alt="PRD.ai Logo" 
          width={40} 
          height={40} 
          className="rounded-xl object-cover border-2 border-primary shadow-[2px_2px_0_#e040a0]" 
        />
        <div>
          <h1 className="text-xl font-black text-primary tracking-tight leading-none">PRD.ai</h1>
          <p className="text-xs font-bold text-on-surface-variant mt-0.5">AI Copilot</p>
        </div>
      </div>
      
      {/* CTA */}
      <Link href="/wizard" className="pop-btn w-full text-white font-bold rounded-xl py-3 mb-6 flex items-center justify-center gap-2 text-center select-none">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        New PRD
      </Link>
      
      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-2 font-body text-base font-bold">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                active
                  ? 'bg-primary/10 text-primary border-2 border-primary shadow-[2px_2px_0_#e040a0]'
                  : 'text-on-surface border-2 border-transparent hover:border-on-surface hover:bg-surface-container-low hover:shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer Navigation */}
      <div className="mt-auto flex flex-col gap-2 font-body text-base font-bold pt-4 border-t-2 border-on-surface/10">
        {footerItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                active
                  ? 'bg-primary/10 text-primary border-2 border-primary shadow-[2px_2px_0_#e040a0]'
                  : 'text-on-surface border-2 border-transparent hover:border-on-surface hover:bg-surface-container-low hover:shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-600 border-2 border-transparent hover:border-red-600 hover:bg-red-50 rounded-xl px-4 py-3 hover:shadow-[2px_2px_0_#ef4444] hover:-translate-y-0.5 active:translate-y-0.5 transition-all text-left w-full font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
