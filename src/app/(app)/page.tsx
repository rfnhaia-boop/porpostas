'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePlatformStore } from '@/store/usePlatformStore';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import {
  closedByMonth,
  revenueByMonth,
  conversionRate,
  avgResponseDays,
  avgDeliveryDays,
  analyzeServiceTimelines,
} from '@/lib/analytics';
import { motion } from 'framer-motion';
import { Users, Briefcase, FileText, Clock, CheckCircle2, TrendingUp, Timer, Truck, AlertTriangle } from 'lucide-react';

function fmtDays(n: number | null) {
  if (n === null) return '—';
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} dias`;
}

function fmtPct(n: number | null) {
  if (n === null) return '—';
  return `${Math.round(n * 100)}%`;
}

export default function Dashboard() {
  const { clients, savedServices } = usePlatformStore();
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: api.proposals.list,
    refetchOnWindowFocus: true,
  });
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: api.services.list,
  });

  const money = formatBRL;
  const sum = (s: string) =>
    proposals.filter((p) => p.status === s).reduce((acc, p) => acc + p.total, 0);

  const sent = proposals.filter((p) => p.status === 'sent');
  const approvedList = proposals.filter((p) => p.status === 'approved');

  const stats = [
    { label: 'Total de Clientes', value: clients.length, sub: null, icon: Users },
    { label: 'Serviços Cadastrados', value: savedServices.length, sub: null, icon: Briefcase },
    { label: 'Propostas Geradas', value: proposals.length, sub: null, icon: FileText },
    { label: 'Aguardando Resposta', value: sent.length, sub: `${money(sum('sent'))} em negociação`, icon: Clock },
    { label: 'Aprovadas', value: approvedList.length, sub: `${money(sum('approved'))} fechado`, icon: CheckCircle2 },
  ];

  const closed = closedByMonth(proposals);
  const revenue = revenueByMonth(proposals);
  const conversion = conversionRate(proposals);
  const respDays = avgResponseDays(proposals);
  const execDays = avgDeliveryDays(proposals);
  const timelineAlerts = analyzeServiceTimelines(services, proposals);

  const intelStats = [
    { label: 'Taxa de Conversão', value: fmtPct(conversion), icon: TrendingUp },
    { label: 'Tempo Médio de Resposta', value: fmtDays(respDays), icon: Timer },
    { label: 'Tempo Médio de Execução', value: fmtDays(execDays), icon: Truck },
  ];

  return (
    <div className="p-12 min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6A00]/5 blur-[120px] rounded-full pointer-events-none" />

      <PageHeader
        title="Dashboard"
        description="Visão Geral da Operação"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="liquid-glass p-8 rounded-3xl flex items-center justify-between group hover:shadow-[0_0_40px_rgba(255,106,0,0.2)] transition-shadow duration-500"
            >
              <div>
                <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-2">{stat.label}</p>
                <p className="text-5xl font-black text-[var(--foreground)]">{stat.value}</p>
                {stat.sub && (
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#FF6A00]">{stat.sub}</p>
                )}
              </div>
              <div className="text-[#FF6A00] opacity-20">
                <Icon size={64} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="liquid-glass p-8 rounded-3xl">
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-6">Contratos Fechados / Mês</p>
          <MiniBarChart data={closed} />
        </div>
        <div className="liquid-glass p-8 rounded-3xl">
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-6">Faturamento Recebido / Mês</p>
          <MiniBarChart data={revenue} formatValue={(v) => money(v)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {intelStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="liquid-glass p-8 rounded-3xl flex items-center justify-between"
            >
              <div>
                <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-2">{stat.label}</p>
                <p className="text-3xl font-black text-[var(--foreground)]">{stat.value}</p>
              </div>
              <div className="text-[#FF6A00] opacity-20">
                <Icon size={48} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {timelineAlerts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-2">Alerta de Prazo</p>
          {timelineAlerts.map((a) => (
            <div
              key={a.serviceName}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3 items-start"
            >
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--foreground)]">{a.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
