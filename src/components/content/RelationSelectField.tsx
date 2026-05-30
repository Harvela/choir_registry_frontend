'use client';

import React, { useMemo } from 'react';

import { contentEntryLabel } from '@/lib/content/content-entry-label';
import type { ContentEntryDto } from '@/lib/content/types';
import { useContentEntries, useContentTypes } from '@/lib/content/hooks';

type RelationStoreAs = 'id' | 'linkedEntityId' | 'slug';

type RelationSelectFieldProps = {
  targetContentTypeCode: string;
  multiple: boolean;
  value: number | number[] | string | string[] | undefined;
  onChange: (v: number | number[] | string | string[] | undefined) => void;
  disabled?: boolean;
  required?: boolean;
  storeAs?: RelationStoreAs;
  /** Exclude this content entry id from options (e.g. prevent self-parent) */
  excludeContentEntryId?: number;
};

function entrySlug(row: ContentEntryDto): string | undefined {
  const slug = row.fieldValues?.slug;
  return typeof slug === 'string' && slug.trim() ? slug.trim() : undefined;
}

const RelationSelectField: React.FC<RelationSelectFieldProps> = ({
  targetContentTypeCode,
  multiple,
  value,
  onChange,
  disabled,
  required,
  storeAs = 'id',
  excludeContentEntryId,
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

  const items = useMemo(() => {
    const all = list?.items ?? [];
    if (excludeContentEntryId == null) return all;
    return all.filter((row) => row.id !== excludeContentEntryId);
  }, [list?.items, excludeContentEntryId]);

  const selectValue = useMemo(() => {
    if (storeAs === 'slug') {
      if (typeof value !== 'string' || !value.trim()) return '';
      const match = items.find((row) => entrySlug(row) === value.trim());
      return match ? String(match.id) : '';
    }
    if (storeAs === 'linkedEntityId') {
      if (typeof value !== 'number' || !Number.isFinite(value)) return '';
      const match = items.find((row) => row.linkedEntityId === value);
      return match ? String(match.id) : '';
    }
    return typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : '';
  }, [value, items, storeAs]);

  const emitChange = (contentId: number | undefined) => {
    if (contentId == null) {
      onChange(undefined);
      return;
    }
    const entry = items.find((row) => row.id === contentId);
    if (storeAs === 'linkedEntityId') {
      onChange(entry?.linkedEntityId ?? undefined);
      return;
    }
    if (storeAs === 'slug') {
      onChange(entry ? entrySlug(entry) : undefined);
      return;
    }
    onChange(contentId);
  };

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
    const selectedIds =
      storeAs === 'slug'
        ? items
            .filter((row) => {
              const slug = entrySlug(row);
              return (
                typeof slug === 'string' &&
                Array.isArray(value) &&
                value.includes(slug)
              );
            })
            .map((row) => String(row.id))
        : storeAs === 'linkedEntityId'
          ? items
              .filter((row) =>
                Array.isArray(value)
                  ? value.includes(row.linkedEntityId)
                  : false,
              )
              .map((row) => String(row.id))
          : Array.isArray(value)
            ? value.map(String)
            : [];

    return (
      <div className="space-y-2">
        <select
          multiple
          size={Math.min(12, Math.max(4, items.length || 4))}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          disabled={disabled || isLoading}
          value={selectedIds}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions);
            const contentIds = opts
              .map((o) => Number(o.value))
              .filter(Number.isFinite);
            if (storeAs === 'linkedEntityId') {
              const linkedIds = contentIds
                .map(
                  (cid) => items.find((row) => row.id === cid)?.linkedEntityId,
                )
                .filter((x): x is number => typeof x === 'number');
              onChange(linkedIds);
            } else if (storeAs === 'slug') {
              const slugs = contentIds
                .map((cid) => {
                  const row = items.find((item) => item.id === cid);
                  return row ? entrySlug(row) : undefined;
                })
                .filter((x): x is string => typeof x === 'string');
              onChange(slugs);
            } else {
              onChange(contentIds);
            }
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

  return (
    <select
      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      disabled={disabled || isLoading}
      value={selectValue}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) {
          emitChange(undefined);
          return;
        }
        emitChange(Number(v));
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
