import { Eye, Pencil, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import AdminContentShell from '@/components/content/AdminContentShell';
import { normalizeProfileList } from '@/components/content/ProfileListField';
import { normalizeVideoList } from '@/components/content/VideoListField';
import { useContentEntries, useContentType } from '@/lib/content/hooks';
import type { ContentEntryDto } from '@/lib/content/types';
import { resolveUploadAssetUrl } from '@/lib/content/uploadUrls';

function formatCell(
  row: ContentEntryDto,
  fieldKey: string,
  fieldType: string,
): React.ReactNode {
  const raw = row.fieldValues?.[fieldKey];
  if (raw == null || raw === '')
    return <span className="text-slate-400">—</span>;

  if (fieldType === 'boolean') {
    return raw ? 'oui' : 'non';
  }
  if (fieldType === 'image' && typeof raw === 'string') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveUploadAssetUrl(raw)}
        alt=""
        className="h-10 w-14 rounded object-cover ring-1 ring-slate-200"
      />
    );
  }
  if (fieldType === 'images' && Array.isArray(raw)) {
    const urls = raw
      .filter((x): x is string => typeof x === 'string')
      .slice(0, 3);
    return (
      <div className="flex gap-1">
        {urls.map((u) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={u}
            src={resolveUploadAssetUrl(u)}
            alt=""
            className="size-9 rounded object-cover ring-1 ring-slate-200"
          />
        ))}
        {raw.length > 3 ? (
          <span className="self-center text-xs text-slate-500">
            +{raw.length - 3}
          </span>
        ) : null}
      </div>
    );
  }
  if (fieldType === 'profile_list') {
    const rows = normalizeProfileList(raw);
    const nonempty = rows.filter(
      (r) => r.name || r.roleTitle || r.imageUrl,
    );
    if (!nonempty.length) {
      return <span className="text-slate-400">—</span>;
    }
    const first = nonempty[0];
    const rest = nonempty.slice(1);
    if (!first) {
      return <span className="text-slate-400">—</span>;
    }
    return (
      <div className="flex max-w-[14rem] items-center gap-2">
        {first.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveUploadAssetUrl(first.imageUrl)}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div
            className="size-9 shrink-0 rounded-full bg-slate-200"
            aria-hidden
          />
        )}
        <span className="min-w-0 truncate text-xs text-slate-700">
          {first.name || first.roleTitle || '—'}
        </span>
        {rest.length > 0 ? (
          <span className="shrink-0 text-xs text-slate-500">+{rest.length}</span>
        ) : null}
      </div>
    );
  }
  if (fieldType === 'video_list') {
    const rows = normalizeVideoList(raw);
    if (!rows.length) return <span className="text-slate-400">—</span>;
    const first = rows[0];
    return (
      <span className="text-xs text-slate-700">
        {rows.length} vidéo{rows.length > 1 ? 's' : ''}
        {first?.title ? ` · ${first.title}` : ''}
      </span>
    );
  }
  if (fieldType === 'relation' || fieldType === 'entity_relation') {
    return Array.isArray(raw) ? raw.join(', ') : String(raw);
  }
  if (fieldType === 'html' || fieldType === 'textarea') {
    const s = typeof raw === 'string' ? raw.replace(/<[^>]+>/g, ' ') : '';
    const t = s.replace(/\s+/g, ' ').trim();
    return t.length > 70 ? `${t.slice(0, 67)}…` : t || '—';
  }

  const s = typeof raw === 'string' ? raw : JSON.stringify(raw);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

const ContentEntriesPage: React.FC = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 12;

  const typeIdRaw = router.query.typeId;
  const typeId =
    typeof typeIdRaw === 'string' && typeIdRaw
      ? Number.parseInt(typeIdRaw, 10)
      : undefined;
  const validTypeId =
    typeId != null && Number.isFinite(typeId) ? typeId : undefined;

  const searchQ =
    typeof router.query.search === 'string' ? router.query.search : '';
  const sortByQ =
    typeof router.query.sortBy === 'string' ? router.query.sortBy : '';
  const sortDirQ =
    router.query.sortDir === 'DESC' || router.query.sortDir === 'ASC'
      ? router.query.sortDir
      : 'ASC';
  const statusQ =
    typeof router.query.status === 'string' ? router.query.status : '';
  const visibilityQ =
    typeof router.query.visibility === 'string' ? router.query.visibility : '';

  const { data: typeDetail } = useContentType(validTypeId, !!validTypeId);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      contentTypeId: validTypeId,
      search: searchQ.trim() || undefined,
      sortBy: sortByQ.trim() || undefined,
      sortDir:
        sortByQ.trim() && (sortDirQ === 'DESC' || sortDirQ === 'ASC')
          ? (sortDirQ as 'ASC' | 'DESC')
          : undefined,
      status: statusQ || undefined,
      visibility: visibilityQ || undefined,
    }),
    [
      page,
      limit,
      validTypeId,
      searchQ,
      sortByQ,
      sortDirQ,
      statusQ,
      visibilityQ,
    ],
  );

  const { data, isLoading, isFetching } = useContentEntries(listParams);

  const tableFields = useMemo(() => {
    const defs = typeDetail?.fieldDefinitions ?? [];
    return [...defs]
      .filter((f) => f.showInTable)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [typeDetail]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const colSpan = (validTypeId ? 6 : 7) + tableFields.length;

  const [localSearch, setLocalSearch] = useState(searchQ);

  useEffect(() => {
    setLocalSearch(searchQ);
  }, [searchQ]);

  useEffect(() => {
    setPage(1);
  }, [validTypeId]);

  const pushQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = { ...router.query };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '') delete next[k];
        else next[k] = v;
      }
      router.replace({ pathname: router.pathname, query: next }, undefined, {
        shallow: true,
      });
    },
    [router],
  );

  const toggleSort = (col: string) => {
    const same = sortByQ === col;
    const nextDir = same && sortDirQ === 'ASC' ? 'DESC' : 'ASC';
    pushQuery({ sortBy: col, sortDir: nextDir });
    setPage(1);
  };

  const sortIndicator = (col: string) => {
    if (sortByQ !== col) return null;
    return sortDirQ === 'DESC' ? ' ▼' : ' ▲';
  };

  const title = validTypeId
    ? typeDetail?.name
      ? `Entrées — ${typeDetail.name}`
      : 'Entrées'
    : 'Entrées';

  return (
    <AdminContentShell title={title}>
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end md:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Rechercher dans les champs…"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none ring-indigo-500/30 transition focus:bg-white focus:ring-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    pushQuery({
                      search: localSearch.trim(),
                    });
                    setPage(1);
                  }
                }}
              />
            </div>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
              value={statusQ}
              onChange={(e) => {
                pushQuery({ status: e.target.value || undefined });
                setPage(1);
              }}
            >
              <option value="">Tous statuts</option>
              <option value="draft">draft</option>
              <option value="ready">ready</option>
              <option value="published">published</option>
            </select>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
              value={visibilityQ}
              onChange={(e) => {
                pushQuery({ visibility: e.target.value || undefined });
                setPage(1);
              }}
            >
              <option value="">Toutes visibilités</option>
              <option value="private">private</option>
              <option value="public">public</option>
            </select>
          </div>
          <Link
            href={
              validTypeId
                ? `/admin/content/entries/new?typeId=${validTypeId}`
                : '/admin/content/entries/new'
            }
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            Nouvelle entrée
          </Link>
        </div>

        <p className="text-sm text-slate-600">
          {data != null ? (
            <>
              <span className="font-medium text-slate-800">{data.total}</span>{' '}
              entrée(s) — page {data.page} / {totalPages}
              {validTypeId && typeDetail ? (
                <span className="text-slate-500">
                  {' '}
                  · filtré par type « {typeDetail.name} »
                </span>
              ) : null}
            </>
          ) : null}
        </p>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      className="hover:text-indigo-700"
                      onClick={() => toggleSort('id')}
                    >
                      ID{sortIndicator('id')}
                    </button>
                  </th>
                  {!validTypeId ? <th className="px-4 py-3">Type</th> : null}
                  <th className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      className="hover:text-indigo-700"
                      onClick={() => toggleSort('status')}
                    >
                      Statut{sortIndicator('status')}
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      className="hover:text-indigo-700"
                      onClick={() => toggleSort('visibility')}
                    >
                      Visibilité{sortIndicator('visibility')}
                    </button>
                  </th>
                  <th className="px-4 py-3">Lié</th>
                  {tableFields.map((f) => (
                    <th key={f.id} className="whitespace-nowrap px-4 py-3">
                      <button
                        type="button"
                        className="max-w-[140px] truncate text-left hover:text-indigo-700"
                        title={f.fieldKey}
                        onClick={() => toggleSort(f.fieldKey)}
                      >
                        {f.label || f.fieldKey}
                        {sortIndicator(f.fieldKey)}
                      </button>
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      className="hover:text-indigo-700"
                      onClick={() => toggleSort('updatedAt')}
                    >
                      Modifié{sortIndicator('updatedAt')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Chargement…
                    </td>
                  </tr>
                ) : !data?.items.length ? (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Aucune entrée sur cette page.
                    </td>
                  </tr>
                ) : (
                  data.items.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-800">
                        {row.id}
                      </td>
                      {!validTypeId ? (
                        <td className="px-4 py-3">
                          {row.contentType?.name ??
                            row.contentType?.code ??
                            '—'}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {row.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.visibility}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-xs text-slate-600">
                        {row.linkedEntityType} #{row.linkedEntityId}
                      </td>
                      {tableFields.map((f) => (
                        <td
                          key={`${row.id}-${f.id}`}
                          className="max-w-[200px] px-4 py-3 align-middle text-slate-700"
                        >
                          {formatCell(row, f.fieldKey, f.fieldType)}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {new Date(row.updatedAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/content/entries/${row.id}?mode=view`}
                            className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
                            title="Voir"
                          >
                            <Eye className="size-4" />
                          </Link>
                          <Link
                            href={`/admin/content/entries/${row.id}?mode=edit`}
                            className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
                            title="Modifier"
                          >
                            <Pencil className="size-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pb-6">
          <button
            type="button"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50 disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </AdminContentShell>
  );
};

export default ContentEntriesPage;
