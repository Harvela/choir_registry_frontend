'use client';

import React, { useEffect, useState } from 'react';

import {
  fetchLinkedEntityOptions,
  type LinkedEntityType,
} from '@/lib/content/linked-entity-options';

type EntityRelationSelectFieldProps = {
  targetLinkedEntityType: string;
  multiple: boolean;
  value: number | number[] | undefined;
  onChange: (v: number | number[] | undefined) => void;
  disabled?: boolean;
  required?: boolean;
};

const EntityRelationSelectField: React.FC<EntityRelationSelectFieldProps> = ({
  targetLinkedEntityType,
  multiple,
  value,
  onChange,
  disabled,
  required,
}) => {
  const [items, setItems] = useState<{ id: number; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const entityType = targetLinkedEntityType.trim() as LinkedEntityType;

  useEffect(() => {
    let cancelled = false;
    if (!entityType) {
      setItems([]);
      setIsLoading(false);
      setLoadError(null);
      return () => {
        cancelled = true;
      };
    }
    setIsLoading(true);
    setLoadError(null);
    fetchLinkedEntityOptions(entityType)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Impossible de charger les options.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType]);

  if (!targetLinkedEntityType.trim()) {
    return (
      <p className="text-sm text-amber-700">
        Définissez le type d&apos;entité cible dans les paramètres du champ
        (schéma).
      </p>
    );
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
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
              {row.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs
          entrées. L&apos;ordre de sélection est conservé.
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
          {row.label}
        </option>
      ))}
    </select>
  );
};

export default EntityRelationSelectField;
