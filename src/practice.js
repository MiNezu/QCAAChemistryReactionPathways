const MODES = {
  product: {label:'Predict the product',prompt:'What product representation is recorded for this reaction?',answer:r=>r.products,context:r=>`Reactants: ${r.reactants.join(' + ')}`},
  reactant: {label:'Identify the reactant',prompt:'Which reactant representation is recorded for this reaction?',answer:r=>r.reactants,context:r=>`Products: ${r.products.join(' + ')}`},
  reagents: {label:'Recall reagents',prompt:'Which reagents are recorded for this reaction?',answer:r=>r.reagents,context:r=>`${r.reactants.join(' + ')} → ${r.products.join(' + ')}`},
  conditions: {label:'Recall conditions',prompt:'What conditions are recorded for this reaction?',answer:r=>conditionAnswer(r),context:r=>`${r.reactants.join(' + ')} → ${r.products.join(' + ')}`},
  type: {label:'Classify the reaction',prompt:'What reaction type is recorded?',answer:r=>[r.reactionType],context:r=>`${r.reactants.join(' + ')} → ${r.products.join(' + ')}`},
  pathway: {label:'Name the transformation',prompt:'Which functional-group transformation is recorded?',answer:r=>[r.mapFrom&&r.mapTo?`${r.mapFrom} → ${r.mapTo}`:''],context:r=>r.name}
};
function conditionAnswer(r){if(r.conditions.status==='not_applicable')return ['Not applicable'];const detail=[r.conditions.temperature,r.conditions.solvent,r.conditions.other].filter(Boolean).join('; ');return detail?[detail]:[]}
const norm=s=>s.toLocaleLowerCase().normalize('NFKC').replace(/[\s.,;:()[\]{}]/g,'').replace(/→/g,'->').trim();
export function eligibleRecords(records){return records.filter(r=>r.validationStatus==='Published'&&r.reactants?.length&&r.products?.length)}
export function availableModes(records){const eligible=eligibleRecords(records);return Object.keys(MODES).filter(k=>eligible.some(r=>{const ans=MODES[k].answer(r);return ans.some(Boolean)}))}
export function buildQuestion(records,{mode,tags=[],difficulty='',usedIds=[]}={}){
 const def=MODES[mode];if(!def)throw Error('Choose a valid question mode.');
 let pool=eligibleRecords(records).filter(r=>!usedIds.includes(r.id));if(tags.length)pool=pool.filter(r=>tags.every(t=>r.syllabusTags?.includes(t)));if(difficulty)pool=pool.filter(r=>r.difficulty===difficulty);pool=pool.filter(r=>def.answer(r).some(Boolean));
 if(!pool.length)return null;
 const r=pool[Math.floor(Math.random()*pool.length)];return {reactionId:r.id,mode,label:def.label,prompt:def.prompt,context:def.context(r),question:r.name||'Reaction record',answers:def.answer(r).filter(Boolean),accepted:[...(mode==='conditions'?(r.acceptedAnswers||[]):[]),...def.answer(r)].map(norm).filter(Boolean)}
}
export function checkAnswer(question,value){const answer=norm(value);return Boolean(answer)&&question.accepted.includes(answer)}
