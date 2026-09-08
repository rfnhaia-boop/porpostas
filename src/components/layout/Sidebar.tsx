'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Settings, PlusCircle, Archive, FolderCheck, Send, LogOut, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';
import { useSession, signOut } from '@/lib/auth-client';

export const Sidebar = ({ open = false, onClose }: { open?: boolean; onClose?: () => void }) => {
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
    { href: '/havi', label: 'Havi', icon: Sparkles, img: '/havi-icon.webp' },
    { href: '/clients', label: 'Meus Clientes', icon: Users },
    { href: '/services', label: 'Serviços', icon: FileText },
    { href: '/proposals', label: 'Histórico', icon: Archive },
    { href: '/approved', label: 'Aprovados', icon: FolderCheck },
    { href: '/dispatches', label: 'Disparos', icon: Send },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside
      className={`w-64 liquid-glass h-screen flex flex-col no-print fixed left-0 top-0 z-[100] transition-transform duration-300 ease-out lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-8 flex justify-between items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nex-logo.webp" alt="NEX" className="h-7 w-auto shrink-0" />
        <div className="flex items-center gap-1">
          <span className="hidden lg:flex items-center gap-1">
            <NotificationsBell />
            <ThemeToggle />
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={22} />
          </button>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(link.href + '/');
          
          return (
            <Link key={link.href} href={link.href} onClick={onClose}>
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
                {'img' in link && link.img ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={link.img} alt="" className="relative z-10 h-5 w-5 rounded-full" />
                ) : (
                  <Icon size={20} className="relative z-10" />
                )}
                <span className="font-semibold uppercase tracking-widest text-[10px] relative z-10">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        <Link href="/quotes/new?fresh=1" onClick={onClose}>
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
