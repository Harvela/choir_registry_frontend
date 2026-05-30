'use client';

import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

export type StringListFieldProps = {
  value: string[];
  onChange: (rows: string[]) => void;
  disabled?: boolean;
  label?: string;
  rowLabel?: string;
  addLabel?: string;
  placeholder?: string;
};

export function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string');
}

const StringListField: React.FC<StringListFieldProps> = ({
  value,
  onChange,
  disabled,
  label,
  rowLabel = 'Paragraphe',
  addLabel = 'Ajouter un paragraphe',
  placeholder,
}) => {
  const rows = value.length ? value : [];

  const setRow = (idx: number, text: string) => {
    onChange(rows.map((r, i) => (i === idx ? text : r)));
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
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {rowLabel} {idx + 1}
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
            <textarea
              className="min-h-[72px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
              rows={3}
              value={row}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(e) => setRow(idx, e.target.value)}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, ''])}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
};

export default StringListField;
