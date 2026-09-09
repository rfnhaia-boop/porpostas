'use client';

import { commercialTotals, commercialPaymentTerms, validateCommercial } from '@/lib/commercial';
import { CommercialChoices } from '@/components/CommercialChoices';
import React, { useRef, useState } from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, Eye, FileText, Link2, Loader2, Mail, MessageCircle, Printer, Send, SlidersHorizontal, X, XCircle } from 'lucide-react';
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
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  // Proposta persistida: já vem preenchida se estamos editando uma proposta existente.
  const [saved, setSaved] = useState<{ id: string; publicToken: string } | null>(
    quoteDraft.proposalId && quoteDraft.publicToken
      ? { id: quoteDraft.proposalId, publicToken: quoteDraft.publicToken }
      : null,
  );
  const commercialItems = quoteDraft.services.map(s => ({ ...s, unitPrice: s.price }));
  const paymentTerms = quoteDraft.commercial ? commercialPaymentTerms(commercialItems, quoteDraft.commercial, formatBRL) : quoteDraft.paymentTerms || DEFAULT_PAYMENT_TERMS;

  const draftClient = clients.find((c) => c.id === quoteDraft.clientId) ?? null;
  const quoteView: QuoteView = {
    commercial: quoteDraft.commercial,
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
    minTerm: quoteDraft.minTerm,
    paymentTerms,
    notes: quoteDraft.notes,
    items: quoteDraft.services.map((s) => ({
      id: s.id,
      billingType: s.billingType, optional: s.optional, selected: s.selected, packageId: s.packageId,
      name: s.name,
      description: s.description,
      details: s.details ?? [],
      unitLabel: s.unitLabel,
      quantity: s.quantity ?? 1,
      unitPrice: s.price,
      price: Math.round((s.quantity ?? 1) * s.price),
    })),
    total: quoteDraft.commercial ? commercialTotals(commercialItems, quoteDraft.commercial).total : quoteDraft.services.reduce((sum, s) => sum + Math.round((s.quantity ?? 1) * s.price), 0),
  };

  // Ex.: total R$ 3.000 em 3x -> "3x mensais de R$ 1.000,00"
  const installmentText = (n: number) => {
    const safeN = Math.max(2, Math.min(48, Math.round(n) || 2));
    const per = Math.round(quoteView.total / safeN);
    return `${safeN}x mensais de ${formatBRL(per)}`;
  };

  const accessPhrase = quoteDraft.accessPhrase?.trim() || null;

  const buildPayload = () => ({
    commercial: quoteDraft.commercial,
    clientId: quoteDraft.clientId,
    template: quoteDraft.template,
    proposalNumber: quoteDraft.proposalNumber,
    title: quoteDraft.title,
    validityDays: quoteDraft.validityDays,
    timeline: quoteDraft.timeline,
    minTerm: quoteDraft.minTerm,
    paymentTerms,
    notes: quoteDraft.notes,
    accessPhrase,
    requiresSignedContract: quoteDraft.requiresSignedContract,
    items: quoteDraft.services.map((s) => ({
      billingType: s.billingType, optional: s.optional, selected: s.selected, packageId: s.packageId,
      name: s.name,
      description: s.description,
      details: s.details ?? [],
      unitLabel: s.unitLabel,
      quantity: s.quantity ?? 1,
      unitPrice: s.price,
    })),
  });

  // Cria a proposta na 1ª vez; nas seguintes atualiza os campos, os itens e o status.
  // Evita criar 2 propostas se dois botões (salvar / enviar / visualizar como cliente)
  // dispararem antes do primeiro `create` resolver — o 2º espera o mesmo request.
  const createInFlight = useRef<Promise<{ id: string; publicToken: string }> | null>(null);

  const persistProposal = async (status: 'draft' | 'sent') => {
    if (quoteDraft.commercial) validateCommercial(commercialItems, quoteDraft.commercial, status === 'sent');
    if (saved) {
      await api.proposals.update(saved.id, {
        commercial: quoteDraft.commercial,
        clientId: quoteDraft.clientId,
        proposalNumber: quoteDraft.proposalNumber,
        title: quoteDraft.title,
        template: quoteDraft.template,
        validityDays: quoteDraft.validityDays,
        timeline: quoteDraft.timeline,
        minTerm: quoteDraft.minTerm,
        paymentTerms,
        accessPhrase,
        requiresSignedContract: quoteDraft.requiresSignedContract,
        notes: quoteDraft.notes,
        items: buildPayload().items,
        status,
      });
      return saved;
    }
    if (!createInFlight.current) {
      createInFlight.current = api.proposals.create({ ...buildPayload(), status }).then((created) => {
        const next = { id: created.id, publicToken: created.publicToken };
        setSaved(next);
        updateQuoteDraft({ proposalId: next.id, publicToken: next.publicToken });
        return next;
      });
      createInFlight.current.catch(() => { createInFlight.current = null; });
    }
    return createInFlight.current;
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

  // Dispara o e-mail da proposta PRO CLIENTE (link + código + mensagem padrão).
  const sendClientEmail = async () => {
    const s = saved;
    if (!s || emailState === 'sending') return;
    setEmailState('sending');
    setEmailMsg(null);
    try {
      const r = await api.proposals.sendEmail(s.id);
      setEmailState('sent');
      setEmailMsg(`E-mail enviado para ${r.to}.`);
    } catch (err) {
      setEmailState('error');
      setEmailMsg(err instanceof Error ? err.message : 'Não consegui enviar o e-mail.');
    }
  };

  const handleSend = async () => {
    if (sendState === 'saving') return;
    setSendState('saving');
    try {
      await persistProposal('sent');
      setIsSharing(true);
      // Ao mandar, já dispara o e-mail pro cliente automaticamente.
      void sendClientEmail();
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
        {/* Settings Modal (Padrão Rafael) */}
        <AnimatePresence>
          {isEditingSettings && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[4px] no-print p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/5 border-t-white/20 border-l-white/10 p-6 sm:p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
                style={{
                  background: "linear-gradient(135deg, rgba(30, 30, 30, 0.4) 0%, rgba(5, 5, 5, 0.6) 100%)",
                  backdropFilter: "blur(60px) saturate(200%)",
                  WebkitBackdropFilter: "blur(60px) saturate(200%)",
                }}
              >
                {/* Reflexo superior do vidro */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                
                {/* Glow de Fundo Radial (Efeito Tomada) */}
                <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[120%] h-40 bg-[#FF6A00]/15 blur-[120px] rounded-[100%] pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between mb-10">
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.2em] text-white">
                    Ajustes <span className="text-[#FF6A00]">do Orçamento</span>
                  </h2>
                  <button onClick={() => setIsEditingSettings(false)} className="text-white/40 hover:text-white transition-colors">
                    <XCircle size={28} />
                  </button>
                </div>

                <div className="relative z-10 space-y-8">
                  
                  {/* Grupo Nome e Número */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Nome da Proposta</label>
                      <input
                        type="text"
                        value={quoteDraft.title}
                        onChange={(e) => updateQuoteDraft({ title: e.target.value })}
                        placeholder="Ex.: Identidade..."
                        className="w-full bg-transparent border-b-2 border-white/10 text-2xl md:text-3xl font-bold text-white focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors placeholder:text-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Nº da Proposta</label>
                      <input
                        type="text"
                        value={quoteDraft.proposalNumber}
                        onChange={(e) => updateQuoteDraft({ proposalNumber: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-white/10 text-2xl md:text-3xl font-black text-white focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Grupo Prazos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Validade</label>
                      <input 
                        type="text" 
                        value={quoteDraft.validityDays} 
                        onChange={(e) => updateQuoteDraft({ validityDays: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-white/10 text-2xl font-bold text-white focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Prazo Estimado</label>
                      <input
                        type="text"
                        value={quoteDraft.timeline}
                        onChange={(e) => updateQuoteDraft({ timeline: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-white/10 text-2xl font-bold text-white focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Prazo Mínimo</label>
                      <input
                        type="text"
                        placeholder="ex: 3 meses (opcional)"
                        value={quoteDraft.minTerm}
                        onChange={(e) => updateQuoteDraft({ minTerm: e.target.value })}
                        className="w-full bg-transparent border-b-2 border-white/10 text-2xl font-bold text-white placeholder:text-white/20 placeholder:text-base focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors"
                      />
                    </div>
                  </div>

                  {quoteDraft.commercial && <p className="text-sm text-white/80">{paymentTerms}<br/><button className="mt-3 text-[#FF6A00] underline" onClick={() => router.push('/quotes/new')}>Editar modelo e calendário de cobrança</button></p>}
                  {!quoteDraft.commercial && <>
                  {/* Condição de Pagamento */}
                  <div className="pt-4">
                    <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Condição de Pagamento</label>
                    <input 
                      type="text" 
                      value={paymentTerms} 
                      onChange={(e) => updateQuoteDraft({ paymentTerms: e.target.value })} 
                      className="w-full bg-transparent border-b-2 border-white/10 text-2xl md:text-3xl font-black text-white focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors" 
                    />
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['À vista', '50% na aprovação e 50% na entrega', '30/60 dias'].map((value) => (
                        <button
                          key={value}
                          onClick={() => updateQuoteDraft({ paymentTerms: value })}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold tracking-wider text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        >
                          {value}
                        </button>
                      ))}
                    </div>

                    {/* Parcelamento com Glassmorphism embutido */}
                    <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-5 md:p-6 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Parcelar em</span>
                        <input
                          type="number"
                          min={2}
                          max={48}
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="w-20 bg-transparent border-b-2 border-white/20 text-3xl font-black text-[#FF6A00] text-center focus:outline-none focus:border-[#FF6A00] transition-colors pb-1"
                        />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">x Mensais</span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <button
                          onClick={() => updateQuoteDraft({ paymentTerms: installmentText(installments) })}
                          disabled={quoteView.total <= 0}
                          className="w-full md:w-auto rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A3D] px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#0A0A0A] shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(255,106,0,0.5)] disabled:opacity-40"
                        >
                          Aplicar
                        </button>
                        {quoteView.total > 0 && (
                          <p className="text-[10px] text-white/50 tracking-wide">
                            Fica: <span className="font-black text-[#FF6A00]">{installmentText(installments)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  </>}
                  {/* Extras */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div>
                      <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Palavra-Chave (Senha)</label>
                      <input
                        type="text"
                        value={quoteDraft.accessPhrase || ''}
                        onChange={(e) => updateQuoteDraft({ accessPhrase: e.target.value })}
                        placeholder="Deixe vazio para aberto"
                        className="w-full bg-transparent border-b-2 border-white/10 text-xl font-bold text-white focus:outline-none focus:border-[#FF6A00] pb-2 transition-colors placeholder:text-white/20"
                      />
                      <p className="mt-2 text-[9px] uppercase tracking-wider text-white/30">Exige essa senha p/ acessar.</p>
                    </div>
                    <div>
                      <label className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase mb-2 block">Observações / Termos</label>
                      <textarea
                        value={quoteDraft.notes}
                        onChange={(e) => updateQuoteDraft({ notes: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#FF6A00] transition-colors min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer / Salvar */}
                <div className="relative z-10 mt-12 flex justify-end">
                  <button
                    onClick={() => setIsEditingSettings(false)}
                    className="w-full md:w-auto bg-gradient-to-r from-[#FF6A00] to-[#FF8A3D] text-[#0A0A0A] px-10 py-4 rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(255,106,0,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,106,0,0.6)]"
                  >
                    Salvar Ajustes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
              <button
                onClick={sendClientEmail}
                disabled={emailState === 'sending' || !saved}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] px-5 py-4 text-sm font-bold text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50"
              >
                {emailState === 'sending' ? <Loader2 size={18} className="animate-spin" /> : emailState === 'sent' ? <Check size={18} /> : <Mail size={18} />}
                {emailState === 'sending' ? 'Enviando…' : emailState === 'sent' ? 'Enviado' : 'E-mail'}
              </button>
              <button onClick={openWhatsApp} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-sm font-black text-[#07170c]"><MessageCircle size={18} /> WhatsApp</button>
            </div>
            {emailMsg && (
              <p className={`mt-3 text-xs font-semibold ${emailState === 'error' ? 'text-red-500' : 'text-green-500'}`}>{emailMsg}</p>
            )}
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              O e-mail vai pro cliente ({client?.email || 'sem e-mail cadastrado'}) com o link, o código de acesso e a mensagem padrão. Editável em Disparos.
            </p>
          </div>
        </div>
      )}

      {/* Header/Controls (Not part of the actual quote, hidden on print via no-print) */}
      {/* Floating Header Premium (Padrão Rafael) */}
      <header className="relative xl:fixed m-4 xl:m-0 xl:top-6 xl:left-[calc(16rem+1.5rem)] xl:right-6 z-50 flex flex-col xl:flex-row items-center justify-between gap-4 rounded-[2.5rem] xl:rounded-full border border-white/10 bg-[#050505]/60 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-[40px] saturate-[200%] no-print transition-all">
        
        {/* Lado Esquerdo: Voltar */}
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/quotes/new')}
            className="group flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/50 transition-all hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>
        
        {/* Centro: Templates (Segmented Control) */}
        <div className="flex flex-wrap justify-center items-center gap-1 rounded-[1.75rem] xl:rounded-full border border-white/5 bg-white/5 p-1 shadow-inner">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => updateQuoteDraft({ template: t.id })}
              className={`relative px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                activeTemplate === t.id 
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center gap-2">
          
          {/* Ações Secundárias */}
          <div className="flex items-center gap-1 rounded-full border border-white/5 bg-white/5 p-1">
            <button 
              onClick={previewClientView} 
              className="flex items-center justify-center rounded-full p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white"
              title="Visualizar como Cliente"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => setIsEditingSettings(true)}
              className="flex items-center justify-center rounded-full p-2 text-white/50 transition-all hover:bg-white/10 hover:text-white"
              title="Ajustar Configurações"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1"></div>

          {/* Ações Principais */}
          <button
            onClick={handleSaveProposal}
            disabled={saveState === 'saving'}
            className="flex items-center gap-2 rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/5 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6A00] transition-all hover:bg-[#FF6A00]/20 disabled:opacity-50"
          >
            <FileText size={15} /> 
            <span className="hidden lg:inline">{saveState === 'saving' ? 'Salvando...' : saveState === 'saved' ? 'Salvo!' : 'Salvar'}</span>
          </button>

          <button 
            onClick={handleSend} 
            disabled={sendState === 'saving'} 
            className="flex items-center gap-2 rounded-full border border-[#FF6A00]/50 bg-[#FF6A00]/10 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#FF6A00] transition-all hover:bg-[#FF6A00]/20 hover:shadow-[0_0_20px_rgba(255,106,0,0.2)] disabled:opacity-50"
          >
            <Send size={15} /> 
            <span className="hidden lg:inline">{sendState === 'saving' ? '...' : 'Enviar'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A3D] px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#0A0A0A] shadow-[0_0_20px_rgba(255,106,0,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,106,0,0.6)]"
          >
            <Printer size={15} className="transition-transform group-hover:rotate-12" /> 
            <span className="hidden lg:inline">Imprimir</span>
          </button>
        </div>
      </header>

      {/* Render Active Template */}
      <div className="flex-1 xl:mt-20 relative print-only">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTemplate}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full min-h-full"
          >
            <div className="no-print p-4"><CommercialChoices q={quoteView} onChange={(commercial, ids) => updateQuoteDraft({ commercial, services: quoteDraft.services.map(s => ({ ...s, selected: s.optional ? ids.includes(s.id) : true })) })}/></div>
            <TemplateRenderer template={activeTemplate} q={quoteView} />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
