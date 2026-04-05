/* eslint-disable import/no-extraneous-dependencies */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { jsPDF as JSPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { api } from '@/config/api';
import { logError } from '@/utils/logger';

import {
  appendScopedExportParams,
  extractTransactionsList,
  type PaginatedTransactions,
  shouldExportAllTransactions,
  TransactionService,
} from './service';
import type {
  CreateTransactionDto,
  DailyContributionFilters,
  Transaction,
  TransactionFilters,
  TransactionStats,
} from './types';
import { Currency, TransactionType } from './types';

const DEFAULT_FC_TO_USD_RATE = 2800;

const translateCategoryToFrench = (category: string): string => {
  const translations: Record<string, string> = {
    DAILY: 'Quotidien',
    SPECIAL: 'Spécial',
    DONATION: 'Donation',
    OTHER: 'Autre',
    CHARITY: 'Charité',
    MAINTENANCE: 'Maintenance',
    TRANSPORT: 'Transport',
    SPECIAL_ASSISTANCE: 'Assistance Spéciale',
    COMMUNICATION: 'Communication',
    RESTAURATION: 'Restauration',
    ILLNESS: 'Maladie',
    BIRTH: 'Naissance',
    MARRIAGE: 'Mariage',
    DEATH: 'Décès',
    BUY_DEVICES: "Achat d'Équipements",
    COMMITTEE: 'Comité',
    SORTIE: 'Sortie',
  };

  return translations[category] || category;
};

function contributorDisplayName(transaction: Transaction): string {
  if (transaction.contributor) {
    const first = transaction.contributor.firstName || '';
    const last = transaction.contributor.lastName || '';
    const name = `${last} ${first}`.trim();
    if (name) return name;
  }
  const external = transaction.externalContributorName?.trim();
  if (external) return external;
  return 'Anonyme';
}

function aggregateAmountsByTypeAndCurrency(transactions: Transaction[]) {
  const totals = {
    incomeUSD: 0,
    incomeFC: 0,
    expenseUSD: 0,
    expenseFC: 0,
  };

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    const isUSD = t.currency === Currency.USD;
    if (t.type === TransactionType.INCOME) {
      if (isUSD) totals.incomeUSD += amount;
      else totals.incomeFC += amount;
    } else if (isUSD) totals.expenseUSD += amount;
    else totals.expenseFC += amount;
  }

  return totals;
}

export const useTransactions = (
  filters: TransactionFilters,
): UseQueryResult<PaginatedTransactions> => {
  const {
    page: pageFromFilters = 1,
    limit: limitFromFilters = 10,
    ...rest
  } = filters;

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () =>
      TransactionService.fetchTransactions(rest, {
        page: pageFromFilters,
        limit: limitFromFilters,
      }),
    staleTime: 1000 * 60,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionDto) =>
      TransactionService.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
    },
  });
};

export const useExportTransactions = () => {
  return useMutation({
    mutationFn: async (params: {
      filters: TransactionFilters;
      exportAll?: boolean;
      conversionRate?: number;
    }) => {
      const conversionRate = params.conversionRate || DEFAULT_FC_TO_USD_RATE;
      const shouldExportAll = shouldExportAllTransactions(params.filters);

      const queryParams = new URLSearchParams();
      appendScopedExportParams(queryParams, params.filters, shouldExportAll);
      queryParams.append('page', '1');
      queryParams.append('limit', '999999');

      const transactionResponse = await api.get(
        `/transactions?${queryParams.toString()}`,
      );

      const doc = new JSPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const margin = 15;

      try {
        const logoResponse = await fetch('/assets/images/Wlogo.png');
        const blob = await logoResponse.blob();
        const reader = new FileReader();

        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        doc.addImage(base64, 'PNG', 15, 15, 35, 20);
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(
        'COMMUNAUTE DES EGLISES LIBRES DE PENTECOTE EN AFRIQUE',
        margin + 30,
        20,
      );
      doc.text('5è CELPA SALEM GOMA', margin + 30, 25);
      doc.text('CHORALE LA NOUVELLE JERUSALEM', margin + 30, 30);

      doc.setFontSize(12);
      doc.text('TRANSACTIONS', margin, 40);

      let frenchDateHeader = '';
      if (shouldExportAll) {
        frenchDateHeader = `${format(parseISO(new Date().toISOString()), 'MM/yyyy', { locale: fr })}`;
      } else if (params.filters.startDate && params.filters.endDate) {
        frenchDateHeader = `Période : ${format(parseISO(params.filters.startDate), 'dd/MM/yyyy', { locale: fr })} à ${format(parseISO(params.filters.endDate), 'dd/MM/yyyy', { locale: fr })}`;
      }

      doc.setFontSize(10);
      doc.text(frenchDateHeader, margin, 45);

      const rawList = extractTransactionsList(transactionResponse.data);
      const totals = aggregateAmountsByTypeAndCurrency(rawList);

      const tableRows = rawList.map((transaction) => [
        contributorDisplayName(transaction),
        transaction.type === TransactionType.INCOME ? 'Revenu' : 'Dépense',
        translateCategoryToFrench(transaction.category),
        transaction.subcategory
          ? translateCategoryToFrench(transaction.subcategory)
          : '-',
        transaction.amount.toFixed(2),
        transaction.currency === Currency.USD ? 'USD' : 'FC',
      ]);

      const totalIncomeFCInUSD = totals.incomeFC / conversionRate;
      const totalExpenseFCInUSD = totals.expenseFC / conversionRate;
      const totalIncomeInUSD = totals.incomeUSD + totalIncomeFCInUSD;
      const totalExpenseInUSD = totals.expenseUSD + totalExpenseFCInUSD;

      autoTable(doc, {
        startY: 48,
        head: [
          [
            'Contributeur',
            'Type',
            'Catégorie',
            'Sous-catégorie',
            'Montant',
            'Devise',
          ],
        ],
        body: tableRows,
        foot: [
          ['', '', '', 'REVENU TOTAL', `${totals.incomeUSD.toFixed(2)}`, '$'],
          ['', '', '', '', `${totals.incomeFC.toFixed(2)}`, 'FC'],
          ['', '', '', '', `${totalIncomeFCInUSD.toFixed(2)}`, '$'],
          [
            '',
            '',
            '',
            'DÉPENSE TOTALE',
            `${totals.expenseUSD.toFixed(2)}`,
            '$',
          ],
          ['', '', '', '', `${totals.expenseFC.toFixed(2)}`, 'FC'],
          ['', '', '', '', `${totalExpenseFCInUSD.toFixed(2)}`, '$'],
          [
            '',
            '',
            '',
            'SOLDE',
            `${(totals.incomeUSD - totals.expenseUSD).toFixed(2)}`,
            '$',
          ],
          [
            '',
            '',
            '',
            '',
            `${(totals.incomeFC - totals.expenseFC).toFixed(2)}`,
            'FC',
          ],
          [
            '',
            '',
            '',
            '',
            `${(totalIncomeInUSD - totalExpenseInUSD).toFixed(2)}`,
            '$',
          ],
          ['', '', '', 'Taux de conversion', `1$= ${conversionRate} FC`, ''],
        ],
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 0.5,
          lineColor: [0, 0, 0],
          lineWidth: 0,
          textColor: [0, 0, 0],
          halign: 'left',
        },
        headStyles: {
          fillColor: [43, 53, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 9,
          cellPadding: 0.5,
          lineWidth: 0,
        },
        footStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'normal',
          fontSize: 9,
          cellPadding: 0.5,
          lineWidth: 0,
          halign: 'right',
        },
        alternateRowStyles: {
          fillColor: [188, 188, 188],
          textColor: [0, 0, 0],
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 48, halign: 'left' },
          1: { cellWidth: 25, halign: 'left' },
          2: { cellWidth: 30, halign: 'left' },
          3: { cellWidth: 30, halign: 'left' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 20, halign: 'left' },
        },
        didParseCell: (hookData) => {
          const newStyles = { ...hookData.cell.styles };
          if (hookData.section === 'head') {
            if (hookData.column.index === 4) {
              newStyles.halign = 'right';
            }
          } else if (hookData.section === 'foot') {
            if (hookData.column.index === 4 && hookData.row.index < 9) {
              newStyles.halign = 'right';
            } else if (hookData.column.index === 5 && hookData.row.index < 9) {
              newStyles.halign = 'left';
            } else if (hookData.row.index === 9) {
              newStyles.halign = 'left';
            } else {
              newStyles.halign = 'left';
            }
            if (hookData.row.index % 2 === 1) {
              newStyles.fillColor = [91, 227, 248];
            }
            if (hookData.row.index >= 6 && hookData.row.index <= 8) {
              newStyles.fontStyle = 'bold';
            }
          } else {
            newStyles.textColor = [0, 0, 0];
            if (hookData.column.index !== 4) {
              newStyles.halign = 'left';
            }
          }
          Object.assign(hookData.cell.styles, newStyles);
        },
        margin: { top: 2, left: margin, bottom: margin, right: margin },
        showFoot: 'lastPage',
      });

      const filename = shouldExportAll
        ? `transactions_${format(parseISO(new Date().toISOString()), 'MMMM-d-yyyy').replace(/\//g, '-')}.pdf`
        : `transactions_${format(parseISO(params.filters.startDate ?? new Date().toISOString()), 'MMMM-d-yyyy')}_${format(parseISO(params.filters.endDate ?? new Date().toISOString()), 'MMMM-d-yyyy')}.pdf`;

      doc.save(filename);
    },
  });
};

export function useDailyContributions(
  filters: DailyContributionFilters,
  pagination: { page: number; limit: number },
) {
  return useQuery({
    queryKey: ['daily-contributions', filters, pagination],
    queryFn: () =>
      TransactionService.fetchDailyContributions(filters, pagination),
    staleTime: 1000 * 60,
  });
}

export const useTransactionStats = (
  filters?: TransactionFilters,
): UseQueryResult<TransactionStats> => {
  return useQuery({
    queryKey: ['transactionStats', filters],
    queryFn: () => TransactionService.fetchStats(filters),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
};

export const useTotalBalance = () => {
  return useQuery({
    queryKey: ['totalBalance'],
    queryFn: async () => {
      try {
        const stats = await TransactionService.fetchStats();
        return {
          usd: stats.usd.netRevenue,
          fc: stats.fc.netRevenue,
        };
      } catch (error) {
        logError(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
};

export const useExportTransactionsPDF = () => {
  return useMutation({
    mutationFn: async (params: {
      filters: TransactionFilters;
      exportAll?: boolean;
      conversionRate?: number;
    }) => {
      const shouldExportAll = shouldExportAllTransactions(params.filters);

      if (
        !shouldExportAll &&
        !params.filters.startDate &&
        !params.filters.endDate
      ) {
        throw new Error('At least one date must be specified for the report');
      }

      const queryParams = new URLSearchParams();
      appendScopedExportParams(queryParams, params.filters, shouldExportAll);
      queryParams.append('page', '1');
      queryParams.append('limit', '999999');

      const { data: reportData } = await api.get('/transactions', {
        params: queryParams,
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      });

      const blob = new Blob([reportData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const getDateRangeSuffix = () => {
        if (shouldExportAll) {
          return 'all';
        }

        if (params.filters.startDate && params.filters.endDate) {
          const start = format(
            parseISO(params.filters.startDate),
            'MMM d, yyyy',
          );
          const end = format(parseISO(params.filters.endDate), 'MMM d, yyyy');
          return `${start}_to_${end}`;
        }
        if (params.filters.startDate) {
          return format(parseISO(params.filters.startDate), 'MMM d, yyyy');
        }
        return 'all';
      };

      link.setAttribute(
        'download',
        `transaction-report-${getDateRangeSuffix()}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
};
