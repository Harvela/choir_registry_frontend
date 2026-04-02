import { api } from '@/config/api';

import type {
  CreateTransactionDto,
  DailyContributionFilters,
  DailyContributionsResponse,
  Transaction,
  TransactionFilters,
  TransactionStats,
} from './types';

interface QueryParams extends TransactionFilters {
  page: number;
  limit: number;
}

/** Drop undefined / null / '' so axios query strings stay clean. */
export function omitEmptyParams<T extends Record<string, unknown>>(
  obj: T,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  ) as Record<string, string | number | boolean>;
}

/** Map `/transactions/stats` JSON to `TransactionStats`. */
export function normalizeTransactionStatsPayload(
  raw: Record<string, unknown> | null | undefined,
): TransactionStats {
  const totals = raw?.totals as
    | {
        income?: { usd?: unknown; fc?: unknown };
        expense?: { usd?: unknown; fc?: unknown };
        solde?: { usd?: unknown; fc?: unknown };
      }
    | undefined;

  return {
    usd: {
      totalIncome: Number(totals?.income?.usd ?? 0),
      totalExpense: Number(totals?.expense?.usd ?? 0),
      netRevenue: Number(totals?.solde?.usd ?? 0),
    },
    fc: {
      totalIncome: Number(totals?.income?.fc ?? 0),
      totalExpense: Number(totals?.expense?.fc ?? 0),
      netRevenue: Number(totals?.solde?.fc ?? 0),
    },
    dailyTotalUSD: Number(raw?.dailyTotalUSD ?? 0),
    dailyTotalFC: Number(raw?.dailyTotalFC ?? 0),
  };
}

export type PaginatedTransactions = {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
};

/**
 * API may return `[transactions, total]` or `{ data, total, page, limit }`.
 */
export function coercePaginatedTransactions(
  data: unknown,
  page: number,
  limit: number,
): PaginatedTransactions {
  if (Array.isArray(data) && data.length === 2) {
    const [transactions, total] = data;
    return {
      data: (transactions as Transaction[]) ?? [],
      total: Number(total) || 0,
      page,
      limit,
    };
  }
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as PaginatedTransactions).data)
  ) {
    const d = data as PaginatedTransactions;
    return {
      data: d.data,
      total: Number(d.total) || 0,
      page: Number(d.page) || page,
      limit: Number(d.limit) || limit,
    };
  }
  return { data: [], total: 0, page, limit };
}

/** Raw list for export / PDF builders (tuple or wrapped shape). */
export function extractTransactionsList(data: unknown): Transaction[] {
  if (Array.isArray(data) && data.length === 2) {
    const [first] = data;
    return Array.isArray(first) ? (first as Transaction[]) : [];
  }
  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Transaction[] }).data;
  }
  return [];
}

const EXPORT_SCOPED_KEYS = [
  'startDate',
  'endDate',
  'type',
  'category',
  'search',
] as const satisfies readonly (keyof TransactionFilters)[];

export function shouldExportAllTransactions(
  filters: TransactionFilters,
): boolean {
  return EXPORT_SCOPED_KEYS.every((key) => {
    const v = filters[key];
    return v === undefined || v === null || v === '';
  });
}

export function appendScopedExportParams(
  params: URLSearchParams,
  filters: TransactionFilters,
  exportAll: boolean,
): void {
  if (exportAll) return;
  for (const key of EXPORT_SCOPED_KEYS) {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
}

export const TransactionService = {
  fetchTransactions: async (
    filters: TransactionFilters,
    pagination: { page: number; limit: number },
  ): Promise<PaginatedTransactions> => {
    const queryParams: QueryParams = {
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    };

    const params = omitEmptyParams(
      queryParams as unknown as Record<string, unknown>,
    );

    const { data } = await api.get('/transactions', { params });
    return coercePaginatedTransactions(
      data,
      pagination.page,
      pagination.limit,
    );
  },

  createTransaction: async (
    data: CreateTransactionDto,
  ): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  exportTransactions: async (filters: TransactionFilters): Promise<void> => {
    const response = await api.get('/transactions', {
      params: omitEmptyParams({
        ...filters,
        limit: 1000,
      } as Record<string, unknown>),
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `transactions-${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  fetchStats: async (
    filters?: TransactionFilters,
  ): Promise<TransactionStats> => {
    const params = filters
      ? omitEmptyParams(filters as Record<string, unknown>)
      : undefined;

    const { data } = await api.get('/transactions/stats', { params });
    return normalizeTransactionStatsPayload(
      data as Record<string, unknown> | undefined,
    );
  },

  fetchDailyContributions: async (
    filters: DailyContributionFilters,
    pagination: { page: number; limit: number },
  ) => {
    const { data } = await api.get<DailyContributionsResponse>(
      '/transactions/daily',
      {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
        },
      },
    );

    if (Array.isArray(data) && data.length === 2) {
      const [contributions, total] = data;
      return {
        data: contributions || [],
        total: total || 0,
        page: pagination.page,
        limit: pagination.limit,
      };
    }

    return data;
  },
};
