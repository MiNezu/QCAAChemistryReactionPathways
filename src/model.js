export const SCHEMA_VERSION = 1;
export const STATUSES = ['Draft', 'Validated', 'Published', 'Needs review'];
export const blankReaction = () => ({
  id: crypto.randomUUID(), name: '', description: '', reactionType: '', functionalGroups: [],
  reactants: [], products: [], reagents: [], conditions: { status: 'unspecified', temperature: '', solvent: '', other: '' },
  catalysts: { status: 'unspecified', values: [] }, alternativeConditionSets: [], limitations: '', acceptedAnswers: [],
  syllabusTags: [], difficulty: '', source: '', validationStatus: 'Draft', notes: ''
});
export function validateReaction(r) {
  const errors = [];
  if (!r || typeof r !== 'object' || Array.isArray(r)) return ['Record must be an object.'];
  if (!r.id || typeof r.id !== 'string') errors.push('A stable string ID is required.');
  if (typeof r.name !== 'string') errors.push('Name must be text.');
  if (!STATUSES.includes(r.validationStatus)) errors.push('Validation status is invalid.');
  for (const key of ['functionalGroups','reactants','products','reagents','alternativeConditionSets','acceptedAnswers','syllabusTags'])
    if (!Array.isArray(r[key])) errors.push(`${key} must be a list.`);
  if (!r.conditions || typeof r.conditions !== 'object' || !['required','optional','not_applicable','unspecified'].includes(r.conditions.status)) errors.push('Conditions need a valid explicit status.');
  if (!r.catalysts || typeof r.catalysts !== 'object' || !['required','optional','not_applicable','unspecified'].includes(r.catalysts.status)) errors.push('Catalysts need a valid explicit status.');
  for (const [i, set] of (r.alternativeConditionSets || []).entries()) if (!set || !Array.isArray(set.reagents) || !set.conditions || typeof set.conditions !== 'object') errors.push(`Alternative condition set ${i + 1} is malformed.`);
  return errors;
}
export function validateCollection(records) {
  if (!Array.isArray(records)) return ['Import must contain a list of reactions.'];
  const errors = records.flatMap((r, i) => validateReaction(r).map(e => `Record ${i + 1}: ${e}`));
  const ids = records.map(r => r?.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate reaction IDs were found.');
  return errors;
}
