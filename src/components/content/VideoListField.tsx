'use client';

import { Plus, Trash2, Upload } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { uploadContentVideo } from '@/lib/content/api';
import type { VideoListItemDto } from '@/lib/content/types';
import { extractYouTubeId } from '@/lib/content/youtube';

import ImageUploadField from './ImageUploadField';

export type VideoListFieldProps = {
  value: VideoListItemDto[];
  onChange: (rows: VideoListItemDto[]) => void;
  disabled?: boolean;
  label?: string;
};

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `vid-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyRow(): VideoListItemDto {
  return {
    id: newId(),
    title: '',
    thumbnail: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    source: 'youtube',
    videoId: '',
    videoUrl: '',
  };
}

export function normalizeVideoList(raw: unknown): VideoListItemDto[] {
  if (!Array.isArray(raw)) return [];
  const out: VideoListItemDto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title : '';
    const thumbnail = typeof o.thumbnail === 'string' ? o.thumbnail : '';
    const publishedAt =
      typeof o.publishedAt === 'string'
        ? o.publishedAt
        : new Date().toISOString().slice(0, 10);
    const videoId = typeof o.videoId === 'string' ? o.videoId : '';
    const videoUrl = typeof o.videoUrl === 'string' ? o.videoUrl : '';
    let source = o.source as VideoListItemDto['source'];
    if (source !== 'youtube' && source !== 'url' && source !== 'upload') {
      source = videoId ? 'youtube' : videoUrl ? 'url' : 'youtube';
    }
    const id = typeof o.id === 'string' && o.id ? o.id : newId();
    out.push({
      id,
      title,
      thumbnail,
      publishedAt,
      source,
      videoId: source === 'youtube' ? videoId : undefined,
      videoUrl: source !== 'youtube' ? videoUrl : undefined,
    });
  }
  return out;
}

const VideoListField: React.FC<VideoListFieldProps> = ({
  value,
  onChange,
  disabled,
  label,
}) => {
  const rows = value.length ? value : [];
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const setRow = (idx: number, patch: Partial<VideoListItemDto>) => {
    const next = rows.map((r, i) => {
      if (i !== idx) return { ...r };
      const merged = { ...r, ...patch };
      if (patch.source) {
        if (patch.source === 'youtube') {
          merged.videoUrl = undefined;
        } else {
          merged.videoId = undefined;
        }
      }
      return merged;
    });
    onChange(next);
  };

  const addRow = () => onChange([...rows, emptyRow()]);
  const removeRow = (idx: number) => onChange(rows.filter((_, i) => i !== idx));

  const handleVideoUpload = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadContentVideo(file);
      setRow(idx, { source: 'upload', videoUrl: url, videoId: undefined });
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-3">
      {label ? (
        <span className="block text-sm font-medium text-slate-700">
          {label}
        </span>
      ) : null}
      <div className="space-y-4">
        {rows.map((row, idx) => (
          <div
            key={row.id || idx}
            className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Vidéo {idx + 1}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeRow(idx)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Retirer
              </button>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="shrink-0 sm:w-48">
                <ImageUploadField
                  label="Vignette"
                  value={row.thumbnail}
                  disabled={disabled}
                  onChange={(url) => setRow(idx, { thumbnail: url })}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Titre</span>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    value={row.title}
                    disabled={disabled}
                    onChange={(e) => setRow(idx, { title: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">
                    Date de publication
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    value={
                      row.publishedAt.includes('T')
                        ? row.publishedAt.slice(0, 10)
                        : row.publishedAt.slice(0, 10)
                    }
                    disabled={disabled}
                    onChange={(e) =>
                      setRow(idx, { publishedAt: e.target.value })
                    }
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Source</span>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                    value={row.source}
                    disabled={disabled}
                    onChange={(e) =>
                      setRow(idx, {
                        source: e.target.value as VideoListItemDto['source'],
                      })
                    }
                  >
                    <option value="youtube">YouTube</option>
                    <option value="url">URL vidéo</option>
                    <option value="upload">Fichier uploadé</option>
                  </select>
                </label>
                {row.source === 'youtube' ? (
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">
                      YouTube (ID ou lien)
                    </span>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                      value={row.videoId ?? ''}
                      disabled={disabled}
                      placeholder="dQw4w9WgXcQ ou https://youtube.com/watch?v=…"
                      onChange={(e) =>
                        setRow(idx, {
                          videoId: extractYouTubeId(e.target.value),
                        })
                      }
                    />
                  </label>
                ) : null}
                {row.source === 'url' ? (
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">
                      URL de la vidéo
                    </span>
                    <input
                      type="url"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                      value={row.videoUrl ?? ''}
                      disabled={disabled}
                      placeholder="https://…/video.mp4"
                      onChange={(e) =>
                        setRow(idx, { videoUrl: e.target.value })
                      }
                    />
                  </label>
                ) : null}
                {row.source === 'upload' ? (
                  <div className="space-y-2">
                    <span className="block text-sm font-medium text-slate-700">
                      Fichier vidéo
                    </span>
                    <input
                      ref={(el) => {
                        fileRefs.current[idx] = el;
                      }}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/ogg"
                      className="hidden"
                      disabled={disabled || uploadingIdx === idx}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleVideoUpload(idx, file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      disabled={disabled || uploadingIdx === idx}
                      onClick={() => fileRefs.current[idx]?.click()}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Upload className="size-4" aria-hidden />
                      {uploadingIdx === idx
                        ? 'Envoi…'
                        : row.videoUrl
                          ? 'Remplacer la vidéo'
                          : 'Choisir un fichier'}
                    </button>
                    {row.videoUrl ? (
                      <p className="truncate text-xs text-slate-500">
                        {row.videoUrl}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={addRow}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-700 disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden />
        Ajouter une vidéo
      </button>
    </div>
  );
};

export default VideoListField;
