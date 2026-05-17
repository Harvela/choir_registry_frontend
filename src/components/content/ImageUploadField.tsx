'use client';

import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { uploadContentImage } from '@/lib/content/api';
import { resolveUploadAssetUrl } from '@/lib/content/uploadUrls';

type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
};

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  disabled,
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || disabled || busy) return;
    setBusy(true);
    try {
      const url = await uploadContentImage(file);
      onChange(url);
    } catch {
      toast.error('Échec du téléversement');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      ) : null}
      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-36 w-full max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveUploadAssetUrl(value)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Aucune image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onFile}
            disabled={disabled || busy}
          />
          <button
            type="button"
            disabled={disabled || busy}
            onClick={pick}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? 'Téléversement…' : value ? 'Remplacer' : 'Téléverser'}
          </button>
          {value ? (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange('')}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Effacer
            </button>
          ) : null}
          <label className="block text-xs text-slate-500">
            Ou URL directe
            <input
              type="url"
              className="mt-1 w-full max-w-xs rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder="https://…"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;
