'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePlatformStore, CompanyInfo } from '@/store/usePlatformStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { InputExpansivo } from '@/components/ui/InputExpansivo';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const { companyInfo, updateCompanyInfo, hydrated } = usePlatformStore();

  const [form, setForm] = useState<CompanyInfo>(companyInfo);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  // Sincroniza o form quando os dados do banco chegam (só antes de o usuário mexer).
  useEffect(() => {
    if (!dirty.current) setForm(companyInfo);
  }, [companyInfo]);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    dirty.current = true;
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updateCompanyInfo({ [field]: value });
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
      } catch {
        setStatus('idle');
      }
    }, 600);
  };

  const dbLabel = status === 'saving' ? 'Salvando' : status === 'saved' ? 'Salvo' : hydrated ? 'Online' : 'Conectando';

  return (
    <div className="p-8 md:p-12 min-h-screen flex flex-col max-w-6xl mx-auto">
      <PageHeader
        title="Configurações do Sistema"
        description="Parâmetros globais de emissão de propostas e identidade corporativa"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4">

        {/* Left Column - Instructions/Context */}
        <div className="lg:col-span-4 space-y-6">
          <div className="liquid-glass p-8 rounded-3xl border-l-4 border-[#FF6A00]">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-[var(--foreground)]">Dados Institucionais</h3>
            <p className="text-sm font-semibold text-[var(--text-muted)] leading-relaxed">
              Estas informações formam o cabeçalho e rodapé arquitetural dos seus orçamentos. Mantenha os dados rigorosamente atualizados para garantir a validade jurídica das propostas.
            </p>
          </div>

          <div className="liquid-glass p-8 rounded-3xl hidden md:block">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-4 text-[var(--foreground)]">Motor de Sincronização</h3>
            <p className="text-xs font-semibold text-[var(--text-muted)] leading-relaxed mb-6">
              A arquitetura NEX salva seus dados no banco automaticamente. Cada alteração é persistida poucos instantes após você parar de digitar — nenhuma ação de salvamento manual é necessária.
            </p>
            <div className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between">
               <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Status do DB</span>
               <div className="flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                  <span className="text-[10px] uppercase font-bold text-[var(--foreground)] tracking-widest">{dbLabel}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full liquid-glass p-8 md:p-14 rounded-[2.5rem]"
          >
            <div className="space-y-12">
              <InputExpansivo
                label="Razão Social / Nome Fantasia"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <InputExpansivo
                  label="CNPJ / CPF"
                  value={form.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                />
                <InputExpansivo
                  label="Telefone / WhatsApp"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <InputExpansivo
                label="E-mail Corporativo"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />

              <div className="pt-10 border-t border-[var(--border-color)] flex items-center justify-between">
                <p className="text-[var(--text-muted)] font-semibold uppercase tracking-widest text-[10px] max-w-xs">Modificações salvas automaticamente no banco.</p>
                <div className="text-[10px] uppercase font-black tracking-widest text-[#FF6A00] flex items-center gap-2">
                  <span className="opacity-50">NEX</span> CRM ENGINE
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
