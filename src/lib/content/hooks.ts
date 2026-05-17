import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addContentField,
  approveContentEntry,
  createContentEntry,
  createContentType,
  deleteContentField,
  fetchContentEntries,
  fetchContentEntry,
  fetchContentType,
  fetchContentTypes,
  publishContentEntry,
  updateContentEntry,
  updateContentField,
  updateContentType,
} from './api';
import { fetchLinkedEntityOptions } from './linked-entity-options';
import { contentKeys, type ContentListParams } from './query-keys';

export function useContentTypes() {
  return useQuery({
    queryKey: contentKeys.types(),
    queryFn: fetchContentTypes,
  });
}

export function useContentType(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: id != null ? contentKeys.type(id) : ['content', 'type', 'nil'],
    queryFn: () => fetchContentType(id as number),
    enabled: enabled && id != null,
  });
}

export function useContentEntries(params: ContentListParams) {
  return useQuery({
    queryKey: contentKeys.entries(params),
    queryFn: () => fetchContentEntries(params),
    placeholderData: (prev) => prev,
  });
}

export function useContentEntry(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: id != null ? contentKeys.entry(id) : ['content', 'entry', 'nil'],
    queryFn: () => fetchContentEntry(id as number),
    enabled: enabled && id != null,
  });
}

export function useLinkedEntityOptions(type: string | undefined) {
  return useQuery({
    queryKey: ['content', 'linkedEntities', type ?? 'nil'],
    queryFn: () => fetchLinkedEntityOptions(type as any),
    enabled: type != null,
  });
}

export function useCreateContentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createContentType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.types() }).catch(() => {});
    },
  });
}

export function useUpdateContentType(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name?: string;
      code?: string;
      description?: string | null;
      isActive?: boolean;
      allowedLinkedEntityTypes?: string[] | null;
    }) => updateContentType(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.types() }).catch(() => {});
      qc.invalidateQueries({ queryKey: contentKeys.type(id) }).catch(() => {});
    },
  });
}

export function useAddContentField(typeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof addContentField>[1]) =>
      addContentField(typeId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.type(typeId) }).catch(
        () => {},
      );
    },
  });
}

export function useUpdateContentField(fieldId: number, typeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof updateContentField>[1]) =>
      updateContentField(fieldId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.type(typeId) }).catch(
        () => {},
      );
    },
  });
}

/** Patch any field on this content type (e.g. toggling showInTable in a list). */
export function useUpdateAnyContentField(typeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      fieldId: number;
      body: Parameters<typeof updateContentField>[1];
    }) => updateContentField(vars.fieldId, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.type(typeId) }).catch(
        () => {},
      );
    },
  });
}

export function useDeleteContentField(typeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: number) => deleteContentField(fieldId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.type(typeId) }).catch(
        () => {},
      );
    },
  });
}

export function useCreateContentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createContentEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all }).catch(() => {});
    },
  });
}

export function useUpdateContentEntry(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof updateContentEntry>[1]) =>
      updateContentEntry(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.entry(id) }).catch(() => {});
      qc.invalidateQueries({ queryKey: contentKeys.all }).catch(() => {});
    },
  });
}

export function useApproveContentEntry(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => approveContentEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.entry(id) }).catch(() => {});
      qc.invalidateQueries({ queryKey: contentKeys.all }).catch(() => {});
    },
  });
}

export function usePublishContentEntry(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publishContentEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.entry(id) }).catch(() => {});
      qc.invalidateQueries({ queryKey: contentKeys.all }).catch(() => {});
    },
  });
}
