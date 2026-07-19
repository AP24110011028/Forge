import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { eachDayOfInterval, format, subDays } from 'date-fns'
import { Archive, CalendarDays, Check, Flame, Forward, IceCreamBowl, Pencil, Plus, Repeat2, Snowflake, Sparkles, Target, Trash2, Trophy, X } from 'lucide-react'
import { db } from '../db'
import { completionRate, iso, isScheduled, longestStreakFor, streakFor } from '../metrics'
import type { Category, Completion, Habit, HabitFreeze } from '../types'

const categories:Category[]=['GATE','College','AI Roadmap','Health','Personal','Family','GitHub','Bus Study','Other']
const colors=['#8b7cf6','#4f8cff','#ff6fae','#39c895','#ff9d4d','#f05d6f','#d4a72c']
const emptyHabit=():Habit=>({name:'',category:'Personal',icon:'Sparkles',description:'',schedule:'daily',weekdays:[1,2,3,4,5],customDates:[],weeklyTarget:7,startDate:iso(),reminder:'',color:colors[0],archived:false,createdAt:new Date().toISOString()})

function HabitEditor({habit,onClose}:{habit?:Habit;onClose:()=>void}){
  const [value,setValue]=useState<Habit>(habit||emptyHabit())
  const save=async(event:React.FormEvent)=>{event.preventDefault();if(habit?.id)await db.habits.update(habit.id,value);else await db.habits.add(value);onClose()}
  const remove=async()=>{if(!habit?.id||!confirm(`Delete “${habit.name}” and all its history?`))return;await db.transaction('rw',[db.habits,db.completions,db.freezes],async()=>{await db.completions.where('habitId').equals(habit.id!).delete();await db.freezes.where('habitId').equals(habit.id!).delete();await db.habits.delete(habit.id!)});onClose()}
  return <div className="modal-bg"><form className="premium-modal" onSubmit={save}>
    <header><div><span className="eyebrow">RITUAL DESIGNER</span><h2>{habit?'Edit habit':'Build a new habit'}</h2></div><button type="button" onClick={onClose}><X/></button></header>
    <label>Habit name<input autoFocus required value={value.name} onChange={e=>setValue({...value,name:e.target.value})} placeholder="e.g. Revise Probability formulas"/></label>
    <div className="form-grid"><label>Category<select value={value.category} onChange={e=>setValue({...value,category:e.target.value as Category})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Frequency<select value={value.schedule} onChange={e=>setValue({...value,schedule:e.target.value as Habit['schedule']})}><option value="daily">Daily</option><option value="weekdays">Custom weekdays</option><option value="monthly">Monthly</option><option value="custom">Specific dates</option></select></label></div>
    {value.schedule==='weekdays'&&<div className="weekday-selector">{['S','M','T','W','T','F','S'].map((label,index)=><button type="button" key={`${label}-${index}`} className={value.weekdays.includes(index)?'active':''} onClick={()=>setValue({...value,weekdays:value.weekdays.includes(index)?value.weekdays.filter(day=>day!==index):[...value.weekdays,index]})}>{label}</button>)}</div>}
    {value.schedule==='custom'&&<label>Custom dates<input value={value.customDates?.join(', ')||''} onChange={e=>setValue({...value,customDates:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})} placeholder="2026-07-20, 2026-07-25"/><small>Comma-separated dates in YYYY-MM-DD format.</small></label>}
    <label>Why this matters<textarea value={value.description} onChange={e=>setValue({...value,description:e.target.value})} placeholder="A clear reason makes consistency easier."/></label>
    <div className="form-grid"><label>Weekly target<input type="number" min="1" max="7" value={value.weeklyTarget} onChange={e=>setValue({...value,weeklyTarget:+e.target.value})}/></label><label>Reminder<input type="time" value={value.reminder} onChange={e=>setValue({...value,reminder:e.target.value})}/></label><label>Start date<input type="date" value={value.startDate} onChange={e=>setValue({...value,startDate:e.target.value})}/></label><label>End date<input type="date" value={value.endDate||''} onChange={e=>setValue({...value,endDate:e.target.value})}/></label></div>
    <label>Color<div className="premium-colors">{colors.map(color=><button type="button" key={color} aria-label={`Use ${color}`} className={value.color===color?'active':''} style={{background:color}} onClick={()=>setValue({...value,color})}/>)}</div></label>
    <footer>{habit&&<><button type="button" className="danger" onClick={remove}><Trash2 size={15}/> Delete</button><button type="button" onClick={()=>setValue({...value,archived:!value.archived})}><Archive size={15}/> {value.archived?'Restore':'Archive'}</button></>}<span/><button type="button" onClick={onClose}>Cancel</button><button className="primary" type="submit">Save habit</button></footer>
  </form></div>
}

function HabitCard({habit,completions,freezes,days,onEdit,onStatus,onFreeze}:{habit:Habit;completions:Completion[];freezes:HabitFreeze[];days:Date[];onEdit:()=>void;onStatus:(status:'complete'|'skipped')=>void;onFreeze:()=>void}){
  const history=completions.filter(c=>c.habitId===habit.id)
  const current=streakFor(habit,completions,freezes),longest=longestStreakFor(habit,completions,freezes),rate=completionRate(habit,completions)
  const todayCompletion=history.find(c=>c.date===iso()),monthKey=format(new Date(),'yyyy-MM'),freezeUsed=freezes.some(f=>f.habitId===habit.id&&f.month===monthKey)
  return <article className="premium-habit-card" style={{'--habit-color':habit.color} as React.CSSProperties}>
    <header><span className="large-habit-icon"><Repeat2/></span><button onClick={onEdit} aria-label={`Edit ${habit.name}`}><Pencil size={16}/></button></header>
    <span className="category-label">{habit.category} · {habit.schedule}</span><h2>{habit.name}</h2><p>{habit.description||`${habit.weeklyTarget} times per week · build the rhythm gently.`}</p>
    <div className="habit-stat-row"><span><Flame/><b>{current}</b><small>current</small></span><span><Trophy/><b>{longest}</b><small>longest</small></span><span><Target/><b>{rate}%</b><small>30 days</small></span></div>
    <div className="mini-heatmap">{days.slice(-42).map(day=>{const state=history.find(c=>c.date===iso(day))?.status,frozen=freezes.some(f=>f.habitId===habit.id&&f.date===iso(day));return <i key={iso(day)} className={`${state||''} ${frozen?'frozen':''}`} title={`${format(day,'d MMM')} · ${state||'not complete'}`}/>})}</div>
    <footer><button className={todayCompletion?.status==='complete'?'complete active':'complete'} onClick={()=>onStatus('complete')}><Check size={15}/> Done</button><button className={todayCompletion?.status==='skipped'?'skip active':'skip'} onClick={()=>onStatus('skipped')}><Forward size={15}/> Skip</button><button className={`freeze ${freezeUsed?'used':''}`} onClick={onFreeze} disabled={freezeUsed} title="Preserve one missed day per month"><Snowflake size={15}/> {freezeUsed?'Used':'Freeze'}</button></footer>
  </article>
}

function CalendarView({habits,completions,freezes,days,average}:{habits:Habit[];completions:Completion[];freezes:HabitFreeze[];days:Date[];average:number}){
  const range=days.slice(-35)
  return <section className="premium-panel habit-calendar"><div className="premium-panel-head"><div><span className="eyebrow">90-DAY VIEW</span><h2>Consistency calendar</h2></div><span className="score-chip">{average}% average</span></div><div className="calendar-matrix"><div/>{range.map(day=><time key={iso(day)}>{format(day,'d')}</time>)}{habits.slice(0,10).map(habit=><div className="calendar-habit-row" key={habit.id}><b title={habit.name}>{habit.name}</b>{range.map(day=>{const state=completions.find(c=>c.habitId===habit.id&&c.date===iso(day))?.status,frozen=freezes.some(f=>f.habitId===habit.id&&f.date===iso(day));return <i key={iso(day)} className={`${state||''} ${frozen?'frozen':''}`}/>})}</div>)}</div></section>
}

export default function PremiumHabits(){
  const habits=useLiveQuery(()=>db.habits.toArray(),[])||[],completions=useLiveQuery(()=>db.completions.toArray(),[])||[],freezes=useLiveQuery(()=>db.freezes.toArray(),[])||[]
  const [category,setCategory]=useState('All'),[view,setView]=useState<'cards'|'calendar'>('cards'),[editing,setEditing]=useState<Habit|null|undefined>(undefined)
  const today=new Date(),todayKey=iso(today),monthKey=format(today,'yyyy-MM'),visible=habits.filter(h=>category==='Archived'?h.archived:!h.archived&&(category==='All'||h.category===category)),active=habits.filter(h=>!h.archived)
  const completedToday=completions.filter(c=>c.date===todayKey&&c.status==='complete').length,bestStreak=Math.max(0,...active.map(h=>streakFor(h,completions,freezes))),avgRate=Math.round(active.reduce((sum,h)=>sum+completionRate(h,completions),0)/Math.max(1,active.length))
  const days=eachDayOfInterval({start:subDays(today,89),end:today})
  const freeze=async(habit:Habit)=>{if(!habit.id||freezes.some(f=>f.habitId===habit.id&&f.month===monthKey))return;const date=prompt('Freeze which missed date? Use YYYY-MM-DD.',todayKey);if(date)await db.freezes.add({habitId:habit.id,month:monthKey,date,createdAt:new Date().toISOString()})}
  const setStatus=async(habit:Habit,status:'complete'|'skipped')=>{if(!habit.id)return;const existing=completions.find(c=>c.habitId===habit.id&&c.date===todayKey);if(existing)await db.completions.delete(existing.id!);if(existing?.status!==status)await db.completions.add({habitId:habit.id,date:todayKey,status,note:''})}
  return <div className="page premium-habits-page">
    <header className="premium-hero"><div><span className="eyebrow">CONSISTENCY SYSTEM</span><h1>Habits that survive real life.</h1><p>Flexible schedules, honest statistics, and one monthly streak freeze—without guilt.</p></div><button className="primary" onClick={()=>setEditing(null)}><Plus size={17}/> New habit</button></header>
    <div className="habit-summary-grid"><article><span className="violet"><Repeat2/></span><div><small>Active habits</small><b>{active.length}</b></div></article><article><span className="amber"><Flame/></span><div><small>Current best streak</small><b>{bestStreak} days</b></div></article><article><span className="green"><Target/></span><div><small>30-day completion</small><b>{avgRate}%</b></div></article><article><span className="blue"><Check/></span><div><small>Completed today</small><b>{completedToday}/{active.filter(h=>isScheduled(h,today)).length}</b></div></article></div>
    <div className="habit-toolbar"><div className="segmented">{['All',...categories,'Archived'].map(item=><button key={item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{item}</button>)}</div><div className="view-switch"><button className={view==='cards'?'active':''} onClick={()=>setView('cards')}><Sparkles size={15}/> Cards</button><button className={view==='calendar'?'active':''} onClick={()=>setView('calendar')}><CalendarDays size={15}/> Calendar</button></div></div>
    {view==='cards'?<div className="premium-habit-grid">{visible.map(habit=><HabitCard key={habit.id} habit={habit} completions={completions} freezes={freezes} days={days} onEdit={()=>setEditing(habit)} onStatus={status=>setStatus(habit,status)} onFreeze={()=>freeze(habit)}/>)}</div>:<CalendarView habits={visible} completions={completions} freezes={freezes} days={days} average={avgRate}/>} 
    {!visible.length&&<div className="premium-empty"><IceCreamBowl/><h2>Nothing here yet</h2><p>Create a habit or switch categories.</p></div>}{editing!==undefined&&<HabitEditor habit={editing||undefined} onClose={()=>setEditing(undefined)}/>} 
  </div>
}
