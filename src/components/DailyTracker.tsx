import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, format, isSameDay, parseISO } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Forward, NotebookPen, Sparkles } from 'lucide-react'
import { db } from '../db'
import { iso, isScheduled, percent } from '../metrics'
import type { Completion, Habit } from '../types'

function TrackerRow({habit,date,completion}:{habit:Habit;date:string;completion?:Completion}){
  const [note,setNote]=useState(completion?.note||'')
  const setStatus=async(status:'complete'|'skipped'|null)=>{if(completion)await db.completions.delete(completion.id!);if(status&&habit.id)await db.completions.add({habitId:habit.id,date,status,note})}
  return <article className={`premium-tracker-row ${completion?.status||''}`}><span className="tracker-accent" style={{background:habit.color}}/><div className="tracker-copy"><small>{habit.category} · {habit.schedule}</small><h2>{habit.name}</h2><label><NotebookPen size={14}/><input value={note} onChange={e=>setNote(e.target.value)} onBlur={()=>completion?.id&&db.completions.update(completion.id,{note})} placeholder="Add a reflection or note…"/></label></div><div className="tracker-actions"><button className={completion?.status==='complete'?'active':''} onClick={()=>setStatus(completion?.status==='complete'?null:'complete')}><Check/><span>Done</span></button><button className={completion?.status==='skipped'?'active skip':''} onClick={()=>setStatus(completion?.status==='skipped'?null:'skipped')}><Forward/><span>Skip</span></button></div></article>
}

export default function DailyTracker(){
  const [date,setDate]=useState(new Date())
  const habits=useLiveQuery(()=>db.habits.filter(h=>!h.archived).toArray(),[])||[]
  const completions=useLiveQuery(()=>db.completions.where('date').equals(iso(date)).toArray(),[iso(date)])||[]
  const list=habits.filter(h=>isScheduled(h,date)),done=completions.filter(c=>c.status==='complete').length,score=percent(done,list.length)
  return <div className="page premium-tracker"><header className="premium-hero"><div><span className="eyebrow">DAILY CHECK-IN</span><h1>{isSameDay(date,new Date())?'Today’s rhythm':format(date,'EEEE, d MMMM')}</h1><p>Complete, skip, and reflect—without rewriting history.</p></div><div className="tracker-date"><button onClick={()=>setDate(addDays(date,-1))} aria-label="Previous day"><ChevronLeft/></button><input type="date" value={iso(date)} onChange={e=>setDate(parseISO(e.target.value))}/><button onClick={()=>setDate(addDays(date,1))} aria-label="Next day"><ChevronRight/></button></div></header><section className="tracker-score"><div className="score-ring" style={{'--score':`${score*3.6}deg`} as React.CSSProperties}><b>{score}%</b><span>complete</span></div><div><span className="eyebrow">DAILY SCORE</span><h2>{done} of {list.length} rituals complete</h2><p>{score===100?'The loop is closed. Take the win.':score>=50?'Momentum is active—protect the next action.':'Start with one small completion.'}</p><div className="habit-progress"><span style={{width:`${score}%`}}/></div></div></section><div className="premium-tracker-list">{list.map(habit=><TrackerRow key={habit.id} habit={habit} date={iso(date)} completion={completions.find(c=>c.habitId===habit.id)}/>)}</div>{!list.length&&<div className="premium-empty"><Sparkles/><h2>A clear day</h2><p>No habits are scheduled for this date.</p></div>}</div>
}
