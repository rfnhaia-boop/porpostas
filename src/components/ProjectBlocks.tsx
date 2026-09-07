'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ProposalBlock } from '@/lib/api';
import { Check, ChevronDown, ChevronUp, Link2, Loader2, Plus, Trash2 } from 'lucide-react';

export function ProjectBlocks({
  proposalId,
  blocks,
  suggestions,
}: {
  proposalId: string;
  blocks: ProposalBlock[];
  suggestions: { serviceName: string; stages: string[] }[];
}) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['proposal', proposalId] });
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
  };
  const [newTitle, setNewTitle] = useState('');

  const add = useMutation({
    mutationFn: (title: string) => api.blocks.add(proposalId, title),
    onSuccess: () => {
      setNewTitle('');
      invalidate();
    },
  });
  const pull = useMutation({
    mutationFn: (titles: string[]) => api.blocks.addMany(proposalId, titles),
    onSuccess: invalidate,
  });
  const move = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const a = blocks[index];
      const b = blocks[index + dir];
      if (!a || !b) return;
      await Promise.all([
        api.blocks.update(proposalId, a.id, { order: b.order }),
        api.blocks.update(proposalId, b.id, { order: a.order }),
      ]);
    },
    onSuccess: invalidate,
  });

  const done = blocks.filter((b) => b.status === 'done').length;
  const pct = blocks.length ? Math.round((done / blocks.length) * 100) : 0;

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Etapas do Projeto
        </h3>
        {blocks.length > 0 && (
          <span className="text-xs font-bold text-[var(--text-muted)]">
            {done} de {blocks.length} {done === 1 ? 'concluída' : 'concluídas'}
          </span>
        )}
      </div>

      {blocks.length > 0 && (
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-[var(--border-color)]/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF6A00]/60 to-[#FF6A00] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.serviceName}
              onClick={() => pull.mutate(s.stages)}
              disabled={pull.isPending}
              className="flex items-center gap-1.5 rounded-full border border-[#FF6A00]/40 bg-[#FF6A00]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#FF6A00] transition hover:bg-[#FF6A00]/20 disabled:opacity-50"
            >
              {pull.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Puxar etapas de {s.serviceName} ({s.stages.length})
            </button>
          ))}
        </div>
      )}

      {blocks.length === 0 && suggestions.length === 0 && (
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Sem etapas ainda. Adicione os blocos do projeto (ex.: Construção da marca, Aplicação, Conteúdo + tráfego).
        </p>
      )}

      <div className="space-y-2">
        {blocks.map((b, i) => (
          <BlockRow
            key={b.id}
            proposalId={proposalId}
            block={b}
            first={i === 0}
            last={i === blocks.length - 1}
            onMove={(dir) => move.mutate({ index: i, dir })}
            onChanged={invalidate}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTitle.trim()) add.mutate(newTitle.trim());
          }}
          placeholder="Nova etapa…"
          className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[#FF6A00]"
        />
        <button
          onClick={() => newTitle.trim() && add.mutate(newTitle.trim())}
          disabled={add.isPending || !newTitle.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-[#FF6A00] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#ff7a1a] disabled:opacity-50"
        >
          <Plus size={13} /> Etapa
        </button>
      </div>
    </div>
  );
}

function BlockRow({
  proposalId,
  block,
  first,
  last,
  onMove,
  onChanged,
}: {
  proposalId: string;
  block: ProposalBlock;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState(block.title);
  const [link, setLink] = useState(block.link);
  const [showLink, setShowLink] = useState(!!block.link);
  const done = block.status === 'done';

  const patch = useMutation({
    mutationFn: (data: Parameters<typeof api.blocks.update>[2]) =>
      api.blocks.update(proposalId, block.id, data),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: () => api.blocks.remove(proposalId, block.id),
    onSuccess: onChanged,
  });

  return (
    <div
      className={`rounded-2xl border p-3 transition-colors ${
        done ? 'border-green-500/30 bg-green-500/5' : 'border-[var(--border-color)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => patch.mutate({ status: done ? 'pending' : 'done' })}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            done ? 'border-green-500 bg-green-500 text-white' : 'border-[var(--border-color)] hover:border-[#FF6A00]'
          }`}
          title={done ? 'Desmarcar' : 'Marcar como feita'}
        >
          {done && <Check size={13} />}
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== block.title && patch.mutate({ title: title.trim() })}
          className={`flex-1 bg-transparent text-sm font-bold outline-none ${
            done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--foreground)]'
          }`}
        />

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setShowLink((v) => !v)}
            className={`transition-colors ${block.link ? 'text-[#FF6A00]' : 'text-[var(--text-muted)] hover:text-[#FF6A00]'}`}
            title="Link da entrega"
          >
            <Link2 size={14} />
          </button>
          <button
            onClick={() => onMove(-1)}
            disabled={first}
            className="text-[var(--text-muted)] transition-colors hover:text-[#FF6A00] disabled:opacity-20"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={last}
            className="text-[var(--text-muted)] transition-colors hover:text-[#FF6A00] disabled:opacity-20"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => remove.mutate()}
            className="text-[var(--text-muted)] transition-colors hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {showLink && (
        <div className="mt-2 flex items-center gap-2 pl-9">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onBlur={() => link !== block.link && patch.mutate({ link: link.trim() })}
            placeholder="https://… (link da entrega desta etapa)"
            className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-1.5 text-xs outline-none focus:border-[#FF6A00]"
          />
        </div>
      )}
    </div>
  );
}
