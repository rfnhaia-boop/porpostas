'use client';

import React, { useState } from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, Eye, FileText, Link2, Mail, MessageCircle, Printer, Send, SlidersHorizontal, X } from 'lucide-react';
import { TemplateRenderer, TEMPLATE_OPTIONS as TEMPLATES } from '@/components/templates/TemplateRenderer';
import { DEFAULT_PAYMENT_TERMS, type QuoteView } from '@/lib/quoteView';
import { formatBRL } from '@/lib/money';
import { buildPublicPath } from '@/lib/slug';
import { api } from '@/lib/api';

export default function PreviewPage() {
  const router = useRouter();
  const { quoteDraft, updateQuoteDraft, clients, companyInfo } = usePlatformStore();
  const activeTemplate = quoteDraft.template || 'cyber';
  const [installments, setInstallments] = useState(3);

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [sendState, setSendState] = useState<'idle' | 'saving'>('idle');
  // Proposta persistida: já vem preenchida se estamos editando uma proposta existente.
  const [saved, setSaved] = useState<{ id: string; publicToken: string } | null>(
    quoteDraft.proposalId && quoteDraft.publicToken
      ? { id: quoteDraft.proposalId, publicToken: quoteDraft.publicToken }
      : null,
  );
  const paymentTerms = quoteDraft.paymentTerms || DEFAULT_PAYMENT_TERMS;

  const draftClient = clients.find((c) => c.id === quoteDraft.clientId) ?? null;
  const quoteView: QuoteView = {
    company: companyInfo,
    client: draftClient
      ? {
          name: draftClient.name,
          company: draftClient.company,
          document: draftClient.document,
          email: draftClient.email,
        }
      : null,
    proposalNumber: quoteDraft.proposalNumber,
    validityDays: quoteDraft.validityDays,
    timeline: quoteDraft.timeline,
    paymentTerms,
    notes: quoteDraft.notes,
    items: quoteDraft.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      details: s.details ?? [],
      unitLabel: s.unitLabel,
      quantity: s.quantity ?? 1,
      unitPrice: s.price,
      price: Math.round((s.quantity ?? 1) * s.price),
    })),
    total: quoteDraft.services.reduce((sum, s) => sum + Math.round((s.quantity ?? 1) * s.price), 0),
  };

  // Ex.: total R$ 3.000 em 3x -> "3x mensais de R$ 1.000,00"
  const installmentText = (n: number) => {
    const safeN = Math.max(2, Math.min(48, Math.round(n) || 2));
    const per = Math.round(quoteView.total / safeN);
    return `${safeN}x mensais de ${formatBRL(per)}`;
  };

  const accessPhrase = quoteDraft.accessPhrase.trim() || null;

  const buildPayload = () => ({
    clientId: quoteDraft.clientId,
    template: quoteDraft.template,
    proposalNumber: quoteDraft.proposalNumber,
    validityDays: quoteDraft.validityDays,
    timeline: quoteDraft.timeline,
    paymentTerms,
    notes: quoteDraft.notes,
    accessPhrase,
    items: quoteDraft.services.map((s) => ({
      name: s.name,
      description: s.description,
      details: s.details ?? [],
      unitLabel: s.unitLabel,
      quantity: s.quantity ?? 1,
      unitPrice: s.price,
    })),
  });

  // Cria a proposta na 1ª vez; nas seguintes atualiza os campos, os itens e o status.
  const persistProposal = async (status: 'draft' | 'sent') => {
    if (saved) {
      await api.proposals.update(saved.id, {
        proposalNumber: quoteDraft.proposalNumber,
        template: quoteDraft.template,
        validityDays: quoteDraft.validityDays,
        timeline: quoteDraft.timeline,
        paymentTerms,
        notes: quoteDraft.notes,
        accessPhrase,
        items: buildPayload().items,
        status,
      });
      return saved;
    }
    const created = await api.proposals.create({ ...buildPayload(), status });
    const next = { id: created.id, publicToken: created.publicToken };
    setSaved(next);
    return next;
  };

  const handleSaveProposal = async () => {
    if (saveState === 'saving') return;
    setSaveState('saving');
    try {
      await persistProposal('draft');
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      setSaveState('idle');
      alert(err instanceof Error ? err.message : 'Erro ao salvar a proposta.');
    }
  };

  const handleSend = async () => {
    if (sendState === 'saving') return;
    setSendState('saving');
    try {
      await persistProposal('sent');
      setIsSharing(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao preparar o envio.');
    } finally {
      setSendState('idle');
    }
  };

  if (quoteDraft.services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center no-print">
        <p className="text-[var(--text-muted)] font-semibold tracking-widest uppercase">Orçamento inválido.</p>
        <button onClick={() => router.push('/quotes/new')} className="ml-4 text-[#FF6A00]">Voltar</button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const client = clients.find((item) => item.id === quoteDraft.clientId);
  const getShareUrl = () =>
    saved ? `${window.location.origin}${buildPublicPath(saved.publicToken, client?.name)}` : '';
  const copyShareUrl = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };
  const firstName = client?.name?.trim().split(/\s+/)[0] || '';
  const phraseLine = accessPhrase ? `\n\nPalavra-chave para abrir: ${accessPhrase}` : '';
  const openEmail = () => {
    const subject = encodeURIComponent(`Proposta ${quoteDraft.proposalNumber} — ${companyInfo.name}`);
    const body = encodeURIComponent(
      `Olá, ${firstName || client?.name || ''}!\n\n` +
        `A ${companyInfo.name} preparou uma proposta para você. Você pode revisar e responder (aprovar, recusar ou pedir ajuste) direto pelo link:\n\n` +
        `${getShareUrl()}${phraseLine}\n\n` +
        `Qualquer dúvida é só responder este e-mail.\n${companyInfo.name}`,
    );
    window.location.href = `mailto:${client?.email || ''}?subject=${subject}&body=${body}`;
  };
  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá, ${firstName || client?.name || ''}! Aqui é da ${companyInfo.name}. ` +
        `Preparei sua proposta ${quoteDraft.proposalNumber} — dá pra revisar e já responder pelo link:\n${getShareUrl()}${phraseLine}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };
  const previewClientView = async () => {
    try {
      const p = await persistProposal('draft');
      window.open(`${window.location.origin}${buildPublicPath(p.publicToken, client?.name)}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao abrir a visualização.');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)] print:bg-white print:text-black transition-colors">
      {/* Settings Modal */}
      {isEditingSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm no-print">
          <div className="bg-[var(--panel-bg)] p-12 rounded-3xl w-full max-w-xl border border-[var(--border-color)]">
            <h2 className="text-2xl font-black uppercase tracking-widest mb-8 text-[var(--foreground)]">Ajustes do Orçamento</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-1 block">Nº da Proposta</label>
                <input 
                  type="text" 
                  value={quoteDraft.proposalNumber} 
                  onChange={(e) => updateQuoteDraft({ proposalNumber: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-xl font-bold text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2"
                />
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-1 block">Validade</label>
                <input 
                  type="text" 
                  value={quoteDraft.validityDays} 
                  onChange={(e) => updateQuoteDraft({ validityDays: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-xl font-bold text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2"
                />
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-1 block">Prazo Estimado</label>
                <input 
                  type="text" 
                  value={quoteDraft.timeline} 
                  onChange={(e) => updateQuoteDraft({ timeline: e.target.value })}
                  className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-xl font-bold text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2"
                />
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-1 block">Condição de pagamento</label>
                <input 
                  type="text" 
                  value={paymentTerms} 
                  onChange={(e) => updateQuoteDraft({ paymentTerms: e.target.value })} 
                  className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-xl font-bold text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2" 
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {['À vista', '50% na aprovação e 50% na entrega', '30/60 dias'].map((value) => (
                    <button
                      key={value}
                      onClick={() => updateQuoteDraft({ paymentTerms: value })}
                      className="rounded-full border border-[var(--border-color)] px-3 py-1 text-[10px] text-[var(--text-muted)] hover:border-[#FF6A00] hover:text-[#FF6A00]"
                    >
                      {value}
                    </button>
                  ))}
                </div>

                {/* Parcelamento — calcula do total */}
                <div className="mt-4 rounded-xl border border-[var(--border-color)] p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Parcelar em</span>
                    <input
                      type="number"
                      min={2}
                      max={48}
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-16 bg-transparent border-b-2 border-[var(--border-color)] text-lg font-bold text-[var(--foreground)] text-center focus:outline-none focus:border-[#FF6A00]"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">x mensais</span>
                    <button
                      onClick={() => updateQuoteDraft({ paymentTerms: installmentText(installments) })}
                      disabled={quoteView.total <= 0}
                      className="ml-auto rounded-full bg-[#FF6A00] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0A0A0A] disabled:opacity-40"
                    >
                      Aplicar
                    </button>
                  </div>
                  {quoteView.total > 0 && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Resultado: <span className="font-bold text-[#FF6A00]">{installmentText(installments)}</span>
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-1 block">Palavra-chave do link (opcional)</label>
                <input
                  type="text"
                  value={quoteDraft.accessPhrase}
                  onChange={(e) => updateQuoteDraft({ accessPhrase: e.target.value })}
                  placeholder="ex: gustavo2026 — deixe vazio pra link aberto"
                  className="w-full bg-transparent border-b-2 border-[var(--border-color)] text-xl font-bold text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] pb-2 placeholder:text-sm placeholder:font-normal placeholder:text-[var(--text-muted)]"
                />
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Se preenchida, o cliente precisa digitar essa palavra pra abrir a proposta. Você manda ela junto com o link.</p>
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-1 block">Observações / Termos</label>
                <textarea
                  value={quoteDraft.notes}
                  onChange={(e) => updateQuoteDraft({ notes: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg p-4 text-[var(--foreground)] focus:outline-none focus:border-[#FF6A00] min-h-[120px]"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsEditingSettings(false)}
                className="bg-[#FF6A00] text-[#0A0A0A] px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs"
              >
                Salvar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isSharing && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-5 backdrop-blur-md no-print">
          <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border-color)] bg-[var(--panel-bg)] p-8 shadow-2xl md:p-10">
            <div className="mb-8 flex items-start justify-between">
              <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.25em] text-[#FF6A00]">Link com resposta</p><h2 className="text-3xl font-black tracking-tight text-[var(--foreground)]">Enviar ao cliente</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-muted)]">O cliente abre uma página limpa, revisa o orçamento e registra “Aprovar” ou “Recusar” no próprio link.</p></div>
              <button aria-label="Fechar" onClick={() => setIsSharing(false)} className="rounded-full border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-[var(--foreground)]"><X size={18} /></button>
            </div>
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4">
              <Link2 className="shrink-0 text-[#FF6A00]" size={20} />
              <p className="min-w-0 flex-1 truncate text-xs text-[var(--text-muted)]">{getShareUrl()}</p>
              <button onClick={copyShareUrl} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#FF6A00] px-4 py-2 text-xs font-bold text-[#0A0A0A]">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copiado' : 'Copiar'}</button>
            </div>
            {accessPhrase && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#FF6A00]/30 bg-[#FF6A00]/5 p-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6A00]">Palavra-chave</span>
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--foreground)]">{accessPhrase}</p>
                <span className="text-[10px] text-[var(--text-muted)]">mande junto com o link</span>
              </div>
            )}
            {typeof window !== 'undefined' && window.location.hostname === 'localhost' && <p className="mb-6 text-xs text-amber-500">Este endereço é local. Ao publicar o sistema, o mesmo botão gera um link acessível ao cliente.</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              <button onClick={() => window.open(getShareUrl(), '_blank', 'noopener,noreferrer')} className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] px-5 py-4 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--background)]"><Eye size={18} /> Visualizar</button>
              <button onClick={openEmail} className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] px-5 py-4 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--background)]"><Mail size={18} /> E-mail</button>
              <button onClick={openWhatsApp} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-[#07170c]"><MessageCircle size={18} /> WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {/* Header/Controls (Not part of the actual quote, hidden on print via no-print) */}
      <header className="fixed top-0 left-64 z-50 flex w-[calc(100%-16rem)] flex-wrap items-center justify-between gap-3 px-6 py-3 liquid-glass no-print">
        <button 
          onClick={() => router.push('/quotes/new')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        
        <div className="flex max-w-[46vw] gap-2 overflow-x-auto py-1">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => updateQuoteDraft({ template: t.id })}
              className={`px-4 py-2 rounded-full uppercase tracking-widest text-[10px] transition-all ${
                activeTemplate === t.id ? 'bg-[var(--foreground)] text-[var(--background)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border-color)]'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={previewClientView} className="flex items-center gap-2 rounded-full border border-[var(--border-color)] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[var(--foreground)] transition-colors hover:bg-[var(--panel-bg)]"><Eye size={16} /> Visualizar</button>
          <button onClick={handleSend} disabled={sendState === 'saving'} className="flex items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#FF6A00] transition-colors hover:bg-[#FF6A00]/20 disabled:opacity-50"><Send size={16} /> {sendState === 'saving' ? 'Preparando...' : 'Enviar'}</button>
          <button
            onClick={() => setIsEditingSettings(true)}
            className="border border-[var(--border-color)] text-[var(--foreground)] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-[var(--panel-bg)] transition-colors"
          >
            <SlidersHorizontal size={16} /> Ajustar
          </button>
          <button
            onClick={handleSaveProposal}
            disabled={saveState === 'saving'}
            className="border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FF6A00] hover:text-[#0A0A0A] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <FileText size={16} /> {saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? 'Salvo!' : 'Salvar'}
          </button>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-[#FF6A00] to-[#FF8A3D] text-[#0A0A0A] shadow-[0_0_20px_rgba(255,106,0,0.3)] px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:shadow-[0_0_30px_rgba(255,106,0,0.5)] transition-all"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </header>

      {/* Render Active Template */}
      <div className="flex-1 mt-20 relative print-only">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTemplate}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full min-h-full"
          >
            <TemplateRenderer template={activeTemplate} q={quoteView} />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
