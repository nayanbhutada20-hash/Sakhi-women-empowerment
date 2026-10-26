import {Link} from 'react-router-dom';
import {useApp,useLoad,Load,Page,inr,fallback} from './App.jsx';
import Chart from './Chart.jsx';

const Bars=({title,data})=>{const mx=Math.max(1,...Object.values(data));return <div className="card"><h3>{title}</h3>{Object.entries(data).map(([k,v])=><div key={k}>{k}: <b>{v}</b><div className="bar"><i style={{width:v/mx*100+'%'}}/></div></div>)}{!Object.keys(data).length&&<p className="muted">No data yet</p>}</div>};
const L=x=>x.data||[];

export function HomeExtras(){const c=useLoad('/categories'),s=useLoad('/successStories'),t=useLoad('/trainingPrograms'),j=useLoad('/jobs'),i=useLoad('/initiatives'),d=useLoad('/donations'),e=useLoad('/events'),te=useLoad('/testimonials');
  const raised=id=>L(d).filter(x=>x.initiativeId===id).reduce((a,x)=>a+x.amount,0);
  return <>
   <h2>Shop by category</h2><div className="row">{L(c).map(x=><Link key={x.id} className="btn alt" style={{flex:'0 0 auto'}} to="/shop">{x.name}</Link>)}</div>
   <h2>Women entrepreneur success stories</h2><div className="grid">{L(s).filter(x=>x.status==='Approved').slice(0,3).map(x=><div className="card" key={x.id}><img src={x.image} alt={x.author} onError={fallback}/><h3>{x.title}</h3><p>{x.author} · {x.business}</p></div>)}</div><p><Link to="/stories">More stories →</Link></p>
   <h2>Training &amp; employment</h2><div className="grid">{L(t).filter(x=>x.status==='open').slice(0,2).map(x=><Link className="card" key={'t'+x.id} to="/training"><b>{x.title}</b><p className="muted">{x.duration} · {x.mode}</p></Link>)}{L(j).filter(x=>x.status==='open').slice(0,2).map(x=><Link className="card" key={'j'+x.id} to="/jobs"><b>{x.title}</b><p className="muted">{x.location} · {x.mode}</p></Link>)}</div>
   <h2>Active welfare campaigns</h2><div className="grid">{L(i).filter(x=>x.status==='active').map(x=><Link className="card" key={x.id} to="/donate"><b>{x.title}</b><div className="bar"><i style={{width:Math.min(100,raised(x.id)/x.target*100)+'%'}}/></div><p className="muted">{inr(raised(x.id))} of {inr(x.target)}</p></Link>)}</div>
   <h2>Community events</h2><div className="grid">{L(e).filter(x=>x.status==='Scheduled').slice(0,3).map(x=><Link className="card" key={x.id} to="/events"><b>{x.title}</b><p className="muted">{x.date} · {x.location}</p></Link>)}</div>
   <h2>Testimonials</h2><div className="grid">{L(te).map(x=><blockquote className="card" key={x.id} style={{margin:0}}>“{x.text}”<footer className="muted">— {x.name}, {x.role}</footer></blockquote>)}</div>
   <div className="hero" style={{marginTop:'1.5rem',textAlign:'center'}}><h2>Ready to begin your journey?</h2><Link className="btn alt" to="/register">Join Sakhi</Link></div></>;}

export function Footer(){return <footer style={{background:'#2a1038',color:'#eee',padding:'1.5rem 1.2rem',marginTop:'2rem'}}><div style={{maxWidth:1100,margin:'0 auto'}} className="row">
  <div><b>🪷 Sakhi</b><p>Empowering women through skills, work and community. Demo project: simulated orders and donations.</p></div>
  <div><b>Explore</b><br/>{[['/shop','Shop'],['/training','Training'],['/jobs','Jobs'],['/donate','Campaigns'],['/events','Events']].map(([t,n])=><div key={t}><Link style={{color:'#e6d3f3'}} to={t}>{n}</Link></div>)}</div>
  <div><b>Help</b><br/>{[['/faq','FAQ'],['/contact','Contact'],['/support','Support'],['/privacy','Privacy'],['/terms','Terms']].map(([t,n])=><div key={t}><Link style={{color:'#e6d3f3'}} to={t}>{n}</Link></div>)}</div></div></footer>;}

export function UserDash(){const {user}=useApp();const id=user.id;
  const o=useLoad('/orders?buyerId='+id),dn=useLoad('/donations?donorId='+id),er=useLoad('/eventRegistrations?userId='+id),ev=useLoad('/events'),fp=useLoad('/forumPosts?userId='+id),fc=useLoad('/forumComments?userId='+id),tk=useLoad('/supportTickets?userId='+id),n=useLoad('/notifications?userId='+id),w=useLoad('/wishlists?userId='+id),rv=useLoad('/reviews?userId='+id),va=useLoad('/volunteerApplications?userId='+id);
  const regs=L(er).filter(r=>r.status==='Registered'),unread=L(n).filter(x=>!x.read).length,myVol=L(va)[0];
  const stats=[...(user.role==='buyer'?[['Orders',L(o).length],['Wishlist',L(w).length],['Reviews',L(rv).length]]:[]),...(user.role==='donor'||L(dn).length?[['Donated (simulated)',inr(L(dn).reduce((s,x)=>s+x.amount,0))]]:[]),
   ...(user.role==='volunteer'?[['Application',myVol?myVol.status:'Not applied']]:[]),['Events registered',regs.length],['Open tickets',L(tk).filter(x=>x.status!=='Resolved').length],['Unread alerts',unread]];
  return <main id="main"><h1>Welcome, {user.name}</h1>
   <div className="card row" style={{alignItems:'center'}}>{user.image&&<img src={user.image} alt="" style={{width:64,height:64,borderRadius:'50%',flex:'0 0 64px'}} onError={fallback}/>}<div><b>{user.name}</b><br/><span className="muted">{user.email}</span><br/><span className="badge">{user.role}</span> <Link to="/profile">Edit profile</Link></div></div>
   <div className="stats">{stats.map(([k,v])=><div className="card stat" key={k}><b>{v}</b>{k}</div>)}</div>
   {user.role==='volunteer'&&<div className="card"><h3>Volunteer status</h3>{myVol?<p>Status: <span className="badge">{myVol.status}</span> · Assigned activity: {myVol.assignedActivity||'None yet'}</p>:<p>You have not applied yet. <Link to="/volunteer">Apply now</Link></p>}</div>}
   {user.role==='buyer'&&<><h2>Recent orders</h2>{L(o).length?L(o).slice(-3).reverse().map(x=><div className="card" key={x.id} style={{margin:'.4rem 0'}}><b>{x.id}</b> · {inr(x.total)} · <span className="badge">{x.status}</span></div>):<p>No orders yet. <Link to="/shop">Start shopping</Link></p>}<p><Link to="/orders">All orders</Link> · <Link to="/cart">Cart</Link> · <Link to="/wishlist">Wishlist</Link></p></>}
   {L(dn).length>0&&<><h2>Donation history</h2><div className="tw"><table><thead><tr><th>Receipt</th><th>Amount</th><th>Date</th></tr></thead><tbody>{L(dn).map(x=><tr key={x.id}><td>{x.receipt}</td><td>{inr(x.amount)}</td><td>{x.createdAt}</td></tr>)}</tbody></table></div></>}
   {user.role==='donor'&&<p><Link className="btn" to="/donate">Donate (simulated)</Link></p>}
   <h2>My event registrations</h2>{regs.length?<ul>{regs.map(r=>{const x=L(ev).find(y=>y.id===r.eventId);return <li key={r.id}>{x?x.title+' · '+x.date:'Event #'+r.eventId}</li>})}</ul>:<p>None. <Link to="/events">Browse events</Link></p>}
   <h2>Community activity</h2><p>{L(fp).length} posts · {L(fc).length} comments · <Link to="/forum">Open forum</Link></p><ul>{L(fp).slice(-3).map(x=><li key={x.id}>{x.title}</li>)}</ul>
   <h2>Support tickets</h2>{L(tk).length?<ul>{L(tk).map(x=><li key={x.id}>{x.ref} · {x.subject} · <span className="badge">{x.status}</span></li>)}</ul>:<p>No tickets.</p>}<p><Link to="/support">Support</Link> · <Link to="/notifications">Notifications ({unread})</Link></p></main>;}

export function SellerReport({orders,uid}){
  const live=orders.filter(x=>x.status!=='Cancelled'),mine=x=>x.items.filter(i=>i.sellerId===uid);
  const byProd={},byDate={};live.forEach(x=>mine(x).forEach(i=>{byProd[i.name]=(byProd[i.name]||0)+i.price*i.qty;byDate[x.createdAt]=(byDate[x.createdAt]||0)+i.price*i.qty}));
  const stat={};orders.forEach(x=>stat[x.status]=(stat[x.status]||0)+1);
  const csv=['product,sales_inr',...Object.entries(byProd).map(([k,v])=>'"'+k.replace(/"/g,'""')+'",'+v)].join('\n');
  const dl=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='seller-sales.csv';a.click()};
  return <><h2>Sales report (simulated)</h2><div className="grid"><Chart title="Sales by product (₹)" data={byProd}/><Chart title="Sales by date (₹)" data={byDate} type="line"/><Chart title="Orders by status" data={stat} type="pie"/></div>
   <p><button className="btn alt" onClick={dl}>Export CSV</button></p>
   <h2>More tools</h2><div className="row">{[['/training','Training registrations'],['/mentorship','Mentorship requests'],['/stories/submit','Submit success story'],['/support','Support tickets'],['/notifications','Notifications'],['/profile','Profile']].map(([t,n])=><Link key={t} className="btn alt" to={t}>{n}</Link>)}</div></>;}

export function SellerExtras({uid}){const r=useLoad('/reviews'),p=useLoad('/products?sellerId='+uid),ta=useLoad('/trainingApplications?userId='+uid),tp=useLoad('/trainingPrograms'),m=useLoad('/mentorshipRequests?userId='+uid);
  const ids=L(p).map(x=>x.id),rv=L(r).filter(x=>x.status==='Approved'&&ids.includes(x.productId));
  return <><h2>Approved reviews on my products</h2>{rv.length?rv.map(x=><div className="card" key={x.id} style={{margin:'.4rem 0'}}>{'★'.repeat(x.rating)} {L(p).find(y=>y.id===x.productId)?.name} · <b>{x.userName}</b><p>{x.comment}</p></div>):<p>No approved reviews yet.</p>}
   <h2>My training registrations</h2>{L(ta).length?<ul>{L(ta).map(x=><li key={x.id}>{L(tp).find(y=>y.id===x.programId)?.title||'Program #'+x.programId} · <span className="badge">{x.status}</span></li>)}</ul>:<p>None yet. <Link to="/training">Browse training</Link></p>}
   <h2>My mentorship requests</h2>{L(m).length?<ul>{L(m).map(x=><li key={x.id}>{x.ref} · {x.businessIdea} · <span className="badge">{x.status}</span> {x.mentor&&<>· Mentor: {x.mentor}</>}</li>)}</ul>:<p>None yet. <Link to="/mentorship">Request mentorship</Link></p>}</>;}

export function MyReviews(){const {user}=useApp();const r=useLoad('/reviews?userId='+user.id),p=useLoad('/products');
  return <Page title="My reviews"><Load s={r}>{l=>l.length?l.map(x=><div className="card" key={x.id} style={{margin:'.5rem 0'}}>{'★'.repeat(x.rating)} <b>{L(p).find(y=>y.id===x.productId)?.name||'Product'}</b> <span className="badge">{x.status}</span><p>{x.comment}</p></div>):<p>No reviews yet. After an order is delivered you can review it from the product page.</p>}</Load></Page>;}
