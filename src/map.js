export function publishedMapRecords(records) {
  return records.filter(r => r.validationStatus === 'Published' && r.mapFrom?.trim() && r.mapTo?.trim());
}
export function layoutMap(records) {
  const nodes = new Map();
  for (const r of records) for (const label of [r.mapFrom.trim(), r.mapTo.trim()]) if (!nodes.has(label)) nodes.set(label, { id: label, label });
  const edges = records.map(r => ({ id:r.id, from:r.mapFrom.trim(), to:r.mapTo.trim(), name:r.name || 'Untitled reaction' }));
  const adj = new Map([...nodes.keys()].map(k => [k, []]));
  edges.forEach(e => { adj.get(e.from).push(e.to); adj.get(e.to).push(e.from); });
  const components = [], seen = new Set();
  for (const id of nodes.keys()) if (!seen.has(id)) { const q=[id], comp=[]; seen.add(id); while(q.length){const x=q.shift();comp.push(x);for(const y of adj.get(x))if(!seen.has(y)){seen.add(y);q.push(y)}}components.push(comp); }
  const layers = new Map();
  for (const comp of components) {
    const roots = comp.filter(x => !edges.some(e => e.to===x && comp.includes(e.from)));
    const queue=(roots.length?roots:[comp[0]]).map(x=>[x,0]); const depth=new Map();
    while(queue.length){const [x,d]=queue.shift();if(depth.has(x))continue;depth.set(x,d);for(const e of edges){if(e.from===x)queue.push([e.to,d+1]);else if(e.to===x)queue.push([e.from,d+1]);}}
    for(const x of comp){const d=depth.get(x)||0;if(!layers.has(d))layers.set(d,[]);layers.get(d).push(x)}
  }
  const maxLayer=Math.max(0,...layers.keys()), gapX=260,gapY=150,positions=new Map();
  for(const [depth, ids] of [...layers.entries()].sort((a,b)=>a[0]-b[0])) ids.sort((a,b)=>a.localeCompare(b)).forEach((id,i)=>positions.set(id,{x:100+depth*gapX,y:100+i*gapY}));
  const width=Math.max(800,100+maxLayer*gapX+240), height=Math.max(420,...[...positions.values()].map(p=>p.y+110));
  const parallel=new Map();for(const e of edges){const k=[e.from,e.to].sort().join('::');parallel.set(k,(parallel.get(k)||0)+1)}
  const offsets=new Map();return {nodes:[...nodes.values()].map(n=>({...n,...positions.get(n.id)})),edges:edges.map(e=>{const k=[e.from,e.to].sort().join('::'),i=offsets.get(k)||0;offsets.set(k,i+1);return {...e,parallelIndex:i,parallelCount:parallel.get(k)}}),width,height};
}
