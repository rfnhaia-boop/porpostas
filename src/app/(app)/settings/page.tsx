'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePlatformStore, CompanyInfo } from '@/store/usePlatformStore';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { InputExpansivo } from '@/components/ui/InputExpansivo';
import { PixQRCode } from '@/components/PixQRCode';
import { buildPixBrCode, normalizePixKey } from '@/lib/pixBrCode';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react';

function EmailVerifyStatus({ email, verified }: { email: string; verified: boolean }) {
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  if (!email.trim()) return null;

  if (verified) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-500">
        <CheckCircle2 size={13} /> E-mail confirmado
      </p>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
      <MailWarning size={13} />
      <span>E-mail não confirmado</span>
      <button
        onClick={async () => {
          setBusy(true);
          try {
            await api.company.resendEmailVerification();
            setSent(true);
          } catch {
            /* ignora */
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy || sent}
        className="rounded-full border border-amber-500/40 px-3 py-1 text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-50"
      >
        {busy ? <Loader2 size={11} className="animate-spin" /> : sent ? 'Enviado — veja seu e-mail' : 'Enviar confirmação'}
      </button>
    </div>
  );
}

const PIX_KEY_TYPES: { value: CompanyInfo['pixKeyType']; label: string }[] = [
  { value: '', label: 'Selecione…' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
];

export default function SettingsPage() {
  const { companyInfo, updateCompanyInfo, hydrated } = usePlatformStore();

  const [form, setForm] = useState<CompanyInfo>(companyInfo);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Partial<CompanyInfo>>({});
  const dirty = useRef(false);

  // Sincroniza o form quando os dados do banco chegam (só antes de o usuário mexer).
  useEffect(() => {
    if (!dirty.current) setForm(companyInfo);
  }, [companyInfo]);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    dirty.current = true;
    setForm((prev) => ({ ...prev, [field]: value }));
    // Acumula as mudanças e salva o lote — assim editar vários campos rápido
    // (ex: os 4 campos do PIX) não perde nenhum.
    pending.current = { ...pending.current, [field]: value };
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const patch = pending.current;
      pending.current = {};
      try {
        await updateCompanyInfo(patch);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
      } catch {
        setStatus('idle');
      }
    }, 600);
  };

  const dbLabel = status === 'saving' ? 'Salvando' : status === 'saved' ? 'Salvo' : hydrated ? 'Online' : 'Conectando';

  const pixReady = !!form.pixKey.trim() && !!form.pixKeyType && !!(form.pixReceiverName || form.name).trim() && !!form.pixReceiverCity.trim();
  const pixPreview = pixReady
    ? buildPixBrCode({
        key: normalizePixKey(form.pixKey, form.pixKeyType),
        name: form.pixReceiverName || form.name,
        city: form.pixReceiverCity,
      })
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-12 min-h-screen flex flex-col max-w-6xl mx-auto">
      <PageHeader
        title="Configurações do Sistema"
        description="Parâmetros globais de emissão de propostas e identidade corporativa"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4">

        {/* Left Column - Instructions/Context */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative overflow-hidden p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            style={{
              background: "linear-gradient(135deg, rgba(30, 30, 30, 0.4) 0%, rgba(5, 5, 5, 0.6) 100%)",
              backdropFilter: "blur(40px) saturate(200%)",
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF6A00] to-[#FF8A3D]" />
            <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-4 text-white">Dados Institucionais</h3>
            <p className="text-sm font-medium text-white/50 leading-relaxed">
              Estas informações formam o cabeçalho e rodapé arquitetural dos seus orçamentos. Mantenha os dados rigorosamente atualizados para garantir a validade jurídica das propostas.
            </p>
          </div>

          <div className="relative overflow-hidden p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)] hidden md:block"
            style={{
              background: "linear-gradient(135deg, rgba(30, 30, 30, 0.4) 0%, rgba(5, 5, 5, 0.6) 100%)",
              backdropFilter: "blur(40px) saturate(200%)",
            }}
          >
            <h3 className="text-lg font-black uppercase tracking-[0.2em] mb-4 text-white">Motor de Sincronização</h3>
            <p className="text-xs font-medium text-white/50 leading-relaxed mb-6">
              A arquitetura NEX salva seus dados no banco automaticamente. Cada alteração é persistida poucos instantes após você parar de digitar — nenhuma ação de salvamento manual é necessária.
            </p>
            <div className="w-full bg-black/40 border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-inner">
               <span className="text-[10px] uppercase font-black text-white/40 tracking-[0.2em]">Status do DB</span>
               <div className="flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  <span className="text-[10px] uppercase font-black text-white tracking-[0.2em]">{dbLabel}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative overflow-hidden p-8 md:p-14 rounded-[2.5rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
            style={{
              background: "linear-gradient(135deg, rgba(30, 30, 30, 0.4) 0%, rgba(5, 5, 5, 0.6) 100%)",
              backdropFilter: "blur(60px) saturate(200%)",
              WebkitBackdropFilter: "blur(60px) saturate(200%)",
            }}
          >
            {/* Reflexo superior do vidro */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
            
            {/* Glow Radial Interno */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-40 bg-[#FF6A00]/10 blur-[100px] rounded-[100%] pointer-events-none" />

            <div className="relative z-10 space-y-12">
              <InputExpansivo
                label="Razão Social / Nome Fantasia"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="text-2xl md:text-3xl text-white border-white/20 placeholder:text-white/20"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <InputExpansivo
                  label="CNPJ / CPF"
                  value={form.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  className="text-xl md:text-2xl text-white border-white/20 placeholder:text-white/20"
                />
                <InputExpansivo
                  label="Telefone / WhatsApp"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="text-xl md:text-2xl text-white border-white/20 placeholder:text-white/20"
                />
              </div>
              <div>
                <InputExpansivo
                  label="E-mail Corporativo"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="text-xl md:text-2xl text-white border-white/20 placeholder:text-white/20"
                />
                <EmailVerifyStatus email={form.email} verified={companyInfo.emailVerified && form.email === companyInfo.email} />
              </div>

              <div>
                <InputExpansivo
                  label="Logo (URL da imagem)"
                  value={form.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  className="text-lg md:text-xl text-white border-white/20 placeholder:text-white/20"
                />
                <p className="mt-3 text-[11px] font-semibold text-white/40 leading-relaxed max-w-lg">
                  Link direto de uma imagem (PNG ou JPG). É a sua marca que aparece no topo dos e-mails automáticos e na área do cliente — não a da NEX. Sem logo, entra o nome da empresa.
                </p>
                {form.logoUrl.trim() && (
                  <div className="mt-4 inline-flex items-center gap-3 rounded-xl bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logoUrl}
                      alt="Prévia do logo"
                      className="h-10 max-w-[200px] object-contain"
                      onError={(e) => { (e.currentTarget.style.display = 'none'); }}
                    />
                  </div>
                )}
              </div>

              {/* --- PIX --- */}
              <div className="pt-10 border-t border-white/10">
                <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white mb-2">
                  PIX de Recebimento
                </h3>
                <p className="text-xs font-semibold text-white/50 leading-relaxed mb-8 max-w-lg">
                  Configurado aqui, o QR Code aparece automaticamente na área de todos os clientes.
                </p>

                <div className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-12 items-end">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">
                        Tipo da chave
                      </label>
                      <select
                        value={form.pixKeyType}
                        onChange={(e) => handleChange('pixKeyType', e.target.value)}
                        className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3.5 text-sm font-bold text-white outline-none focus:border-[#FF6A00] transition-colors appearance-none cursor-pointer"
                      >
                        {PIX_KEY_TYPES.map((t) => (
                          <option key={t.value} value={t.value} className="bg-[#0A0A0A] text-white">
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <InputExpansivo
                      label="Chave PIX"
                      value={form.pixKey}
                      onChange={(e) => handleChange('pixKey', e.target.value)}
                      className="text-xl md:text-3xl text-white border-white/20 placeholder:text-white/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <InputExpansivo
                      label="Nome do recebedor"
                      value={form.pixReceiverName}
                      onChange={(e) => handleChange('pixReceiverName', e.target.value)}
                      className="text-xl md:text-2xl text-white border-white/20 placeholder:text-white/20"
                    />
                    <InputExpansivo
                      label="Cidade do recebedor"
                      value={form.pixReceiverCity}
                      onChange={(e) => handleChange('pixReceiverCity', e.target.value)}
                      className="text-xl md:text-2xl text-white border-white/20 placeholder:text-white/20"
                    />
                  </div>

                  {pixPreview ? (
                    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--background)] p-6 flex flex-col sm:flex-row items-center gap-6">
                      <PixQRCode payload={pixPreview} size={160} />
                      <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                        <p className="font-black uppercase tracking-widest text-[var(--foreground)] mb-1">
                          Prévia
                        </p>
                        <p>
                          É assim que o cliente vai ver. Este QR não tem valor fixo — no portal, cada
                          mês gera um QR com o valor daquele mês já embutido.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      Preencha tipo, chave, nome e cidade pra ver a prévia do QR.
                    </p>
                  )}
                </div>
              </div>

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
