import { api } from '@/config/api';
import { CommuniqueService } from '@/lib/communique/service';
import { PerformanceService } from '@/lib/performance/service';
import { RehearsalService } from '@/lib/rehearsal/service';
import { ReportService } from '@/lib/report/service';

import type { Department } from '../departments/service';
import { DepartmentService } from '../departments/service';
import type { LINKED_ENTITY_TYPES } from './linked-entities';

export type LinkedEntityType = (typeof LINKED_ENTITY_TYPES)[number];

export type LinkedEntityOption = {
  id: number;
  label: string;
};

export async function fetchLinkedEntityOptions(
  type: LinkedEntityType,
): Promise<LinkedEntityOption[]> {
  switch (type) {
    case 'Communique': {
      const rows = await CommuniqueService.getAllCommuniques();
      return rows.map((c) => ({ id: c.id, label: c.title }));
    }
    case 'Performance': {
      const res = await PerformanceService.fetchPerformances(
        {},
        { page: 1, limit: 100 },
      );
      return res.data.map((p) => ({
        id: Number(p.id),
        label: `${String(p.type ?? 'Performance')} — ${String(p.date)}`,
      }));
    }
    case 'Rehearsal': {
      const res = await RehearsalService.fetchRehearsals({
        page: 1,
        limit: 100,
      });
      return res.data.map((r: any) => ({
        id: Number(r.id),
        label: r.title ?? r.date ?? `Rehearsal #${r.id}`,
      }));
    }
    case 'Song': {
      const res = await api.get('/songs', { params: { page: 1, limit: 500 } });
      const rows: any[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.items)
            ? res.data.items
            : [];
      return rows.map((s) => ({
        id: Number(s.id),
        label: s.title ?? `Song #${s.id}`,
      }));
    }
    case 'Report': {
      const rows = await ReportService.getAllReports();
      return rows.map((r: any) => ({
        id: Number(r.id),
        label: r.title ?? `Report #${r.id}`,
      }));
    }
    case 'User': {
      const res = await api.get('/users', { params: { page: 1, limit: 200 } });
      const rows: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      return rows.map((u) => ({
        id: Number(u.id),
        label: u.fullName ?? u.name ?? u.email ?? `User #${u.id}`,
      }));
    }
    case 'Department': {
      const rows: Department[] = await DepartmentService.listDepartments();
      return rows.map((d) => ({ id: d.id, label: d.name }));
    }
    case 'Album': {
      const res = await api.get<Array<{ id: number; label: string }>>(
        '/content/linked-options/albums',
      );
      return Array.isArray(res.data)
        ? res.data.map((r) => ({
            id: Number(r.id),
            label: r.label || `Album #${r.id}`,
          }))
        : [];
    }
    case 'Playlist': {
      const res = await api.get<Array<{ id: number; label: string }>>(
        '/content/linked-options/playlists',
      );
      return Array.isArray(res.data)
        ? res.data.map((r) => ({
            id: Number(r.id),
            label: r.label || `Playlist #${r.id}`,
          }))
        : [];
    }
    default: {
      return [];
    }
  }
}
