'use client';

import React, { useMemo } from 'react';

import { contentEntryLabel } from '@/lib/content/content-entry-label';
import { useContentEntries, useContentTypes } from '@/lib/content/hooks';

type RelationSelectFieldProps = {
  targetContentTypeCode: string;
  multiple: boolean;
  value: number | number[] | undefined;
  onChange: (v: number | number[] | undefined) => void;
  disabled?: boolean;
  required?: boolean;
};

const RelationSelectField: React.FC<RelationSelectFieldProps> = ({
  targetContentTypeCode,
  multiple,
  value,
  onChange,
  disabled,
  required,
}) => {
  const { data: types = [] } = useContentTypes();
  const targetType = useMemo(
    () => types.find((t) => t.code === targetContentTypeCode.trim()),
    [types, targetContentTypeCode],
  );
  const typeId = targetType?.id;

  const { data: list, isLoading } = useContentEntries({
    contentTypeId: typeId,
    limit: 100,
    page: 1,
  });

  const items = list?.items ?? [];

  if (!targetContentTypeCode.trim()) {
    return (
      <p className="text-sm text-amber-700">
        Définissez le code du type cible dans les paramètres du champ (schéma).
      </p>
    );
  }

  if (!targetType) {
    return (
      <p className="text-sm text-amber-700">
        Type introuvable pour le code « {targetContentTypeCode} ».
      </p>
    );
  }

  if (multiple) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <select
          multiple
          size={Math.min(12, Math.max(4, items.length || 4))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          disabled={disabled || isLoading}
          value={selected.map(String)}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions);
            const ids = opts
              .map((o) => Number(o.value))
              .filter(Number.isFinite);
            onChange(ids);
          }}
        >
          {items.map((row) => (
            <option key={row.id} value={row.id}>
              {contentEntryLabel(row)}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs
          entrées.
        </p>
      </div>
    );
  }

  const single =
    typeof value === 'number' && Number.isFinite(value) ? String(value) : '';

  return (
    <select
      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      disabled={disabled || isLoading}
      value={single}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) {
          onChange(undefined);
          return;
        }
        onChange(Number(v));
      }}
    >
      {!required ? <option value="">—</option> : null}
      {items.map((row) => (
        <option key={row.id} value={row.id}>
          {contentEntryLabel(row)}
        </option>
      ))}
    </select>
  );
};

export default RelationSelectField;
