import Link from 'next/link';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import AdminContentShell from '@/components/content/AdminContentShell';
import { useContentTypes, useCreateContentType } from '@/lib/content/hooks';
import { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

const ContentTypesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: types = [], isLoading } = useContentTypes();
  const createMutation = useCreateContentType();
  const canEditSchema =
    user?.type === 'admin' && user?.role === UserRole.SUPER_ADMIN;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Nom et code requis');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        code: code.trim().replace(/\s+/g, '_').toLowerCase(),
        description: description.trim() || undefined,
      });
      toast.success('Type créé');
      setName('');
      setCode('');
      setDescription('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <AdminContentShell title="Types de contenu">
      {canEditSchema ? (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Nouveau type
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nom affiché"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="code_unique"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Description (optionnel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Créer le type
          </button>
        </form>
      ) : (
        <p className="mb-6 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Seul un super administrateur peut créer ou modifier le schéma.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  Chargement…
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-500">
                  Aucun type. Créez-en un ci-dessus.
                </td>
              </tr>
            ) : (
              types.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.code}</td>
                  <td className="px-4 py-3">{t.isActive ? 'Oui' : 'Non'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/content/types/${t.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminContentShell>
  );
};

export default ContentTypesPage;
