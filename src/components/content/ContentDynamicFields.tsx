'use client';

import React from 'react';

import type { ContentFieldDefinitionDto } from '@/lib/content/types';

import EntityRelationSelectField from './EntityRelationSelectField';
import GalleryUploadField from './GalleryUploadField';
import ImageUploadField from './ImageUploadField';
import ModeratorListField, {
  normalizeModeratorList,
} from './ModeratorListField';
import ProfileListField, { normalizeProfileList } from './ProfileListField';
import ProgramListField, { normalizeProgramList } from './ProgramListField';
import RelationSelectField from './RelationSelectField';
import WeeklyProgramListField, {
  normalizeWeeklyProgramList,
} from './WeeklyProgramListField';
import SeoDefaultsField, { normalizeSeoDefaults } from './SeoDefaultsField';
import SocialLinkListField, {
  normalizeSocialLinkList,
} from './SocialLinkListField';
import StringListField, { normalizeStringList } from './StringListField';
import TinyMceField from './TinyMceField';
import VideoListField, { normalizeVideoList } from './VideoListField';

export type ContentDynamicFieldsProps = {
  definitions: ContentFieldDefinitionDto[];
  fieldValues: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
  disabled?: boolean;
  /** Current entry id — used to exclude self from relation pickers */
  excludeContentEntryId?: number;
};

function relationMeta(def: ContentFieldDefinitionDto): {
  code: string;
  multiple: boolean;
  storeAs: 'id' | 'linkedEntityId' | 'slug';
} {
  const val = def.validation ?? {};
  const code =
    typeof val.targetContentTypeCode === 'string'
      ? val.targetContentTypeCode
      : '';
  const multiple = val.multiple === true;
  const storeAs =
    val.storeAs === 'linkedEntityId'
      ? 'linkedEntityId'
      : val.storeAs === 'slug'
        ? 'slug'
        : 'id';
  return { code, multiple, storeAs };
}

function entityRelationMeta(def: ContentFieldDefinitionDto): {
  linkedType: string;
  multiple: boolean;
} {
  const val = def.validation ?? {};
  const linkedType =
    typeof val.targetLinkedEntityType === 'string'
      ? val.targetLinkedEntityType
      : '';
  const multiple = val.multiple === true;
  return { linkedType, multiple };
}

const ContentDynamicFields: React.FC<ContentDynamicFieldsProps> = ({
  definitions,
  fieldValues,
  setField,
  disabled,
  excludeContentEntryId,
}) => {
  const defs = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-5 border-t border-slate-100 pt-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Champs
      </h2>
      {defs.map((def) => {
        const v = fieldValues[def.fieldKey];
        const labelText = (
          <>
            {def.label || def.fieldKey}
            {def.required ? (
              <span className="text-red-600" aria-hidden>
                {' '}
                *
              </span>
            ) : null}
          </>
        );

        if (def.fieldType === 'html') {
          return (
            <label key={def.id} className="block text-sm">
              <span className="font-medium text-slate-700">{labelText}</span>
              <div className="mt-1 rounded-md border border-slate-200 bg-white">
                <TinyMceField
                  value={typeof v === 'string' ? v : ''}
                  onChange={(html) => setField(def.fieldKey, html)}
                />
              </div>
            </label>
          );
        }

        if (def.fieldType === 'textarea') {
          return (
            <label key={def.id} className="block text-sm">
              <span className="font-medium text-slate-700">{labelText}</span>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={6}
                value={typeof v === 'string' ? v : ''}
                disabled={disabled}
                onChange={(e) => setField(def.fieldKey, e.target.value)}
              />
            </label>
          );
        }

        if (def.fieldType === 'boolean') {
          return (
            <label
              key={def.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={!!v}
                disabled={disabled}
                onChange={(e) => setField(def.fieldKey, e.target.checked)}
              />
              <span className="font-medium text-slate-700">{labelText}</span>
            </label>
          );
        }

        if (def.fieldType === 'number') {
          return (
            <label key={def.id} className="block text-sm">
              <span className="font-medium text-slate-700">{labelText}</span>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                value={
                  typeof v === 'number' && Number.isFinite(v)
                    ? v
                    : v === '' || v === undefined
                      ? ''
                      : Number(v) || ''
                }
                disabled={disabled}
                onChange={(e) => {
                  const raw = e.target.value;
                  setField(def.fieldKey, raw === '' ? '' : Number(raw));
                }}
              />
            </label>
          );
        }

        if (def.fieldType === 'date') {
          return (
            <label key={def.id} className="block text-sm">
              <span className="font-medium text-slate-700">{labelText}</span>
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
                value={typeof v === 'string' ? v : ''}
                disabled={disabled}
                onChange={(e) => setField(def.fieldKey, e.target.value)}
              />
            </label>
          );
        }

        if (def.fieldType === 'image') {
          return (
            <div key={def.id} className="block text-sm">
              <ImageUploadField
                label={def.label || def.fieldKey}
                value={typeof v === 'string' ? v : ''}
                disabled={disabled}
                onChange={(url) => setField(def.fieldKey, url)}
              />
            </div>
          );
        }

        if (def.fieldType === 'images') {
          const arr = Array.isArray(v)
            ? v.filter((x): x is string => typeof x === 'string')
            : [];
          return (
            <div key={def.id} className="block text-sm">
              <span className="mb-2 block font-medium text-slate-700">
                {labelText}
              </span>
              <GalleryUploadField
                value={arr}
                disabled={disabled}
                onChange={(urls) => setField(def.fieldKey, urls)}
              />
            </div>
          );
        }

        if (def.fieldType === 'profile_list') {
          return (
            <div key={def.id} className="block text-sm">
              <ProfileListField
                label={def.label || def.fieldKey}
                value={normalizeProfileList(v)}
                disabled={disabled}
                onChange={(rows) => setField(def.fieldKey, rows)}
              />
            </div>
          );
        }

        if (def.fieldType === 'video_list') {
          return (
            <div key={def.id} className="block text-sm">
              <VideoListField
                label={def.label || def.fieldKey}
                value={normalizeVideoList(v)}
                disabled={disabled}
                onChange={(rows) => setField(def.fieldKey, rows)}
              />
            </div>
          );
        }

        if (def.fieldType === 'social_link_list') {
          return (
            <div key={def.id} className="block text-sm">
              <SocialLinkListField
                label={def.label || def.fieldKey}
                value={normalizeSocialLinkList(v)}
                disabled={disabled}
                onChange={(rows) => setField(def.fieldKey, rows)}
              />
            </div>
          );
        }

        if (def.fieldType === 'seo_defaults') {
          return (
            <div key={def.id} className="block text-sm">
              <SeoDefaultsField
                label={def.label || def.fieldKey}
                value={normalizeSeoDefaults(v)}
                disabled={disabled}
                onChange={(next) => setField(def.fieldKey, next)}
              />
            </div>
          );
        }

        if (def.fieldType === 'program_list') {
          return (
            <div key={def.id} className="block text-sm">
              <ProgramListField
                label={def.label || def.fieldKey}
                value={normalizeProgramList(v)}
                disabled={disabled}
                onChange={(rows) => setField(def.fieldKey, rows)}
              />
            </div>
          );
        }

        if (def.fieldType === 'weekly_program_list') {
          return (
            <div key={def.id} className="block text-sm">
              <WeeklyProgramListField
                label={def.label || def.fieldKey}
                value={normalizeWeeklyProgramList(v)}
                disabled={disabled}
                onChange={(rows) => setField(def.fieldKey, rows)}
              />
            </div>
          );
        }

        if (def.fieldType === 'moderator_list') {
          return (
            <div key={def.id} className="block text-sm">
              <ModeratorListField
                label={def.label || def.fieldKey}
                value={normalizeModeratorList(v)}
                disabled={disabled}
                onChange={(rows) => setField(def.fieldKey, rows)}
              />
            </div>
          );
        }

        if (def.fieldType === 'string_list') {
          return (
            <div key={def.id} className="block text-sm">
              <StringListField
                label={def.label || def.fieldKey}
                value={normalizeStringList(v)}
                disabled={disabled}
                onChange={(rows) => setField(def.fieldKey, rows)}
              />
            </div>
          );
        }

        if (def.fieldType === 'relation') {
          const { code, multiple, storeAs } = relationMeta(def);
          let rv: number | number[] | string | string[] | undefined;
          if (storeAs === 'slug') {
            rv = multiple
              ? Array.isArray(v)
                ? v.filter((x): x is string => typeof x === 'string')
                : []
              : typeof v === 'string'
                ? v
                : undefined;
          } else {
            rv = multiple
              ? Array.isArray(v)
                ? v.filter((x): x is number => typeof x === 'number')
                : []
              : typeof v === 'number'
                ? v
                : undefined;
          }

          return (
            <label key={def.id} className="block text-sm">
              <span className="font-medium text-slate-700">{labelText}</span>
              <RelationSelectField
                targetContentTypeCode={code}
                multiple={multiple}
                storeAs={storeAs}
                excludeContentEntryId={excludeContentEntryId}
                value={rv}
                required={def.required}
                disabled={disabled}
                onChange={(next) => setField(def.fieldKey, next)}
              />
            </label>
          );
        }

        if (def.fieldType === 'entity_relation') {
          const { linkedType, multiple } = entityRelationMeta(def);
          const rv = multiple
            ? Array.isArray(v)
              ? v.filter((x): x is number => typeof x === 'number')
              : []
            : typeof v === 'number'
              ? v
              : undefined;

          return (
            <label key={def.id} className="block text-sm">
              <span className="font-medium text-slate-700">{labelText}</span>
              <EntityRelationSelectField
                targetLinkedEntityType={linkedType}
                multiple={multiple}
                value={rv as number | number[] | undefined}
                required={def.required}
                disabled={disabled}
                onChange={(next) => setField(def.fieldKey, next)}
              />
            </label>
          );
        }

        return (
          <label key={def.id} className="block text-sm">
            <span className="font-medium text-slate-700">{labelText}</span>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
              value={typeof v === 'string' ? v : String(v ?? '')}
              disabled={disabled}
              onChange={(e) => setField(def.fieldKey, e.target.value)}
            />
          </label>
        );
      })}
    </div>
  );
};

export default ContentDynamicFields;
