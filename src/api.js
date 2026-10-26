const B='http://localhost:3001';
const call=(m,p,b)=>fetch(B+p,{method:m,headers:{'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined})
 .then(r=>{if(!r.ok)throw new Error('API error '+r.status);return r.status===204?null:r.json()});
export const api={get:p=>call('GET',p),post:(p,b)=>call('POST',p,b),patch:(p,b)=>call('PATCH',p,b),del:p=>call('DELETE',p)};
export const notify=(userId,text)=>api.post('/notifications',{userId,text,read:false,createdAt:new Date().toISOString()});
export const logAction=(adminId,action,target)=>api.post('/activityLogs',{adminId,action,target,createdAt:new Date().toISOString()});
// App-level ownership check: re-reads the record and verifies the owner. NOT real security (JSON Server cannot enforce it).
export const assertOwner=async(path,field,uid)=>{const r=await api.get(path);const v=r[field];if(Array.isArray(v)?!v.includes(uid):v!==uid)throw new Error('Not allowed: you do not own this record');return r};
