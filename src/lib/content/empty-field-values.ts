import type { ContentFieldDefinitionDto } from './types';

/** Initial values when creating an entry (keys omitted where appropriate). */
export function emptyFieldValuesForDefinitions(
  fields: ContentFieldDefinitionDto[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    switch (f.fieldType) {
      case 'number':
        out[f.fieldKey] = 0;
        break;
      case 'boolean':
        out[f.fieldKey] = false;
        break;
      case 'images':
        out[f.fieldKey] = [];
        break;
      case 'profile_list':
      case 'video_list':
      case 'social_link_list':
      case 'program_list':
      case 'weekly_program_list':
      case 'moderator_list':
      case 'string_list':
        out[f.fieldKey] = [];
        break;
      case 'seo_defaults':
        out[f.fieldKey] = { title: '', description: '', ogImage: '', keywords: '' };
        break;
      case 'relation':
      case 'entity_relation': {
        const mult =
          f.validation &&
          typeof f.validation === 'object' &&
          f.validation.multiple === true;
        if (mult) out[f.fieldKey] = [];
        break;
      }
      default:
        out[f.fieldKey] = '';
    }
  }
  return out;
}
