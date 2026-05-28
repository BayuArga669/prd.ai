"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TopBar from '@/components/TopBar';

const presetAvatars = [
  { id: 'preset1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150', label: 'Classic Blue' },
  { id: 'preset2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150', label: 'Vibrant Pink' },
  { id: 'preset3', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150', label: 'Warm Orange' },
  { id: 'preset4', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150&h=150', label: 'Casual Tech' },
  { id: 'preset5', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150', label: 'Indigo Creative' },
  { id: 'preset6', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150', label: 'Minimalist Yellow' }
];

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile.');
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '');
          setAvatarUrl(data.user.avatar_url || '');
          setEmail(data.user.email || '');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load profile. Please refresh.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setSuccess(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setError(null);
    setSuccess(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      setAvatarUrl(data.url);
      setSuccess('Image uploaded successfully! Click the save button below to commit.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setSuccess('Profile updated successfully!');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-background flex flex-col">
        <TopBar initialAvatarUrl={avatarUrl} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-2xl font-black text-primary animate-pulse font-headline">
            Loading Profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">
      <TopBar initialAvatarUrl={avatarUrl} />
      <div className="px-6 md:px-12 pb-24 md:pb-12 max-w-4xl mx-auto w-full flex flex-col gap-8 text-left">
        
        {/* Title */}
        <section className="mt-6 md:mt-2">
          <h2 className="text-4xl font-headline font-black text-on-background mb-2 tracking-tight">
            Account Settings
          </h2>
          <p className="text-base text-on-surface-variant font-bold">Customize your personal profile and avatar settings.</p>
        </section>

        {/* Notifications Banners */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 shadow-[3px_3px_0_#ef4444]">
            <div className="flex items-start gap-2.5 text-red-700">
              <span className="material-symbols-outlined text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <p className="text-sm font-bold">{error}</p>
            </div>
          </div>
        )}



        {/* Main Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Avatar Preview & Selection Card */}
          <div className="glass-neo-card p-6 rounded-[2rem] bg-white flex flex-col items-center border-4 border-on-surface shadow-[4px_4px_0_#2e1a28]">
            <span className="text-xs text-on-surface-variant font-extrabold uppercase tracking-wider mb-4 block">Avatar Preview</span>
            <div className="w-24 h-24 rounded-full border-4 border-on-surface overflow-hidden shadow-[4px_4px_0_#2e1a28] mb-6 relative bg-surface-container">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt="Avatar preview" 
                  width={96} 
                  height={96} 
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                  <span className="material-symbols-outlined text-4xl">person</span>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h4 className="font-headline font-black text-on-background text-lg leading-tight">{name || 'User'}</h4>
              <p className="text-xs text-on-surface-variant/80 font-bold mt-1">{email}</p>
            </div>
          </div>

          {/* Form and Selection Details */}
          <div className="lg:col-span-2 glass-neo-card p-6 md:p-8 rounded-[2rem] bg-white border-4 border-on-surface shadow-[6px_6px_0_#2e1a28]">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Details Inputs */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-surface rounded-xl border-2 border-on-surface text-sm focus:outline-none focus:border-primary shadow-[2px_2px_0_#2e1a28] font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface" htmlFor="email-read">
                    Email Address
                  </label>
                  <input
                    id="email-read"
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-4 py-3 bg-surface-container-low text-on-surface-variant/60 rounded-xl border-2 border-on-surface/20 text-sm font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Avatar Preset Grid */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-bold text-on-surface">
                  Choose a Preset Avatar
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {presetAvatars.map((preset) => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.url)}
                        title={preset.label}
                        className={`aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200 cursor-pointer relative ${
                          isSelected
                            ? 'border-primary ring-4 ring-primary-container scale-105 shadow-[2px_2px_0_#e040a0]'
                            : 'border-on-surface hover:scale-105 hover:shadow-[2px_2px_0_#2e1a28]'
                        }`}
                      >
                        <Image 
                          src={preset.url} 
                          alt={preset.label}
                          width={80} 
                          height={80} 
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl font-bold drop-shadow-md">check</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Upload Input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface">
                  Or Upload a Custom Avatar File
                </label>
                <div className="border-4 border-dashed border-on-surface/30 rounded-2xl p-6 bg-surface-container-lowest hover:bg-surface-container-low transition-colors flex flex-col items-center justify-center gap-3 relative cursor-pointer group">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 group-hover:scale-110 transition-transform">cloud_upload</span>
                  <div className="text-center">
                    <span className="text-sm font-black text-primary hover:underline">Choose a file</span>
                    <span className="text-xs text-on-surface-variant/75 block mt-1 font-bold">PNG, JPG up to 2MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center gap-2 rounded-xl">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-black text-primary animate-pulse">Uploading file...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Avatar Url Input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface" htmlFor="avatarUrl">
                  Or Paste a Custom Image URL
                </label>
                <input
                  id="avatarUrl"
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-surface rounded-xl border-2 border-on-surface text-sm focus:outline-none focus:border-primary shadow-[2px_2px_0_#2e1a28] font-bold"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="pop-btn w-full text-white font-black rounded-xl py-3.5 shadow-[4px_4px_0_#2e1a28] hover:shadow-[6px_6px_0_#2e1a28] transition-all flex items-center justify-center gap-2 select-none"
              >
                {saving ? (
                  <span className="animate-pulse">Saving Changes...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                    Save Profile Changes
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Floating Success Toast */}
      {success && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#e8f5e9] border-4 border-on-surface rounded-2xl p-4 shadow-[4px_4px_0_#1b5e20] text-left animate-toast-slide-in max-w-sm flex items-start gap-3">
          <span className="material-symbols-outlined text-green-700 text-2xl font-black drop-shadow-sm">check_circle</span>
          <div>
            <h4 className="font-headline font-black text-green-900 text-sm">Success!</h4>
            <p className="text-xs text-green-800 font-bold mt-0.5">{success}</p>
          </div>
          <button 
            onClick={() => setSuccess(null)} 
            className="text-green-700/50 hover:text-green-700 ml-auto transition-colors focus:outline-none"
            type="button"
          >
            <span className="material-symbols-outlined font-black text-sm">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
