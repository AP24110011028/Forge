import { format, isWeekend } from 'date-fns'
import type { PlannerItem } from './types'

export type PlannerMode = 'Auto' | 'Weekday' | 'Weekend' | 'Vacation' | 'Exam' | 'Holiday' | 'Bus Study'
export type ScheduleBlock = { time:string; end:string; title:string; category:string; hours:number; energy:'high'|'medium'|'low' }
export const collegeStartDate='2026-08-03'

const schedules:Record<Exclude<PlannerMode,'Auto'>,ScheduleBlock[]> = {
  Weekday:[
    {time:'05:00',end:'06:00',title:'Morning reset & planning',category:'Personal',hours:1,energy:'low'},
    {time:'06:00',end:'07:15',title:'Get ready & breakfast',category:'Personal',hours:1.25,energy:'low'},
    {time:'07:40',end:'08:30',title:'Morning bus study',category:'Bus Study',hours:.8,energy:'medium'},
    {time:'09:00',end:'17:30',title:'College',category:'College',hours:8.5,energy:'high'},
    {time:'17:50',end:'19:00',title:'Evening bus revision',category:'Bus Study',hours:1.15,energy:'low'},
    {time:'19:00',end:'20:15',title:'Dinner, family & reset',category:'Family',hours:1.25,energy:'low'},
    {time:'20:30',end:'00:00',title:'Live GATE class',category:'GATE',hours:3.5,energy:'high'},
  ],
  Weekend:[
    {time:'06:30',end:'07:30',title:'Weekly reset & planning',category:'Personal',hours:1,energy:'low'},
    {time:'08:00',end:'10:00',title:'Pending Probability lecture + DPP',category:'GATE',hours:2,energy:'high'},
    {time:'10:30',end:'12:30',title:'Semester assignments & labs',category:'College',hours:2,energy:'high'},
    {time:'14:00',end:'16:00',title:'AI roadmap project',category:'AI Roadmap',hours:2,energy:'high'},
    {time:'16:30',end:'18:00',title:'Weekly GATE test & review',category:'GATE',hours:1.5,energy:'medium'},
    {time:'18:00',end:'20:15',title:'Family time & recovery',category:'Family',hours:2.25,energy:'low'},
    {time:'20:30',end:'22:00',title:'Plan the coming week',category:'Personal',hours:1.5,energy:'medium'},
  ],
  Vacation:[
    {time:'07:00',end:'08:00',title:'Morning reset & breakfast',category:'Personal',hours:1,energy:'low'},
    {time:'09:00',end:'11:00',title:'GATE deep work',category:'GATE',hours:2,energy:'high'},
    {time:'11:30',end:'13:00',title:'Current Probability lecture',category:'GATE',hours:1.5,energy:'high'},
    {time:'15:00',end:'17:00',title:'AI roadmap build',category:'AI Roadmap',hours:2,energy:'high'},
    {time:'17:30',end:'18:30',title:'Revision & flashcards',category:'Personal',hours:1,energy:'low'},
    {time:'19:00',end:'21:00',title:'Family time',category:'Family',hours:2,energy:'low'},
  ],
  Exam:[
    {time:'05:30',end:'06:15',title:'Light movement & breakfast',category:'Health',hours:.75,energy:'low'},
    {time:'06:30',end:'08:30',title:'Exam subject revision',category:'College',hours:2,energy:'high'},
    {time:'09:00',end:'12:00',title:'Past papers & active recall',category:'College',hours:3,energy:'high'},
    {time:'14:00',end:'16:00',title:'Weak-topic repair',category:'College',hours:2,energy:'high'},
    {time:'17:00',end:'18:00',title:'Formula sheet review',category:'College',hours:1,energy:'medium'},
    {time:'20:00',end:'21:00',title:'Calm final recap',category:'College',hours:1,energy:'low'},
    {time:'22:00',end:'05:30',title:'Protected sleep',category:'Health',hours:7.5,energy:'low'},
  ],
  Holiday:[
    {time:'08:00',end:'14:00',title:'Family time',category:'Family',hours:6,energy:'low'},
    {time:'14:00',end:'15:30',title:'Pending Probability lecture',category:'GATE',hours:1.5,energy:'high'},
    {time:'15:45',end:'17:15',title:'Current Probability lecture',category:'GATE',hours:1.5,energy:'high'},
    {time:'17:15',end:'18:00',title:'DPP & MCQs',category:'GATE',hours:.75,energy:'medium'},
    {time:'18:00',end:'19:00',title:'Python, Git or AI practice',category:'AI Roadmap',hours:1,energy:'medium'},
    {time:'20:30',end:'00:00',title:'Live GATE class',category:'GATE',hours:3.5,energy:'high'},
  ],
  'Bus Study':[
    {time:'07:40',end:'08:30',title:'Downloaded lecture or PDF',category:'Bus Study',hours:.8,energy:'medium'},
    {time:'17:50',end:'18:20',title:'MCQs & flashcards',category:'Bus Study',hours:.5,energy:'medium'},
    {time:'18:20',end:'19:00',title:'Notes review or rest',category:'Bus Study',hours:.65,energy:'low'},
    {time:'20:30',end:'22:00',title:'Focused GATE follow-up',category:'GATE',hours:1.5,energy:'high'},
  ],
}

export function resolveMode(mode:PlannerMode,date:Date):Exclude<PlannerMode,'Auto'>{
  return mode==='Auto' ? (isWeekend(date)?'Weekend':'Weekday') : mode
}

export function scheduleFor(mode:PlannerMode,date=new Date()){
  const blocks=schedules[resolveMode(mode,date)]
  return format(date,'yyyy-MM-dd')<collegeStartDate?blocks.filter(block=>block.category!=='Bus Study'):blocks
}

export function toPlannerItems(blocks:ScheduleBlock[],date:Date):PlannerItem[]{
  const day=format(date,'yyyy-MM-dd')
  return blocks.map(block=>({kind:'Auto schedule',date:day,title:`${block.time} · ${block.title}`,category:block.category,hours:block.hours,done:false,notes:`${block.time}–${block.end} · ${block.energy} energy`}))
}

export const plannerModes:PlannerMode[]=['Auto','Weekday','Weekend','Vacation','Exam','Holiday','Bus Study']
