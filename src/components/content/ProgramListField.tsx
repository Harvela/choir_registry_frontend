'use client';

import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import type { ProgramListItemDto } from '@/lib/content/types';

export type ProgramListFieldProps = {
  value: ProgramListItemDto[];
  onChange: (rows: ProgramListItemDto[]) => void;
  disabled?: boolean;
  label?: string;
};

function emptyRow(): ProgramListItemDto {
  return { timeRange: '', title: '', description: '' };
}

export function normalizeProgramList(raw: unknown): ProgramListItemDto[] {
  if (!Array.isArray(raw)) return [];
  const out: ProgramListItemDto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const description =
      typeof o.description === 'string' ? o.description : undefined;
    out.push({
      timeRange: typeof o.timeRange === 'string' ? o.timeRange : '',
      title: typeof o.title === 'string' ? o.title : '',
      ...(description ? { description } : {}),
    });
  }
  return out;
}

const ProgramListField: React.FC<ProgramListFieldProps> = ({
  value,
  onChange,
  disabled,
  label,
}) => {
  const rows = value.length ? value : [];

  const setRow = (idx: number, patch: Partial<ProgramListItemDto>) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : { ...r })));
  };

  return (
    <div className="space-y-3">
      {label ? (
        <span className="block text-sm font-medium text-slate-700">
          {label}
        </span>
      ) : null}
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Étape {idx + 1}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Retirer
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Horaire</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  placeholder="18h30 – 19h00"
                  value={row.timeRange}
                  disabled={disabled}
                  onChange={(e) => setRow(idx, { timeRange: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Titre</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  value={row.title}
                  disabled={disabled}
                  onChange={(e) => setRow(idx, { title: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">
                  Description (optionnel)
                </span>
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  rows={2}
                  value={row.description ?? ''}
                  disabled={disabled}
                  onChange={(e) =>
                    setRow(idx, {
                      description: e.target.value || undefined,
                    })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, emptyRow()])}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        Ajouter une étape
      </button>
    </div>
  );
};

export default ProgramListField;
