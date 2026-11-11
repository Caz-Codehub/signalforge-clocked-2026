const ENDPOINTS = { pii: 'pii', injection: 'injection', script: 'script' };
const BASE = 'https://clocked.rezolve.ai/clocked';
const reply = (statusCode, payload) => ({statusCode, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:JSON.stringify(payload)});
const numerical = (v) => { const n=Number(v); return Number.isFinite(n)?Math.max(0,Math.min(1,n)):null; };
function summarize(kind, data) {
  const d = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
  if (kind === 'pii') {
    const entities = Array.isArray(d.entities) ? d.entities : [];
    const masked = typeof d.anonymized_text==='string'?d.anonymized_text:typeof d.masked_text==='string'?d.masked_text:null;
    return {endpoint:'/pii',kind:'pii',count:entities.length,types:[...new Set(entities.map(e=>String(e.type||e.label||'sensitive')))].slice(0,12),masked_text:masked,decision: masked!==null?'redacted':'review',risk_delta:Math.min(24,entities.length*8)};
  }
  const verdict = String(d.verdict ?? d.label ?? d.category ?? 'unknown').toLowerCase();
  const rawScore = kind==='script' ? (d.malicious ?? d.score ?? d.probability) : (d.injection ?? d.score ?? d.probability);
  const score = typeof rawScore === 'boolean' ? (rawScore?1:0) : numerical(rawScore);
  const block = ['malicious','blocked','block','unsafe','dangerous','injection','critical','high'].some(x=>verdict.includes(x)) || (score!==null && score>=0.65);
  const clear = ['safe','clean','benign','allowed','allow','none'].some(x=>verdict===x) || (score!==null && score<=0.2);
  return {endpoint:`/${kind}`,kind,verdict,score,decision:block?'block':clear?'allow':'review',risk_delta:block?30:score!==null?Math.round(score*30):0};
}
export async function handler(event) {
  if (event.httpMethod !== 'POST') return reply(405,{error:'Use POST.'});
  if (!process.env.CLOCKED_API_KEY) return reply(503,{error:'Clocked key not configured on this Netlify site. Offline demo remains available.'});
  if (Buffer.byteLength(event.body||'', 'utf8')>24000) return reply(413,{error:'Request too large.'});
  let body;
  try {body=JSON.parse(event.body||'{}');} catch {return reply(400,{error:'Invalid JSON.'});}
  if (!Object.hasOwn(ENDPOINTS,body.kind)) return reply(400,{error:'Invalid endpoint selection.'});
  const value = body.kind==='script'?body.script:body.text;
  if (typeof value!=='string'||!value.trim()||value.length>8000) return reply(400,{error:'Input must be 1–8000 characters.'});
  const data = body.kind==='script'?{script:value}:body.kind==='pii'?{text:value,anonymize:'mask'}:{text:value,source:'content'};
  try {
    const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),15000);
    let upstream;
    try {upstream=await fetch(`${BASE}/${ENDPOINTS[body.kind]}`,{method:'POST',headers:{'Authorization':`Bearer ${process.env.CLOCKED_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(data),signal:controller.signal});}
    finally {clearTimeout(timeout);}
    if (!upstream.ok) return reply(502,{error:`Clocked request failed (HTTP ${upstream.status}). Please verify API access and payload.`});
    const result=await upstream.json();
    return reply(200,{live:true,...summarize(body.kind,result)});
  } catch(err) { return reply(502,{error:err?.name==='AbortError'?'Clocked request timed out.':'Clocked could not be reached.'}); }
}
