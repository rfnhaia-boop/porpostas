'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmailTemplatesSettings } from '@/components/EmailTemplatesSettings';
import { WhatsappTemplatesSettings } from '@/components/WhatsappTemplatesSettings';
import { motion } from 'framer-motion';
import { Mail, MessageCircle } from 'lucide-react';

const TABS = [
  { id: 'email' as const, label: 'E-mail', icon: Mail },
  { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle },
];

export default function DispatchesPage() {
  const [tab, setTab] = useState<'email' | 'whatsapp'>('email');

  return (
    <div className="p-4 sm:p-6 lg:p-12 max-w-4xl mx-auto min-h-screen">
      <PageHeader
        title="Disparos"
        description="E-mails automáticos e mensagens de WhatsApp"
      />

      <div className="mb-8 flex gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${
              tab === id
                ? 'bg-[#FF6A00] text-white'
                : 'border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full liquid-glass p-6 sm:p-8 rounded-[2rem]"
      >
        {tab === 'email' ? <EmailTemplatesSettings /> : <WhatsappTemplatesSettings />}
      </motion.div>
    </div>
  );
}
