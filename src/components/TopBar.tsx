"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23604868'><circle cx='12' cy='8' r='4'/><path d='M12 14c-6.1 0-8 4-8 4h16s-1.9-4-8-4z'/></svg>";

interface TopBarProps {
  initialAvatarUrl?: string | null;
}

export default function TopBar({ initialAvatarUrl }: TopBarProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl || null);
  const [prevInitialAvatarUrl, setPrevInitialAvatarUrl] = useState<string | null | undefined>(initialAvatarUrl);

  if (initialAvatarUrl !== prevInitialAvatarUrl) {
    setPrevInitialAvatarUrl(initialAvatarUrl);
    setAvatarUrl(initialAvatarUrl || null);
  }

  useEffect(() => {
    if (!initialAvatarUrl) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user && data.user.avatar_url) {
            setAvatarUrl(data.user.avatar_url);
          }
        })
        .catch((err) => console.error('Failed to fetch user profile in TopBar:', err));
    }
  }, [initialAvatarUrl]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <>
      {/* TopAppBar (Mobile Only) */}
      <header className="md:hidden flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50 bg-surface border-b-3 border-on-surface shadow-[0_3px_0_rgba(46,26,40,0.1)] transition-all duration-300 ease-in-out font-body">
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="PRD.ai Logo" 
            width={24} 
            height={24} 
            className="rounded-lg object-cover border border-primary/20" 
          />
          <span className="text-xl font-black text-primary tracking-tight">PRD.ai</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="text-red-500 hover:text-red-600 active:scale-95 transition-transform flex items-center justify-center p-1 rounded-lg hover:bg-red-50"
            title="Logout"
          >
            <span className="material-symbols-outlined font-bold">logout</span>
          </button>
          <button className="text-on-surface hover:text-primary active:scale-95 transition-transform">
            <span className="material-symbols-outlined font-bold">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full border-2 border-on-surface overflow-hidden shadow-[2px_2px_0_#2e1a28]">
            <Image 
              alt="User profile" 
              width={32} 
              height={32} 
              className="object-cover w-full h-full" 
              src={avatarUrl || defaultAvatar} 
              unoptimized
            />
          </div>
        </div>
      </header>

      {/* Top Row Actions (Desktop) */}
      <div className="hidden md:flex justify-end items-center px-8 py-5 gap-4 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:text-primary bg-white hover:bg-surface-container-low border-2 border-on-surface shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0_#2e1a28] transition-all">
          <span className="material-symbols-outlined font-bold">search</span>
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:text-secondary bg-white hover:bg-surface-container-low border-2 border-on-surface shadow-[2px_2px_0_#2e1a28] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0_#2e1a28] transition-all relative">
          <span className="material-symbols-outlined font-bold">notifications</span>
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-primary rounded-full border border-on-surface"></span>
        </button>
        <div className="w-10 h-10 rounded-full border-2 border-on-surface overflow-hidden shadow-[2px_2px_0_#2e1a28] cursor-pointer hover:scale-105 transition-transform duration-200">
          <Image 
            alt="User profile" 
            width={40} 
            height={40} 
            className="object-cover w-full h-full" 
            src={avatarUrl || defaultAvatar} 
            unoptimized
          />
        </div>
      </div>
    </>
  );
}
