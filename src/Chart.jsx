import {ResponsiveContainer,BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,XAxis,YAxis,Tooltip,CartesianGrid,Legend} from 'recharts';
const COL=['#6A1B9A','#8E44AD','#B39DDB','#2e7d32','#b26a00','#c62828','#5c6bc0','#00897b'];
export default function Chart({title,data,type='bar'}){
  const rows=Object.entries(data).map(([name,value])=>({name,value}));if(type==='line')rows.sort((a,b)=>a.name.localeCompare(b.name));
  return <div className="card"><h3>{title}</h3>{rows.length?<div role="img" aria-label={title+': '+rows.map(r=>r.name+' '+r.value).join(', ')} style={{height:240}}><ResponsiveContainer width="100%" height="100%">
   {type==='pie'?<PieChart><Pie data={rows} dataKey="value" nameKey="name" outerRadius={75}>{rows.map((r,i)=><Cell key={i} fill={COL[i%COL.length]}/>)}</Pie><Tooltip/><Legend/></PieChart>
   :type==='line'?<LineChart data={rows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Line dataKey="value" stroke="#6A1B9A" strokeWidth={2}/></LineChart>
   :<BarChart data={rows}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" fontSize={11}/><YAxis allowDecimals={false} fontSize={11}/><Tooltip/><Bar dataKey="value" fill="#6A1B9A"/></BarChart>}
  </ResponsiveContainer></div>:<p className="muted">No data</p>}</div>;}
