import {useState} from 'react';
import {NavLink,Link} from 'react-router-dom';
import {LayoutDashboard,ShoppingBag,ShoppingCart,Package,Heart,GraduationCap,Briefcase,Users,Lightbulb,HandHeart,CalendarDays,MessageSquare,LifeBuoy,Bell,User,Boxes,BarChart3,Star,BookOpen,Gift,Receipt,Store,Mail,Layers,HeartHandshake,Menu} from './icons.jsx';
import {useApp,useLoad} from './App.jsx';

const L=(to,label,Icon)=>({to,label,Icon});
const LEARN=[L('/training','Training',GraduationCap),L('/jobs','Jobs',Briefcase),L('/groups','Self-help groups',Users),L('/mentorship','Mentorship',Lightbulb),L('/assistance','Welfare assistance',HandHeart)];
const COMM=[L('/events','Events',CalendarDays),L('/forum','Community forum',MessageSquare)];
const ACC=[L('/support','Support tickets',LifeBuoy),L('/feedback','Feedback & complaints',Mail),L('/notifications','Notifications',Bell),L('/profile','Profile',User)];
const pretty=k=>k.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
const AD=[['People',['users']],['Marketplace',['products','inventory','categories','orders','reviews','coupons']],['Learning & jobs',['trainingPrograms','trainingApplications','jobs','jobApplications']],
 ['Community',['selfHelpGroups','groupMemberships','successStories','mentorshipRequests','events','eventRegistrations','forumPosts','forumComments','reports']],
 ['Welfare',['initiatives','donations','financialAssistanceApplications','volunteerApplications']],['Support',['complaints','supportTickets','faqs','contactMessages']],['System',['activityLogs']]];
const NAV={
 buyer:[['Shopping',[L('/dashboard','Dashboard',LayoutDashboard),L('/shop','Marketplace',ShoppingBag),L('/cart','Cart',ShoppingCart),L('/orders','My orders',Package),L('/wishlist','Wishlist',Heart),L('/my-reviews','My reviews',Star),L('/donate','Donate',Gift)]],['Grow',LEARN],['Community',COMM],['Account',ACC]],
 seller:[['My store',[L('/dashboard','Overview',LayoutDashboard),L('/seller/products','Products',Store),L('/seller/inventory','Inventory',Boxes),L('/seller/orders','Orders',Package),L('/seller/reports','Sales reports',BarChart3),L('/seller/reviews','Reviews & activity',Star),L('/stories/submit','Success story',BookOpen)]],['Grow',LEARN],['Community',COMM],['Account',ACC]],
 donor:[['Giving',[L('/dashboard','Dashboard',LayoutDashboard),L('/donate','Campaigns',Gift),L('/my-donations','Donations & receipts',Receipt)]],['Community',COMM],['Account',ACC]],
 volunteer:[['Volunteering',[L('/dashboard','Dashboard',LayoutDashboard),L('/volunteer','My application',HeartHandshake),L('/events','Events',CalendarDays)]],['Learn',[L('/training','Training',GraduationCap),L('/groups','Self-help groups',Users)]],['Community',[L('/forum','Community forum',MessageSquare)]],['Account',ACC.slice(0,1).concat(ACC.slice(2))]],
 admin:[['Overview',[L('/dashboard','Dashboard',LayoutDashboard),L('/admin/analytics','Reports & analytics',BarChart3)]],...AD.map(([t,ks])=>[t,ks.map(k=>L('/admin/'+k,pretty(k),Layers))]),['Account',[L('/profile','Admin profile',User)]]]};

export default function DashLayout({children}){const {user}=useApp();const [open,setOpen]=useState(false);const n=useLoad('/notifications?userId='+user.id);
  const unread=(n.data||[]).filter(x=>!x.read).length;
  return <div className="shell"><aside className={'sidebar'+(open?' open':'')} aria-label="Dashboard menu">
   <div className="sb-user"><span className="avatar">{user.name[0]}</span><div><b>{user.name}</b><br/><span className="badge">{user.role}</span></div></div>
   {(NAV[user.role]||[]).map(([t,items])=><div key={t}><div className="sb-title">{t}</div>{items.map(({to,label,Icon})=><NavLink key={to} end to={to} onClick={()=>setOpen(false)} className={({isActive})=>'sb-link'+(isActive?' active':'')}><Icon size={18} aria-hidden="true"/>{label}{to==='/notifications'&&unread>0&&<em>{unread}</em>}</NavLink>)}</div>)}</aside>
   {open&&<div className="scrim" onClick={()=>setOpen(false)}/>}
   <div className="shell-main"><div className="topbar"><button className="burger2" aria-label="Toggle dashboard menu" onClick={()=>setOpen(!open)}><Menu size={20}/></button>
    <div><b>Welcome back, {user.name.split(' ')[0]} 👋</b><div className="muted">{new Date().toDateString()}</div></div>
    <Link className="bell" to="/notifications" aria-label={'Notifications, '+unread+' unread'}><Bell size={20}/>{unread>0&&<em>{unread}</em>}</Link></div>{children}</div></div>;}
