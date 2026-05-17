export type ContentListParams = {
  page?: number;
  limit?: number;
  contentTypeId?: number;
  status?: string;
  visibility?: string;
  audienceDepartmentId?: number;
  linkedEntityType?: string;
  linkedEntityId?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  search?: string;
};

export const contentKeys = {
  all: ['content'] as const,
  types: () => [...contentKeys.all, 'types'] as const,
  type: (id: number) => [...contentKeys.types(), id] as const,
  entries: (params: ContentListParams) =>
    [...contentKeys.all, 'entries', params] as const,
  entry: (id: number) => [...contentKeys.all, 'entry', id] as const,
};
