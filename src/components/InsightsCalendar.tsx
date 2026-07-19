import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, parseISO, startOfMonth, startOfWeek, subDays } from 'date-fns'
import { BarChart3, BrainCircuit, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ListFilter, Repeat2, School, Sparkles, Target } from 'lucide-react'
import { db } from '../db'
import { completionRate, iso, isScheduled, percent } from '../metrics'

const palette=['#8b7cf6','#4f8cff','#ff6fae','#39c895','#ff9d4d','#f05d6f']

export function PremiumAnalytics(){
  const habits=useLiveQuery(()=>db.habits.filter(h=>!h.archived).toArray(),[])||[]
  const completions=useLiveQuery(()=>db.completions.toArray(),[])||[]
  const gate=useLiveQuery(()=>db.gate.toArray(),[])||[]
  const college=useLiveQuery(()=>db.college.toArray(),[])||[]
  const roadmap=useLiveQuery(()=>db.roadmap.toArray(),[])||[]
  const planner=useLiveQuery(()=>db.planner.toArray(),[])||[]
  const last30=Array.from({length:30},(_,i)=>subDays(new Date(),29-i))
  const daily=last30.map(day=>({day:format(day,'d MMM'),habits:completions.filter(c=>c.date===iso(day)&&c.status==='complete').length,hours:planner.filter(p=>p.date===iso(day)&&p.done).reduce((a,p)=>a+p.hours,0)}))
  const weekly=Array.from({length:8},(_,i)=>{const start=subDays(startOfWeek(new Date(),{weekStartsOn:1}),(7-i)*7),days=Array.from({length:7},(_,d)=>addDays(start,d));return {week:format(start,'d MMM'),score:Math.round(days.reduce((sum,day)=>sum+percent(completions.filter(c=>c.date===iso(day)&&c.status==='complete').length,habits.filter(h=>isScheduled(h,day)).length),0)/7),hours:planner.filter(p=>days.some(day=>p.date===iso(day))&&p.done).reduce((a,p)=>a+p.hours,0)}})
  const gateChart=gate.map(s=>({name:s.name.replace('Computer Organization and Architecture','COA').replace('Probability and Statistics','Probability'),value:percent(s.lectures,s.totalLectures)}))
  const semesterChart=college.map(s=>({name:s.name.replace('Computer Organization and Architecture','COA').replace('Advanced Java Programming','Advanced Java'),value:s.progress}))
  const monthChart=Array.from({length:6},(_,i)=>{const weeks=roadmap.filter(w=>w.month===i+1),done=weeks.reduce((a,w)=>a+w.completedTopics.length+(w.buildDone?1:0),0),total=weeks.reduce((a,w)=>a+w.topics.length+1,0);return {name:`M${i+1}`,value:percent(done,total)}})
  const categoryData=[...new Set(habits.map(h=>h.category))].map(cat=>({name:cat,value:completions.filter(c=>c.status==='complete'&&habits.find(h=>h.id===c.habitId)?.category===cat).length})).filter(x=>x.value)
  const avgHabit=Math.round(habits.reduce((a,h)=>a+completionRate(h,completions),0)/Math.max(1,habits.length))
  const studyHours=planner.filter(p=>p.done).reduce((a,p)=>a+p.hours,0)
  const semester=Math.round(college.reduce((a,s)=>a+s.progress,0)/Math.max(1,college.length))
  const roadmapDone=roadmap.reduce((a,w)=>a+w.completedTopics.length+(w.buildDone?1:0),0),roadmapTotal=roadmap.reduce((a,w)=>a+w.topics.length+1,0)
  return <div className="page premium-analytics"><header className="premium-hero"><div><span className="eyebrow">PERFORMANCE INTELLIGENCE</span><h1>See the pattern. Adjust the system.</h1><p>Weekly and monthly signals across habits, study hours, GATE, Semester 5 and the AI roadmap.</p></div><span className="analytics-badge"><Sparkles/> Last 30 days</span></header>
    <div className="premium-metrics-grid"><article className="premium-metric violet"><span className="metric-icon"><Repeat2/></span><div><small>Habit completion</small><strong>{avgHabit}%</strong><span>30-day average</span></div></article><article className="premium-metric blue"><span className="metric-icon"><Clock3/></span><div><small>Study time</small><strong>{studyHours.toFixed(1)}h</strong><span>Completed planned blocks</span></div></article><article className="premium-metric green"><span className="metric-icon"><School/></span><div><small>Semester progress</small><strong>{semester}%</strong><span>{college.length} subjects</span></div></article><article className="premium-metric pink"><span className="metric-icon"><BrainCircuit/></span><div><small>AI roadmap</small><strong>{percent(roadmapDone,roadmapTotal)}%</strong><span>9-month journey</span></div></article></div>
    <div className="analytics-grid"><section className="premium-panel analytics-wide"><div className="premium-panel-head"><div><span className="eyebrow">WEEKLY</span><h2>Productivity score</h2></div><span className="score-chip">8-week trend</span></div><div className="analytics-chart"><ResponsiveContainer><AreaChart data={weekly}><defs><linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b7cf6" stopOpacity=".45"/><stop offset="1" stopColor="#8b7cf6" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)"/><XAxis dataKey="week" axisLine={false} tickLine={false}/><YAxis domain={[0,100]} axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="score" stroke="#8b7cf6" strokeWidth={3} fill="url(#weeklyGradient)"/></AreaChart></ResponsiveContainer></div></section>
      <section className="premium-panel"><div className="premium-panel-head"><div><span className="eyebrow">BALANCE</span><h2>Habit categories</h2></div><Target/></div><div className="analytics-chart"><ResponsiveContainer><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>{categoryData.map((_,i)=><Cell key={i} fill={palette[i%palette.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></section>
      <ChartPanel eyebrow="GATE" title="Subject completion" data={gateChart} color="#8b7cf6"/>
      <ChartPanel eyebrow="SEMESTER 5" title="Academic progress" data={semesterChart} color="#4f8cff"/>
      <ChartPanel eyebrow="AI ROADMAP" title="Progress by month" data={monthChart} color="#ff6fae"/>
      <section className="premium-panel analytics-wide"><div className="premium-panel-head"><div><span className="eyebrow">MONTHLY</span><h2>Study hours & habit volume</h2></div><span className="score-chip">30 days</span></div><div className="analytics-chart"><ResponsiveContainer><BarChart data={daily}><CartesianGrid vertical={false} stroke="var(--line)"/><XAxis dataKey="day" hide/><YAxis axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="hours" fill="#4f8cff" radius={[5,5,0,0]}/><Bar dataKey="habits" fill="#8b7cf6" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section></div>
  </div>
}

function ChartPanel({eyebrow,title,data,color}:{eyebrow:string;title:string;data:{name:string;value:number}[];color:string}){return <section className="premium-panel"><div className="premium-panel-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><BarChart3/></div><div className="analytics-chart"><ResponsiveContainer><BarChart data={data}><CartesianGrid vertical={false} stroke="var(--line)"/><XAxis dataKey="name" hide/><YAxis domain={[0,100]} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" fill={color} radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section>}

export function PremiumCalendar(){
  const planner=useLiveQuery(()=>db.planner.toArray(),[])||[]
  const habits=useLiveQuery(()=>db.habits.filter(h=>!h.archived).toArray(),[])||[]
  const completions=useLiveQuery(()=>db.completions.toArray(),[])||[]
  const [cursor,setCursor]=useState(new Date())
  const [view,setView]=useState<'month'|'week'|'timeline'>('month')
  const [category,setCategory]=useState('All')
  const categories=['All',...new Set(planner.map(p=>p.category))]
  const filtered=planner.filter(p=>category==='All'||p.category===category)
  const monthDays=eachDayOfInterval({start:startOfMonth(cursor),end:endOfMonth(cursor)}),blanks=Array.from({length:startOfMonth(cursor).getDay()})
  const weekDays=eachDayOfInterval({start:startOfWeek(cursor,{weekStartsOn:1}),end:endOfWeek(cursor,{weekStartsOn:1})})
  const upcoming=filtered.filter(p=>p.date>=iso(new Date())).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12)
  return <div className="page premium-calendar-page"><header className="premium-hero"><div><span className="eyebrow">UNIFIED CALENDAR</span><h1>Time, deadlines and habits—together.</h1><p>Switch between monthly context, the current week, and a focused deadline timeline.</p></div><div className="calendar-controls"><button onClick={()=>setCursor(addDays(cursor,view==='month'?-30:-7))}><ChevronLeft/></button><b>{format(cursor,view==='month'?'MMMM yyyy':"'Week of' d MMM")}</b><button onClick={()=>setCursor(addDays(cursor,view==='month'?30:7))}><ChevronRight/></button></div></header>
    <div className="calendar-toolbar"><div className="view-switch"><button className={view==='month'?'active':''} onClick={()=>setView('month')}><CalendarDays/> Month</button><button className={view==='week'?'active':''} onClick={()=>setView('week')}><ListFilter/> Week</button><button className={view==='timeline'?'active':''} onClick={()=>setView('timeline')}><Clock3/> Timeline</button></div><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
    {view==='month'&&<section className="premium-panel premium-month"><div className="month-weekdays">{'Sun Mon Tue Wed Thu Fri Sat'.split(' ').map(day=><b key={day}>{day}</b>)}</div><div className="month-cells">{blanks.map((_,i)=><div className="month-cell blank" key={i}/>)}{monthDays.map(day=>{const events=filtered.filter(p=>p.date===iso(day)),done=completions.filter(c=>c.date===iso(day)&&c.status==='complete').length;return <div className={`month-cell ${isSameDay(day,new Date())?'today':''}`} key={iso(day)}><header><b>{format(day,'d')}</b>{done>0&&<span><Check/> {done}</span>}</header>{events.slice(0,3).map(event=><button key={event.id} className={event.done?'done':''} onClick={()=>db.planner.update(event.id!,{done:!event.done})}><i/>{event.title.replace(/^\d\d:\d\d · /,'')}</button>)}{events.length>3&&<small>+{events.length-3} more</small>}</div>})}</div></section>}
    {view==='week'&&<div className="premium-week-grid">{weekDays.map(day=><section className={isSameDay(day,new Date())?'today':''} key={iso(day)}><header><small>{format(day,'EEE')}</small><b>{format(day,'d')}</b></header>{filtered.filter(p=>p.date===iso(day)).map(event=><button key={event.id} onClick={()=>db.planner.update(event.id!,{done:!event.done})}><time>{event.title.match(/^\d\d:\d\d/)?.[0]||'Any'}</time><span><b>{event.title.replace(/^\d\d:\d\d · /,'')}</b><small>{event.category} · {event.hours}h</small></span>{event.done&&<Check/>}</button>)}{!filtered.some(p=>p.date===iso(day))&&<p>{habits.filter(h=>isScheduled(h,day)).length} habits scheduled</p>}</section>)}</div>}
    {view==='timeline'&&<section className="premium-panel deadline-timeline"><div className="premium-panel-head"><div><span className="eyebrow">DEADLINES</span><h2>What’s coming next</h2></div><span className="score-chip">{upcoming.length} upcoming</span></div>{upcoming.map(item=><article key={item.id}><time><b>{format(parseISO(item.date),'dd')}</b><span>{format(parseISO(item.date),'MMM')}</span></time><i/><div><small>{item.category} · {item.kind}</small><b>{item.title}</b><span>{item.hours} planned hours</span></div><button onClick={()=>db.planner.update(item.id!,{done:!item.done})}>{item.done?<Check/>:<span/>}</button></article>)}</section>}
  </div>
}
