'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, FileText, Settings, PlusCircle, Archive, FolderCheck, Send, LogOut, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';
import { useSession, signOut } from '@/lib/auth-client';


const OrcamentoButton = ({ onClose }: { onClose?: () => void }) => {
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <Link href="/quotes/new?fresh=1" onClick={onClose} className="w-full block">
      <button
        ref={btnRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative w-full flex items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#FF6A00]/30 bg-gradient-to-r from-[#FF6A00]/10 to-[#FF6A00]/5 p-4 transition-all duration-500 hover:border-[#FF6A00]/50 hover:shadow-[0_0_40px_rgba(255,106,0,0.3)] hover:scale-[1.02] backdrop-blur-xl"
      >
        {/* Glow de JS Seguindo o Mouse */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(80px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,106,0,0.6), transparent 100%)`,
          }}
        />
        
        {/* Camada superior do botão (Fundo translúcido para o texto sobressair) */}
        <div className="absolute inset-0 bg-[#030303]/40 z-0" />

        <PlusCircle size={18} className="relative z-10 text-[#FF6A00] transition-colors group-hover:text-white" />
        <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.25em] text-[#FF6A00] transition-colors group-hover:text-white">
          Orçamento
        </span>
      </button>
    </Link>
  );
};

export const Sidebar = ({ open = false, onClose }: { open?: boolean; onClose?: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      /* mesmo se o request falhar, tira o usuário da área logada */
    }
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
      <div className="p-6 pb-8 flex justify-between items-center border-b border-white/[0.02] mb-4 relative">
        <div className="absolute top-1/2 left-8 w-20 h-10 bg-[#FF6A00]/10 blur-[30px] rounded-full pointer-events-none" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nex-logo.webp" alt="NEX" className="h-6 w-auto shrink-0 relative z-10 drop-shadow-[0_0_15px_rgba(255,106,0,0.3)]" />
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
      
      <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(link.href + '/');
          
          return (
            <Link key={link.href} href={link.href} onClick={onClose} className="block relative outline-none">
              <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer relative group overflow-hidden ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/90 hover:bg-white/[0.02]'
              }`}>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gradient-to-r from-white/[0.05] to-transparent border-l-2 border-[#FF6A00] rounded-r-xl"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center transition-transform duration-300 ${isActive ? 'scale-110 text-[#FF6A00]' : 'group-hover:scale-110 group-hover:text-white'}`}>
                  {'img' in link && link.img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={link.img} alt="" className={`h-5 w-5 rounded-full ${isActive ? 'drop-shadow-[0_0_10px_rgba(255,106,0,0.5)]' : 'group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]'}`} />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>
                
                <span className={`font-black uppercase tracking-[0.15em] text-[10px] relative z-10 transition-transform duration-300 ${isActive ? 'translate-x-1 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'group-hover:translate-x-1'}`}>
                  {link.label}
                </span>

                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            </Link>
          );
        })}
      </nav>

            <div className="p-6 pb-12 flex flex-col gap-8">
        <OrcamentoButton onClose={onClose} />

        <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-2 pr-3 backdrop-blur-xl transition-all duration-500 hover:border-white/10 hover:bg-white/[0.05] hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 text-sm font-black uppercase text-white shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:border-white/20 group-hover:from-white/20">
              {session?.user?.email?.charAt(0) ?? 'N'}
            </div>
            <div className="flex flex-col truncate">
              <span className="truncate text-[10px] font-bold tracking-wider text-white/70 group-hover:text-white transition-colors">
                {session?.user?.email ?? 'nexus@admin.com'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6A00]/70 group-hover:text-[#FF6A00]">
                Workspace
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            title="Sair"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/20 transition-all duration-300 hover:bg-red-500/10 hover:text-red-500 hover:scale-110"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};


