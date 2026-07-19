import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, format } from 'date-fns'
import { Award, Check, ChevronDown, Circle, Clock3, ExternalLink, Flame, Pause, Play, RotateCcw, Snowflake, Sparkles, Square, Trophy } from 'lucide-react'
import { db } from '../db'
import { dailyStatus, levelFor, workloadFor } from '../domain/progress'
import type { ActionStatus, DailyAction } from '../types'

const today=()=>format(new Date(),'yyyy-MM-dd')
const statuses:ActionStatus[]=['Not Started','In Progress','Done','Frozen','Skipped','Missed']

async function setActionStatus(action:DailyAction,status:ActionStatus){
  if(!action.id)return
  await db.transaction('rw',[db.actions,db.xpEvents],async()=>{
    const completedAt=status==='Done'?new Date().toISOString():undefined
    await db.actions.update(action.id!,{status,completedAt})
    const sourceKey=`action:${action.id}:done`
    if(status==='Done'&&!await db.xpEvents.where('sourceKey').equals(sourceKey).first())await db.xpEvents.add({sourceKey,amount:action.xpReward,category:action.category,description:action.title,occurredAt:completedAt!})
  })
}

export function TodayPage(){
  const actions=useLiveQuery(()=>db.actions.where('date').equals(today()).toArray(),[])??[]
  const events=useLiveQuery(()=>db.xpEvents.toArray(),[])??[]
  const [expanded,setExpanded]=useState<number>()
  const workload=workloadFor(actions),status=dailyStatus(actions),xp=events.filter(e=>e.occurredAt.slice(0,10)===today()).reduce((s,e)=>s+e.amount,0)
  const grouped=Object.entries(actions.reduce<Record<string,DailyAction[]>>((groups,action)=>{(groups[action.timeBlock]??=[]).push(action);return groups},{}))
  return <div className="page"><header className="page-head"><div><span className="eyebrow">TODAY’S MISSION</span><h1>One clear action at a time</h1><p>{status.message}</p></div><div className="today-score"><strong>{status.percent}%</strong><span>{status.label}</span></div></header>
    <div className="today-metrics"><div><Clock3/><b>{workload.minutes} min</b><span>{workload.level} plan</span></div><div><Sparkles/><b>{xp} XP</b><span>earned today</span></div><div><Flame/><b>{actions.filter(a=>a.status==='Done').length}</b><span>actions complete</span></div></div>
    {(workload.level==='Heavy'||workload.level==='Overloaded')&&<section className="coach-card"><Sparkles/><div><b>Calm workload check</b><p>{workload.suggestion}</p></div></section>}
    {grouped.map(([block,items])=><section className="action-group" key={block}><div className="action-group-head"><h2>{block}</h2><span>{items?.filter(a=>a.status==='Done').length}/{items?.length}</span></div>{items?.map(action=><article className={`daily-action ${action.status==='Done'?'is-done':''}`} key={action.id}><button className="action-check" aria-label={`Mark ${action.title} done`} onClick={()=>setActionStatus(action,action.status==='Done'?'Not Started':'Done')}>{action.status==='Done'?<Check/>:<Circle/>}</button><div className="action-main"><button className="action-title" onClick={()=>setExpanded(expanded===action.id?undefined:action.id)}><span><b>{action.title}</b><small>{action.category} · {action.estimatedMinutes} min · {action.xpReward} XP</small></span><ChevronDown className={expanded===action.id?'rotated':''}/></button>{expanded===action.id&&<div className="action-detail"><ul>{action.checklist.map((item,i)=><li key={item}><label><input type="checkbox" checked={action.checklistDone.includes(i)} onChange={async()=>{const next=action.checklistDone.includes(i)?action.checklistDone.filter(x=>x!==i):[...action.checklistDone,i];await db.actions.update(action.id!,{checklistDone:next})}}/>{item}</label></li>)}</ul><p><b>Expected output:</b> {action.expectedOutput}</p><textarea value={action.notes} onChange={e=>db.actions.update(action.id!,{notes:e.target.value})} placeholder="Notes, evidence, or what to continue…"/><div className="action-buttons"><a className="button" href={`/focus?action=${action.id}`}><Play/> Start focus</a>{action.resource&&<a className="button" href={action.resource}><ExternalLink/> Resource</a>}<button onClick={()=>db.actions.update(action.id!,{date:format(addDays(new Date(),1),'yyyy-MM-dd'),status:'Not Started'})}><RotateCcw/> Tomorrow</button></div></div>}</div><select aria-label={`Status for ${action.title}`} value={action.status} onChange={e=>setActionStatus(action,e.target.value as ActionStatus)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></article>)}</section>)}
  </div>
}

export function FocusMode(){
  const params=new URLSearchParams(location.search),requested=Number(params.get('action'))
  const actions=useLiveQuery(()=>db.actions.where('date').equals(today()).toArray(),[])??[]
  const action=actions.find(a=>a.id===requested)??actions.find(a=>a.status!=='Done')
  const [minutes,setMinutesState]=useState(25),[seconds,setSeconds]=useState(25*60),[running,setRunning]=useState(false),[countUp,setCountUpState]=useState(false),[notes,setNotes]=useState('')
  const startedAt=useRef<string|undefined>(undefined)
  const setMinutes=(value:number)=>{setMinutesState(value);setSeconds(countUp?0:value*60);setRunning(false);startedAt.current=undefined}
  const setCountUp=(value:boolean)=>{setCountUpState(value);setSeconds(value?0:minutes*60);setRunning(false);startedAt.current=undefined}
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(value=>{if(!countUp&&value<=1){setRunning(false);void notifyFinished();return 0}return value+(countUp?1:-1)}),1000);return()=>clearInterval(id)},[running,countUp])
  const toggleRunning=()=>{if(!running&&!startedAt.current)startedAt.current=new Date().toISOString();setRunning(value=>!value)}
  const finish=async(status:'Completed'|'Abandoned')=>{if(action?.id&&status==='Completed')await setActionStatus(action,'Done');const endedAt=new Date().toISOString();await db.focusSessions.add({actionId:action?.id,startedAt:startedAt.current??endedAt,endedAt,plannedMinutes:minutes,actualSeconds:countUp?seconds:minutes*60-seconds,status,notes,interruptions:[]});setRunning(false);startedAt.current=undefined}
  if(!action)return <div className="page focus-empty"><Sparkles/><h1>Your focus space is ready</h1><p>Add or generate a Today action, then begin a focused session.</p></div>
  return <div className="focus-page"><span className="eyebrow">FOCUS MODE · {action.category.toUpperCase()}</span><h1>{action.title}</h1><p>{action.expectedOutput}</p><div className="focus-timer">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</div><div className="timer-presets">{[25,45,60,90].map(m=><button className={minutes===m?'active':''} onClick={()=>setMinutes(m)} key={m}>{m}m</button>)}<button onClick={()=>setCountUp(!countUp)}>{countUp?'Countdown':'Count up'}</button></div><div className="focus-controls"><button className="primary" onClick={toggleRunning}>{running?<Pause/>:<Play/>}{running?'Pause':'Start'}</button><button onClick={()=>finish('Completed')}><Check/> Finish</button><button onClick={()=>finish('Abandoned')}><Square/> Leave gently</button></div><section className="focus-notes"><h2>Session notes</h2><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Capture a thought, interruption, or next step…"/></section></div>
}

async function notifyFinished(){try{const api=await import('@tauri-apps/plugin-notification');let permission=await api.isPermissionGranted();if(!permission)permission=(await api.requestPermission())==='granted';if(permission)api.sendNotification({title:'Focus session complete',body:'Your focused time is recorded. Take a breath before the next step.'})}catch{/* Browser preview has no native notification bridge. */}}

const achievementDefs=[['First Step','Complete your first daily action',1,'Common'],['First Habit Completed','Record one habit completion',1,'Common'],['Three-Day Spark','Reach a three-day streak',3,'Common'],['Seven-Day Streak','Keep a seven-day flame',7,'Rare'],['Fourteen-Day Streak','Build fourteen consistent days',14,'Rare'],['Thirty-Day Streak','Protect a thirty-day rhythm',30,'Epic'],['100 XP','Earn 100 lifetime XP',100,'Common'],['1,000 XP','Earn 1,000 lifetime XP',1000,'Rare'],['10,000 XP','Earn 10,000 lifetime XP',10000,'Legendary']] as const
export function AchievementsPage(){const events=useLiveQuery(()=>db.xpEvents.toArray(),[])??[],completions=useLiveQuery(()=>db.completions.toArray(),[])??[];const xp=events.reduce((s,e)=>s+e.amount,0),done=events.filter(e=>e.sourceKey.startsWith('action:')).length;const level=levelFor(xp);return <div className="page"><header className="page-head"><div><span className="eyebrow">MILESTONES</span><h1>Achievements</h1><p>Quiet evidence of the work you kept showing up for.</p></div><div className="level-chip"><Trophy/><b>Level {level.level}</b><span>{level.current}/{level.required} XP</span></div></header><div className="achievement-grid">{achievementDefs.map(([title,description,target,rarity],i)=>{const progress=title.includes('XP')?xp:title.includes('Habit')?completions.filter(c=>c.status==='complete').length:title.includes('Step')?done:0,unlocked=progress>=target;return <article className={`achievement ${unlocked?'unlocked':''}`} key={title}><div className="achievement-icon">{unlocked?<Award/>:i<6?<Flame/>:<Snowflake/>}</div><span className="eyebrow">{rarity}</span><h2>{title}</h2><p>{description}</p><div className="progress"><span style={{width:`${Math.min(100,progress/target*100)}%`}}/></div><small>{unlocked?'Unlocked':`${Math.min(progress,target)} / ${target}`}</small></article>})}</div></div>}
