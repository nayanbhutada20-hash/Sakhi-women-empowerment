import {useState,useEffect} from 'react';
import {Link,useParams} from 'react-router-dom';
import {api,notify,logAction,assertOwner} from './api';
import Chart from './Chart.jsx';
import {useApp,useLoad,Load,Page,inr,today,fallback} from './App.jsx';

const T=(k,label,req,t)=>({k,label:label||k,req,t});
const st=o=>({k:'status',label:'Status',t:'select',o:o.split(',')});
const resp=T('adminResponse','Admin response / remarks',0,'textarea');
const Field=({x,v,set})=>{const id='f_'+x.k;return <div><label htmlFor={id}>{x.label}{x.req?' *':''}</label>
 {x.t==='select'?<select id={id} value={v} onChange={e=>set(e.target.value)}>{x.o.map(o=><option key={o}>{o}</option>)}</select>
 :x.t==='bool'?<select id={id} value={String(v)} onChange={e=>set(e.target.value==='true')}><option>true</option><option>false</option></select>
 :x.t==='textarea'?<textarea id={id} value={v??''} onChange={e=>set(e.target.value)}/>
 :<input id={id} type={x.t||'text'} value={v??''} onChange={e=>set(e.target.value)}/>}</div>};

export function Crud({col,fields=[],cols,add=true,del=true,edit=true,def={}}){
  const {user,say}=useApp();const l=useLoad('/'+col);const [q,setQ]=useState(''),[f,setF]=useState(null),[sf,setSf]=useState('');
  const sfield=fields.find(x=>x.k==='status');
  const save=async e=>{e.preventDefault();for(const x of fields)if(x.req&&!String(f[x.k]??'').trim())return say(x.label+' is required',1);
   const b={...f};fields.forEach(x=>{if(x.t==='number')b[x.k]=+b[x.k]});
   try{if(f.id){await api.patch(`/${col}/${f.id}`,b);const to=f.userId||f.buyerId;if(to&&(f.status||f.adminResponse))await notify(to,`Update on your ${col} record: ${b.status||'reviewed'}`)}
    else await api.post('/'+col,{...def,...b,createdAt:today()});
    await logAction(user.id,(f.id?'update_':'create_')+col,col+':'+(f.id||'new'));say('Saved');setF(null);l.reload()}catch{say('Save failed',1)}};
  const rm=async r=>{if(col==='users'&&r.id===user.id)return say('You cannot delete yourself',1);if(!confirm('Delete this record?'))return;
   await api.del(`/${col}/${r.id}`);await logAction(user.id,'delete_'+col,col+':'+r.id);say('Deleted');l.reload()};
  return <div><div className="row"><input aria-label="Search" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/>
   {sfield&&<select aria-label="Filter status" value={sf} onChange={e=>setSf(e.target.value)}><option value="">All statuses</option>{sfield.o.map(o=><option key={o}>{o}</option>)}</select>}
   {add&&<button className="btn" onClick={()=>setF(Object.fromEntries(fields.map(x=>[x.k,x.o?x.o[0]:x.t==='bool'?true:''])))}>+ Add</button>}</div>
   {f&&<form className="card" onSubmit={save}><h3>{f.id?'Edit':'Add'} record</h3>{fields.map(x=><Field key={x.k} x={x} v={f[x.k]} set={v=>setF({...f,[x.k]:v})}/>)}<br/><button className="btn">Save</button> <button type="button" className="btn alt" onClick={()=>setF(null)}>Cancel</button></form>}
   <Load s={l}>{d=>{const rows=d.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase())&&(!sf||r.status===sf));
    return rows.length?<div className="tw"><table><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}<th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c}>{String(r[c]??'').slice(0,60)}</td>)}
     <td>{edit&&<button className="btn alt" onClick={()=>setF(r)}>Edit</button>} {del&&<button className="btn danger" onClick={()=>rm(r)}>Delete</button>}</td></tr>)}</tbody></table></div>:<p>No records found.</p>}}</Load></div>;}

const SECTIONS={
 users:{cols:['id','name','email','role','status','sellerStatus'],fields:[T('name','Name',1),st('active,suspended'),{k:'sellerStatus',label:'Seller status',t:'select',o:['','pending','approved','rejected']}],add:false},
 categories:{cols:['id','name'],fields:[T('name','Name',1)]},
 products:{cols:['id','name','category','price','stock','status'],fields:[T('name','Name',1),T('description','Description',0,'textarea'),T('category','Category',1),T('sellerId','Seller user ID',1,'number'),T('price','Price',1,'number'),T('stock','Stock',1,'number'),T('image','Image URL'),st('pending,approved,rejected')],def:{available:true}},
 inventory:{col:'products',cols:['id','name','stock'],fields:[T('stock','Stock',1,'number')],add:false,del:false},
 orders:{cols:['id','customerName','total','status'],fields:[st('Placed,Confirmed,Processing,Shipped,Delivered,Cancelled')],add:false,del:false},
 reviews:{cols:['id','productId','userName','rating','comment','status'],fields:[st('Pending,Approved,Rejected')],add:false},
 coupons:{cols:['id','code','type','value','minOrder','expiry','limit','used','active'],fields:[T('code','Code',1),{k:'type',label:'Type',t:'select',o:['percent','flat']},T('value','Value',1,'number'),T('minOrder','Min order',1,'number'),T('expiry','Expiry',1,'date'),T('limit','Usage limit',1,'number'),T('active','Active',0,'bool')],def:{used:0}},
 trainingPrograms:{cols:['id','title','category','seats','startDate','status'],fields:[T('title','Title',1),T('category','Category',1),T('duration'),T('instructor'),T('seats','Seats',1,'number'),T('startDate','Start date',1,'date'),T('mode','Location / format'),st('open,closed')]},
 trainingApplications:{col:'trainingApplications',cols:['id','programId','userName','status'],fields:[st('Submitted,Confirmed,Rejected,Cancelled')],add:false},
 jobs:{cols:['id','title','location','mode','type','deadline','status'],fields:[T('title','Title',1),T('location',0,1),T('mode','Work mode'),T('type','Employment type'),T('salary'),T('deadline','Deadline',1,'date'),st('open,closed')]},
 jobApplications:{cols:['id','jobId','userName','status'],fields:[st('Submitted,Under Review,Shortlisted,Rejected')],add:false},
 selfHelpGroups:{cols:['id','name','location','leaderId','status'],fields:[T('name','Name',1),T('location','Location',1),T('description',0,0,'textarea'),T('objectives'),T('activities'),T('leaderId','Leader user ID',1,'number'),T('baseMembers','Starting members',0,'number'),st('Approved,Pending,Rejected')]},
 groupMemberships:{cols:['id','groupId','userName','status'],fields:[st('Pending,Approved,Rejected')],add:false},
 successStories:{cols:['id','title','author','status'],fields:[T('title','Title',1),T('author','Author',1),T('business'),T('challenges',0,0,'textarea'),T('achievements',0,0,'textarea'),T('image','Image URL'),st('Pending,Approved,Rejected')]},
 mentorshipRequests:{cols:['id','ref','userName','businessIdea','supportCategory','mentor','status'],fields:[T('mentor','Assigned mentor (demo name)'),st('Submitted,Under Review,Assigned,Completed,Rejected'),resp],add:false},
 initiatives:{cols:['id','title','target','deadline','status'],fields:[T('title','Title',1),T('description',0,0,'textarea'),T('image','Image URL'),T('target','Target ₹',1,'number'),T('deadline','Deadline',1,'date'),st('active,paused,closed')]},
 donations:{cols:['id','receipt','donorName','initiativeId','amount','createdAt'],fields:[],add:false,edit:false,del:false},
 financialAssistanceApplications:{cols:['id','ref','userName','category','amount','status'],fields:[st('Submitted,Under Review,Additional Information Required,Approved,Rejected'),resp],add:false},
 volunteerApplications:{cols:['id','userName','skills','availability','status','assignedActivity'],fields:[st('Submitted,Approved,Rejected'),T('assignedActivity','Assigned activity')],add:false},
 events:{cols:['id','title','date','location','capacity','status'],fields:[T('title','Title',1),T('description',0,0,'textarea'),T('date','Date',1,'date'),T('time','Time'),T('location','Location'),T('capacity','Capacity',1,'number'),st('Scheduled,Cancelled,Completed')]},
 eventRegistrations:{cols:['id','eventId','userName','status','attended'],fields:[st('Registered,Cancelled'),T('attended','Attended',0,'bool')],add:false},
 forumPosts:{cols:['id','title','userName','category','status'],fields:[st('visible,hidden')],add:false},
 forumComments:{cols:['id','postId','userName','body','status'],fields:[st('visible,hidden')],add:false},
 reports:{cols:['id','targetType','targetId','reason','status'],fields:[st('Open,Resolved,Dismissed')],add:false},
 complaints:{cols:['id','ref','userName','type','subject','status'],fields:[st('Submitted,Under Review,Resolved,Rejected'),resp],add:false},
 supportTickets:{cols:['id','ref','userName','subject','priority','status'],fields:[st('Open,In Progress,Waiting for User,Resolved'),resp],add:false},
 faqs:{cols:['id','category','question'],fields:[T('category','Category',1),T('question','Question',1),T('answer','Answer',1,'textarea')]},
 contactMessages:{cols:['id','name','email','subject','message','status'],fields:[st('New,Read,Replied')],add:false},
 activityLogs:{cols:['id','adminId','action','target','createdAt'],fields:[],add:false,edit:false,del:false}};

export function AdminHub(){const {section='users'}=useParams();const cats=useLoad('/categories');let c=SECTIONS[section];
  if(section==='products'&&cats.data&&cats.data.length)c={...c,fields:c.fields.map(x=>x.k==='category'?{...x,t:'select',o:cats.data.map(y=>y.name)}:x)};
  return <Page title="Admin management">{section==='analytics'?<Analytics/>:c?<><h2>{section}</h2>{section==='activityLogs'&&<p className="muted">Demo records only, not a tamper-proof audit log.</p>}<Crud key={section} col={c.col||section} {...c}/></>:<p>Unknown section.</p>}</Page>;}

const cnt=(a,k)=>a.reduce((m,x)=>{const v=(typeof k==='function'?k(x):x[k])||'n/a';m[v]=(m[v]||0)+1;return m},{});
function Bars({title,data}){const mx=Math.max(1,...Object.values(data));return <div className="card"><h3>{title}</h3>{Object.entries(data).map(([k,v])=><div key={k}>{k}: <b>{v}</b><div className="bar"><i style={{width:v/mx*100+'%'}}/></div></div>)}{!Object.keys(data).length&&<p className="muted">No data</p>}</div>}
function Analytics(){const names=['users','products','orders','donations','initiatives','trainingApplications','jobApplications','volunteerApplications','financialAssistanceApplications'];
  const [d,setD]=useState(null),[e,setE]=useState(null),[from,setFrom]=useState(''),[to,setTo]=useState('');
  useEffect(()=>{Promise.all(names.map(n=>api.get('/'+n))).then(r=>setD(Object.fromEntries(names.map((n,i)=>[n,r[i]])))).catch(()=>setE('Could not load analytics data'))},[]);
  if(e)return <p className="err">{e}</p>;if(!d)return <p>Loading…</p>;
  const R=a=>a.filter(x=>{const c=(x.createdAt||'').slice(0,10);return(!from||c>=from)&&(!to||c<=to)});
  const o=R(d.orders),live=o.filter(x=>x.status!=='Cancelled'),don=R(d.donations);
  const sets=[['User registrations by month',cnt(R(d.users),x=>(x.createdAt||'seed').slice(0,7))],['Products by category',cnt(d.products,'category')],['Product approval',cnt(d.products,'status')],['Order status',cnt(o,'status')],
   ['Sales by date (₹)',live.reduce((m,x)=>(m[x.createdAt]=(m[x.createdAt]||0)+x.total,m),{})],
   ['Donations by campaign (₹)',don.reduce((m,x)=>{const t=(d.initiatives.find(i=>i.id===x.initiativeId)||{}).title||'Unknown';m[t]=(m[t]||0)+x.amount;return m},{})],
   ['Training applications',cnt(R(d.trainingApplications),'status')],['Job applications',cnt(R(d.jobApplications),'status')],['Volunteer applications',cnt(R(d.volunteerApplications),'status')],['Assistance applications',cnt(R(d.financialAssistanceApplications),'status')]];
  const csv=[['metric','label','value'],...sets.flatMap(([t,m])=>Object.entries(m).map(([k,v])=>[t,k,v]))].map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const dl=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='sakhi-report.csv';a.click()};
  return <><div className="row"><div><label htmlFor="fr">From</label><input id="fr" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></div><div><label htmlFor="to">To</label><input id="to" type="date" value={to} onChange={e=>setTo(e.target.value)}/></div><button className="btn" onClick={dl}>Export CSV</button></div>
   <div className="stats"><div className="card stat"><b>{o.length}</b>Orders</div><div className="card stat"><b>{inr(live.reduce((s,x)=>s+x.total,0))}</b>Simulated sales (orders only)</div><div className="card stat"><b>{inr(don.reduce((s,x)=>s+x.amount,0))}</b>Simulated donations (donations only)</div></div>
   <div className="grid">{sets.map(([t,m])=><Chart key={t} title={t} data={m} type={t.startsWith('Sales')?'line':/status|approval|applications/i.test(t)?'pie':'bar'}/>)}</div></>;}

export function Submissions({title,col,fields,intro,guest,prefix,statusDef='Submitted',allow}){
  const {user,say}=useApp();const init=()=>Object.fromEntries(fields.map(x=>[x.k,x.o?x.o[0]:'']));const [f,setF]=useState(init);const [done,setDone]=useState('');
  const mine=useLoad(`/${col}?userId=${user?user.id:-1}`);
  if(!user&&!guest)return <Page title={title}><p>Please <Link to="/login">login</Link> to continue.</p></Page>;
  if(allow&&user&&!allow.includes(user.role))return <Page title={title}><p>This page is not available for your role.</p></Page>;
  const sub=async e=>{e.preventDefault();for(const x of fields){const v=String(f[x.k]).trim();if(x.req&&!v)return say(x.label+' is required',1);if(x.email&&v&&!/\S+@\S+\.\S+/.test(v))return say('Enter a valid email',1)}
   const ref=prefix?prefix+'-'+Date.now().toString().slice(-6):undefined;const b={...f};fields.forEach(x=>{if(x.t==='number')b[x.k]=+b[x.k]||0});
   try{await api.post('/'+col,{...b,ref,userId:user?.id,userName:user?.name,status:statusDef,createdAt:today()});if(user)await notify(user.id,`${title}: submitted${ref?' ('+ref+')':''}`);
    setDone(ref||'Submitted successfully');setF(init());say('Submitted');mine.reload()}catch{say('Submit failed. Is the API running?',1)}};
  return <Page title={title}>{intro}{done&&<p role="status" className="card">✔ Confirmation: <b>{done}</b></p>}
   <form className="card" onSubmit={sub}>{fields.map(x=><Field key={x.k} x={x} v={f[x.k]} set={v=>setF({...f,[x.k]:v})}/>)}<br/><button className="btn">Submit</button></form>
   {user&&<><h2>My submissions</h2><Load s={mine}>{l=>l.length?<div className="tw"><table><thead><tr><th>Ref</th><th>Summary</th><th>Status</th><th>Response / assignment</th></tr></thead><tbody>{l.map(r=><tr key={r.id}><td>{r.ref||r.id}</td><td>{String(r[fields[0].k]).slice(0,50)}</td><td><span className="badge">{r.status}</span></td><td>{r.adminResponse||r.assignedActivity||r.mentor||''}</td></tr>)}</tbody></table></div>:<p>Nothing submitted yet.</p>}</Load></>}</Page>;}

const F=(k,label,req,t,o)=>({k,label,req,t,o});
const Resources=()=><div className="card"><h3>Entrepreneurship resource center</h3><ul>{['Business planning','Pricing and profit calculation','Product photography','Packaging','Marketing','Customer service','Digital selling','Financial literacy'].map(x=><li key={x}>{x}</li>)}</ul></div>;
export const Mentorship=()=><Submissions title="Mentorship" col="mentorshipRequests" prefix="MEN" intro={<Resources/>} fields={[F('businessIdea','Business idea',1),F('supportCategory','Support category',0,'select',['Business planning','Pricing','Marketing','Digital selling','Finance']),F('description','Describe your goals',1,'textarea')]}/>;
export const Assistance=()=><Submissions title="Welfare assistance" col="financialAssistanceApplications" prefix="AST" intro={<p className="muted">Demo form. Do not enter real ID numbers or bank details.</p>} fields={[F('category','Category',0,'select',['Education','Livelihood','Skill development','Emergency']),F('description','Request description',1,'textarea'),F('amount','Requested amount (₹)',0,'number'),F('contact','Contact (demo)',1),F('docRef','Supporting document reference (optional)')]}/>;
export const Volunteer=()=><Submissions title="Volunteer application" col="volunteerApplications" allow={['volunteer']} fields={[F('skills','Skills and interests',1),F('availability','Availability',0,'select',['Weekdays','Weekends','Evenings','Flexible']),F('preferredActivity','Preferred activity',0,'select',['Workshops','Awareness drives','Teaching','Event support'])]}/>;
export const Support=()=><Submissions title="Support tickets" col="supportTickets" prefix="TKT" statusDef="Open" fields={[F('subject','Subject',1),F('priority','Priority',0,'select',['Low','Medium','High']),F('description','Describe the issue',1,'textarea')]}/>;
export const Feedback=()=><Submissions title="Feedback & complaints" col="complaints" prefix="CMP" fields={[F('type','Type',0,'select',['Feedback','Suggestion','Complaint']),F('subject','Subject',1),F('description','Details',1,'textarea')]}/>;
export const Contact=()=><Submissions title="Contact us" col="contactMessages" guest statusDef="New" fields={[F('name','Name',1),F('email','Email',1,'email'),F('subject','Subject',1),F('message','Message',1,'textarea')].map(x=>x.k==='email'?{...x,email:1}:x)}/>;
export const SubmitStory=()=><Submissions title="Submit your success story" col="successStories" allow={['seller']} statusDef="Pending" intro={<p className="muted">Stories appear publicly only after admin approval.</p>} fields={[F('title','Title',1),F('author','Your name',1),F('business','Business description',1),F('challenges','Challenges',0,'textarea'),F('achievements','Achievements',0,'textarea'),F('image','Profile image URL')]}/>;

export function WishBtn({productId}){const {user,say}=useApp();
  const add=async()=>{if(!user)return say('Please login first',1);if((await api.get(`/wishlists?userId=${user.id}&productId=${productId}`)).length)return say('Already in wishlist',1);await api.post('/wishlists',{userId:user.id,productId,createdAt:today()});say('Saved to wishlist')};
  return <button className="btn alt" onClick={add}>♡ Wishlist</button>;}
export function Wishlist(){const {user,say}=useApp();const w=useLoad('/wishlists?userId='+user.id),p=useLoad('/products');
  const rm=async x=>{await api.del('/wishlists/'+x.id);say('Removed');w.reload()};
  return <Page title="My wishlist"><Load s={w}>{l=>l.length?<div className="grid">{l.map(x=>{const pr=(p.data||[]).find(y=>y.id===x.productId);return pr?<div className="card" key={x.id}><img src={pr.image} alt={pr.name} onError={fallback}/><h3>{pr.name}</h3><p>{inr(pr.price)}</p><Link className="btn" to={'/shop/'+pr.id}>View</Link> <button className="btn alt" onClick={()=>rm(x)}>Remove</button></div>:null})}</div>:<p>Your wishlist is empty.</p>}</Load></Page>;}

export function ReviewBox({product}){const {user,say}=useApp();const r=useLoad('/reviews?productId='+product.id),rel=useLoad('/products?category='+encodeURIComponent(product.category));
  const [f,setF]=useState({rating:'5',comment:''}),[ok,setOk]=useState(false);
  useEffect(()=>{if(user)api.get(`/orders?buyerId=${user.id}&status=Delivered`).then(o=>setOk(o.some(x=>x.items.some(i=>i.productId===product.id)))).catch(()=>{})},[user,product.id]);
  const ap=(r.data||[]).filter(x=>x.status==='Approved'),avg=ap.length?(ap.reduce((s,x)=>s+x.rating,0)/ap.length).toFixed(1):null;
  const sub=async e=>{e.preventDefault();if(!f.comment.trim())return say('Write a short review',1);if((r.data||[]).some(x=>x.userId===user.id))return say('You already reviewed this product',1);
   await api.post('/reviews',{productId:product.id,userId:user.id,userName:user.name,rating:+f.rating,comment:f.comment,status:'Pending',createdAt:today()});say('Review sent for moderation');setF({rating:'5',comment:''});r.reload()};
  return <><h3>Reviews {avg&&`· ★ ${avg} (${ap.length})`}</h3>{ap.map(x=><div className="card" key={x.id} style={{margin:'.4rem 0'}}>{'★'.repeat(x.rating)} <b>{x.userName}</b><p>{x.comment}</p></div>)}{!ap.length&&<p className="muted">No approved reviews yet.</p>}
   {ok?<form className="card" onSubmit={sub}><label htmlFor="rt">Rating</label><select id="rt" value={f.rating} onChange={e=>setF({...f,rating:e.target.value})}>{[5,4,3,2,1].map(n=><option key={n}>{n}</option>)}</select><label htmlFor="rc">Your review</label><textarea id="rc" value={f.comment} onChange={e=>setF({...f,comment:e.target.value})}/><br/><button className="btn">Submit review</button></form>:<p className="muted">Only buyers with a delivered order can review.</p>}
   <h3>Related products</h3><div className="grid">{(rel.data||[]).filter(x=>x.id!==product.id&&x.status==='approved').slice(0,3).map(x=><Link key={x.id} className="card" to={'/shop/'+x.id}>{x.name} · {inr(x.price)}</Link>)}</div></>;}

export function Stories(){const {user}=useApp();const s=useLoad('/successStories'),u=useLoad('/users');
  const ok=(s.data||[]).filter(x=>x.status==='Approved'),sellers=(u.data||[]).filter(x=>x.role==='seller'&&x.sellerStatus==='approved');
  return <Page title="Success stories & women entrepreneurs">{user?.role==='seller'&&<p><Link className="btn" to="/stories/submit">Submit your story</Link></p>}
   <Load s={s}>{()=><div className="grid">{ok.map(x=><div className="card" key={x.id}><img src={x.image} alt={x.author} onError={fallback}/><h3>{x.title}</h3><p><b>{x.author}</b> · {x.business}</p><p>Challenge: {x.challenges}</p><p>Achievement: {x.achievements}</p></div>)}</div>}</Load>
   <h2>Entrepreneur directory</h2><div className="grid">{sellers.map(x=><div className="card" key={x.id}><h3>{x.name}</h3><p>{x.business}</p></div>)}</div></Page>;}

export function Groups(){const {user,say}=useApp();const g=useLoad('/selfHelpGroups'),m=useLoad('/groupMemberships');const M=m.data||[];
  const join=async x=>{if(!user)return say('Please login',1);if(M.some(r=>r.groupId===x.id&&r.userId===user.id&&r.status!=='Rejected'))return say('You already requested to join',1);
   await api.post('/groupMemberships',{groupId:x.id,userId:user.id,userName:user.name,status:'Pending',createdAt:today()});await notify(user.id,'Membership request sent: '+x.name);say('Request sent');m.reload()};
  const decide=async(r,s)=>{await api.patch('/groupMemberships/'+r.id,{status:s});await notify(r.userId,'Group membership '+s);m.reload()};
  const editD=async x=>{const d=prompt('New description',x.description);if(d){await api.patch('/selfHelpGroups/'+x.id,{description:d});g.reload()}};
  return <Page title="Self-help groups"><Load s={g}>{l=><div className="grid">{l.filter(x=>x.status==='Approved').map(x=>{const mine=M.find(r=>r.groupId===x.id&&r.userId===user?.id);const pend=M.filter(r=>r.groupId===x.id&&r.status==='Pending');
   return <div className="card" key={x.id}><h3>{x.name}</h3><p>{x.location} · {(x.baseMembers||0)+M.filter(r=>r.groupId===x.id&&r.status==='Approved').length} members</p><p>{x.description}</p><p className="muted">{x.objectives} · {x.activities}</p>
    {mine?<span className="badge">Your request: {mine.status}</span>:<button className="btn" onClick={()=>join(x)}>Request to join</button>}
    {user?.id===x.leaderId&&<><p><button className="btn alt" onClick={()=>editD(x)}>Edit description</button></p>{pend.map(r=><p key={r.id}>{r.userName} <button className="btn" onClick={()=>decide(r,'Approved')}>Approve</button> <button className="btn danger" onClick={()=>decide(r,'Rejected')}>Reject</button></p>)}</>}</div>})}</div>}</Load></Page>;}

export function Events(){const {user,say}=useApp();const e=useLoad('/events'),r=useLoad('/eventRegistrations');const R=r.data||[];
  const reg=async x=>{if(!user)return say('Please login',1);const act=R.filter(y=>y.eventId===x.id&&y.status==='Registered');if(act.some(y=>y.userId===user.id))return say('Already registered',1);if(act.length>=x.capacity)return say('This event is full',1);
   await api.post('/eventRegistrations',{eventId:x.id,userId:user.id,userName:user.name,status:'Registered',attended:false,createdAt:today()});await notify(user.id,'Registered for '+x.title);say('Registered');r.reload()};
  const cancel=async y=>{await api.patch('/eventRegistrations/'+y.id,{status:'Cancelled'});say('Registration cancelled');r.reload()};
  return <Page title="Community events"><Load s={e}>{l=><div className="grid">{l.map(x=>{const act=R.filter(y=>y.eventId===x.id&&y.status==='Registered');const mine=act.find(y=>y.userId===user?.id);
   return <div className="card" key={x.id}><h3>{x.title}</h3><p>{x.description}</p><p className="muted">{x.date} {x.time} · {x.location} · {act.length}/{x.capacity} · <span className="badge">{x.status}</span></p>
    {x.status==='Scheduled'&&(mine?<button className="btn alt" onClick={()=>cancel(mine)}>Cancel registration</button>:<button className="btn" disabled={act.length>=x.capacity} onClick={()=>reg(x)}>{act.length>=x.capacity?'Full':'Register'}</button>)}</div>})}</div>}</Load></Page>;}

export function Forum(){const {user,say}=useApp();const p=useLoad('/forumPosts'),c=useLoad('/forumComments');
  const blank={title:'',category:'Entrepreneurship',body:''};const [f,setF]=useState(blank),[ed,setEd]=useState(null),[cm,setCm]=useState({});
  const post=async e=>{e.preventDefault();if(!user)return say('Please login to post',1);if(!f.title.trim()||!f.body.trim())return say('Title and text are required',1);
   if(ed){try{await assertOwner('/forumPosts/'+ed,'userId',user.id)}catch(er){return say(er.message,1)}await api.patch('/forumPosts/'+ed,f)}else await api.post('/forumPosts',{...f,userId:user.id,userName:user.name,status:'visible',createdAt:today()});setEd(null);setF(blank);say('Saved');p.reload()};
  const rm=async x=>{if(x.userId!==user?.id&&user?.role!=='admin')return say('Not allowed',1);if(!confirm('Delete this post?'))return;await api.del('/forumPosts/'+x.id);p.reload()};
  const comment=async x=>{if(!user)return say('Please login',1);if(!(cm[x.id]||'').trim())return;await api.post('/forumComments',{postId:x.id,userId:user.id,userName:user.name,body:cm[x.id],status:'visible',createdAt:today()});setCm({...cm,[x.id]:''});c.reload()};
  const report=async(t,id)=>{if(!user)return say('Please login',1);const reason=prompt('Why are you reporting this?');if(reason){await api.post('/reports',{targetType:t,targetId:id,reporterId:user.id,reason,status:'Open',createdAt:today()});say('Reported to admins')}};
  return <Page title="Community forum"><form className="card" onSubmit={post}><h3>{ed?'Edit post':'New discussion'}</h3><label htmlFor="ft">Title</label><input id="ft" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
   <label htmlFor="fc">Category</label><select id="fc" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{['Entrepreneurship','Education','Employment','Skill Development','Women Empowerment','Community Support'].map(x=><option key={x}>{x}</option>)}</select>
   <label htmlFor="fb">Message</label><textarea id="fb" value={f.body} onChange={e=>setF({...f,body:e.target.value})}/><br/><button className="btn">{ed?'Update':'Post'}</button></form>
   <Load s={p}>{l=>l.filter(x=>x.status==='visible').slice().reverse().map(x=><div className="card" key={x.id} style={{margin:'1rem 0'}}><h3>{x.title}</h3><p className="muted">{x.category} · {x.userName} · {x.createdAt}</p><p>{x.body}</p>
    {user?.id===x.userId&&<><button className="btn alt" onClick={()=>{setEd(x.id);setF({title:x.title,category:x.category,body:x.body})}}>Edit</button> </>}{(user?.id===x.userId||user?.role==='admin')&&<button className="btn danger" onClick={()=>rm(x)}>Delete</button>} <button className="btn alt" onClick={()=>report('post',x.id)}>Report</button>
    {(c.data||[]).filter(y=>y.postId===x.id&&y.status==='visible').map(y=><p key={y.id}>💬 <b>{y.userName}</b>: {y.body} <a href="#" onClick={e=>{e.preventDefault();report('comment',y.id)}}>report</a></p>)}
    <div className="row"><input aria-label="Comment" placeholder="Write a comment" value={cm[x.id]||''} onChange={e=>setCm({...cm,[x.id]:e.target.value})}/><button className="btn" onClick={()=>comment(x)}>Comment</button></div></div>)}</Load></Page>;}

export function Faq(){const f=useLoad('/faqs');const [q,setQ]=useState('');
  return <Page title="FAQ"><input aria-label="Search FAQs" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/><Load s={f}>{l=>l.filter(x=>(x.question+x.answer+x.category).toLowerCase().includes(q.toLowerCase())).map(x=><details className="card" key={x.id} style={{margin:'.5rem 0'}}><summary><b>{x.question}</b> <span className="badge">{x.category}</span></summary><p>{x.answer}</p></details>)}</Load></Page>;}

export const Privacy=()=><Page title="Privacy policy"><div className="card"><p>Sakhi is a learning demo. Data lives in a local db.json served by JSON Server, which has no authentication or encryption. Demo passwords are stored as plain text, and role checks run in your browser, so they are not a security boundary.</p><p>Never enter real personal, financial or identity information. Orders and donations are simulated and no money moves. A production system needs a trusted backend, hashed credentials and server-side authorization.</p></div></Page>;
export const Terms=()=><Page title="Terms and conditions"><div className="card"><p>This site is for demonstration only. Jobs, training, welfare assistance, receipts and orders are fictional and carry no real obligation. Demo receipts are not tax receipts. Activity logs are demo records and not tamper-proof.</p></div></Page>;

export function Profile(){const {user,saveUser,say}=useApp();const [f,setF]=useState({name:user.name,image:user.image||'',business:user.business||'',emailAlerts:user.emailAlerts!==false});
  const save=async e=>{e.preventDefault();if(!f.name.trim())return say('Name is required',1);const u=await api.patch('/users/'+user.id,{name:f.name,image:f.image,emailAlerts:f.emailAlerts,...(user.role==='seller'?{business:f.business}:{})});saveUser(u);say('Profile saved')};
  return <Page title="Profile"><form className="card" onSubmit={save}><p>Role: <span className="badge">{user.role}</span> (cannot be changed here)</p><label htmlFor="pn">Name</label><input id="pn" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
   <label htmlFor="pi">Profile image URL</label><input id="pi" value={f.image} onChange={e=>setF({...f,image:e.target.value})}/>{user.role==='seller'&&<><label htmlFor="pb">Business description</label><input id="pb" value={f.business} onChange={e=>setF({...f,business:e.target.value})}/></>}
   <label><input type="checkbox" style={{width:'auto'}} checked={f.emailAlerts} onChange={e=>setF({...f,emailAlerts:e.target.checked})}/> Notification preference (demo)</label><p className="muted">Password changes are not offered: this demo stores only fictional plain-text passwords.</p><button className="btn">Save</button></form></Page>;}

export function Hub(){const {user}=useApp();const L=[['/events','Events'],['/forum','Community forum'],['/groups','Self-help groups'],['/stories','Success stories'],['/mentorship','Mentorship'],['/assistance','Welfare assistance'],['/support','Support tickets'],['/feedback','Feedback & complaints'],['/faq','FAQ'],['/contact','Contact'],['/wishlist','Wishlist'],['/profile','Profile'],['/privacy','Privacy'],['/terms','Terms']];
  if(user?.role==='volunteer')L.unshift(['/volunteer','Volunteer application']);if(user?.role==='admin')L.unshift(['/admin/users','Admin management']);
  return <Page title="All pages"><div className="grid">{L.map(([t,n])=><Link className="card" key={t} to={t}>{n}</Link>)}</div></Page>;}
