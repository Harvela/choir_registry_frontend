/** Keep in sync with choir_registry_backend linked-entity-type.ts */
export const LINKED_ENTITY_TYPES = [
  'Performance',
  'Communique',
  'User',
  'Department',
  'Rehearsal',
  'Song',
  'Report',
  'Album',
  'Playlist',
] as const;

/** Linked entity types allowed as `entity_relation` field targets */
export const ENTITY_RELATION_TARGETS = ['Song', 'Department', 'Album'] as const;

export type EntityRelationTarget = (typeof ENTITY_RELATION_TARGETS)[number];
