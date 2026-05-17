'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import React from 'react';

import { uploadContentImage } from '@/lib/content/api';

const Editor = dynamic(
  () =>
    import('@tinymce/tinymce-react').then(
      (m) =>
        ((m as unknown as { Editor?: unknown; default?: unknown }).Editor ??
          (m as unknown as { Editor?: unknown; default?: unknown })
            .default) as unknown as ComponentType<Record<string, unknown>>,
    ),
  {
    ssr: false,
    loading: () => <p className="text-sm text-gray-500">Chargement…</p>,
  },
);

const TINYMCE_SCRIPT_SRC =
  'https://cdn.jsdelivr.net/npm/tinymce@7/tinymce.min.js';

type TinyMceFieldProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
};

const TinyMceField: React.FC<TinyMceFieldProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="rounded border border-gray-200 bg-white">
      <Editor
        tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
        value={value}
        onEditorChange={(html: string) => onChange(html)}
        disabled={disabled}
        init={{
          license_key: 'gpl',
          height: 420,
          branding: false,
          promotion: false,
          menubar: false,
          plugins: 'link lists image code table autoresize',
          toolbar:
            'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image | code removeformat',
          content_style:
            'body { font-family: system-ui, sans-serif; font-size: 14px; }',
          images_upload_handler: async (blobInfo: {
            blob: () => Blob;
            filename: () => string;
          }) => {
            const blob = blobInfo.blob();
            const name = blobInfo.filename();
            const file = new File([blob], name, { type: blob.type });
            return uploadContentImage(file);
          },
        }}
      />
    </div>
  );
};

export default TinyMceField;
