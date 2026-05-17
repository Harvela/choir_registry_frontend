import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import AdminContentShell from '@/components/content/AdminContentShell';
import ContentDynamicFields from '@/components/content/ContentDynamicFields';
import { emptyFieldValuesForDefinitions } from '@/lib/content/empty-field-values';
import {
  useContentType,
  useContentTypes,
  useCreateContentEntry,
  useLinkedEntityOptions,
} from '@/lib/content/hooks';
import { LINKED_ENTITY_TYPES } from '@/lib/content/linked-entities';
import { DepartmentService } from '@/lib/departments/service';

const NewContentEntryPage: React.FC = () => {
  const router = useRouter();
  const { data: types = [] } = useContentTypes();
  const [typeId, setTypeId] = useState<number | ''>('');

  useEffect(() => {
    const raw = router.query.typeId;
    if (typeof raw === 'string' && raw) {
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n)) setTypeId(n);
    }
  }, [router.query.typeId]);
  const numericTypeId = typeId === '' ? undefined : typeId;
  const { data: typeDetail } = useContentType(numericTypeId, !!numericTypeId);
  const createMut = useCreateContentEntry();

  const [linkedType, setLinkedType] = useState<string>('Communique');
  const [linkedId, setLinkedId] = useState<number | ''>('');
  const [audienceDeptId, setAudienceDeptId] = useState<number | ''>('');
  const [visibility, setVisibility] = useState('private');
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});

  const defs = typeDetail?.fieldDefinitions ?? [];

  const linkedEntityTypeChoices = useMemo(() => {
    const allowed = typeDetail?.allowedLinkedEntityTypes;
    if (!allowed?.length) {
      return [...LINKED_ENTITY_TYPES];
    }
    return LINKED_ENTITY_TYPES.filter((t) => allowed.includes(t));
  }, [typeDetail?.allowedLinkedEntityTypes]);

  useEffect(() => {
    if (linkedEntityTypeChoices.length === 0) return;
    if (
      !linkedEntityTypeChoices.includes(
        linkedType as (typeof LINKED_ENTITY_TYPES)[number],
      )
    ) {
      const next = linkedEntityTypeChoices[0];
      if (next) {
        setLinkedType(next);
        setLinkedId('');
      }
    }
  }, [linkedEntityTypeChoices, linkedType]);

  const { data: linkedOptions = [], isLoading: linkedLoading } =
    useLinkedEntityOptions(linkedType);
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: DepartmentService.listDepartments,
  });

  const definitionSig = defs.map((d) => `${d.id}:${d.fieldType}`).join('|');

  useEffect(() => {
    if (!defs.length) return;
    setFieldValues(emptyFieldValuesForDefinitions(defs));
  }, [numericTypeId, definitionSig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericTypeId == null) {
      toast.error('Choisissez un type');
      return;
    }
    if (linkedId === '') {
      toast.error('Choisissez une entité liée');
      return;
    }
    try {
      const row = await createMut.mutateAsync({
        contentTypeId: numericTypeId,
        linkedEntityType: linkedType,
        linkedEntityId: linkedId,
        fieldValues,
        audienceDepartmentId:
          audienceDeptId === '' ? undefined : audienceDeptId,
        visibility,
      });
      toast.success('Entrée créée');
      await router.push(`/admin/content/entries/${row.id}?mode=edit`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const setField = (key: string, value: unknown) => {
    setFieldValues((v) => ({ ...v, [key]: value }));
  };

  return (
    <AdminContentShell
      title="Nouvelle entrée"
      subtitle="Créez une entrée liée à une entité métier, puis éditez les champs dynamiques."
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl space-y-8 rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Type de contenu</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={typeId === '' ? '' : String(typeId)}
              onChange={(e) =>
                setTypeId(e.target.value ? Number(e.target.value) : '')
              }
              required
            >
              <option value="">—</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Entité liée</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={linkedType}
              onChange={(e) => {
                setLinkedType(e.target.value);
                setLinkedId('');
              }}
            >
              {linkedEntityTypeChoices.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Sélection</span>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={linkedId === '' ? '' : String(linkedId)}
              onChange={(e) =>
                setLinkedId(e.target.value ? Number(e.target.value) : '')
              }
              required
              disabled={linkedLoading}
            >
              <option value="">
                {linkedLoading ? 'Chargement…' : '— Choisir —'}
              </option>
              {linkedOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">
            Audience département
          </span>
          <select
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            value={audienceDeptId === '' ? '' : String(audienceDeptId)}
            onChange={(e) =>
              setAudienceDeptId(e.target.value ? Number(e.target.value) : '')
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

        {defs.length === 0 ? (
          <p className="border-t border-slate-100 pt-6 text-sm text-slate-500">
            Sélectionnez un type avec des champs définis.
          </p>
        ) : (
          <ContentDynamicFields
            definitions={defs}
            fieldValues={fieldValues}
            setField={setField}
            disabled={createMut.isPending}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createMut.isPending}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            Créer
          </button>
        </div>
      </form>
    </AdminContentShell>
  );
};

export default NewContentEntryPage;
