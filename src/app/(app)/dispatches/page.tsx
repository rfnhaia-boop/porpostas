'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmailTemplatesSettings } from '@/components/EmailTemplatesSettings';
import { WhatsappTemplatesSettings } from '@/components/WhatsappTemplatesSettings';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, MessageCircle, Send } from 'lucide-react';

const TABS = [
  { id: 'email' as const, label: 'E-mails Automáticos', icon: Mail, color: 'from-cyan-500 to-blue-500', shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]' },
  { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle, color: 'from-[#FF6A00] to-[#FF8C33]', shadow: 'shadow-[0_0_20px_rgba(255,106,0,0.4)]' },
];

export default function DispatchesPage() {
  const [tab, setTab] = useState<'email' | 'whatsapp'>('email');

  return (
    <div className="p-4 sm:p-6 lg:p-12 min-h-screen text-white">
      <PageHeader
        title="Motor de Disparo"
        description="Ajuste os textos e gatilhos de comunicação que o Fechô envia para os seus clientes"
        action={
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            <Send size={14} className="text-[#FF6A00]" /> Configuração Global
          </div>
        }
      />

      {/* TABS ELEGANTES */}
      <div className="mb-12 flex flex-wrap gap-4 border-b border-white/5 pb-8">
        {TABS.map(({ id, label, icon: Icon, color, shadow }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-3 rounded-full px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? 'bg-white/[0.05] text-white'
                  : 'text-white/40 hover:bg-white/[0.02] hover:text-white/70'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="dispatchTab"
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${color} opacity-20 blur-md`}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="dispatchTabBorder"
                  className="absolute inset-0 rounded-full border border-white/20"
                />
              )}
              <Icon size={16} className={isActive ? (id === 'whatsapp' ? 'text-[#FF6A00]' : 'text-cyan-400') : ''} />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
          >
            {tab === 'email' ? <EmailTemplatesSettings /> : <WhatsappTemplatesSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
