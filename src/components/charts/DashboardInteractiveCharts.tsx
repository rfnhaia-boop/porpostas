'use client';
import { motion } from 'framer-motion';
import { PieChart, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatBRL } from '@/lib/money';

export function DashboardInteractiveCharts({ proposals }: { proposals: any[] }) {
  // Filtrar apenas propostas aprovadas ou entregues
  const closed = proposals.filter(p => ['approved', 'in_progress', 'delivered'].includes(p.status));
  
  // Calcular totais usando os valores já salvos na proposta ou inferindo
  let recurring = 0;
  let once = 0;
  
  closed.forEach(p => {
    // Se a proposta tiver comercial modelado, podemos tentar separar (aproximação simples caso itens não estejam completos)
    // Se não, vamos considerar o paymentPattern ou total direto
    if (p.paymentPattern && Array.isArray(p.paymentPattern)) {
       p.paymentPattern.forEach((pay: any) => {
         // Assumir que parcelas são pagamento único parcelado, e assinaturas são recorrentes
         if (pay.label && pay.label.toLowerCase().includes('mensal')) recurring += pay.amount;
         else once += pay.amount;
       });
    } else {
       // Fallback para total inteiro como "valor único"
       once += p.total;
    }
  });

  const total = once + recurring;
  const oncePct = total > 0 ? (once / total) * 100 : 0;
  const recurringPct = total > 0 ? (recurring / total) * 100 : 0;

  if (total === 0) return null;

  return (
    <div className="liquid-glass p-6 sm:p-10 rounded-[2.5rem] mt-8 mb-4 border border-white/5">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-light text-white flex items-center gap-3">
            <TrendingUp size={24} className="text-[#FF6A00]" />
            Visão Geral de Caixa
          </h3>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            Análise de receita fechada (Implantação vs. Recorrência)
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Volume Total</p>
          <p className="font-display text-3xl font-bold text-white">{formatBRL(total)}</p>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-white/40">
        <PieChart size={14} className="text-cyan-500" /> Distribuição de Receita
      </div>
      
      {/* Gráfico de Barras Empilhadas Interativo */}
      <div className="flex h-16 w-full overflow-hidden rounded-full border border-white/10 bg-black/50 p-1.5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        {oncePct > 0 && (
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${oncePct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="group relative flex h-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-white/20 to-white/10 transition-colors hover:from-white/30 hover:to-white/20"
          >
            {oncePct > 15 && <span className="font-mono text-[10px] font-bold text-white">Único / Implantação</span>}
            
            {/* Tooltip Hover */}
            <div className="pointer-events-none absolute -top-14 opacity-0 transition-opacity group-hover:opacity-100 bg-[#0a0a0a] border border-white/10 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white/40"></span>
              <span className="font-mono text-[10px] uppercase text-white/50">Único:</span>
              <span className="font-bold text-white text-xs">{formatBRL(once)}</span>
            </div>
          </motion.div>
        )}
        {recurringPct > 0 && (
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${recurringPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="group relative flex h-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8C33] shadow-[0_0_20px_rgba(255,106,0,0.2)] transition-colors hover:shadow-[0_0_30px_rgba(255,106,0,0.4)]"
          >
            {recurringPct > 15 && <span className="font-mono text-[10px] font-black text-black">Recorrência</span>}
            
            {/* Tooltip Hover */}
            <div className="pointer-events-none absolute -top-14 opacity-0 transition-opacity group-hover:opacity-100 bg-[#0a0a0a] border border-[#FF6A00]/20 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(255,106,0,0.15)] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#FF6A00]"></span>
              <span className="font-mono text-[10px] uppercase text-[#FF6A00]/70">Recorrente:</span>
              <span className="font-bold text-[#FF6A00] text-xs">{formatBRL(recurring)}</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/40">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--text-muted)]">Valor Único</p>
            <p className="text-xl font-bold text-white">{formatBRL(once)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF6A00]/20 bg-[#FF6A00]/10 text-[#FF6A00]">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#FF6A00]/70">Recorrência Estimada</p>
            <p className="text-xl font-bold text-[#FF6A00]">{formatBRL(recurring)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
