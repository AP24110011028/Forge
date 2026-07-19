import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format, parseISO } from 'date-fns'
import { BatteryCharging, BookOpen, BrainCircuit, BriefcaseBusiness, Bus, CalendarDays, Check, Clock3, Dumbbell, GraduationCap, Moon, RefreshCw, Sparkles, Sun, Umbrella, Zap } from 'lucide-react'
import { db } from '../db'
import { iso } from '../metrics'
import { plannerModes, resolveMode, scheduleFor, toPlannerItems, type PlannerMode, type ScheduleBlock } from '../planner'

const modeMeta:Record<PlannerMode,{icon:typeof Sun;description:string}>={
  Auto:{icon:Sparkles,description:'Weekday or weekend, chosen automatically'},
  Weekday:{icon:BriefcaseBusiness,description:'Morning reset, college, bus from 3 August, live GATE'},
  Weekend:{icon:Sun,description:'Deep work, test, roadmap, weekly reset'},
  Vacation:{icon:Umbrella,description:'Long-form GATE and AI project blocks'},
  Exam:{icon:BookOpen,description:'Active recall, past papers, protected sleep'},
  Holiday:{icon:CalendarDays,description:'Family-first with the Probability pair'},
  'Bus Study':{icon:Bus,description:'Offline-first commute study mode'},
}

const categoryIcon:Record<string,typeof Sun>={Health:Dumbbell,College:BookOpen,GATE:GraduationCap,'Bus Study':Bus,'AI Roadmap':BrainCircuit,Family:Sun,Personal:Moon}

function Block({block,done,onToggle}:{block:ScheduleBlock;done:boolean;onToggle:()=>void}){
  const Icon=categoryIcon[block.category]||Clock3
  return <article className={`smart-block ${done?'done':''}`}><button className="block-check" onClick={onToggle}>{done?<Check size={15}/>:null}</button><time><b>{block.time}</b><span>{block.end}</span></time><span className={`smart-block-icon ${block.energy}`}><Icon size={19}/></span><div><b>{block.title}</b><small>{block.category} · {block.hours}h · {block.energy} energy</small></div><span className={`energy-pill ${block.energy}`}>{block.energy}</span></article>
}

export default function SmartPlanner(){
  const [date,setDate]=useState(iso())
  const [mode,setMode]=useState<PlannerMode>(()=>(localStorage.getItem('pujiflow-planner-mode')||'Auto') as PlannerMode)
  const items=useLiveQuery(()=>db.planner.where('date').equals(date).toArray(),[date])||[]
  const selectedDate=parseISO(date)
  const resolved=resolveMode(mode,selectedDate)
  const blocks=scheduleFor(mode,selectedDate)
  const autoItems=items.filter(item=>item.kind==='Auto schedule')
  const generate=async()=>{await db.planner.where('date').equals(date).filter(item=>item.kind==='Auto schedule').delete();await db.planner.bulkAdd(toPlannerItems(blocks,selectedDate))}
  useEffect(()=>{localStorage.setItem('pujiflow-planner-mode',mode)},[mode])
  useEffect(()=>{if(items.length===0){const target=parseISO(date);void db.planner.bulkAdd(toPlannerItems(scheduleFor(mode,target),target))}},[date,mode,items.length])
  const completed=autoItems.filter(item=>item.done).length
  const focusHours=blocks.filter(b=>b.energy==='high').reduce((sum,b)=>sum+b.hours,0)
  const totalHours=blocks.reduce((sum,b)=>sum+b.hours,0)
  const toggle=async(index:number)=>{const item=autoItems[index];if(item?.id)await db.planner.update(item.id,{done:!item.done})}

  return <div className="page smart-planner-page">
    <header className="premium-hero"><div><span className="eyebrow">SMART DAILY PLANNER</span><h1>Your day, intelligently shaped.</h1><p>Choose a mode once. Forge builds the schedule and keeps the day realistic.</p></div><div className="hero-actions"><input className="premium-date" type="date" value={date} onChange={e=>setDate(e.target.value)}/><button className="primary" onClick={generate}><RefreshCw size={16}/> Regenerate</button></div></header>

    <section className="mode-picker" aria-label="Planner mode">{plannerModes.map(value=>{const Meta=modeMeta[value],Icon=Meta.icon;return <button key={value} className={mode===value?'active':''} onClick={()=>setMode(value)}><Icon size={18}/><span><b>{value}</b><small>{Meta.description}</small></span>{mode===value&&<Check size={16}/>}</button>})}</section>

    <div className="planner-summary-grid"><article><span><CalendarDays/></span><div><small>Active mode</small><b>{resolved}</b></div></article><article><span><Zap/></span><div><small>Deep-focus time</small><b>{focusHours.toFixed(1)} hours</b></div></article><article><span><Clock3/></span><div><small>Planned time</small><b>{totalHours.toFixed(1)} hours</b></div></article><article><span><BatteryCharging/></span><div><small>Blocks complete</small><b>{completed}/{blocks.length}</b></div></article></div>

    <div className="smart-planner-layout">
      <section className="premium-panel smart-agenda"><div className="premium-panel-head"><div><span className="eyebrow">{format(selectedDate,'EEEE').toUpperCase()}</span><h2>{format(selectedDate,'d MMMM yyyy')}</h2></div><span className="score-chip">{resolved} mode</span></div><div className="smart-blocks">{blocks.map((block,index)=><Block key={`${block.time}-${block.title}`} block={block} done={autoItems[index]?.done||false} onToggle={()=>toggle(index)}/>)}</div></section>
      <aside className="planner-side">
        <section className="premium-panel"><span className="eyebrow">PLANNING RULES</span><h2>Built around your real life</h2><ul className="rule-list"><li><Check/>Morning preparation is protected before college.</li><li><Check/>Bus study activates when college starts on 3 August.</li><li><Check/>The Probability pair stays together.</li><li><Check/>Live GATE begins at 8:30 PM.</li><li><Check/>Recovery time is part of the plan.</li></ul></section>
        <section className="planner-coach"><Sparkles/><span><small>FORGE COACH</small><b>{completed===blocks.length?'Day complete. Close the loop with a reflection.':completed>0?'Momentum is active. Protect the next block.':'Start with the first block, not the whole day.'}</b></span></section>
      </aside>
    </div>
  </div>
}
