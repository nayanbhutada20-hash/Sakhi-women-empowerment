import {useState,useEffect,createContext,useContext,useCallback} from 'react';
import {BrowserRouter,Routes,Route,Link,Navigate,useNavigate,useParams} from 'react-router-dom';
import {api,notify,logAction,assertOwner} from './api';
import DashLayout from './Layout.jsx';
import {MyReviews,HomeExtras,Footer,UserDash,SellerReport,SellerExtras} from './Extras.jsx';
import {AdminHub,Mentorship,Assistance,Volunteer,Support,Feedback,Contact,SubmitStory,Wishlist,WishBtn,ReviewBox,Stories,Groups,Events,Forum,Faq,Privacy,Terms,Profile,Hub} from './More.jsx';

const Ctx=createContext();const useApp=()=>useContext(Ctx);
const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const today=()=>new Date().toISOString().slice(0,10);
const fallback=e=>{e.target.src='https://placehold.co/400x300/F8F5FC/6A1B9A?text=Sakhi'};

function useLoad(path){
  const [s,set]=useState({data:null,loading:true,err:null});
  const reload=useCallback(()=>{api.get(path).then(d=>set({data:d,loading:false,err:null})).catch(()=>set({data:null,loading:false,err:'Could not reach the API. Is "npm run api" running?'}))},[path]);
  useEffect(reload,[reload]);return {...s,reload};
}
const Load=({s,children})=>s.loading?<p>Loading…</p>:s.err?<p className="err" role="alert">{s.err}</p>:children(s.data);

function Provider({children}){
  const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('sakhi_user')||'null'));
  const [cart,setCart]=useState(()=>JSON.parse(localStorage.getItem('sakhi_cart')||'[]'));
  const [toast,setToast]=useState(null);
  const say=(msg,bad)=>{setToast({msg,bad});setTimeout(()=>setToast(null),3000)};
  const saveUser=u=>{setUser(u);u?localStorage.setItem('sakhi_user',JSON.stringify(u)):localStorage.removeItem('sakhi_user')};
  const saveCart=c=>{setCart(c);localStorage.setItem('sakhi_cart',JSON.stringify(c))};
  return <Ctx.Provider value={{user,saveUser,cart,saveCart,say}}>{children}{toast&&<div role="status" className={'toast '+(toast.bad?'bad':'')}>{toast.msg}</div>}</Ctx.Provider>;
}

// Route guard (UI-level only, NOT real security)
const Guard=({roles,children})=>{const {user}=useApp();
  if(!user)return <Navigate to="/login"/>;
  if(roles&&!roles.includes(user.role))return <Page title="Unauthorized"><p>Your role ({user.role}) cannot open this page.</p></Page>;
  return children;};
const Page=({title,children})=><main id="main"><h1>{title}</h1>{children}</main>;

function Nav(){const {user,saveUser,cart}=useApp();const go=useNavigate();const [open,setOpen]=useState(false);
  return <><a className="skip" href="#main">Skip to content</a><nav className="top" aria-label="Main"><Link className="logo" to="/">🪷 Sakhi</Link><button className="burger" aria-expanded={open} aria-controls="menu" onClick={()=>setOpen(!open)}>☰ Menu</button><div id="menu" className={'menu'+(open?' open':'')} onClick={()=>setOpen(false)}>
   <Link to="/shop">Shop</Link><Link to="/training">Training</Link><Link to="/jobs">Jobs</Link><Link to="/donate">Campaigns</Link><Link to="/about">About</Link><Link to="/events">Events</Link><Link to="/forum">Community</Link><Link to="/more">More</Link>
   {user&&<><Link to="/cart">Cart ({cart.length})</Link><Link to="/dashboard">Dashboard</Link><Link to="/notifications">Alerts</Link><a href="#" onClick={e=>{e.preventDefault();saveUser(null);go('/')}}>Logout</a></>}
   {!user&&<><Link to="/login">Login</Link><Link to="/register">Register</Link></>}</div></nav></>;}

function Home(){
  const p=useLoad('/products'),u=useLoad('/users'),d=useLoad('/donations'),i=useLoad('/initiatives');
  const pub=(p.data||[]).filter(x=>x.status==='approved'&&x.available);
  return <main id="main"><div className="hero"><h1>Empowering Women, Transforming Lives.</h1>
   <p>Sakhi helps women sell products, learn skills, find work, and access welfare support.</p>
   <Link className="btn alt" to="/shop">Explore Products</Link><Link className="btn alt" to="/register">Become a Seller</Link><Link className="btn alt" to="/training">Join Training</Link><Link className="btn alt" to="/donate">Discover Welfare Programs</Link></div>
   <div className="stats"><div className="card stat"><b>{pub.length}</b>Products</div><div className="card stat"><b>{(u.data||[]).filter(x=>x.role==='seller'&&x.sellerStatus==='approved').length}</b>Women entrepreneurs</div>
   <div className="card stat"><b>{inr((d.data||[]).reduce((s,x)=>s+x.amount,0))}</b>Simulated donations</div><div className="card stat"><b>{(i.data||[]).filter(x=>x.status==='active').length}</b>Active campaigns</div></div>
   <h2>Featured products</h2><div className="grid">{pub.slice(0,4).map(x=><ProductCard key={x.id} p={x}/>)}</div><HomeExtras/></main>;}

const ProductCard=({p})=><div className="card"><img src={p.image} alt={p.name} onError={fallback}/><h3>{p.name}</h3><p>{inr(p.price)} · <span className="muted">{p.stock>0?p.stock+' in stock':'Out of stock'}</span></p><Link className="btn" to={'/shop/'+p.id}>View</Link></div>;

function Shop(){const p=useLoad('/products'),c=useLoad('/categories');
  const [q,setQ]=useState(''),[cat,setCat]=useState(''),[max,setMax]=useState(''),[sort,setSort]=useState('new'),[n,setN]=useState(6);
  return <Page title="Marketplace"><div className="row"><input aria-label="Search" placeholder="Search products" value={q} onChange={e=>setQ(e.target.value)}/>
   <select aria-label="Category" value={cat} onChange={e=>setCat(e.target.value)}><option value="">All categories</option>{(c.data||[]).map(x=><option key={x.id}>{x.name}</option>)}</select>
   <input aria-label="Max price" type="number" placeholder="Max ₹" value={max} onChange={e=>setMax(e.target.value)}/>
   <select aria-label="Sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="new">Newest</option><option value="lo">Price low-high</option><option value="hi">Price high-low</option></select></div><br/>
   <Load s={p}>{d=>{let l=d.filter(x=>x.status==='approved'&&x.available&&x.name.toLowerCase().includes(q.toLowerCase())&&(!cat||x.category===cat)&&(!max||x.price<=+max));
    l.sort((a,b)=>sort==='lo'?a.price-b.price:sort==='hi'?b.price-a.price:b.createdAt.localeCompare(a.createdAt));
    return l.length?<><div className="grid">{l.slice(0,n).map(x=><ProductCard key={x.id} p={x}/>)}</div>{n<l.length&&<p><button className="btn alt" onClick={()=>setN(n+6)}>Load more</button></p>}</>:<p>No products match your search.</p>}}</Load></Page>;}

function ProductDetail(){const {id}=useParams();const {user,cart,saveCart,say}=useApp();const p=useLoad('/products/'+id);
  const add=x=>{if(!user)return say('Please login first',1);const e=cart.find(i=>i.productId===x.id);const qty=(e?.qty||0)+1;
   if(qty>x.stock)return say('Not enough stock',1);saveCart(e?cart.map(i=>i.productId===x.id?{...i,qty}:i):[...cart,{productId:x.id,qty}]);say('Added to cart')};
  return <Page title="Product"><Load s={p}>{x=><><div className="card"><img src={x.image} alt={x.name} onError={fallback}/><h2>{x.name}</h2><p>{x.description}</p><p><b>{inr(x.price)}</b> · {x.category} · {x.stock} in stock</p>
   <button className="btn" disabled={x.stock<1||x.status!=='approved'} onClick={()=>add(x)}>Add to cart</button> <WishBtn productId={x.id}/></div><ReviewBox product={x}/></>}</Load></Page>;}

function Cart(){const {user,cart,saveCart,say}=useApp();const p=useLoad('/products');const go=useNavigate();
  const [code,setCode]=useState(''),[cp,setCp]=useState(null),[f,setF]=useState({name:user?.name||'',address:'',phone:''}),[busy,setBusy]=useState(false);
  const rows=(p.data||[]).length?cart.map(i=>({...i,p:p.data.find(x=>x.id===i.productId)})).filter(r=>r.p):[];
  const sub=rows.reduce((s,r)=>s+r.p.price*r.qty,0);
  const disc=cp?Math.min(sub,cp.type==='percent'?Math.round(sub*cp.value/100):cp.value):0;
  const setQty=(id,d)=>saveCart(cart.map(i=>i.productId===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const apply=async()=>{const l=await api.get('/coupons?code='+encodeURIComponent(code.toUpperCase()));const c=l[0];
   if(!c||!c.active||c.expiry<today()||c.used>=c.limit||sub<c.minOrder){setCp(null);return say('Coupon is invalid, expired or not eligible',1)}setCp(c);say('Coupon applied')};
  const place=async()=>{if(!f.name||!f.address||!/^\d{10}$/.test(f.phone))return say('Enter name, address and a 10-digit phone',1);setBusy(true);
   try{const fresh=await Promise.all(rows.map(r=>api.get('/products/'+r.p.id)));
    for(const [k,r] of rows.entries()){if(fresh[k].status!=='approved'||r.qty>fresh[k].stock)throw new Error(fresh[k].name+': not enough stock')}
    const items=rows.map(r=>({productId:r.p.id,sellerId:r.p.sellerId,name:r.p.name,price:r.p.price,qty:r.qty}));
    const sellerIds=[...new Set(items.map(i=>i.sellerId))];const id='ORD-'+Date.now();
    await api.post('/orders',{id,buyerId:user.id,customerName:f.name,address:f.address,phone:f.phone,items,sellerIds,subtotal:sub,discount:disc,total:sub-disc,coupon:cp?.code||null,status:'Placed',createdAt:today()});
    await Promise.all(rows.map((r,k)=>api.patch('/products/'+r.p.id,{stock:fresh[k].stock-r.qty})));
    if(cp)await api.patch('/coupons/'+cp.id,{used:cp.used+1});
    await Promise.all(sellerIds.map(s=>notify(s,'New order '+id)));await notify(user.id,'Demo order '+id+' placed');
    saveCart([]);say('Demo order placed (no real payment)');go('/orders')}catch(e){say(e.message,1)}setBusy(false)};
  if(!cart.length)return <Page title="Cart"><p>Your cart is empty. <Link to="/shop">Browse products</Link></p></Page>;
  return <Page title="Cart & Checkout"><Load s={p}>{()=><>
   <div className="tw"><table><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.productId}><td>{r.p.name}</td><td>{inr(r.p.price)}</td>
    <td><button aria-label="Decrease" onClick={()=>setQty(r.productId,-1)}>-</button> {r.qty} <button aria-label="Increase" disabled={r.qty>=r.p.stock} onClick={()=>setQty(r.productId,1)}>+</button></td>
    <td><button className="btn danger" onClick={()=>saveCart(cart.filter(i=>i.productId!==r.productId))}>Remove</button></td></tr>)}</tbody></table></div>
   <div className="row"><input aria-label="Coupon" placeholder="Coupon (try SAKHI10)" value={code} onChange={e=>setCode(e.target.value)}/><button className="btn alt" onClick={apply}>Apply</button></div>
   <p>Subtotal {inr(sub)} · Discount {inr(disc)} · <b>Total {inr(sub-disc)}</b></p>
   <h3>Delivery (fictional details only)</h3><label htmlFor="n">Name</label><input id="n" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
   <label htmlFor="a">Address</label><textarea id="a" value={f.address} onChange={e=>setF({...f,address:e.target.value})}/>
   <label htmlFor="ph">Contact number</label><input id="ph" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><br/><br/>
   <button className="btn" disabled={busy} onClick={place}>Place Demo Order</button></>}</Load></Page>;}

const STAT=['Placed','Confirmed','Processing','Shipped','Delivered','Cancelled'];
function Orders(){const {user,say}=useApp();const o=useLoad('/orders?buyerId='+user.id);
  const cancel=async x=>{if(!confirm('Cancel order '+x.id+'?'))return;try{const r=await assertOwner('/orders/'+x.id,'buyerId',user.id);if(r.status!=='Placed')return say('Only Placed orders can be cancelled',1)}catch(e){return say(e.message,1)}
   for(const i of x.items){const p=await api.get('/products/'+i.productId);await api.patch('/products/'+i.productId,{stock:p.stock+i.qty})}
   await api.patch('/orders/'+x.id,{status:'Cancelled'});say('Order cancelled, stock restored');o.reload()};
  return <Page title="My Orders"><Load s={o}>{d=>d.length?d.map(x=><div className="card" key={x.id} style={{marginBottom:'1rem'}}><b>{x.id}</b> <span className="badge">{x.status}</span>
   <p className="muted">Timeline: {STAT.slice(0,5).map((s,k)=>k<=STAT.indexOf(x.status)?'✔ '+s:s).join(' → ')}</p>
   <ul>{x.items.map(i=><li key={i.productId}>{i.name} × {i.qty} @ {inr(i.price)}</li>)}</ul><p>Total {inr(x.total)}</p>
   {x.status==='Placed'&&<button className="btn danger" onClick={()=>cancel(x)}>Cancel order</button>}</div>):<p>No orders yet.</p>}</Load></Page>;}

function Donate(){const {user,say}=useApp();const i=useLoad('/initiatives'),d=useLoad('/donations');const [f,setF]=useState({initiativeId:'',amount:'',message:''});const [rc,setRc]=useState(null);
  const raised=id=>(d.data||[]).filter(x=>x.initiativeId===id).reduce((s,x)=>s+x.amount,0);
  const give=async e=>{e.preventDefault();if(!user)return say('Please login to donate',1);if(!f.initiativeId||+f.amount<1)return say('Select a campaign and amount',1);
   const r=await api.post('/donations',{receipt:'DEMO-RCPT-'+Date.now(),donorId:user.id,donorName:user.name,initiativeId:+f.initiativeId,amount:+f.amount,message:f.message,createdAt:today()});
   await notify(user.id,'Simulated donation recorded: '+r.receipt);setRc(r);d.reload();say('Simulated donation saved')};
  return <Page title="Welfare Campaigns"><div className="grid"><Load s={i}>{l=>l.map(x=>{const r=raised(x.id);return <div className="card" key={x.id}><h3>{x.title}</h3><p>{x.description}</p><div className="bar"><i style={{width:Math.min(100,r/x.target*100)+'%'}}/></div><p>{inr(r)} of {inr(x.target)} · <span className="badge">{x.status}</span></p></div>})}</Load></div>
   <h2>Make a simulated donation</h2><p className="muted">No money is transferred. Demo receipts are not tax receipts.</p>
   <form className="card" onSubmit={give}><label htmlFor="c">Campaign</label><select id="c" value={f.initiativeId} onChange={e=>setF({...f,initiativeId:e.target.value})}><option value="">Select</option>{(i.data||[]).filter(x=>x.status==='active').map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select>
   <label htmlFor="am">Amount (₹)</label><input id="am" type="number" min="1" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
   <label htmlFor="m">Message (optional)</label><input id="m" value={f.message} onChange={e=>setF({...f,message:e.target.value})}/><br/><br/><button className="btn">Donate (demo)</button></form>
   {rc&&<div className="card"><h3>Demo receipt {rc.receipt}</h3><p>{rc.donorName} · {inr(rc.amount)} · {rc.createdAt}</p><p className="muted">Simulated donation. Not a real receipt.</p><button className="btn noprint" onClick={()=>window.print()}>Print</button></div>}</Page>;}

function Apply({title,list,appPath,keyField,extra}){const {user,say}=useApp();const l=useLoad(list),a=useLoad(user?appPath+'?userId='+user.id:appPath+'?userId=0');
  const all=useLoad(appPath);
  const apply=async x=>{if(!user)return say('Please login to apply',1);
   if((a.data||[]).some(r=>r[keyField]===x.id&&r.status!=='Cancelled'))return say('You already applied',1);
   if(x.seats!==undefined&&(all.data||[]).filter(r=>r[keyField]===x.id&&r.status!=='Cancelled').length>=x.seats)return say('No seats left',1);
   await api.post(appPath,{[keyField]:x.id,userId:user.id,userName:user.name,status:'Submitted',createdAt:today()});await notify(user.id,'Application submitted: '+x.title);say('Applied');a.reload();all.reload()};
  const cancel=async r=>{await api.patch(appPath+'/'+r.id,{status:'Cancelled'});say('Application cancelled');a.reload();all.reload()};
  return <Page title={title}><div className="grid"><Load s={l}>{d=>d.map(x=>{const mine=(a.data||[]).find(r=>r[keyField]===x.id&&r.status!=='Cancelled');
   return <div className="card" key={x.id}><h3>{x.title}</h3><p className="muted">{extra(x)}</p>
   {mine?<p><span className="badge">{mine.status}</span> <button className="btn alt" onClick={()=>cancel(mine)}>Cancel</button></p>:<button className="btn" onClick={()=>apply(x)}>Apply</button>}</div>})}</Load></div></Page>;}

function Dashboard(){const {user}=useApp();
  if(user.role==='admin')return <Admin/>;if(user.role==='seller')return <Seller/>;
  return <UserDash/>;}

function MyDonations(){const {user}=useApp();const d=useLoad('/donations?donorId='+user.id);const [sel,setSel]=useState(null);
  return <Page title="Donation history & receipts"><Load s={d}>{l=>l.length?<><div className="tw"><table><thead><tr><th>Receipt</th><th>Amount</th><th>Date</th><th></th></tr></thead><tbody>{l.map(x=><tr key={x.id}><td>{x.receipt}</td><td>{inr(x.amount)}</td><td>{x.createdAt}</td><td><button className="btn alt" onClick={()=>setSel(x)}>View receipt</button></td></tr>)}</tbody></table></div>
   {sel&&<div className="card"><h3>Demo receipt {sel.receipt}</h3><p>{sel.donorName} · {inr(sel.amount)} · {sel.createdAt}</p><p className="muted">Simulated donation. No money was transferred. Not a tax receipt.</p><button className="btn noprint" onClick={()=>window.print()}>Print</button></div>}</>:<p>No donations yet.</p>}</Load></Page>;}

function Seller(){const tab=useParams().tab||'overview';const {user,say}=useApp();const p=useLoad('/products?sellerId='+user.id),o=useLoad('/orders'),c=useLoad('/categories');
  const [f,setF]=useState({name:'',description:'',category:'',price:'',stock:'',image:''});
  const ok=user.sellerStatus==='approved';
  const add=async e=>{e.preventDefault();if(!f.name||!f.category||+f.price<1||+f.stock<0)return say('Fill name, category, price, stock',1);
   await api.post('/products',{...f,price:+f.price,stock:+f.stock,available:true,status:'pending',sellerId:user.id,createdAt:today()});say('Submitted for admin approval');setF({name:'',description:'',category:'',price:'',stock:'',image:''});p.reload()};
  const mine=(o.data||[]).filter(x=>x.sellerIds.includes(user.id)&&x.status!=='Cancelled');
  const sales=mine.reduce((s,x)=>s+x.items.filter(i=>i.sellerId===user.id).reduce((t,i)=>t+i.price*i.qty,0),0);
  const setStock=async(x,v)=>{try{await assertOwner('/products/'+x.id,'sellerId',user.id)}catch(e){return say(e.message,1)}await api.patch('/products/'+x.id,{stock:Math.max(0,+v)});p.reload()};
  const edit=async x=>{try{await assertOwner('/products/'+x.id,'sellerId',user.id)}catch(e){return say(e.message,1)}const name=prompt('Product name',x.name);if(!name)return;const price=+prompt('Price (₹)',x.price);if(!(price>0))return say('Enter a valid price',1);const description=prompt('Description',x.description)||x.description;await api.patch('/products/'+x.id,{pendingChanges:{name,price,description}});say('Edit sent for approval. Your live listing stays unchanged until approved');p.reload()};
  const del=async x=>{try{await assertOwner('/products/'+x.id,'sellerId',user.id)}catch(e){return say(e.message,1)}if(confirm('Delete '+x.name+'?')){await api.del('/products/'+x.id);p.reload()}};
  const st=async(x,s)=>{let rec;try{rec=await assertOwner('/orders/'+x.id,'sellerIds',user.id)}catch(e){return say(e.message,1)}if(rec.status==='Cancelled'||!STAT.slice(0,5).includes(s))return say('This status change is not permitted',1);await api.patch('/orders/'+x.id,{status:s});await notify(x.buyerId,'Order '+x.id+' is now '+s);say('Status updated');o.reload()};
  const P=p.data||[];
  const TT={overview:'Seller dashboard',products:'My products',inventory:'Inventory',orders:'Incoming orders',reports:'Sales reports',reviews:'Reviews & activity'};
  const allOrders=(o.data||[]).filter(x=>x.sellerIds.includes(user.id));
  return <Page title={TT[tab]||'Seller'}>{!ok&&<p className="alert">Your seller account is {user.sellerStatus}. You cannot add products until an admin approves it.</p>}
   {tab==='overview'&&<><div className="stats"><div className="card stat"><b>{P.length}</b>Products</div><div className="card stat"><b>{P.filter(x=>x.status==='approved').length}</b>Published</div><div className="card stat"><b>{P.filter(x=>x.status==='pending').length}</b>Pending approval</div>
    <div className="card stat"><b>{P.filter(x=>x.stock<=5).length}</b>Low stock</div><div className="card stat"><b>{mine.filter(x=>x.status!=='Delivered').length}</b>Open orders</div><div className="card stat"><b>{mine.filter(x=>x.status==='Delivered').length}</b>Completed</div><div className="card stat"><b>{inr(sales)}</b>Simulated sales</div></div>
    <h2>Recent incoming orders</h2>{allOrders.slice(-3).reverse().map(x=><div className="card" key={x.id} style={{margin:'.4rem 0'}}><b>{x.id}</b> · {x.customerName} · <span className="badge">{x.status}</span></div>)}{!allOrders.length&&<p>No orders yet.</p>}
    <p><Link className="btn" to="/seller/orders">Manage orders</Link> <Link className="btn alt" to="/seller/products">Manage products</Link> <Link className="btn alt" to="/seller/reports">Sales reports</Link></p></>}
   {tab==='products'&&<>{ok&&<form className="card" onSubmit={add}><h3>Add product</h3>{['name','description','price','stock','image'].map(k=><div key={k}><label htmlFor={k}>{k==='image'?'Image URL':k}</label><input id={k} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></div>)}
    <label htmlFor="cat">Category</label><select id="cat" value={f.category} onChange={e=>setF({...f,category:e.target.value})}><option value="">Select</option>{(c.data||[]).map(x=><option key={x.id}>{x.name}</option>)}</select><br/><br/><button className="btn">Submit for approval</button></form>}
    <h2>My products</h2><div className="tw"><table><thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>{P.map(x=><tr key={x.id}><td>{x.name}</td><td>{inr(x.price)}</td><td>{x.stock}</td><td><span className="badge">{x.status}</span>{x.pendingChanges&&<> <span className="badge">edit pending</span></>}</td>
    <td><button className="btn alt" onClick={()=>edit(x)}>Edit</button> <button className="btn danger" onClick={()=>del(x)}>Delete</button></td></tr>)}</tbody></table></div></>}
   {tab==='inventory'&&<><p className="muted">Change a stock number, then click outside the box to save. 5 or fewer counts as low stock.</p><div className="tw"><table><thead><tr><th>Product</th><th>Stock</th></tr></thead><tbody>{P.map(x=><tr key={x.id}><td>{x.name}</td><td><input style={{width:90}} aria-label={'Stock for '+x.name} type="number" defaultValue={x.stock} onBlur={e=>setStock(x,e.target.value)}/> {x.stock<=5&&<span className="badge">low stock</span>}</td></tr>)}</tbody></table></div></>}
   {tab==='orders'&&<>{allOrders.length?allOrders.map(x=><div className="card" key={x.id} style={{margin:'.6rem 0'}}><b>{x.id}</b> · {x.customerName} · {x.phone} · <span className="badge">{x.status}</span><p className="muted">{x.address}</p><ul>{x.items.filter(i=>i.sellerId===user.id).map(i=><li key={i.productId}>{i.name} × {i.qty} @ {inr(i.price)}</li>)}</ul>
    <label htmlFor={'s'+x.id}>Update status</label><select id={'s'+x.id} value={x.status} disabled={x.status==='Cancelled'} onChange={e=>st(x,e.target.value)}>{STAT.map(s=><option key={s} disabled={s==='Cancelled'}>{s}</option>)}</select></div>):<p>No incoming orders yet.</p>}</>}
   {tab==='reports'&&<SellerReport orders={allOrders} uid={user.id}/>}{tab==='reviews'&&<SellerExtras uid={user.id}/>}</Page>;}

function Admin(){const {user,say}=useApp();const u=useLoad('/users'),p=useLoad('/products'),o=useLoad('/orders'),d=useLoad('/donations'),i=useLoad('/initiatives'),ta=useLoad('/trainingApplications'),ja=useLoad('/jobApplications'),lg=useLoad('/activityLogs');
  const U=u.data||[],P=p.data||[],O=o.data||[];
  const sellers=U.filter(x=>x.role==='seller');
  const seller=async(x,s)=>{await api.patch('/users/'+x.id,{sellerStatus:s});await notify(x.id,'Seller account '+s);await logAction(user.id,'seller_'+s,'user:'+x.id);say('Updated');u.reload();lg.reload()};
  const prod=async(x,s)=>{await api.patch('/products/'+x.id,{status:s});await notify(x.sellerId,x.name+' '+s);await logAction(user.id,'product_'+s,'product:'+x.id);say('Updated');p.reload();lg.reload()};
  const chg=async(x,ok)=>{await api.patch('/products/'+x.id,ok?{...x.pendingChanges,pendingChanges:null}:{pendingChanges:null});await notify(x.sellerId,x.name+' edit '+(ok?'approved':'rejected'));await logAction(user.id,'product_edit_'+(ok?'approved':'rejected'),'product:'+x.id);say('Updated');p.reload();lg.reload()};
  const ord=async(x,s)=>{await api.patch('/orders/'+x.id,{status:s});await notify(x.buyerId,'Order '+x.id+' is '+s);await logAction(user.id,'order_status_'+s,'order:'+x.id);o.reload();lg.reload()};
  const delP=async x=>{if(confirm('Delete '+x.name+'?')){await api.del('/products/'+x.id);await logAction(user.id,'product_deleted','product:'+x.id);p.reload();lg.reload()}};
  const stat=[['Users',U.length],['Sellers',sellers.length],['Pending sellers',sellers.filter(x=>x.sellerStatus==='pending').length],['Published products',P.filter(x=>x.status==='approved').length],['Pending products',P.filter(x=>x.status==='pending').length],['Orders',O.length],
   ['Simulated sales',inr(O.filter(x=>x.status!=='Cancelled').reduce((s,x)=>s+x.total,0))],['Simulated donations',inr((d.data||[]).reduce((s,x)=>s+x.amount,0))],['Active campaigns',(i.data||[]).filter(x=>x.status==='active').length],['Training applications',(ta.data||[]).length],['Job applications',(ja.data||[]).length]];
  return <Page title="Admin dashboard"><p><Link className="btn" to="/admin/users">Open all management pages</Link> <Link className="btn alt" to="/admin/analytics">Reports</Link></p><div className="stats">{stat.map(([k,v])=><div className="card stat" key={k}><b>{v}</b>{k}</div>)}</div>
   <h2>Sellers</h2><div className="tw"><table><tbody>{sellers.map(x=><tr key={x.id}><td>{x.name}</td><td>{x.business}</td><td><span className="badge">{x.sellerStatus}</span></td><td><button className="btn" onClick={()=>seller(x,'approved')}>Approve</button> <button className="btn danger" onClick={()=>seller(x,'rejected')}>Reject</button></td></tr>)}</tbody></table></div>
   <h2>Products</h2><div className="tw"><table><tbody>{P.map(x=><tr key={x.id}><td>{x.name}</td><td><span className="badge">{x.status}</span>{x.pendingChanges&&<div className="muted">Edit: {x.pendingChanges.name}, {inr(x.pendingChanges.price)} <button className="btn" onClick={()=>chg(x,true)}>Approve edit</button> <button className="btn alt" onClick={()=>chg(x,false)}>Reject edit</button></div>}</td><td><button className="btn" onClick={()=>prod(x,'approved')}>Approve</button> <button className="btn alt" onClick={()=>prod(x,'rejected')}>Reject</button> <button className="btn danger" onClick={()=>delP(x)}>Delete</button></td></tr>)}</tbody></table></div>
   <h2>Orders</h2><div className="tw"><table><tbody>{O.map(x=><tr key={x.id}><td>{x.id}</td><td>{inr(x.total)}</td><td><select aria-label="Order status" value={x.status} onChange={e=>ord(x,e.target.value)}>{STAT.map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>
   <h2>Activity log</h2><p className="muted">Demo records only, not a tamper-proof audit log.</p><ul>{(lg.data||[]).slice().reverse().slice(0,10).map(x=><li key={x.id}>{x.createdAt.slice(0,16)} · {x.action} · {x.target}</li>)}</ul></Page>;}

function Notifications(){const {user}=useApp();const n=useLoad('/notifications?userId='+user.id);
  const mark=async x=>{await api.patch('/notifications/'+x.id,{read:true});n.reload()};
  const all=async()=>{await Promise.all((n.data||[]).filter(x=>!x.read).map(x=>api.patch('/notifications/'+x.id,{read:true})));n.reload()};
  return <Page title="Notifications"><button className="btn alt" onClick={all}>Mark all as read</button><Load s={n}>{l=>l.length?l.slice().reverse().map(x=><div className="card" key={x.id} style={{margin:'.5rem 0',fontWeight:x.read?400:700}}>{x.text} {!x.read&&<button className="btn alt" onClick={()=>mark(x)}>Mark read</button>}</div>):<p>No notifications.</p>}</Load></Page>;}

function Login(){const {saveUser,say}=useApp();const go=useNavigate();const [e,setE]=useState(''),[pw,setPw]=useState('');
  const sub=async ev=>{ev.preventDefault();try{const l=await api.get('/users?email='+encodeURIComponent(e));const u=l.find(x=>x.password===pw);
   if(!u)return say('Wrong email or password',1);if(u.status!=='active')return say('Account is not active',1);saveUser(u);go('/dashboard')}catch{say('API not reachable. Run npm run api',1)}};
  return <Page title="Login"><form className="card" onSubmit={sub}><label htmlFor="e">Email</label><input id="e" type="email" value={e} onChange={x=>setE(x.target.value)}/><label htmlFor="p">Password</label><input id="p" type="password" value={pw} onChange={x=>setPw(x.target.value)}/><br/><br/><button className="btn">Login</button></form>
   <div className="card"><b>Demo accounts</b> (password <code>demo123</code>): admin@sakhi.demo, seller@sakhi.demo, newseller@sakhi.demo, buyer@sakhi.demo, donor@sakhi.demo, volunteer@sakhi.demo<p className="muted">Mock auth for learning only. Not secure.</p></div></Page>;}

function Register(){const {saveUser,say}=useApp();const go=useNavigate();const [f,setF]=useState({name:'',email:'',password:'',role:'buyer'});
  const sub=async ev=>{ev.preventDefault();if(!f.name||!/\S+@\S+\.\S+/.test(f.email)||f.password.length<6)return say('Enter name, valid email, 6+ char password',1);
   if((await api.get('/users?email='+encodeURIComponent(f.email))).length)return say('Email already registered',1);
   const u=await api.post('/users',{...f,status:'active',createdAt:today(),...(f.role==='seller'?{sellerStatus:'pending',business:''}:{})});saveUser(u);say('Welcome to Sakhi');go('/dashboard')};
  return <Page title="Register"><form className="card" onSubmit={sub}><p className="muted">Use fictional details and a throwaway password. Do not reuse real passwords.</p>
   {['name','email','password'].map(k=><div key={k}><label htmlFor={k}>{k}</label><input id={k} type={k==='password'?'password':'text'} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></div>)}
   <label htmlFor="r">I am a</label><select id="r" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{['buyer','seller','donor','volunteer'].map(r=><option key={r}>{r}</option>)}</select><br/><br/><button className="btn">Create account</button></form></Page>;}

const About=()=><Page title="About Sakhi"><div className="card"><h3>Mission</h3><p>Help women gain economic independence through skills, jobs, entrepreneurship and welfare support.</p><h3>Privacy &amp; limits</h3>
 <p>This is a local demo. JSON Server has no real security, passwords are plain fictional demo values, and route guards in the browser are not a security boundary. Never enter real personal or financial data. Donations and orders are simulated.</p></div></Page>;

const W=({children})=>{const {user}=useApp();return user?<DashLayout>{children}</DashLayout>:children};
const G=({roles,children})=><Guard roles={roles}><W>{children}</W></Guard>;
export default function App(){return <Provider><BrowserRouter><Nav/><Routes>
 <Route path="/" element={<Home/>}/><Route path="/about" element={<About/>}/><Route path="/faq" element={<Faq/>}/><Route path="/contact" element={<Contact/>}/><Route path="/privacy" element={<Privacy/>}/><Route path="/terms" element={<Terms/>}/><Route path="/more" element={<Hub/>}/>
 <Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
 <Route path="/shop" element={<W><Shop/></W>}/><Route path="/shop/:id" element={<W><ProductDetail/></W>}/>
 <Route path="/training" element={<W><Apply title="Training programs" list="/trainingPrograms" appPath="/trainingApplications" keyField="programId" extra={x=>`${x.category} · ${x.duration} · ${x.instructor} · ${x.seats} seats · starts ${x.startDate} · ${x.mode}`}/></W>}/>
 <Route path="/jobs" element={<W><Apply title="Jobs (fictional demo listings)" list="/jobs" appPath="/jobApplications" keyField="jobId" extra={x=>`${x.location} · ${x.mode} · ${x.type} · ${x.salary} · apply by ${x.deadline}`}/></W>}/>
 <Route path="/donate" element={<W><Donate/></W>}/><Route path="/stories" element={<W><Stories/></W>}/><Route path="/groups" element={<W><Groups/></W>}/><Route path="/events" element={<W><Events/></W>}/><Route path="/forum" element={<W><Forum/></W>}/>
 <Route path="/mentorship" element={<W><Mentorship/></W>}/><Route path="/assistance" element={<W><Assistance/></W>}/><Route path="/volunteer" element={<W><Volunteer/></W>}/><Route path="/support" element={<W><Support/></W>}/><Route path="/feedback" element={<W><Feedback/></W>}/>
 <Route path="/dashboard" element={<G><Dashboard/></G>}/><Route path="/cart" element={<G roles={['buyer']}><Cart/></G>}/><Route path="/orders" element={<G roles={['buyer']}><Orders/></G>}/><Route path="/wishlist" element={<G roles={['buyer']}><Wishlist/></G>}/><Route path="/my-reviews" element={<G roles={['buyer']}><MyReviews/></G>}/>
 <Route path="/my-donations" element={<G roles={['donor']}><MyDonations/></G>}/><Route path="/notifications" element={<G><Notifications/></G>}/><Route path="/profile" element={<G><Profile/></G>}/>
 <Route path="/stories/submit" element={<G roles={['seller']}><SubmitStory/></G>}/><Route path="/seller/:tab" element={<G roles={['seller']}><Seller/></G>}/><Route path="/admin/:section" element={<G roles={['admin']}><AdminHub/></G>}/>
 <Route path="*" element={<Page title="404 - Page not found"><Link to="/">Go home</Link></Page>}/></Routes><Footer/></BrowserRouter></Provider>;}

export {useApp,useLoad,Load,Page,inr,today,fallback};
