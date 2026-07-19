import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns'
import { ArrowRight, BookOpenCheck, BrainCircuit, Bus, CalendarClock, Check, ChevronRight, CirclePlus, Clock3, Flame, GraduationCap, Moon, Sparkles, Target, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import { iso, isScheduled, percent, streakFor } from '../metrics'
import { scheduleFor, type PlannerMode } from '../planner'
import type { Completion, Habit } from '../types'

const quotes=[
  'Small steps, every single day.',
  'Consistency is how future you says thank you.',
  'Protect the next focused hour.',
  'Progress feels quiet before it feels powerful.',
]

const tone:Record<string,string>={GATE:'violet',College:'blue','AI Roadmap':'pink',Health:'green','Bus Study':'orange',Family:'rose',Personal:'gold'}

function Metric({icon:Icon,label,value,detail,accent}:{icon:typeof Flame;label:string;value:string;detail:string;accent:string}){
  return <article className={`premium-metric ${accent}`}><span className="metric-icon"><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div></article>
}

function HabitToggle({habit,completion}:{habit:Habit;completion?:Completion}){
  const toggle=async()=>{if(!habit.id)return;if(completion)await db.completions.delete(completion.id!);else await db.completions.add({habitId:habit.id,date:iso(),status:'complete',note:''})}
  return <button className={`premium-habit ${completion?.status||''}`} onClick={toggle} aria-label={`${completion?'Undo':'Complete'} ${habit.name}`}>
    <span className="habit-dot" style={{background:habit.color}}/>
    <span><b>{habit.name}</b><small>{habit.category}</small></span>
    <i>{completion?.status==='complete'?<Check size={14}/>:null}</i>
  </button>
}

export default function PremiumDashboard(){
  const navigate=useNavigate()
  const habits=useLiveQuery(()=>db.habits.filter(h=>!h.archived).toArray(),[])||[]
  const completions=useLiveQuery(()=>db.completions.toArray(),[])||[]
  const freezes=useLiveQuery(()=>db.freezes.toArray(),[])||[]
  const gate=useLiveQuery(()=>db.gate.toArray(),[])||[]
  const backlog=useLiveQuery(()=>db.backlog.toArray(),[])||[]
  const college=useLiveQuery(()=>db.college.toArray(),[])||[]
  const roadmap=useLiveQuery(()=>db.roadmap.toArray(),[])||[]
  const planner=useLiveQuery(()=>db.planner.toArray(),[])||[]
  const [quick,setQuick]=useState('')
  const today=new Date(),todayKey=iso(today),busActive=today>=new Date('2026-08-03T00:00:00')
  const todayHabits=habits.filter(h=>isScheduled(h,today))
  const todayCompletions=completions.filter(c=>c.date===todayKey)
  const done=todayHabits.filter(h=>todayCompletions.some(c=>c.habitId===h.id&&c.status==='complete'))
  const mode=(localStorage.getItem('pujiflow-planner-mode')||'Auto') as PlannerMode
  const generated=scheduleFor(mode,today)
  const todayPlan=planner.filter(p=>p.date===todayKey)
  const schedule=todayPlan.length?todayPlan.slice(0,7).map(p=>({time:p.title.match(/^\d\d:\d\d/)?.[0]||'Anytime',title:p.title.replace(/^\d\d:\d\d · /,''),category:p.category,done:p.done,id:p.id})):generated.map(b=>({time:b.time,title:b.title,category:b.category,done:false,id:undefined}))
  const probability=gate.find(s=>s.name==='Probability and Statistics')
  const backlogDay=backlog.find(day=>!(day.pending&&day.current&&day.dpp))
  const roadDone=roadmap.reduce((sum,w)=>sum+w.completedTopics.length+(w.buildDone?1:0),0)
  const roadTotal=roadmap.reduce((sum,w)=>sum+w.topics.length+1,0)
  const weekDays=Array.from({length:7},(_,i)=>addDays(startOfWeek(today,{weekStartsOn:1}),i))
  const weekData=weekDays.map(date=>({day:format(date,'EEE'),score:percent(completions.filter(c=>c.date===iso(date)&&c.status==='complete').length,habits.filter(h=>isScheduled(h,date)).length),hours:planner.filter(p=>p.date===iso(date)&&p.done).reduce((sum,p)=>sum+p.hours,0)}))
  const weeklyScore=Math.round(weekData.reduce((sum,d)=>sum+d.score,0)/7)
  const currentStreak=Math.max(0,...habits.map(h=>streakFor(h,completions,freezes)))
  const deadlines=planner.filter(p=>!p.done&&p.date>=todayKey).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4)
  const nextCollege=planner.find(p=>!p.done&&p.category==='College')
  const quote=quotes[today.getDate()%quotes.length]
  const greeting=today.getHours()<12?'Good morning':today.getHours()<18?'Good afternoon':'Good evening'
  const addQuick=async()=>{if(!quick.trim())return;await db.planner.add({kind:'Quick task',date:todayKey,title:quick.trim(),category:'Personal',hours:.5,done:false,notes:''});setQuick('')}
  const dayProgress=percent(done.length,todayHabits.length)
  const summary={gate:percent(gate.reduce((a,s)=>a+s.lectures,0),gate.reduce((a,s)=>a+s.totalLectures,0)),semester:Math.round(college.reduce((a,s)=>a+s.progress,0)/Math.max(1,college.length)),roadmap:percent(roadDone,roadTotal)}

  return <div className="page premium-dashboard">
    <header className="premium-hero">
      <div><span className="eyebrow">{format(today,'EEEE · d MMMM yyyy')}</span><h1>{greeting}, Poojitha.</h1><p>One clear plan. One focused day. Everything else can wait.</p></div>
      <div className="hero-actions"><button className="secondary-action" onClick={()=>navigate('/day-plan')}><CalendarClock size={17}/> Plan day</button><button className="primary" onClick={()=>navigate('/habits')}><CirclePlus size={17}/> Quick add</button></div>
    </header>

    <section className="focus-ribbon">
      <div className="focus-copy"><span><Sparkles size={14}/> TODAY’S NORTH STAR</span><h2>Finish the Probability pair before the live GATE class.</h2><p>{quote}</p></div>
      <div className="focus-score"><div className="score-ring" style={{'--score':`${dayProgress*3.6}deg`} as React.CSSProperties}><b>{dayProgress}%</b><span>day score</span></div></div>
    </section>

    <div className="premium-metrics-grid">
      <Metric icon={Flame} label="Current streak" value={`${currentStreak} days`} detail="Best active ritual" accent="amber"/>
      <Metric icon={Trophy} label="Weekly score" value={`${weeklyScore}%`} detail="Across scheduled habits" accent="violet"/>
      <Metric icon={BookOpenCheck} label="GATE progress" value={`${summary.gate}%`} detail={`${probability?.dppPending||0} Probability DPP pending`} accent="blue"/>
      <Metric icon={BrainCircuit} label="AI roadmap" value={`${summary.roadmap}%`} detail={`${roadmap.filter(w=>w.status==='Complete').length} of 36 weeks complete`} accent="pink"/>
    </div>

    <div className="dashboard-main-grid">
      <section className="premium-panel schedule-panel">
        <div className="premium-panel-head"><div><span className="eyebrow">TODAY’S SCHEDULE</span><h2>{format(today,'EEEE, d MMMM')}</h2></div><button onClick={()=>navigate('/day-plan')}>Open planner <ArrowRight size={15}/></button></div>
        <div className="premium-timeline">{schedule.map((item,index)=><button key={`${item.time}-${item.title}`} className={item.done?'done':''} onClick={()=>item.id&&db.planner.update(item.id,{done:!item.done})}><time>{item.time}</time><i className={tone[item.category]||'violet'}/><span><b>{item.title}</b><small>{item.category}</small></span>{index===0&&<em>Next</em>}</button>)}</div>
      </section>

      <section className="premium-panel habits-panel">
        <div className="premium-panel-head"><div><span className="eyebrow">TODAY’S HABITS</span><h2>{done.length}/{todayHabits.length} complete</h2></div><button onClick={()=>navigate('/habits')}>View all <ChevronRight size={15}/></button></div>
        <div className="habit-progress"><span style={{width:`${dayProgress}%`}}/></div>
        <div className="premium-habit-list">{todayHabits.slice(0,7).map(h=><HabitToggle key={h.id} habit={h} completion={todayCompletions.find(c=>c.habitId===h.id)}/>)}</div>
      </section>

      <section className="premium-panel momentum-panel">
        <div className="premium-panel-head"><div><span className="eyebrow">PRODUCTIVITY</span><h2>Weekly momentum</h2></div><span className="score-chip">{weeklyScore}% score</span></div>
        <div className="premium-chart"><ResponsiveContainer><AreaChart data={weekData}><defs><linearGradient id="premiumFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b7cf6" stopOpacity=".45"/><stop offset="1" stopColor="#8b7cf6" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="4 8"/><XAxis dataKey="day" axisLine={false} tickLine={false}/><YAxis hide domain={[0,100]}/><Tooltip/><Area type="monotone" dataKey="score" stroke="#8b7cf6" strokeWidth={3} fill="url(#premiumFill)"/></AreaChart></ResponsiveContainer></div>
      </section>

      <section className="premium-panel priority-panel">
        <div className="premium-panel-head"><div><span className="eyebrow">ACADEMIC COMMAND</span><h2>Priority stack</h2></div><Target size={20}/></div>
        <button className="priority-card violet" onClick={()=>navigate('/gate')}><GraduationCap/><span><small>GATE · PROBABILITY</small><b>Pending lecture {backlogDay?.day||'complete'}</b><em>1 pending + 1 current + DPP</em></span><ChevronRight/></button>
        <button className="priority-card blue" onClick={()=>navigate('/college')}><BookOpenCheck/><span><small>SEMESTER 5 · {summary.semester}%</small><b>{nextCollege?.title||'Review the next assignment'}</b><em>{college.reduce((a,s)=>a+s.assignments,0)} assignments tracked</em></span><ChevronRight/></button>
        <button className="priority-card pink" onClick={()=>navigate('/roadmap')}><BrainCircuit/><span><small>AI ENGINEER · WEEK {roadmap.find(w=>w.status!=='Complete')?.week||36}</small><b>{roadmap.find(w=>w.status!=='Complete')?.title||'Roadmap complete'}</b><em>{summary.roadmap}% overall progress</em></span><ChevronRight/></button>
      </section>
    </div>

    <div className="dashboard-bottom-grid">
      <section className="premium-panel bus-panel"><div className="premium-panel-head"><div><span className="eyebrow">BUS STUDY</span><h2>{busActive?'Use the commute well':'Begins 3 August'}</h2></div><Bus/></div><div className="bus-cards"><button disabled={!busActive} onClick={()=>navigate('/bus')}><span className="bus-icon sunrise"><Bus/></span><b>Morning bus</b><small>{busActive?'Downloaded lecture · 50 min':'Activates with college'}</small></button><button disabled={!busActive} onClick={()=>navigate('/bus')}><span className="bus-icon sunset"><Moon/></span><b>Evening bus</b><small>{busActive?'MCQs & revision · 70 min':'Paused until 3 August'}</small></button></div></section>
      <section className="premium-panel deadlines-panel"><div className="premium-panel-head"><div><span className="eyebrow">UPCOMING</span><h2>Deadlines & tests</h2></div><Clock3/></div>{deadlines.length?deadlines.map(item=><button key={item.id} onClick={()=>navigate('/planner')}><span className={isSameDay(parseISO(item.date),today)?'today':''}><b>{format(parseISO(item.date),'dd')}</b><small>{format(parseISO(item.date),'MMM')}</small></span><div><b>{item.title}</b><small>{item.category} · {item.kind}</small></div><ChevronRight/></button>):<div className="calm-empty"><Check/><span><b>No urgent deadlines</b><small>Your horizon is clear.</small></span></div>}</section>
    </div>

    <section className="quick-capture"><CirclePlus/><input value={quick} onChange={e=>setQuick(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addQuick()} placeholder="Capture a task for today…" aria-label="Quick add task"/><button onClick={addQuick}>Add task</button><kbd>↵</kbd></section>
  </div>
}
