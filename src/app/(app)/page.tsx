'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePlatformStore } from '@/store/usePlatformStore';
import { api } from '@/lib/api';
import { formatBRL } from '@/lib/money';
import { PageHeader } from '@/components/layout/PageHeader';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { StatusDonut } from '@/components/charts/StatusDonut';
import { HBarList } from '@/components/charts/HBarList';
import {
  closedByMonth,
  revenueByMonth,
  conversionRate,
  avgResponseDays,
  avgDeliveryDays,
  analyzeServiceTimelines,
  paymentHealth,
  statusBreakdown,
  topClients,
  topServices,
  upcomingBills,
  satisfaction,
  avgTicket,
  staleProposals,
} from '@/lib/analytics';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Timer,
  Truck,
  AlertTriangle,
  Wallet,
  PieChart,
  CalendarClock,
  Star,
  Crown,
  Flame,
  BellRing,
} from 'lucide-react';

function fmtDays(n: number | null) {
  if (n === null) return '—';
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} dias`;
}

function fmtPct(n: number | null) {
  if (n === null) return '—';
  return `${Math.round(n * 100)}%`;
}

// Rótulo curto pro topo da barra (o valor cheio fica no title/hover).
function compactBRL(cents: number) {
  const r = cents / 100;
  if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (r >= 1_000) return `${(r / 1_000).toFixed(1).replace('.', ',')}k`;
  return String(Math.round(r));
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
  const health = paymentHealth(proposals);
  const statusSlices = statusBreakdown(proposals);
  const clientRank = topClients(proposals);
  const serviceRank = topServices(proposals);
  const bills = upcomingBills(proposals);
  const sat = satisfaction(proposals);
  const ticket = avgTicket(proposals);
  const stale = staleProposals(proposals);

  const intelStats = [
    { label: 'Taxa de Conversão', value: fmtPct(conversion), icon: TrendingUp },
    { label: 'Ticket Médio', value: ticket === null ? '—' : money(ticket), icon: TrendingUp },
    { label: 'Tempo Médio de Resposta', value: fmtDays(respDays), icon: Timer },
    { label: 'Tempo Médio de Execução', value: fmtDays(execDays), icon: Truck },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-12 min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF6A00]/5 blur-[120px] rounded-full pointer-events-none" />

      <PageHeader
        title="Dashboard"
        description="Visão Geral da Operação"
      />

      <OnboardingChecklist />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="liquid-glass p-6 sm:p-8 rounded-3xl flex items-center justify-between group hover:shadow-[0_0_40px_rgba(255,106,0,0.2)] transition-shadow duration-500"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
        <div className="liquid-glass p-6 sm:p-8 rounded-3xl">
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-6">Contratos Fechados / Mês</p>
          <MiniBarChart data={closed} />
        </div>
        <div className="liquid-glass p-6 sm:p-8 rounded-3xl">
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-6">Faturamento Recebido / Mês</p>
          <MiniBarChart data={revenue} formatValue={(v) => money(v)} labelFormat={compactBRL} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
        <div className="liquid-glass p-6 sm:p-8 rounded-3xl">
          <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <Wallet size={14} /> Saúde dos Pagamentos
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                A receber (no prazo)
              </p>
              <p className="text-lg sm:text-xl font-black text-[var(--foreground)] tabular-nums whitespace-nowrap">
                {money(health.toReceive)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Atrasado
              </p>
              {health.overdue > 0 ? (
                <p className="text-lg sm:text-xl font-black text-red-500 tabular-nums whitespace-nowrap">
                  {money(health.overdue)}
                  <span className="ml-1 text-xs font-bold text-red-500/70">
                    ({health.overdueCount})
                  </span>
                </p>
              ) : (
                <p className="text-sm font-bold text-green-500 pt-1">Nada atrasado</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Recebido este mês
              </p>
              <p className="text-lg sm:text-xl font-black text-green-500 tabular-nums whitespace-nowrap">
                {money(health.receivedThisMonth)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Aguardando conferência
              </p>
              {health.awaitingCount > 0 ? (
                <p className="text-lg sm:text-xl font-black text-amber-500 tabular-nums">
                  {health.awaitingCount}
                  <span className="ml-1.5 text-xs font-bold text-amber-500/70">
                    recibo{health.awaitingCount === 1 ? '' : 's'}
                  </span>
                </p>
              ) : (
                <p className="text-sm font-bold text-[var(--text-muted)] pt-1">Tudo conferido</p>
              )}
            </div>
          </div>
        </div>

        <div className="liquid-glass p-6 sm:p-8 rounded-3xl">
          <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <PieChart size={14} /> Status das Propostas
          </p>
          {statusSlices.length > 0 ? (
            <StatusDonut slices={statusSlices} />
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Nenhuma proposta ainda.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
        <div className="liquid-glass p-6 sm:p-8 rounded-3xl">
          <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <CalendarClock size={14} /> Próximos Recebimentos
          </p>
          {bills.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhuma cobrança em aberto.</p>
          ) : (
            <div className="space-y-3">
              {bills.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">
                      {b.project}
                      <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">{b.label}</span>
                    </p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      {b.client || '—'}
                      {b.dueDate && ` · vence ${new Date(b.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black tabular-nums text-[var(--foreground)]">{money(b.amount)}</p>
                    {b.daysUntil !== null && (
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          b.overdue ? 'text-red-500' : b.daysUntil <= 7 ? 'text-amber-500' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {b.overdue
                          ? `${Math.abs(b.daysUntil)}d atrás`
                          : b.daysUntil === 0
                            ? 'hoje'
                            : `em ${b.daysUntil}d`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="liquid-glass p-6 sm:p-8 rounded-3xl flex flex-col">
          <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <Star size={14} /> Satisfação dos Clientes
          </p>
          {sat.avg === null ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhuma avaliação mensal ainda.</p>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tabular-nums text-[var(--foreground)]">
                  {sat.avg.toFixed(1).replace('.', ',')}
                </span>
                <span className="mb-1.5 text-sm font-bold text-[var(--text-muted)]">/ 5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={22}
                    className={
                      n <= Math.round(sat.avg as number)
                        ? 'fill-[#FF6A00] text-[#FF6A00]'
                        : 'text-[var(--text-muted)] opacity-30'
                    }
                  />
                ))}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                {sat.count} avaliaç{sat.count === 1 ? 'ão' : 'ões'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
        <div className="liquid-glass p-6 sm:p-8 rounded-3xl">
          <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <Crown size={14} /> Melhores Clientes
          </p>
          <HBarList
            empty="Nenhum contrato fechado ainda."
            items={clientRank.map((c) => ({
              label: c.name,
              value: c.total,
              display: money(c.total),
              sub: `${c.count} proposta${c.count === 1 ? '' : 's'}`,
            }))}
          />
        </div>

        <div className="liquid-glass p-6 sm:p-8 rounded-3xl">
          <p className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <Flame size={14} /> Serviços que Mais Vendem
          </p>
          <HBarList
            empty="Nenhum item vendido ainda."
            items={serviceRank.map((s) => ({
              label: s.name,
              value: s.revenue,
              display: money(s.revenue),
              sub: `${s.count}×`,
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-8 mb-8">
        {intelStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="liquid-glass p-6 rounded-3xl flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-[var(--text-muted)] uppercase tracking-widest text-[11px] mb-2">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-black text-[var(--foreground)] tabular-nums truncate">{stat.value}</p>
              </div>
              <div className="text-[#FF6A00] opacity-20 shrink-0">
                <Icon size={36} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {(stale.length > 0 || timelineAlerts.length > 0) && (
        <div className="space-y-3">
          <p className="text-[var(--text-muted)] uppercase tracking-widest text-xs mb-2">Precisa de Atenção</p>

          {stale.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3 items-start"
            >
              <BellRing size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--foreground)]">
                <span className="font-bold">{s.title}</span>
                {s.client && ` (${s.client})`} está enviada há <span className="font-bold">{s.days} dias</span> sem
                resposta. Vale cobrar um retorno.
              </p>
            </div>
          ))}

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
