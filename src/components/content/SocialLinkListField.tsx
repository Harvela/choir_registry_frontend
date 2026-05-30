'use client';

import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import type { SocialLinkItemDto } from '@/lib/content/types';

export type SocialLinkListFieldProps = {
  value: SocialLinkItemDto[];
  onChange: (rows: SocialLinkItemDto[]) => void;
  disabled?: boolean;
  label?: string;
};

function emptyRow(): SocialLinkItemDto {
  return { label: '', url: '' };
}

export function normalizeSocialLinkList(raw: unknown): SocialLinkItemDto[] {
  if (!Array.isArray(raw)) return [];
  const out: SocialLinkItemDto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    out.push({
      label: typeof o.label === 'string' ? o.label : '',
      url: typeof o.url === 'string' ? o.url : '',
    });
  }
  return out;
}

const SocialLinkListField: React.FC<SocialLinkListFieldProps> = ({
  value,
  onChange,
  disabled,
  label,
}) => {
  const rows = value.length ? value : [];

  const setRow = (idx: number, patch: Partial<SocialLinkItemDto>) => {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : { ...r })));
  };

  return (
    <div className="space-y-3">
      {label ? (
        <span className="block text-sm font-medium text-slate-700">
          {label}
        </span>
      ) : null}
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Lien {idx + 1}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Libellé</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  placeholder="Facebook, YouTube…"
                  value={row.label}
                  disabled={disabled}
                  onChange={(e) => setRow(idx, { label: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">URL</span>
                <input
                  type="url"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  placeholder="https://…"
                  value={row.url}
                  disabled={disabled}
                  onChange={(e) => setRow(idx, { url: e.target.value })}
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
        Ajouter un lien
      </button>
    </div>
  );
};

export default SocialLinkListField;
