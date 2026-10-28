import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker, { SessionStore, UsageCounter, EVENT, digest } from '../../services/sharing/worker.js';
function store() {
  const db = new DatabaseSync(':memory:'); let alarm;
  const sql={exec(query,...args){const statement=db.prepare(query);return statement.columns().length ? statement.all(...args) : (statement.run(...args),[]);}};
  const ctx={storage:{sql,transactionSync:f=>{db.exec('BEGIN');try{const result=f();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}},getAlarm:async()=>alarm,setAlarm:async value=>{alarm=value;}}};
  return {instance:new SessionStore(ctx),db,sql};
}
const request=(method,id='',options={})=>new Request('https://local/sessions'+(id?'/'+id:''),{method,headers:{'X-Client-Hash':'client','Content-Type':'application/octet-stream',...options.headers},...(options.body?{body:options.body}:{})});
test('partage serveur : expiration, suppression autorisée et quotas atomiques',async()=>{
  const {instance,db,sql}=store();
  try {
    const secret='a'.repeat(43),hash=await digest(secret);
    const make=()=>instance.fetch(request('POST','',{headers:{'X-Delete-Hash':hash},body:new Uint8Array(30)}));
    const created=await make();assert.equal(created.status,201);const item=await created.json();
    assert.equal((await instance.fetch(request('GET',item.id))).status,200);
    assert.equal((await instance.fetch(request('DELETE',item.id,{headers:{Authorization:'Bearer '+'b'.repeat(43)}}))).status,403);
    assert.equal((await instance.fetch(request('DELETE',item.id,{headers:{Authorization:'Bearer '+secret}}))).status,204);
    assert.equal((await instance.fetch(request('GET',item.id))).status,404);
    const expired=await (await make()).json();sql.exec('UPDATE sessions SET expires = 1 WHERE id = ?',expired.id);
    assert.equal((await instance.fetch(request('GET',expired.id))).status,404);
    const statuses=await Promise.all(Array.from({length:5},async()=>(await make()).status));
    assert.equal(statuses.filter(s=>s===201).length,3);assert.equal(statuses.filter(s=>s===429).length,2);
    sql.exec('UPDATE sessions SET expires=1');sql.exec('UPDATE limits SET expires=1');await instance.alarm();
    assert.equal([...sql.exec('SELECT COUNT(*) AS n FROM sessions')][0].n,0);
    assert.equal([...sql.exec('SELECT COUNT(*) AS n FROM limits')][0].n,0);
  } finally {db.close();}
});
test('partage serveur : origine, CORS, tailles et entrées mal formées',async()=>{
  const {instance,db}=store();
  const env={SESSIONS:{idFromName:()=>'',get:()=>instance}};
  try {
    const bad=await worker.fetch(new Request('https://local/sessions',{headers:{origin:'https://evil.example'}}),env);assert.equal(bad.status,403);assert.equal(bad.headers.get('access-control-allow-origin'),null);
    const pre=await worker.fetch(new Request('https://local/sessions',{method:'OPTIONS',headers:{origin:'https://speechsynthe.si'}}),env);assert.equal(pre.status,204);assert.equal(pre.headers.get('access-control-allow-origin'),'https://speechsynthe.si');assert.equal(pre.headers.get('cache-control'),'no-store');
    const injection=await worker.fetch(new Request('https://local/sessions/%27OR1=1',{headers:{origin:'https://speechsynthe.si'}}),env);assert.equal(injection.status,404);
    assert.equal((await instance.fetch(request('POST','',{body:new Uint8Array(30)}))).status,400);
    assert.equal((await instance.fetch(request('POST','',{headers:{'X-Delete-Hash':'a'.repeat(64)},body:new Uint8Array(512*1024+1)}))).status,413);
  }finally{db.close();}
});
test('compteur d’usage : noms autorisés seulement, quotas, lecture protégée',async()=>{
  const db=new DatabaseSync(':memory:');let alarm;
  const sql={exec(query,...args){const statement=db.prepare(query);return statement.columns().length ? statement.all(...args) : (statement.run(...args),[]);}};
  const ctx={storage:{sql,transactionSync:f=>{db.exec('BEGIN');try{const result=f();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}},getAlarm:async()=>alarm,setAlarm:async value=>{alarm=value;}}};
  const usage=new UsageCounter(ctx);
  const env={STATS_TOKEN:'t'.repeat(32),USAGE:{idFromName:()=>'',get:()=>usage}};
  const send=(body,origin='https://speechsynthe.si')=>worker.fetch(new Request('https://local/events',{method:'POST',body,headers:{origin,'Content-Type':'text/plain'}}),env);
  try {
    assert.ok(EVENT.test('import-pdf-scan')&&EVENT.test('listen-document-en')&&EVENT.test('export-mp3-fr'));
    assert.equal(EVENT.test('import-docx'),false);assert.equal(EVENT.test('listen-text-fr\nCours de droit'),false);
    const ok=await send('import-pdf');assert.equal(ok.status,204);assert.equal(ok.headers.get('access-control-allow-origin'),'https://speechsynthe.si');
    assert.equal((await send('mon cours de droit')).status,400);
    assert.equal((await send('import-pdf','https://evil.example')).status,403);
    assert.equal((await worker.fetch(new Request('https://local/events',{headers:{origin:'https://speechsynthe.si'}}),env)).status,405);
    const statuses=[];for(let i=0;i<61;i++)statuses.push((await send('listen-text-fr')).status);
    assert.equal(statuses.filter(s=>s===204).length,59);assert.equal(statuses.at(-1),429);
    assert.equal((await worker.fetch(new Request('https://local/stats'),env)).status,403);
    assert.equal((await worker.fetch(new Request('https://local/stats',{headers:{authorization:'Bearer wrong'}}),env)).status,403);
    const stats=await worker.fetch(new Request('https://local/stats',{headers:{authorization:'Bearer '+env.STATS_TOKEN}}),env);
    assert.equal(stats.status,200);
    const rows=await stats.json();
    assert.deepEqual(rows.map(r=>[r.event,r.n]),[['import-pdf',1],['listen-text-fr',59]]);
    assert.deepEqual(Object.keys(rows[0]).sort(),['day','event','n']);
    assert.equal([...sql.exec("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='sessions'")][0].n,0);
    sql.exec("UPDATE usage SET day='2000-01-01'");sql.exec('UPDATE limits SET expires=1');await usage.alarm();
    assert.equal([...sql.exec('SELECT COUNT(*) AS n FROM usage')][0].n,0);assert.equal([...sql.exec('SELECT COUNT(*) AS n FROM limits')][0].n,0);
  }finally{db.close();}
});
