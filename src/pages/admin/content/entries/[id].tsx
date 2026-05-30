import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import AdminContentShell from '@/components/content/AdminContentShell';
import ContentDynamicFields from '@/components/content/ContentDynamicFields';
import { normalizeModeratorList } from '@/components/content/ModeratorListField';
import { normalizeProfileList } from '@/components/content/ProfileListField';
import { normalizeProgramList } from '@/components/content/ProgramListField';
import { normalizeWeeklyProgramList } from '@/components/content/WeeklyProgramListField';
import { normalizeSeoDefaults } from '@/components/content/SeoDefaultsField';
import { normalizeSocialLinkList } from '@/components/content/SocialLinkListField';
import { normalizeStringList } from '@/components/content/StringListField';
import { normalizeVideoList } from '@/components/content/VideoListField';
import {
  useApproveContentEntry,
  useContentEntry,
  useContentType,
  usePublishContentEntry,
  useUpdateContentEntry,
} from '@/lib/content/hooks';
import {
  resolveUploadAssetUrl,
  rewriteUploadSrcsInHtml,
} from '@/lib/content/uploadUrls';
import { DepartmentService } from '@/lib/departments/service';

function ContentEntryEditInner({ id }: { id: number }) {
  const router = useRouter();
  const { data: entry, isLoading, error } = useContentEntry(id);
  const typeId = entry?.contentType?.id;
  const { data: typeDetail } = useContentType(typeId, !!typeId);
  const updateMut = useUpdateContentEntry(id);
  const approveMut = useApproveContentEntry(id);
  const publishMut = usePublishContentEntry(id);

  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [audienceDeptId, setAudienceDeptId] = useState<number | ''>('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: DepartmentService.listDepartments,
  });

  useEffect(() => {
    if (entry) {
      setFieldValues(entry.fieldValues ?? {});
      setStatus(entry.status);
      setVisibility(entry.visibility);
      const rawAudienceId =
        entry.audienceDepartment?.id ?? entry.audienceDepartmentId ?? null;
      setAudienceDeptId(rawAudienceId == null ? '' : rawAudienceId);
    }
  }, [entry]);

  useEffect(() => {
    const mode = router.query.mode;
    if (mode === 'edit') setIsEditing(true);
    else if (mode === 'view') setIsEditing(false);
  }, [router.query.mode]);

  const setField = (key: string, value: unknown) => {
    setFieldValues((v) => ({ ...v, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMut.mutateAsync({
        fieldValues,
        status: status || undefined,
        visibility: visibility || undefined,
        audienceDepartmentId: audienceDeptId === '' ? null : audienceDeptId,
      });
      toast.success('Enregistré');
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const defs = typeDetail?.fieldDefinitions ?? [];
  const audienceName =
    audienceDeptId === ''
      ? 'Général (tous)'
      : departments.find((d) => d.id === audienceDeptId)?.name ??
        `Département #${audienceDeptId}`;
  const isApproved = !!entry?.approvedAt;
  const isPublished = !!entry?.publishedAt;

  if (error) {
    return (
      <AdminContentShell title="Entrée">
        <p className="text-red-600">Chargement impossible.</p>
      </AdminContentShell>
    );
  }

  if (isLoading || !entry) {
    return (
      <AdminContentShell title="Entrée">
        <p>Chargement…</p>
      </AdminContentShell>
    );
  }

  return (
    <AdminContentShell title={`Entrée #${entry.id}`}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span>
              Type: {entry.contentType?.name ?? entry.contentType?.code}
            </span>
            <span>·</span>
            <span>
              Lié: {entry.linkedEntityType} #{entry.linkedEntityId}
            </span>
            <span>·</span>
            <span>Audience: {audienceName}</span>
            <span>·</span>
            <span>Statut: {entry.status}</span>
            {isApproved ? (
              <>
                <span>·</span>
                <span className="text-emerald-700">Approuvé</span>
              </>
            ) : null}
            {isPublished ? (
              <>
                <span>·</span>
                <span className="text-indigo-700">Publié</span>
              </>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Annuler
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Modifier
              </button>
            )}
            {!isApproved ? (
              <button
                type="button"
                disabled={approveMut.isPending}
                onClick={() =>
                  approveMut.mutate(undefined, {
                    onSuccess: () => toast.success('Approuvé'),
                    onError: (e) => toast.error(String(e)),
                  })
                }
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Approuver
              </button>
            ) : null}
            {isApproved && !isPublished ? (
              <button
                type="button"
                disabled={publishMut.isPending}
                onClick={() =>
                  publishMut.mutate(undefined, {
                    onSuccess: () => toast.success('Publié'),
                    onError: (e) => toast.error(String(e)),
                  })
                }
                className="rounded border border-emerald-600 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
              >
                Publier
              </button>
            ) : null}
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Visibilité
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {entry.visibility}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Audience
                </p>
                <p className="mt-1 text-sm text-slate-900">{audienceName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Dernière modification
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {new Date(entry.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h2 className="text-sm font-semibold text-slate-800">Champs</h2>
              {defs
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((def) => {
                  const v = fieldValues[def.fieldKey];
                  const label = def.label || def.fieldKey;
                  if (def.fieldType === 'html') {
                    const html = typeof v === 'string' ? v : '';
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <div
                          className="prose prose-sm mt-2 max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: rewriteUploadSrcsInHtml(
                              html || '<p class="text-slate-500">—</p>',
                            ),
                          }}
                        />
                      </div>
                    );
                  }
                  if (def.fieldType === 'textarea') {
                    const txt = typeof v === 'string' ? v : '';
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                          {txt || '—'}
                        </p>
                      </div>
                    );
                  }
                  if (def.fieldType === 'image' && typeof v === 'string' && v) {
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveUploadAssetUrl(v)}
                          alt=""
                          className="mt-2 max-h-56 rounded-lg object-contain"
                        />
                      </div>
                    );
                  }
                  if (
                    def.fieldType === 'images' &&
                    Array.isArray(v) &&
                    v.length
                  ) {
                    const urls = v.filter(
                      (x): x is string => typeof x === 'string',
                    );
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {urls.map((u) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={u}
                              src={resolveUploadAssetUrl(u)}
                              alt=""
                              className="size-20 rounded-md object-cover ring-1 ring-slate-200"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (def.fieldType === 'profile_list') {
                    const rows = normalizeProfileList(v);
                    if (!rows.length) {
                      return (
                        <div
                          key={def.id}
                          className="rounded-lg border border-slate-200 p-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {label}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">—</p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <ul className="mt-3 space-y-3">
                          {rows.map((row, idx) => (
                            <li
                              key={`${row.name}-${row.roleTitle}-${idx}`}
                              className="flex gap-3 rounded-md border border-slate-100 bg-slate-50/80 p-3"
                            >
                              {row.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={resolveUploadAssetUrl(row.imageUrl)}
                                  alt=""
                                  className="size-14 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div
                                  className="size-14 shrink-0 rounded-full bg-slate-200"
                                  aria-hidden
                                />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900">
                                  {row.name || '—'}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {row.roleTitle || '—'}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  if (def.fieldType === 'video_list') {
                    const rows = normalizeVideoList(v);
                    if (!rows.length) {
                      return (
                        <div
                          key={def.id}
                          className="rounded-lg border border-slate-200 p-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {label}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">—</p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <ul className="mt-3 space-y-2">
                          {rows.map((row) => (
                            <li key={row.id} className="text-sm text-slate-800">
                              <span className="font-medium">{row.title}</span>
                              <span className="text-slate-500">
                                {' '}
                                · {row.source}
                                {row.source === 'youtube' && row.videoId
                                  ? ` (${row.videoId})`
                                  : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  if (def.fieldType === 'social_link_list') {
                    const rows = normalizeSocialLinkList(v);
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        {!rows.length ? (
                          <p className="mt-2 text-sm text-slate-500">—</p>
                        ) : (
                          <ul className="mt-3 space-y-1">
                            {rows.map((row, i) => (
                              <li key={i} className="text-sm text-slate-800">
                                <span className="font-medium">
                                  {row.label || '—'}
                                </span>
                                {row.url ? (
                                  <span className="text-slate-500">
                                    {' '}
                                    · {row.url}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                  if (def.fieldType === 'seo_defaults') {
                    const seo = normalizeSeoDefaults(v);
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <dl className="mt-2 space-y-2 text-sm text-slate-800">
                          <div>
                            <dt className="text-xs text-slate-500">Titre</dt>
                            <dd>{seo.title || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">
                              Description
                            </dt>
                            <dd className="whitespace-pre-wrap">
                              {seo.description || '—'}
                            </dd>
                          </div>
                          {seo.keywords?.trim() ? (
                            <div>
                              <dt className="text-xs text-slate-500">
                                Mots-clés
                              </dt>
                              <dd>{seo.keywords}</dd>
                            </div>
                          ) : null}
                          {seo.ogImage ? (
                            <div>
                              <dt className="text-xs text-slate-500">
                                OG image
                              </dt>
                              <dd>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolveUploadAssetUrl(seo.ogImage)}
                                  alt=""
                                  className="mt-1 max-h-32 rounded object-contain"
                                />
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    );
                  }
                  if (def.fieldType === 'program_list') {
                    const rows = normalizeProgramList(v);
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        {!rows.length ? (
                          <p className="mt-2 text-sm text-slate-500">—</p>
                        ) : (
                          <ul className="mt-3 space-y-3">
                            {rows.map((row, i) => (
                              <li key={i} className="text-sm text-slate-800">
                                <p className="font-mono text-xs text-indigo-700">
                                  {row.timeRange || '—'}
                                </p>
                                <p className="font-medium">
                                  {row.title || '—'}
                                </p>
                                {row.description ? (
                                  <p className="text-slate-600">
                                    {row.description}
                                  </p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                  if (def.fieldType === 'weekly_program_list') {
                    const rows = normalizeWeeklyProgramList(v);
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        {!rows.length ? (
                          <p className="mt-2 text-sm text-slate-500">—</p>
                        ) : (
                          <ul className="mt-3 space-y-3">
                            {rows.map((row, i) => (
                              <li key={i} className="text-sm text-slate-800">
                                <p className="font-medium">{row.title || '—'}</p>
                                <p className="font-mono text-xs text-indigo-700">
                                  {row.day || '—'} · {row.time || '—'}
                                </p>
                                {row.description ? (
                                  <p className="text-slate-600">{row.description}</p>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  }
                  if (def.fieldType === 'moderator_list') {
                    const rows = normalizeModeratorList(v);
                    if (!rows.length) {
                      return (
                        <div
                          key={def.id}
                          className="rounded-lg border border-slate-200 p-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            {label}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">—</p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <ul className="mt-3 space-y-3">
                          {rows.map((row, i) => (
                            <li
                              key={i}
                              className="flex gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                            >
                              {row.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={resolveUploadAssetUrl(row.imageUrl)}
                                  alt=""
                                  className="size-12 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : null}
                              <div>
                                <p className="font-medium text-slate-900">
                                  {row.name || '—'}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {row.roleTitle || '—'}
                                </p>
                                {row.bio ? (
                                  <p className="mt-1 text-sm text-slate-500">
                                    {row.bio}
                                  </p>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  if (def.fieldType === 'string_list') {
                    const rows = normalizeStringList(v);
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        {!rows.length ? (
                          <p className="mt-2 text-sm text-slate-500">—</p>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {rows.map((paragraph, i) => (
                              <p
                                key={i}
                                className="whitespace-pre-wrap text-sm text-slate-800"
                              >
                                {paragraph || '—'}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (
                    def.fieldType === 'relation' ||
                    def.fieldType === 'entity_relation'
                  ) {
                    const txt = Array.isArray(v)
                      ? v.join(', ')
                      : String(v ?? '—');
                    return (
                      <div
                        key={def.id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 font-mono text-sm text-slate-900">
                          {txt}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={def.id}
                      className="rounded border border-slate-200 p-3"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-900">
                        {v == null || v === '' ? '—' : String(v)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="space-y-8 rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Statut</span>
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">draft</option>
                  <option value="ready">ready</option>
                  <option value="published" disabled>
                    published (via Publier)
                  </option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Visibilité</span>
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="private">private</option>
                  <option value="public">public</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">
                  Audience département
                </span>
                <select
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  value={audienceDeptId === '' ? '' : String(audienceDeptId)}
                  onChange={(e) =>
                    setAudienceDeptId(
                      e.target.value ? Number(e.target.value) : '',
                    )
                  }
                >
                  <option value="">Général (tous)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ContentDynamicFields
              definitions={defs}
              fieldValues={fieldValues}
              setField={setField}
              disabled={updateMut.isPending}
              excludeContentEntryId={entry.id}
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={updateMut.isPending}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminContentShell>
  );
}

const ContentEntryEditPage: React.FC = () => {
  const router = useRouter();
  const raw = router.query.id;
  const id = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN;

  if (!router.isReady) {
    return (
      <AdminContentShell title="Entrée">
        <p>Chargement…</p>
      </AdminContentShell>
    );
  }

  if (!Number.isFinite(id)) {
    return (
      <AdminContentShell title="Entrée">
        <p>Identifiant invalide.</p>
      </AdminContentShell>
    );
  }

  return <ContentEntryEditInner id={id} />;
};

export default ContentEntryEditPage;
