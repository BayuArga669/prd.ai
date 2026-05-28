"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '#') return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
    { href: '/editor', label: 'Docs', icon: 'description' },
    { href: '/templates', label: 'Templates', icon: 'auto_awesome_motion' },
    { href: '/analytics', label: 'Analytics', icon: 'bar_chart' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t-3 border-on-surface shadow-[0_-4px_0_rgba(46,26,40,0.05)] z-50 px-4 py-2 flex justify-around items-center">
      {navItems.map((item) => {
        const active = isActive(item.href);
        if (active) {
          return (
            <Link key={item.label} className="flex flex-col items-center gap-1 p-2 text-primary" href={item.href}>
              <div className="bg-primary/10 text-primary border-2 border-primary px-4 py-1 rounded-xl shadow-[2px_2px_0_#e040a0]">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
              </div>
              <span className="text-[10px] font-extrabold mt-0.5">{item.label}</span>
            </Link>
          );
        }
        return (
          <Link key={item.label} className="flex flex-col items-center gap-1 p-2 text-on-surface-variant hover:text-primary transition-colors" href={item.href}>
            <span className="material-symbols-outlined font-bold">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
