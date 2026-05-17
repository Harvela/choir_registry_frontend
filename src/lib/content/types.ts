export type ContentTypeDto = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  allowedLinkedEntityTypes: string[] | null;
  createdAt: string;
  updatedAt: string;
  fieldDefinitions?: ContentFieldDefinitionDto[];
};

export type ContentFieldDefinitionDto = {
  id: number;
  fieldKey: string;
  fieldType: string;
  label: string | null;
  required: boolean;
  sortOrder: number;
  showInTable?: boolean;
  validation: Record<string, unknown> | null;
};

export type ContentEntryDto = {
  id: number;
  contentType?: ContentTypeDto & { id?: number };
  fieldValues: Record<string, unknown>;
  linkedEntityType: string;
  linkedEntityId: number;
  status: string;
  visibility: string;
  audienceDepartment?: { id: number } | null;
  audienceDepartmentId?: number | null;
  authorId?: number | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedContentsDto = {
  items: ContentEntryDto[];
  total: number;
  page: number;
  limit: number;
};

/** Content field type `profile_list` — e.g. department responsables */
export type ProfileListItemDto = {
  name: string;
  roleTitle: string;
  imageUrl: string;
};

export type VideoListItemDto = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  source: 'youtube' | 'url' | 'upload';
  videoId?: string;
  videoUrl?: string;
};
