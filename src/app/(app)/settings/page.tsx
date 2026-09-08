'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePlatformStore, CompanyInfo } from '@/store/usePlatformStore';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { PixQRCode } from '@/components/PixQRCode';
import { buildPixBrCode, normalizePixKey } from '@/lib/pixBrCode';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, ImageUp, Loader2, MailWarning, QrCode, Trash2 } from 'lucide-react';

const PIX_KEY_TYPES: { value: CompanyInfo['pixKeyType']; label: string }[] = [
  { value: '', label: 'Selecione…' },
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
];

/** Campo de texto padrão da tela. */
function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[#FF6A00]"
      />
      {hint && <span className="mt-1.5 block text-xs text-[var(--text-muted)]">{hint}</span>}
      {children}
    </label>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)]/40 p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FF6A00]/25 bg-[#FF6A00]/10 text-[#FF6A00]">
          <Icon size={16} />
        </span>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{desc}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { companyInfo, updateCompanyInfo, hydrated } = usePlatformStore();

  const [form, setForm] = useState<CompanyInfo>(companyInfo);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Partial<CompanyInfo>>({});
  const dirty = useRef(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoErr, setLogoErr] = useState<string | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const patch = pending.current;
    if (!Object.keys(patch).length) return;
    pending.current = {};
    try {
      await updateCompanyInfo(patch);
      // Nada mais pendente → volta a aceitar sincronização vinda do banco.
      if (!Object.keys(pending.current).length) dirty.current = false;
      setStatus('saved');
      setTimeout(() => setStatus((s) => (s === 'saved' ? 'idle' : s)), 1500);
    } catch {
      setStatus('idle');
    }
  }, [updateCompanyInfo]);

  // Sincroniza o form quando os dados do banco chegam — só enquanto o usuário não mexeu.
  useEffect(() => {
    if (!dirty.current) setForm(companyInfo);
  }, [companyInfo]);

  // Salva o que estiver pendente ao sair da página (não perde a última edição).
  useEffect(() => () => void flush(), [flush]);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    dirty.current = true;
    setForm((prev) => ({ ...prev, [field]: value }));
    pending.current = { ...pending.current, [field]: value };
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };

  const uploadLogo = async (file: File) => {
    setLogoErr(null);
    setLogoBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/company/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha no envio.');
      dirty.current = true;
      setForm((prev) => ({ ...prev, logoUrl: data.logoUrl }));
      updateCompanyInfo({ logoUrl: data.logoUrl });
    } catch (e) {
      setLogoErr(e instanceof Error ? e.message : 'Falha no envio.');
    } finally {
      setLogoBusy(false);
    }
  };

  const removeLogo = async () => {
    setLogoErr(null);
    setLogoBusy(true);
    try {
      // Limpa o arquivo guardado no banco também (não só a URL).
      await fetch('/api/company/logo', { method: 'DELETE' }).catch(() => {});
      dirty.current = true;
      setForm((prev) => ({ ...prev, logoUrl: '' }));
      updateCompanyInfo({ logoUrl: '' });
    } finally {
      setLogoBusy(false);
    }
  };

  const emailVerified = companyInfo.emailVerified && form.email === companyInfo.email;

  const pixReady =
    !!form.pixKey.trim() &&
    !!form.pixKeyType &&
    !!(form.pixReceiverName || form.name).trim() &&
    !!form.pixReceiverCity.trim();
  const pixPreview = pixReady
    ? buildPixBrCode({
        key: normalizePixKey(form.pixKey, form.pixKeyType),
        name: form.pixReceiverName || form.name,
        city: form.pixReceiverCity,
      })
    : null;

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-4 sm:p-6 lg:p-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="Configurações" description="Identidade da empresa, marca e recebimento" />
        <span
          className={`mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
            status === 'saving' ? 'text-[var(--text-muted)]' : status === 'saved' ? 'text-green-500' : 'text-[var(--text-muted)]/60'
          }`}
        >
          {status === 'saving' ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Salvando…
            </>
          ) : status === 'saved' ? (
            <>
              <CheckCircle2 size={12} /> Salvo
            </>
          ) : hydrated ? (
            'Salva automático'
          ) : (
            'Carregando…'
          )}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 space-y-5"
      >
        <Section icon={Building2} title="Dados da empresa" desc="Aparecem no cabeçalho e no rodapé das propostas.">
          <Field label="Razão social / Nome fantasia" value={form.name} onChange={(v) => handleChange('name', v)} placeholder="Minha Empresa" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CNPJ / CPF" value={form.cnpj} onChange={(v) => handleChange('cnpj', v)} placeholder="00.000.000/0000-00" />
            <Field label="Telefone / WhatsApp" value={form.phone} onChange={(v) => handleChange('phone', v)} placeholder="(11) 90000-0000" />
          </div>
          <div>
            <Field label="E-mail corporativo" type="email" value={form.email} onChange={(v) => handleChange('email', v)} placeholder="contato@empresa.com" />
            {form.email.trim() &&
              (emailVerified ? (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-500">
                  <CheckCircle2 size={13} /> E-mail confirmado
                </p>
              ) : (
                <EmailVerifyPrompt />
              ))}
          </div>
        </Section>

        <Section icon={ImageUp} title="Marca" desc="Sua logo aparece nos e-mails automáticos e na área do cliente. Sem logo, entra o nome da empresa.">
          <Field
            label="Logo — URL da imagem"
            value={form.logoUrl.startsWith('/api/company/logo') ? '' : form.logoUrl}
            onChange={(v) => handleChange('logoUrl', v)}
            placeholder="https://… (ou envie um arquivo abaixo)"
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadLogo(f);
              e.target.value = '';
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoBusy}
              className="flex items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--foreground)] transition hover:border-[#FF6A00] disabled:opacity-50"
            >
              {logoBusy ? <Loader2 size={12} className="animate-spin" /> : <ImageUp size={12} />}
              {logoBusy ? 'Enviando…' : 'Enviar imagem (PNG/JPG/WEBP, até 1 MB)'}
            </button>
            {form.logoUrl.trim() && (
              <button
                type="button"
                onClick={removeLogo}
                disabled={logoBusy}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] transition hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 size={12} /> Remover
              </button>
            )}
          </div>
          {logoErr && <p className="text-[11px] font-bold text-red-400">{logoErr}</p>}
          {form.logoUrl.trim() && (
            <div className="inline-flex items-center gap-3 rounded-xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.logoUrl}
                alt="Prévia da logo"
                className="h-10 max-w-[220px] object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </Section>

        <Section icon={QrCode} title="Recebimento PIX" desc="Configurado aqui, o QR Code aparece automático na área de todos os clientes.">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Tipo da chave</span>
              <select
                value={form.pixKeyType}
                onChange={(e) => handleChange('pixKeyType', e.target.value)}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] outline-none transition-colors focus:border-[#FF6A00]"
              >
                {PIX_KEY_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[var(--background)] text-[var(--foreground)]">
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Chave PIX" value={form.pixKey} onChange={(v) => handleChange('pixKey', v)} placeholder="chave copia-e-cola" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do recebedor" value={form.pixReceiverName} onChange={(v) => handleChange('pixReceiverName', v)} placeholder="(usa o nome da empresa se vazio)" />
            <Field label="Cidade do recebedor" value={form.pixReceiverCity} onChange={(v) => handleChange('pixReceiverCity', v)} placeholder="São Paulo" />
          </div>
          {pixPreview ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-5 sm:flex-row">
              <PixQRCode payload={pixPreview} size={150} />
              <div className="text-xs leading-relaxed text-[var(--text-muted)]">
                <p className="mb-1 font-black uppercase tracking-widest text-[var(--foreground)]">Prévia</p>
                <p>É assim que o cliente vê. Este QR não tem valor fixo — no portal, cada mês gera um QR com o valor daquele mês já embutido.</p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              Preencha tipo, chave, nome e cidade pra ver a prévia do QR.
            </p>
          )}
        </Section>

        <p className="pt-2 text-center text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]/60">
          Cada campo salva sozinho alguns instantes depois que você para de digitar.
        </p>
      </motion.div>
    </div>
  );
}

function EmailVerifyPrompt() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
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
