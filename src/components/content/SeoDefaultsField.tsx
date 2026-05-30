'use client';

import React from 'react';

import type { SeoDefaultsDto } from '@/lib/content/types';

import ImageUploadField from './ImageUploadField';

export type SeoDefaultsFieldProps = {
  value: SeoDefaultsDto;
  onChange: (value: SeoDefaultsDto) => void;
  disabled?: boolean;
  label?: string;
};

export function emptySeoDefaults(): SeoDefaultsDto {
  return { title: '', description: '', ogImage: '', keywords: '' };
}

export function normalizeSeoDefaults(raw: unknown): SeoDefaultsDto {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return emptySeoDefaults();
  }
  const o = raw as Record<string, unknown>;
  return {
    title: typeof o.title === 'string' ? o.title : '',
    description: typeof o.description === 'string' ? o.description : '',
    ogImage: typeof o.ogImage === 'string' ? o.ogImage : '',
    keywords: typeof o.keywords === 'string' ? o.keywords : '',
  };
}

const SeoDefaultsField: React.FC<SeoDefaultsFieldProps> = ({
  value,
  onChange,
  disabled,
  label,
}) => {
  const patch = (p: Partial<SeoDefaultsDto>) => {
    onChange({ ...value, ...p });
  };

  return (
    <div className="space-y-3">
      {label ? (
        <span className="block text-sm font-medium text-slate-700">
          {label}
        </span>
      ) : null}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Titre (meta title)</span>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
            value={value.title}
            disabled={disabled}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">
            Description (meta description)
          </span>
          <textarea
            className="mt-1 min-h-[80px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
            rows={3}
            value={value.description}
            disabled={disabled}
            onChange={(e) => patch({ description: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">
            Mentionnez cultes, horaires et contact pour le référencement.
          </p>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">
            Mots-clés (meta keywords, optionnel)
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
            placeholder="église Kinshasa, culte dimanche, cellule de maison"
            value={value.keywords ?? ''}
            disabled={disabled}
            onChange={(e) => patch({ keywords: e.target.value })}
          />
        </label>
        <ImageUploadField
          label="Image Open Graph (og:image)"
          value={value.ogImage}
          disabled={disabled}
          onChange={(url) => patch({ ogImage: url })}
        />
      </div>
    </div>
  );
};

export default SeoDefaultsField;
