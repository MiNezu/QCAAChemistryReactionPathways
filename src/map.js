export function publishedMapRecords(records) {
  return records.filter(r => r.validationStatus === 'Published' && r.mapFrom?.trim() && r.mapTo?.trim());
}

const NODE_W = 190;
const NODE_H = 46;
const X_GAP = 280;
const Y_GAP = 128;
const MARGIN = 90;

// Deterministic Sugiyama-style layout: cycle-breaking order, longest-path layering,
// repeated barycentric sweeps, then separated routing for feedback/parallel edges.
export function layoutMap(records) {
  const nodeMap = new Map();
  for (const r of records) for (const label of [r.mapFrom.trim(), r.mapTo.trim()]) {
    if (!nodeMap.has(label)) nodeMap.set(label, { id: label, label });
  }
  const edges = records.map(r => ({ id:r.id, from:r.mapFrom.trim(), to:r.mapTo.trim(), name:r.name || 'Untitled reaction' }));
  const ids = [...nodeMap.keys()].sort((a,b)=>a.localeCompare(b));
  if (!ids.length) return { nodes:[], edges:[], width:800, height:420 };

  // Greedily order nodes by net flow to obtain a stable acyclic backbone.
  const remaining = new Set(ids), order = [];
  while (remaining.size) {
    let best = null, bestScore = -Infinity;
    for (const id of remaining) {
      const out = edges.filter(e=>e.from===id && remaining.has(e.to)).length;
      const incoming = edges.filter(e=>e.to===id && remaining.has(e.from)).length;
      const score = out-incoming;
      if (score > bestScore || (score===bestScore && id.localeCompare(best)<0)) { best=id;bestScore=score; }
    }
    order.push(best);remaining.delete(best);
  }
  const orderIndex = new Map(order.map((id,i)=>[id,i]));
  const forward = edges.filter(e=>orderIndex.get(e.from)<orderIndex.get(e.to));
  const feedback = edges.filter(e=>orderIndex.get(e.from)>=orderIndex.get(e.to));

  // Longest-path rank assignment across the acyclic backbone.
  const rank = new Map(ids.map(id=>[id,0]));
  for (const id of order) for (const e of forward) if(e.from===id) rank.set(e.to,Math.max(rank.get(e.to),rank.get(id)+1));
  const layerCount=Math.max(0,...rank.values())+1;
  const layers=Array.from({length:layerCount},()=>[]);
  for(const id of ids) layers[rank.get(id)].push(id);
  const incoming=new Map(ids.map(id=>[id,[]])),outgoing=new Map(ids.map(id=>[id,[]]));
  for(const e of forward){outgoing.get(e.from).push(e.to);incoming.get(e.to).push(e.from)}
  for(const layer of layers)layer.sort((a,b)=>a.localeCompare(b));
  const sweep=(down)=>{
    const start=down?1:layers.length-2,end=down?layers.length:-1,step=down?1:-1;
    for(let i=start;i!==end;i+=step){const reference=down?incoming:outgoing, neighborLayer=layers[i-step], pos=new Map(neighborLayer.map((n,j)=>[n,j]));
      layers[i].sort((a,b)=>{const avg=id=>{const ns=reference.get(id).filter(n=>pos.has(n));return ns.length?ns.reduce((s,n)=>s+pos.get(n),0)/ns.length:Number.POSITIVE_INFINITY};return avg(a)-avg(b)||a.localeCompare(b)});
    }
  };
  // Alternating sweeps reduce crossings while deterministic ties prevent layout jitter.
  for(let i=0;i<6;i++){sweep(true);sweep(false)}

  const maxNodes=Math.max(...layers.map(l=>l.length));
  const positions=new Map();
  layers.forEach((layer,x)=>{const total=(layer.length-1)*Y_GAP;layer.forEach((id,i)=>positions.set(id,{x:MARGIN+x*X_GAP,y:MARGIN+(maxNodes-1)*Y_GAP/2-total/2+i*Y_GAP}))});
  const feedbackLane= MARGIN + maxNodes*Y_GAP + 90;
  const pairGroups=new Map();
  for(const e of edges){const k=[e.from,e.to].sort().join('\u0000');if(!pairGroups.has(k))pairGroups.set(k,[]);pairGroups.get(k).push(e)}
  const routeCounters=new Map();
  const routed=edges.map(e=>{
    const a=positions.get(e.from),b=positions.get(e.to),group=pairGroups.get([e.from,e.to].sort().join('\u0000'));
    const key=[e.from,e.to].join('\u0000'),idx=routeCounters.get(key)||0;routeCounters.set(key,idx+1);
    const same=e.from===e.to, isBack=feedback.includes(e), parallelOffset=(idx-(group.length-1)/2)*26;
    let d,labelX,labelY;
    if(same){const lane=a.y-65-idx*24;d=`M ${a.x+NODE_W/2} ${a.y} C ${a.x+NODE_W/2+85} ${lane} ${a.x+NODE_W/2-85} ${lane} ${a.x+NODE_W/2} ${a.y}`;labelX=a.x+NODE_W/2;labelY=lane-4}
    else if(isBack){const lane=feedbackLane+idx*30;d=`M ${a.x+NODE_W/2} ${a.y+NODE_H} C ${a.x+NODE_W/2} ${lane} ${b.x+NODE_W/2} ${lane} ${b.x+NODE_W/2} ${b.y+NODE_H}`;labelX=(a.x+b.x+NODE_W)/2;labelY=lane-5}
    else if(rank.get(e.to)-rank.get(e.from)>1){const lane=feedbackLane+idx*30;const startX=a.x+NODE_W,startY=a.y+NODE_H/2,endX=b.x,endY=b.y+NODE_H/2,midX=(startX+endX)/2;d=`M ${startX} ${startY} C ${startX+36} ${startY} ${startX+36} ${lane} ${startX+36} ${lane} L ${endX-36} ${lane} C ${endX-36} ${lane} ${endX-36} ${endY} ${endX} ${endY}`;labelX=midX;labelY=lane-5}
    else {const midX=(a.x+NODE_W+b.x)/2;const cy=(a.y+b.y)/2+parallelOffset;d=`M ${a.x+NODE_W} ${a.y+NODE_H/2} C ${midX} ${a.y+NODE_H/2+parallelOffset} ${midX} ${b.y+NODE_H/2+parallelOffset} ${b.x} ${b.y+NODE_H/2}`;labelX=midX;labelY=cy+parallelOffset*.2}
    return {...e,d,labelX,labelY,feedback:isBack};
  });
  const width=Math.max(800,MARGIN*2+NODE_W+(layerCount-1)*X_GAP);
  const hasFeedback=feedback.length>0||edges.some(e=>e.from===e.to);
  const height=Math.max(420,MARGIN*2+Math.max(0,maxNodes-1)*Y_GAP+NODE_H+((hasFeedback||edges.some(e=>rank.get(e.to)-rank.get(e.from)>1))?maxNodes*Y_GAP+130:0));
  return {nodes:ids.map(id=>({...nodeMap.get(id),...positions.get(id),width:NODE_W,height:NODE_H})),edges:routed,width,height};
}
