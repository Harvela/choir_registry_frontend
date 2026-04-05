import React, { useMemo } from 'react';
import { FaEdit, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

import type { LouadoShift } from '@/lib/louado/types';

interface LouadoScheduleTableProps {
  shifts: LouadoShift[];
  isLoading?: boolean;
  error?: string | null;
  canManage?: boolean;
  disableManageActions?: boolean;
  onCreate?: () => void;
  onEdit?: (shift: LouadoShift) => void;
  onDelete?: (shift: LouadoShift) => void;
  onExport?: () => void;
  /** When true, hides the title and action buttons (handled by parent) */
  hideHeader?: boolean;
}

const formatDateForCell = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const renderName = (shift?: LouadoShift['louange']) => {
  if (!shift) return '—';
  const names = [shift.firstName, shift.lastName]
    .filter(Boolean)
    .map((value) => value?.toUpperCase());
  return names.length ? names.join(' ') : '—';
};

export const LouadoScheduleTable: React.FC<LouadoScheduleTableProps> = ({
  shifts,
  isLoading = false,
  error = null,
  canManage = false,
  disableManageActions = false,
  onEdit,
  onDelete,
}) => {
  const sortedShifts = useMemo(
    () =>
      [...shifts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [shifts],
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FaExclamationTriangle className="text-lg" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-emerald-200 shadow-sm">
        <table className="min-w-full divide-y divide-emerald-200">
          <thead>
            <tr className="bg-emerald-700 text-xs uppercase tracking-widest text-emerald-50 md:text-sm">
              <th className="px-4 py-3 text-center align-middle">Date</th>
              <th className="px-4 py-3 text-center align-middle">Louange</th>
              <th className="px-4 py-3 text-center align-middle">Adoration</th>
              <th className="px-4 py-3 text-left align-middle">Obs</th>
              {canManage && (
                <th className="px-4 py-3 text-right align-middle">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-emerald-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-4 py-8 text-center align-middle text-sm text-emerald-700"
                >
                  Chargement du calendrier Louado...
                </td>
              </tr>
            ) : sortedShifts.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="px-4 py-10 text-center align-middle text-sm text-emerald-700"
                >
                  Aucun shift Louado enregistré pour la période sélectionnée.
                </td>
              </tr>
            ) : (
              sortedShifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-emerald-100 text-sm text-emerald-900 transition-colors even:bg-emerald-100/60 hover:bg-emerald-100"
                >
                  <td className="px-4 py-3 text-center align-middle font-semibold uppercase tracking-wide">
                    {formatDateForCell(shift.date)}
                  </td>
                  <td className="px-4 py-3 text-center align-middle font-semibold">
                    {renderName(shift.louange)}
                  </td>
                  <td className="px-4 py-3 text-center align-middle font-semibold">
                    {renderName(shift.adoration)}
                  </td>
                  <td className="px-4 py-3 text-left align-middle text-sm text-emerald-800">
                    {shift.notes || ''}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right align-middle text-sm">
                      <div className="flex items-center justify-end gap-2 text-emerald-700">
                        <button
                          className={`rounded-md border border-transparent p-2 transition-colors ${
                            disableManageActions
                              ? 'cursor-not-allowed text-emerald-400'
                              : 'hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                          onClick={() => {
                            if (!disableManageActions) {
                              onEdit?.(shift);
                            }
                          }}
                          disabled={disableManageActions}
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={`rounded-md border border-transparent p-2 transition-colors ${
                            disableManageActions
                              ? 'cursor-not-allowed text-red-300'
                              : 'hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                          }`}
                          onClick={() => {
                            if (!disableManageActions) {
                              onDelete?.(shift);
                            }
                          }}
                          disabled={disableManageActions}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LouadoScheduleTable;
