import assert from 'node:assert/strict'
import test from 'node:test'
import { scheduleFor, toPlannerItems } from '../src/planner.ts'
import { completionRate, isScheduled, longestStreakFor, streakFor } from '../src/metrics.ts'
import { roadmapWeeks } from '../src/data.ts'
import type { Completion, Habit, HabitFreeze } from '../src/types.ts'
import { canAwardXP, dailyStatus, levelFor, workloadFor, xpFor } from '../src/domain/progress.ts'
import type { DailyAction } from '../src/types.ts'

const habit=(overrides:Partial<Habit>={}):Habit=>({
  id:1,name:'Deep work',category:'GATE',icon:'Target',description:'',schedule:'daily',
  weekdays:[1,2,3,4,5],weeklyTarget:7,startDate:'2026-01-01',reminder:'',color:'#8b7cf6',
  archived:false,createdAt:'2026-01-01T00:00:00.000Z',...overrides,
})

test('weekday schedule protects the real-life anchors after college starts',()=>{
  const blocks=scheduleFor('Weekday',new Date('2026-08-03T12:00:00'))
  assert.equal(blocks[0].time,'05:00')
  assert.ok(blocks.some(block=>block.time==='07:40'&&block.category==='Bus Study'))
  assert.ok(blocks.some(block=>block.time==='09:00'&&block.end==='17:30'))
  assert.ok(blocks.some(block=>block.time==='17:50'&&block.category==='Bus Study'))
  assert.ok(blocks.some(block=>block.time==='20:30'&&block.category==='GATE'))
})

test('bus study stays paused until college starts on 3 August',()=>{
  const before=scheduleFor('Weekday',new Date('2026-08-02T12:00:00'))
  const firstDay=scheduleFor('Weekday',new Date('2026-08-03T12:00:00'))
  assert.equal(before.some(block=>block.category==='Bus Study'),false)
  assert.equal(firstDay.filter(block=>block.category==='Bus Study').length,2)
})

test('AI Engineer roadmap spans eleven flexible months and 44 sustainable weeks',()=>{
  assert.equal(roadmapWeeks.length,44)
  assert.deepEqual([...new Set(roadmapWeeks.map(week=>week.month))],[1,2,3,4,5,6,7,8,9,10,11])
  assert.equal(roadmapWeeks.at(-1)?.title,'Capstone & portfolio')
})

test('auto mode chooses weekend and generates persistable planner items',()=>{
  const saturday=new Date('2026-07-18T12:00:00')
  const blocks=scheduleFor('Auto',saturday)
  assert.ok(blocks.some(block=>block.title.includes('Weekly GATE test')))
  const items=toPlannerItems(blocks,saturday)
  assert.equal(items.length,blocks.length)
  assert.ok(items.every(item=>item.kind==='Auto schedule'&&item.done===false))
})

test('custom and weekday schedules only activate on intended dates',()=>{
  assert.equal(isScheduled(habit({schedule:'weekdays'}),new Date('2026-07-17T12:00:00')),true)
  assert.equal(isScheduled(habit({schedule:'weekdays'}),new Date('2026-07-18T12:00:00')),false)
  assert.equal(isScheduled(habit({schedule:'custom',customDates:['2026-07-20']}),new Date('2026-07-20T12:00:00')),true)
  assert.equal(isScheduled(habit({schedule:'custom',customDates:['2026-07-20']}),new Date('2026-07-21T12:00:00')),false)
})

test('streak freeze preserves one missed day and longest streak stays correct',()=>{
  const completions:Completion[]=[
    {id:1,habitId:1,date:'2026-07-15',status:'complete',note:''},
    {id:2,habitId:1,date:'2026-07-17',status:'complete',note:''},
  ]
  const freezes:HabitFreeze[]=[{id:1,habitId:1,month:'2026-07',date:'2026-07-16',createdAt:'2026-07-17T00:00:00.000Z'}]
  const now=new Date('2026-07-17T12:00:00')
  assert.equal(streakFor(habit(),completions,freezes,now),2)
  assert.equal(longestStreakFor(habit(),completions,freezes),2)
})

test('non-scheduled and skipped days preserve a streak without increasing it',()=>{
  const weekdayHabit=habit({schedule:'weekdays'})
  const completions:Completion[]=[
    {id:1,habitId:1,date:'2026-07-16',status:'complete',note:''},
    {id:2,habitId:1,date:'2026-07-17',status:'skipped',note:''},
    {id:3,habitId:1,date:'2026-07-20',status:'complete',note:''},
  ]
  assert.equal(streakFor(weekdayHabit,completions,[],new Date('2026-07-20T12:00:00')),2)
  assert.equal(longestStreakFor(weekdayHabit,completions),2)
})

test('completion rate excludes skipped check-ins',()=>{
  const completions:Completion[]=[
    {id:1,habitId:1,date:'2026-07-17',status:'complete',note:''},
    {id:2,habitId:1,date:'2026-07-16',status:'skipped',note:''},
  ]
  assert.equal(completionRate(habit(),completions,2),50)
})

const action=(overrides:Partial<DailyAction>={}):DailyAction=>({date:'2026-07-19',title:'Deep practice',category:'GATE',checklist:[],checklistDone:[],topic:'',module:'',resource:'',expectedOutput:'',evidence:'',estimatedMinutes:60,actualMinutes:0,priority:'High',energy:'High',timeBlock:'Flexible',status:'Not Started',notes:'',xpReward:35,optional:false,...overrides})

test('XP rules are effort-aware and source events are idempotent',()=>{
  assert.equal(xpFor(action()),35)
  assert.equal(canAwardXP([{sourceKey:'action:1:done',amount:35,category:'GATE',description:'',occurredAt:''}],'action:1:done'),false)
  assert.equal(canAwardXP([],'action:1:done'),true)
})

test('levels have increasing requirements and preserve progress',()=>{
  assert.deepEqual(levelFor(0),{level:1,current:0,required:500,progress:0})
  assert.equal(levelFor(500).level,2)
  assert.ok(levelFor(1200).required>500)
})

test('workload suggests moving an optional item only when overloaded',()=>{
  const result=workloadFor(Array.from({length:8},(_,i)=>action({id:i+1,title:i===0?'Optional reading':`Task ${i}`,estimatedMinutes:90,optional:i===0,priority:i===0?'Low':'High'})))
  assert.equal(result.level,'Overloaded')
  assert.match(result.suggestion,/Optional reading/)
})

test('perfect day accepts done, frozen and validly skipped items',()=>{
  const result=dailyStatus([action({status:'Done'}),action({status:'Frozen'}),action({status:'Skipped'})])
  assert.equal(result.label,'Perfect Day')
  assert.equal(result.percent,100)
})
