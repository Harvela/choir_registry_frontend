'use client';

import { Plus, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { uploadContentImage } from '@/lib/content/api';
import { resolveUploadAssetUrl } from '@/lib/content/uploadUrls';

type GalleryUploadFieldProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

const GalleryUploadField: React.FC<GalleryUploadFieldProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length || disabled || busy) return;
    setBusy(true);
    try {
      const images = Array.from(files).filter(
        (file): file is File =>
          !!file &&
          typeof file.type === 'string' &&
          file.type.startsWith('image/'),
      );
      const urls = await Promise.all(
        images.map((file) => uploadContentImage(file)),
      );
      onChange([...value, ...urls]);
    } catch {
      toast.error('Échec du téléversement');
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap gap-3">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative size-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveUploadAssetUrl(url)}
              alt=""
              className="size-full object-cover"
            />
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label="Retirer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="flex size-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50"
        >
          <Plus className="size-8" />
          <span className="mt-1 text-xs font-medium">
            {busy ? '…' : 'Ajouter'}
          </span>
        </button>
      </div>
      <p className="text-xs text-slate-500">
        JPG, PNG, WebP ou GIF — plusieurs fichiers à la fois.
      </p>
    </div>
  );
};

export default GalleryUploadField;
