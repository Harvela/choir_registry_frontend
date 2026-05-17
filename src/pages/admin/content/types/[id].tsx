import { useRouter } from 'next/router';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import AdminContentShell from '@/components/content/AdminContentShell';
import type { updateContentField } from '@/lib/content/api';
import {
  useAddContentField,
  useContentType,
  useContentTypes,
  useDeleteContentField,
  useUpdateAnyContentField,
  useUpdateContentType,
} from '@/lib/content/hooks';
import { ENTITY_RELATION_TARGETS } from '@/lib/content/linked-entities';
import type { ContentFieldDefinitionDto } from '@/lib/content/types';
import { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

const FIELD_TYPES = [
  'text',
  'textarea',
  'html',
  'number',
  'boolean',
  'date',
  'image',
  'images',
  'profile_list',
  'video_list',
  'relation',
  'entity_relation',
] as const;

function ContentTypeDetailInner({ id }: { id: number }) {
  const { user } = useAuth();
  const canEditSchema =
    user?.type === 'admin' && user?.role === UserRole.SUPER_ADMIN;

  const { data, isLoading, error } = useContentType(id);
  const { data: allTypes = [] } = useContentTypes();
  const updateType = useUpdateContentType(id);
  const addField = useAddContentField(id);
  const deleteField = useDeleteContentField(id);
  const patchField = useUpdateAnyContentField(id);

  const [fieldKey, setFieldKey] = useState('');
  const [fieldType, setFieldType] = useState<string>('text');
  const [label, setLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [showInTable, setShowInTable] = useState(false);
  const [relationTargetCode, setRelationTargetCode] = useState('');
  const [relationMultiple, setRelationMultiple] = useState(false);
  const [entityRelationTarget, setEntityRelationTarget] = useState('Song');
  const [entityRelationMultiple, setEntityRelationMultiple] = useState(false);

  const fields = data?.fieldDefinitions ?? [];

  const relationTargets = [...allTypes]
    .filter((t) => t.id !== id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldKey.trim()) {
      toast.error('Clé requise');
      return;
    }
    if (fieldType === 'relation' && !relationTargetCode.trim()) {
      toast.error('Choisissez un type de contenu cible');
      return;
    }
    if (fieldType === 'entity_relation' && !entityRelationTarget.trim()) {
      toast.error("Choisissez un type d'entité cible");
      return;
    }
    try {
      await addField.mutateAsync({
        fieldKey: fieldKey.trim(),
        fieldType,
        label: label.trim() || undefined,
        required,
        showInTable,
        validation:
          fieldType === 'relation'
            ? {
                targetContentTypeCode: relationTargetCode.trim(),
                multiple: relationMultiple,
              }
            : fieldType === 'entity_relation'
              ? {
                  targetLinkedEntityType: entityRelationTarget.trim(),
                  multiple: entityRelationMultiple,
                }
              : undefined,
      });
      toast.success('Champ ajouté');
      setFieldKey('');
      setLabel('');
      setRequired(false);
      setShowInTable(false);
      setRelationTargetCode('');
      setRelationMultiple(false);
      setEntityRelationTarget('Song');
      setEntityRelationMultiple(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const toggleShowInTable = async (
    fieldId: number,
    next: boolean,
  ): Promise<void> => {
    try {
      await patchField.mutateAsync({
        fieldId,
        body: { showInTable: next },
      });
      toast.success('Colonne mise à jour');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const toggleActive = async () => {
    if (!data) return;
    try {
      await updateType.mutateAsync({ isActive: !data.isActive });
      toast.success('Mis à jour');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!window.confirm('Supprimer ce champ ?')) return;
    try {
      await deleteField.mutateAsync(fieldId);
      toast.success('Champ supprimé');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  type PatchFieldBody = Parameters<typeof updateContentField>[1];

  const handleFieldTypeChange = async (
    fieldId: number,
    current: ContentFieldDefinitionDto,
    nextType: string,
  ): Promise<void> => {
    try {
      let body: PatchFieldBody = { fieldType: nextType };

      if (nextType === 'relation') {
        const existingCode =
          current.validation &&
          typeof current.validation.targetContentTypeCode === 'string'
            ? current.validation.targetContentTypeCode
            : '';
        const code =
          existingCode && relationTargets.some((t) => t.code === existingCode)
            ? existingCode
            : relationTargets[0]?.code ?? '';
        if (!code) {
          toast.error(
            'Aucun type de contenu cible : créez un autre type ou choisissez une relation existante.',
          );
          return;
        }
        body = {
          fieldType: nextType,
          validation: {
            targetContentTypeCode: code,
            multiple: !!(
              current.validation && current.validation.multiple === true
            ),
          },
        };
      } else if (nextType === 'entity_relation') {
        const existingType =
          current.validation &&
          typeof current.validation.targetLinkedEntityType === 'string'
            ? current.validation.targetLinkedEntityType
            : '';
        const linkedType =
          existingType &&
          (ENTITY_RELATION_TARGETS as readonly string[]).includes(existingType)
            ? existingType
            : ENTITY_RELATION_TARGETS[0];
        body = {
          fieldType: nextType,
          validation: {
            targetLinkedEntityType: linkedType,
            multiple: !!(
              current.validation && current.validation.multiple === true
            ),
          },
        };
      } else if (
        current.fieldType === 'relation' ||
        current.fieldType === 'entity_relation'
      ) {
        body = { fieldType: nextType, validation: null };
      }

      await patchField.mutateAsync({ fieldId, body });
      toast.success('Type mis à jour');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleRelationMetaChange = async (
    fieldId: number,
    targetCode: string,
    multiple: boolean,
  ): Promise<void> => {
    if (!targetCode.trim()) {
      toast.error('Choisissez un type de contenu cible');
      return;
    }
    try {
      await patchField.mutateAsync({
        fieldId,
        body: {
          validation: {
            targetContentTypeCode: targetCode.trim(),
            multiple,
          },
        },
      });
      toast.success('Relation mise à jour');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleEntityRelationMetaChange = async (
    fieldId: number,
    targetType: string,
    multiple: boolean,
  ): Promise<void> => {
    if (!targetType.trim()) {
      toast.error("Choisissez un type d'entité cible");
      return;
    }
    try {
      await patchField.mutateAsync({
        fieldId,
        body: {
          validation: {
            targetLinkedEntityType: targetType.trim(),
            multiple,
          },
        },
      });
      toast.success('Entité liée mise à jour');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  if (error) {
    return (
      <AdminContentShell title="Type">
        <p className="text-red-600">Impossible de charger ce type.</p>
      </AdminContentShell>
    );
  }

  if (isLoading || !data) {
    return (
      <AdminContentShell title="Type">
        <p>Chargement…</p>
      </AdminContentShell>
    );
  }

  return (
    <AdminContentShell title={data.name}>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
            {data.code}
          </span>
          <span className="text-sm text-slate-600">
            Actif : {data.isActive ? 'oui' : 'non'}
          </span>
          {canEditSchema ? (
            <button
              type="button"
              onClick={() => {
                toggleActive().catch(() => {});
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {data.isActive ? 'Désactiver' : 'Activer'}
            </button>
          ) : null}
        </div>

        {canEditSchema ? (
          <form
            onSubmit={handleAddField}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              Ajouter un champ
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Clé</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  placeholder="field_key"
                  value={fieldKey}
                  onChange={(e) => setFieldKey(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Type</span>
                <select
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Libellé</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                  placeholder="Libellé"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </label>
            </div>

            {fieldType === 'relation' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">
                    Type de contenu lié
                  </span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    value={relationTargetCode}
                    onChange={(e) => setRelationTargetCode(e.target.value)}
                    required
                  >
                    <option value="">— Choisir —</option>
                    {relationTargets.map((t) => (
                      <option key={t.id} value={t.code}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={relationMultiple}
                    onChange={(e) => setRelationMultiple(e.target.checked)}
                  />
                  Relation multiple (plusieurs entrées)
                </label>
              </div>
            ) : null}

            {fieldType === 'entity_relation' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">
                    Entité liée
                  </span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    value={entityRelationTarget}
                    onChange={(e) => setEntityRelationTarget(e.target.value)}
                    required
                  >
                    {ENTITY_RELATION_TARGETS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={entityRelationMultiple}
                    onChange={(e) =>
                      setEntityRelationMultiple(e.target.checked)
                    }
                  />
                  Relation multiple
                </label>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                Obligatoire
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showInTable}
                  onChange={(e) => setShowInTable(e.target.checked)}
                />
                Afficher dans la table des entrées
              </label>
            </div>

            <button
              type="submit"
              disabled={addField.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Ajouter le champ
            </button>
          </form>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Lecture seule : seul le super administrateur modifie le schéma.
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Clé</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Ordre</th>
                <th className="px-4 py-3">Req.</th>
                <th className="px-4 py-3 text-center">Table</th>
                {canEditSchema ? <th className="px-4 py-3 text-right" /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fields.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEditSchema ? 7 : 6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Aucun champ défini.
                  </td>
                </tr>
              ) : (
                [...fields]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-slate-900">
                        {f.fieldKey}
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 text-slate-600">
                        {canEditSchema ? (
                          <div className="space-y-2">
                            <select
                              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs shadow-sm"
                              value={f.fieldType}
                              disabled={patchField.isPending}
                              onChange={(e) => {
                                const next = e.target.value;
                                if (next === f.fieldType) return;
                                handleFieldTypeChange(f.id, f, next).catch(
                                  () => {},
                                );
                              }}
                              aria-label={`Type du champ ${f.fieldKey}`}
                            >
                              {FIELD_TYPES.map((ft) => (
                                <option key={ft} value={ft}>
                                  {ft}
                                </option>
                              ))}
                            </select>
                            {f.fieldType === 'relation' ? (
                              <div className="space-y-1.5 rounded border border-slate-100 bg-slate-50 p-2">
                                <label className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                  Cible
                                </label>
                                <select
                                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                  value={
                                    typeof f.validation
                                      ?.targetContentTypeCode === 'string'
                                      ? f.validation.targetContentTypeCode
                                      : ''
                                  }
                                  disabled={
                                    patchField.isPending ||
                                    relationTargets.length === 0
                                  }
                                  onChange={(e) => {
                                    handleRelationMetaChange(
                                      f.id,
                                      e.target.value,
                                      !!(
                                        f.validation &&
                                        f.validation.multiple === true
                                      ),
                                    ).catch(() => {});
                                  }}
                                >
                                  <option value="">— Choisir —</option>
                                  {relationTargets.map((t) => (
                                    <option key={t.id} value={t.code}>
                                      {t.name}
                                    </option>
                                  ))}
                                </select>
                                <label className="flex items-center gap-1.5 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!(
                                        f.validation &&
                                        f.validation.multiple === true
                                      )
                                    }
                                    disabled={patchField.isPending}
                                    onChange={(e) => {
                                      const code =
                                        typeof f.validation
                                          ?.targetContentTypeCode === 'string'
                                          ? f.validation.targetContentTypeCode
                                          : relationTargets[0]?.code ?? '';
                                      if (!code) {
                                        toast.error(
                                          "Choisissez d'abord un type cible",
                                        );
                                        return;
                                      }
                                      handleRelationMetaChange(
                                        f.id,
                                        code,
                                        e.target.checked,
                                      ).catch(() => {});
                                    }}
                                  />
                                  Multiple
                                </label>
                              </div>
                            ) : null}
                            {f.fieldType === 'entity_relation' ? (
                              <div className="space-y-1.5 rounded border border-slate-100 bg-slate-50 p-2">
                                <label className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                  Entité
                                </label>
                                <select
                                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                  value={
                                    typeof f.validation
                                      ?.targetLinkedEntityType === 'string'
                                      ? f.validation.targetLinkedEntityType
                                      : ENTITY_RELATION_TARGETS[0]
                                  }
                                  disabled={patchField.isPending}
                                  onChange={(e) => {
                                    handleEntityRelationMetaChange(
                                      f.id,
                                      e.target.value,
                                      !!(
                                        f.validation &&
                                        f.validation.multiple === true
                                      ),
                                    ).catch(() => {});
                                  }}
                                >
                                  {ENTITY_RELATION_TARGETS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                                <label className="flex items-center gap-1.5 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={
                                      !!(
                                        f.validation &&
                                        f.validation.multiple === true
                                      )
                                    }
                                    disabled={patchField.isPending}
                                    onChange={(e) => {
                                      const linkedType =
                                        typeof f.validation
                                          ?.targetLinkedEntityType === 'string'
                                          ? f.validation.targetLinkedEntityType
                                          : ENTITY_RELATION_TARGETS[0];
                                      handleEntityRelationMetaChange(
                                        f.id,
                                        linkedType,
                                        e.target.checked,
                                      ).catch(() => {});
                                    }}
                                  />
                                  Multiple
                                </label>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <>
                            <span>{f.fieldType}</span>
                            {f.fieldType === 'relation' &&
                            f.validation &&
                            typeof f.validation.targetContentTypeCode ===
                              'string' ? (
                              <span className="mt-1 block text-xs text-slate-500">
                                → {String(f.validation.targetContentTypeCode)}
                                {f.validation.multiple ? ' (multiple)' : ''}
                              </span>
                            ) : null}
                            {f.fieldType === 'entity_relation' &&
                            f.validation &&
                            typeof f.validation.targetLinkedEntityType ===
                              'string' ? (
                              <span className="mt-1 block text-xs text-slate-500">
                                → {String(f.validation.targetLinkedEntityType)}
                                {f.validation.multiple ? ' (multiple)' : ''}
                              </span>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">{f.label ?? '—'}</td>
                      <td className="px-4 py-3">{f.sortOrder}</td>
                      <td className="px-4 py-3">
                        {f.required ? 'oui' : 'non'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!f.showInTable}
                          disabled={!canEditSchema || patchField.isPending}
                          onChange={(e) => {
                            toggleShowInTable(f.id, e.target.checked).catch(
                              () => {},
                            );
                          }}
                          aria-label="Afficher dans la table"
                        />
                      </td>
                      {canEditSchema ? (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteField(f.id).catch(() => {});
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminContentShell>
  );
}

const ContentTypeDetailPage: React.FC = () => {
  const router = useRouter();
  const rawId = router.query.id;
  const idNum =
    typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number.NaN;

  if (!router.isReady) {
    return (
      <AdminContentShell title="Type">
        <p>Chargement…</p>
      </AdminContentShell>
    );
  }

  if (!Number.isFinite(idNum)) {
    return (
      <AdminContentShell title="Type">
        <p>Identifiant invalide.</p>
      </AdminContentShell>
    );
  }

  return <ContentTypeDetailInner id={idNum} />;
};

export default ContentTypeDetailPage;
