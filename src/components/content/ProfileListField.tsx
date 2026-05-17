'use client';

import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import type { ProfileListItemDto } from '@/lib/content/types';

import ImageUploadField from './ImageUploadField';

export type ProfileListFieldProps = {
  value: ProfileListItemDto[];
  onChange: (rows: ProfileListItemDto[]) => void;
  disabled?: boolean;
  label?: string;
};

function emptyRow(): ProfileListItemDto {
  return { name: '', roleTitle: '', imageUrl: '' };
}

export function normalizeProfileList(raw: unknown): ProfileListItemDto[] {
  if (!Array.isArray(raw)) return [];
  const out: ProfileListItemDto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name : '';
    const roleTitle = typeof o.roleTitle === 'string' ? o.roleTitle : '';
    const imageUrl =
      typeof o.imageUrl === 'string'
        ? o.imageUrl
        : o.imageUrl == null
          ? ''
          : String(o.imageUrl);
    out.push({ name, roleTitle, imageUrl });
  }
  return out;
}

const ProfileListField: React.FC<ProfileListFieldProps> = ({
  value,
  onChange,
  disabled,
  label,
}) => {
  const rows = value.length ? value : [];

  const setRow = (idx: number, patch: Partial<ProfileListItemDto>) => {
    const next = rows.map((r, i) =>
      i === idx ? { ...r, ...patch } : { ...r },
    );
    onChange(next);
  };

  const addRow = () => {
    onChange([...rows, emptyRow()]);
  };

  const removeRow = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {label ? (
        <span className="block text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Responsable {idx + 1}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeRow(idx)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Retirer
              </button>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="sm:w-48 shrink-0">
                <ImageUploadField
                  label="Photo"
                  value={row.imageUrl}
                  disabled={disabled}
                  onChange={(url) => setRow(idx, { imageUrl: url })}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Nom</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    value={row.name}
                    disabled={disabled}
                    onChange={(e) => setRow(idx, { name: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Fonction</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    value={row.roleTitle}
                    disabled={disabled}
                    onChange={(e) =>
                      setRow(idx, { roleTitle: e.target.value })
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={addRow}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        Ajouter un responsable
      </button>
    </div>
  );
};

export default ProfileListField;
