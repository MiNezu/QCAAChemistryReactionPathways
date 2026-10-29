import { SCHEMA_VERSION, validateCollection } from './model.js';
import legacyRecords from './legacy-reactions.json';
const KEY = 'reaction-pathway-library';
export function loadRecords() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return { records: structuredClone(legacyRecords), warning: 'Legacy records were imported from reaction-pathways.html and marked Needs review. Verify chemistry independently before use.' };
    const parsed = JSON.parse(raw);
    if (parsed.version !== SCHEMA_VERSION || !Array.isArray(parsed.records)) return { records: [], warning: 'Stored data is not supported. Existing browser data was left untouched.' };
    const errors = validateCollection(parsed.records);
    return errors.length ? { records: [], warning: `Stored data could not be loaded: ${errors.join(' ')}` } : { records: parsed.records, warning: '' };
  } catch { return { records: [], warning: 'Stored data could not be read. Existing browser data was left untouched.' }; }
}
export function saveRecords(records) {
  const errors = validateCollection(records);
  if (errors.length) throw new Error(errors.join('\n'));
  localStorage.setItem(KEY, JSON.stringify({ version: SCHEMA_VERSION, records }));
}
