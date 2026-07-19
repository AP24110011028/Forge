import Dexie, { type EntityTable } from 'dexie'
import type { BacklogDay, CollegeSubject, Completion, DailyAction, FocusSession, GateSubject, Habit, HabitFreeze, KnowledgeItem, PlannerItem, Project, Review, RoadmapWeek, XPEvent } from './types'
import { collegeSubjects, demoHabits, gateSubjects, roadmapWeeks } from './data'
import { z } from 'zod'
class PujiDB extends Dexie {
  habits!:EntityTable<Habit,'id'>; completions!:EntityTable<Completion,'id'>; freezes!:EntityTable<HabitFreeze,'id'>; actions!:EntityTable<DailyAction,'id'>; xpEvents!:EntityTable<XPEvent,'id'>; focusSessions!:EntityTable<FocusSession,'id'>; gate!:EntityTable<GateSubject,'id'>; roadmap!:EntityTable<RoadmapWeek,'id'>; backlog!:EntityTable<BacklogDay,'id'>; college!:EntityTable<CollegeSubject,'id'>; projects!:EntityTable<Project,'id'>; planner!:EntityTable<PlannerItem,'id'>; knowledge!:EntityTable<KnowledgeItem,'id'>; reviews!:EntityTable<Review,'id'>
  constructor(){super('PujiFlowDB');this.version(1).stores({habits:'++id,name,category,archived',completions:'++id,[habitId+date],habitId,date,status',gate:'++id,name',roadmap:'++id,week,month',backlog:'++id,day',college:'++id,name',projects:'++id,status,deadline',planner:'++id,date,kind,category'});this.version(2).stores({habits:'++id,name,category,archived',completions:'++id,[habitId+date],habitId,date,status',gate:'++id,name',roadmap:'++id,week,month',backlog:'++id,day',college:'++id,name',projects:'++id,status,deadline',planner:'++id,date,kind,category',knowledge:'++id,source,status,createdAt',reviews:'++id,[period+key],period,key'});this.version(3).stores({habits:'++id,name,category,archived',completions:'++id,[habitId+date],habitId,date,status',freezes:'++id,[habitId+month],habitId,month,date',gate:'++id,name',roadmap:'++id,week,month',backlog:'++id,day',college:'++id,name',projects:'++id,status,deadline',planner:'++id,date,kind,category',knowledge:'++id,source,status,createdAt',reviews:'++id,[period+key],period,key'});this.version(4).stores({habits:'++id,name,category,archived',completions:'++id,[habitId+date],habitId,date,status',freezes:'++id,[habitId+month],habitId,month,date',gate:'++id,name',roadmap:'++id,week,month',backlog:'++id,day',college:'++id,name',projects:'++id,status,deadline',planner:'++id,date,kind,category',knowledge:'++id,source,status,createdAt',reviews:'++id,[period+key],period,key'}).upgrade(async transaction=>{await transaction.table('habits').toCollection().modify(habit=>{if(habit.name==='Gym')habit.archived=true});await transaction.table('planner').filter(item=>item.title?.toLowerCase().includes('gym')).delete()});this.version(5).stores({habits:'++id,name,category,archived',completions:'++id,[habitId+date],habitId,date,status',freezes:'++id,[habitId+month],habitId,month,date',actions:'++id,date,status,category,habitId',xpEvents:'++id,&sourceKey,occurredAt,category',focusSessions:'++id,actionId,startedAt,status',gate:'++id,name',roadmap:'++id,week,month',backlog:'++id,day',college:'++id,name',projects:'++id,status,deadline',planner:'++id,date,kind,category',knowledge:'++id,source,status,createdAt',reviews:'++id,[period+key],period,key'})}
}
export const db=new PujiDB()

const backupSchema=z.object({version:z.number().int().positive(),exportedAt:z.string(),data:z.record(z.string(),z.array(z.unknown()))})
export async function seed(force=false){
  if(force) await db.transaction('rw',db.tables,async()=>{for(const t of db.tables)await t.clear()})
  await db.habits.where('name').anyOf(['Morning bus study','Evening bus revision']).modify({startDate:'2026-08-03'})
  await db.planner.where('category').equals('Bus Study').filter(item=>item.date<'2026-08-03').delete()
  if(await db.habits.count()===0) await db.habits.bulkAdd(demoHabits)
  const today=new Date().toISOString().slice(0,10)
  if(await db.actions.where('date').equals(today).count()===0){
    const habits=await db.habits.where('archived').equals(0).toArray()
    const exact:Record<string,[string,string[],string]>= {
      'Pending GATE lecture':['Probability — Continue pending lecture',['Watch the next pending segment','Write five concise notes','Record one doubt'],'Lecture notes updated'],
      'Current GATE lecture':['Probability — Current lecture and examples',['Complete the current lecture','Solve two guided examples','Mark the next action'],'Current lecture notes'],
      'DPP':['Probability DPP — Timed practice',['Attempt questions without notes','Review every incorrect answer','Record the error pattern'],'Completed DPP'],
      'Python or AI learning':['Python practice — Current roadmap topic',['Review the current concept','Write a short practice program','Save evidence or a GitHub commit'],'Working practice file'],
      'Morning bus study':['Morning bus — Offline formula review',['Open downloaded material','Review one formula set','Capture one recall gap'],'Reviewed offline notes'],
    }
    await db.actions.bulkAdd(habits.slice(0,10).map((habit,index)=>{const detail=exact[habit.name]??[habit.name,[`Complete ${habit.name.toLowerCase()}`,'Add a brief note when useful'],`${habit.name} check-in`];return {habitId:habit.id,date:today,title:detail[0],category:habit.category,checklist:detail[1],checklistDone:[],topic:habit.name,module:habit.category,resource:'',expectedOutput:detail[2],evidence:'Optional note or local file',estimatedMinutes:['Health','Personal','Family'].includes(habit.category)?15:habit.category==='GATE'?60:45,actualMinutes:0,priority:index<4?'High':'Medium',energy:index<4?'High':'Medium',timeBlock:index<2?'Afternoon Deep Work':habit.category==='GATE'?'GATE Class':'Flexible',status:'Not Started',notes:'',xpReward:index<4?35:20,optional:index>7} as DailyAction}))
  }
  if(await db.gate.count()===0) await db.gate.bulkAdd(gateSubjects)
  const existingRoadmap=await db.roadmap.toArray()
  for(const template of roadmapWeeks){
    const existing=existingRoadmap.find(item=>item.week===template.week)
    if(existing?.id) await db.roadmap.update(existing.id,{month:template.month,title:template.title,topics:template.topics,build:template.build,completedTopics:existing.completedTopics.filter(topic=>template.topics.includes(topic))})
    else await db.roadmap.add(template)
  }
  if(await db.backlog.count()===0) await db.backlog.bulkAdd(Array.from({length:11},(_,i)=>({day:i+1,pending:false,current:false,dpp:false,notes:''})))
  if(await db.college.count()===0) await db.college.bulkAdd(collegeSubjects)
}
export async function exportData(){const data:Record<string,unknown[]>={};for(const t of db.tables)data[t.name]=await t.toArray();return {version:1,exportedAt:new Date().toISOString(),data}}
export async function importData(input:unknown){const payload=backupSchema.parse(input);await db.transaction('rw',db.tables,async()=>{for(const t of db.tables){await t.clear();const rows=payload.data[t.name];if(Array.isArray(rows)&&rows.length)await t.bulkAdd(rows)}})}
export function validateBackup(input:unknown){return backupSchema.safeParse(input)}
