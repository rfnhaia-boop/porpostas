'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Settings, PlusCircle, Archive, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';
import { useSession, signOut } from '@/lib/auth-client';

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Meus Clientes', icon: Users },
    { href: '/services', label: 'Serviços', icon: FileText },
    { href: '/proposals', label: 'Histórico', icon: Archive },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 liquid-glass h-screen flex flex-col no-print fixed left-0 top-0 z-[100]">
      <div className="p-8 flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-[var(--foreground)]">
          NE<span className="text-[#FF6A00]">X</span>
        </h1>
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <ThemeToggle />
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer relative group ${
                isActive ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-[var(--border-color)] rounded-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={20} className="relative z-10" />
                <span className="font-semibold uppercase tracking-widest text-[10px] relative z-10">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        <Link href="/quotes/new">
          <button className="w-full bg-[#FF6A00] text-[#0A0A0A] p-4 rounded-2xl font-black uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,106,0,0.3)]">
            <PlusCircle size={18} /> Orçamento
          </button>
        </Link>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--border-color)] pt-4">
          <span className="text-[10px] text-[var(--text-muted)] truncate" title={session?.user?.email}>
            {session?.user?.email ?? '—'}
          </span>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="shrink-0 text-[var(--text-muted)] hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
