import { Boxes, FileText } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import AdminContentShell from '@/components/content/AdminContentShell';

const AdminContentHome: React.FC = () => {
  return (
    <AdminContentShell title="Contenu">
      <p className="mb-8 max-w-xl text-slate-600">
        Gérez les types de contenu (schéma) et les entrées, avec validation côté
        serveur et workflow brouillon / prêt / publié.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/content/types"
          className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
        >
          <Boxes className="mb-3 size-8 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Types de collection
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Définir les champs et types (style Strapi).
          </p>
        </Link>
        <Link
          href="/admin/content/entries"
          className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
        >
          <FileText className="mb-3 size-8 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">Entrées</h2>
          <p className="mt-1 text-sm text-slate-600">
            Liste paginée, édition et publication.
          </p>
        </Link>
      </div>
    </AdminContentShell>
  );
};

export default AdminContentHome;
