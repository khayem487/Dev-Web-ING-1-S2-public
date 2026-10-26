import assert from 'node:assert/strict';

const base=(process.argv[2]||'http://127.0.0.1:8093').replace(/\/$/,'');
const apiOnly=process.argv.includes('--api-only');
const expectedStorage=process.argv.includes('--persistent')?'external-database':'ephemeral-demo';
const started=Date.now();
const session=()=>({cookies:new Map()});
const request=async(path,{actor,method='GET',body,status=200,headers:extraHeaders={}}={})=>{
  const headers={...extraHeaders};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(actor?.cookies.size)headers.Cookie=[...actor.cookies].map(([k,v])=>`${k}=${v}`).join('; ');
  const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  for(const cookie of response.headers.getSetCookie()){
    const pair=cookie.split(';',1)[0],at=pair.indexOf('=');
    if(actor&&at>=0)actor.cookies.set(pair.slice(0,at),pair.slice(at+1));
  }
  const content=await response.text();
  assert.equal(response.status,status,`${method} ${path} expected ${status}, got ${response.status}: ${content.slice(0,180)}`);
  return {response,content,data:response.headers.get('content-type')?.includes('application/json')&&content?JSON.parse(content):null};
};
const login=async role=>{
  const actor=session();
  const {data}=await request('/api/auth/login',{actor,method:'POST',body:{email:`${role}@demo.local`,motDePasse:'demo1234'}});
  assert.ok(data.id&&actor.cookies.size,'Real session created');
  return actor;
};
if(!apiOnly){
  const {content}=await request('/');
  assert.ok(content.includes('<div id="root">'),'Compiled real React entrypoint is served');
  const script=content.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(script,'Compiled frontend asset is present');
  const asset=await request(script);
  assert.ok(asset.content.includes('Maison de démonstration'),'Actual demo frontend bundle is served');
}
const health=(await request('/api/health')).data;
assert.equal(health.status,'UP');
assert.equal(health.registrationEnabled,false);
assert.equal(health.schedulerEnabled,false);
assert.equal(health.storage,expectedStorage);
const devices=(await request('/api/info/objets')).data;
assert.ok(Array.isArray(devices)&&devices.length>0);
await request('/h2-console',{status:404});
await request('/api/gestion/objets',{status:401});
await request('/api/auth/login',{method:'POST',body:{email:'parent@demo.local',motDePasse:'incorrect'},status:401});
await request('/api/auth/register',{method:'POST',body:{prenom:'Demo',nom:'Test',email:'demo@example.invalid',motDePasse:'test-only'},status:403});
await request('/api/auth/resend-verification',{method:'POST',body:{email:'parent@demo.local'},status:403});
await request('/api/auth/verify-email',{method:'POST',body:{email:'parent@demo.local',token:'123456'},status:403});
await request('/api/info/objets',{method:'OPTIONS',headers:{Origin:'https://example.onrender.com','Access-Control-Request-Method':'GET'},status:403});
for(const role of ['enfant','voisin']){
  const actor=await login(role);
  await request('/api/visualisation/profile',{actor});
  await request('/api/gestion/objets',{actor,status:403});
  await request('/api/admin/utilisateurs',{actor,status:403});
}
const parent=await login('parent');
await request('/api/admin/utilisateurs',{actor:parent,status:403});
const admin=await login('admin');
const sharedUsers=(await request('/api/admin/utilisateurs',{actor:admin})).data;
for(const user of sharedUsers){
  await request(`/api/admin/utilisateurs/${user.id}/admin`,{actor:admin,method:'PATCH',body:{admin:false},status:403});
  await request(`/api/admin/utilisateurs/${user.id}/approval`,{actor:admin,method:'PATCH',body:{approved:false},status:403});
  await request(`/api/admin/utilisateurs/${user.id}`,{actor:admin,method:'DELETE',status:403});
}
await request('/api/visualisation/profile',{actor:parent,method:'PUT',body:{},status:403});
const managed=(await request('/api/gestion/objets',{actor:parent})).data;
const device=managed.find(d=>d.type==='Television')||managed.find(d=>['ACTIF','INACTIF'].includes(d.etat));
assert.ok(device);
const wasActive=device.etat==='ACTIF';
let createdScenario;
try{
  await request(`/api/gestion/objets/${device.id}/etat`,{actor:parent,method:'PATCH',body:{actif:!wasActive}});
  assert.equal((await request(`/api/gestion/objets/${device.id}`,{actor:parent})).data.etat,wasActive?'INACTIF':'ACTIF');
  const scenario=(await request('/api/gestion/scenarios',{actor:parent,method:'POST',body:{
    nom:'Vérification démo Vercel',description:'Scénario temporaire créé et supprimé par le contrôle fonctionnel.',
    type:'MANUAL',enabled:true,actions:[{objetId:device.id,targetEtat:wasActive?'ACTIF':'INACTIF'}],
  }})).data;
  createdScenario=scenario.id;
  assert.ok(createdScenario);
  const executed=(await request(`/api/gestion/scenarios/${createdScenario}/run`,{actor:parent,method:'POST'})).data;
  assert.equal(executed.actionsApplied,1);
  assert.ok(executed.executedAt);
  assert.equal((await request(`/api/gestion/objets/${device.id}`,{actor:parent})).data.etat,device.etat);
  const csv=await request('/api/gestion/exports/objets',{actor:parent});
  assert.ok(csv.response.headers.get('content-type')?.startsWith('text/csv'));
  assert.ok(csv.content.includes('nom')&&csv.content.includes(device.nom));
}finally{
  if(createdScenario)await request(`/api/gestion/scenarios/${createdScenario}`,{actor:parent,method:'DELETE'});
  await request(`/api/gestion/objets/${device.id}/etat`,{actor:parent,method:'PATCH',body:{actif:wasActive}});
}
await request('/api/auth/logout',{actor:parent,method:'POST'});
await request('/api/auth/me',{actor:parent,status:401});
console.log(JSON.stringify({passed:true,base,seconds:Math.round((Date.now()-started)/100)/10,
  staticFrontend:apiOnly?'not-checked-locally':'real-react-served',storage:health.storage,
  checks:['health','public objects','4 demo roles','invalid login','management and admin guards','shared profiles rights approval and deletion protected','registration and email endpoints disabled','cross-origin preflight rejected','H2 console disabled','device state updated and restored','temporary real manual scenario created executed deleted','CSV export','logout'],
  cleanup:'Temporary scenario deleted and device original state restored',browserVisualCheck:false}));
