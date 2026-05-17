import { api, API_URL } from '@/config/api';

import type { ContentListParams } from './query-keys';
import { resolveUploadAssetUrl } from './uploadUrls';
import type {
  ContentEntryDto,
  ContentFieldDefinitionDto,
  ContentTypeDto,
  PaginatedContentsDto,
} from './types';

export async function fetchContentTypes(): Promise<ContentTypeDto[]> {
  const { data } = await api.get<ContentTypeDto[]>('/content/types');
  return data;
}

export async function fetchContentType(
  id: number,
): Promise<ContentTypeDto & { fieldDefinitions: ContentFieldDefinitionDto[] }> {
  const { data } = await api.get(`/content/types/${id}`);
  return data;
}

export async function createContentType(
  body: Partial<ContentTypeDto> & { name: string; code: string },
): Promise<ContentTypeDto> {
  const { data } = await api.post<ContentTypeDto>('/content/types', body);
  return data;
}

export async function updateContentType(
  id: number,
  body: Partial<ContentTypeDto>,
): Promise<ContentTypeDto> {
  const { data } = await api.patch<ContentTypeDto>(
    `/content/types/${id}`,
    body,
  );
  return data;
}

export async function addContentField(
  typeId: number,
  body: {
    fieldKey: string;
    fieldType: string;
    label?: string;
    required?: boolean;
    sortOrder?: number;
    showInTable?: boolean;
    validation?: Record<string, unknown>;
  },
): Promise<ContentFieldDefinitionDto> {
  const { data } = await api.post(`/content/types/${typeId}/fields`, body);
  return data;
}

export async function updateContentField(
  fieldId: number,
  body: Partial<{
    fieldType: string;
    label: string | null;
    required: boolean;
    sortOrder: number;
    showInTable: boolean;
    validation: Record<string, unknown> | null;
  }>,
): Promise<ContentFieldDefinitionDto> {
  const { data } = await api.patch(`/content/fields/${fieldId}`, body);
  return data;
}

export async function deleteContentField(fieldId: number): Promise<void> {
  await api.delete(`/content/fields/${fieldId}`);
}

export async function fetchContentEntries(
  params: ContentListParams,
): Promise<PaginatedContentsDto> {
  const { data } = await api.get<PaginatedContentsDto>('/content', {
    params,
  });
  return data;
}

export async function fetchContentEntry(id: number): Promise<ContentEntryDto> {
  const { data } = await api.get<ContentEntryDto>(`/content/${id}`);
  return data;
}

export async function createContentEntry(body: {
  contentTypeId: number;
  linkedEntityType: string;
  linkedEntityId: number;
  fieldValues: Record<string, unknown>;
  audienceDepartmentId?: number | null;
  visibility?: string;
}): Promise<ContentEntryDto> {
  const { data } = await api.post<ContentEntryDto>('/content', body);
  return data;
}

export async function updateContentEntry(
  id: number,
  body: {
    fieldValues?: Record<string, unknown>;
    status?: string;
    visibility?: string;
    audienceDepartmentId?: number | null;
  },
): Promise<ContentEntryDto> {
  const { data } = await api.patch<ContentEntryDto>(`/content/${id}`, body);
  return data;
}

export async function approveContentEntry(
  id: number,
): Promise<ContentEntryDto> {
  const { data } = await api.post<ContentEntryDto>(`/content/${id}/approve`);
  return data;
}

export async function publishContentEntry(
  id: number,
): Promise<ContentEntryDto> {
  const { data } = await api.post<ContentEntryDto>(`/content/${id}/publish`);
  return data;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const { accessToken } = JSON.parse(raw);
    return accessToken ?? null;
  } catch {
    return null;
  }
}

export async function uploadContentImage(file: File): Promise<string> {
  const token = getStoredAccessToken();
  const form = new FormData();
  form.append('file', file);
  const url = `${API_URL}/upload/content-image`;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Upload failed');
  }
  const json = (await res.json()) as { url: string };
  return resolveUploadAssetUrl(json.url);
}

export async function uploadContentVideo(file: File): Promise<string> {
  const token = getStoredAccessToken();
  const form = new FormData();
  form.append('file', file);
  const url = `${API_URL}/upload/content-video`;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Upload failed');
  }
  const json = (await res.json()) as { url: string };
  return resolveUploadAssetUrl(json.url);
}
