import type { DailyAction, XPEvent } from '../types'

export const levelFor=(xp:number)=>{
  let level=1,spent=0,next=500
  while(xp>=spent+next){spent+=next;level++;next=Math.round(500*Math.pow(1.16,level-1)/25)*25}
  return {level,current:xp-spent,required:next,progress:Math.round((xp-spent)/next*100)}
}

export const xpFor=(action:Pick<DailyAction,'estimatedMinutes'|'priority'|'category'>)=>{
  const effort=action.estimatedMinutes<=10?5:action.estimatedMinutes<=30?15:action.estimatedMinutes<=60?25:action.estimatedMinutes<=120?50:75
  const priority={Low:0,Medium:5,High:10,Critical:20}[action.priority]
  const category=action.category==='Health'||action.category==='Personal'?-5:0
  return Math.max(5,effort+priority+category)
}

export const canAwardXP=(events:XPEvent[],sourceKey:string)=>!events.some(event=>event.sourceKey===sourceKey)

export type WorkloadLevel='Light'|'Balanced'|'Heavy'|'Overloaded'
export function workloadFor(actions:DailyAction[]){
  const active=actions.filter(a=>!['Done','Frozen','Skipped'].includes(a.status))
  const minutes=active.reduce((sum,a)=>sum+a.estimatedMinutes,0)
  const deep=active.filter(a=>a.estimatedMinutes>=60||a.energy==='High').length
  const overdue=active.filter(a=>a.date<new Date().toISOString().slice(0,10)).length
  const score=minutes+deep*25+overdue*35+active.filter(a=>a.priority==='Critical').length*30
  const level:WorkloadLevel=score<=150?'Light':score<=360?'Balanced':score<=540?'Heavy':'Overloaded'
  const movable=active.filter(a=>a.optional||a.priority==='Low').sort((a,b)=>a.estimatedMinutes-b.estimatedMinutes)
  return {level,minutes,score,suggestion:level==='Overloaded'&&movable[0]?`Move “${movable[0].title}” to a calmer day and protect sleep.`:level==='Heavy'?'Keep one buffer block free for unfinished work.':'Your plan leaves reasonable breathing room.'}
}

export function dailyStatus(actions:DailyAction[]){
  if(!actions.length)return {label:'Reset Day',percent:0,message:'A blank day can be a deliberate reset.'}
  const valid=actions.filter(a=>['Done','Frozen','Skipped'].includes(a.status)).length
  const done=actions.filter(a=>a.status==='Done').length
  const percent=Math.round(valid/actions.length*100)
  if(percent===100)return {label:'Perfect Day',percent,message:'Every planned item was completed or intentionally protected.'}
  if(percent>=80)return {label:'Strong Day',percent,message:'A strong day with room to breathe.'}
  if(percent>=50)return {label:'Progress Day',percent,message:'Meaningful progress is safely recorded.'}
  if(done)return {label:'Recovery Day',percent,message:'One meaningful action is enough to restart momentum.'}
  return {label:'Reset Day',percent,message:'No judgment—choose one gentle next action.'}
}

