import { eachDayOfInterval, format, parseISO, subDays } from 'date-fns'
import type { Completion, Habit, HabitFreeze } from './types'

export const iso=(date=new Date())=>format(date,'yyyy-MM-dd')
export const percent=(done:number,total:number)=>total?Math.round(done/total*100):0

export function isScheduled(habit:Habit,date:Date){
  if(date<parseISO(habit.startDate)||(habit.endDate&&date>parseISO(habit.endDate)))return false
  if(habit.schedule==='daily')return true
  if(habit.schedule==='monthly')return date.getDate()===parseISO(habit.startDate).getDate()
  if(habit.schedule==='custom')return habit.customDates?.includes(iso(date))??false
  return habit.weekdays.includes(date.getDay())
}

export function streakFor(habit:Habit,completions:Completion[],freezes:HabitFreeze[]=[],now=new Date()){
  const results=new Map(completions.filter(c=>c.habitId===habit.id).map(c=>[c.date,c.status]))
  const frozen=new Set(freezes.filter(f=>f.habitId===habit.id).map(f=>f.date))
  let run=0,date=now,firstScheduled=true
  while(date>=parseISO(habit.startDate)){
    if(!isScheduled(habit,date)){date=subDays(date,1);continue}
    const key=iso(date),result=results.get(key)
    if(firstScheduled&&!result&&!frozen.has(key)){firstScheduled=false;date=subDays(date,1);continue}
    firstScheduled=false
    if(result==='complete')run++
    else if(result!=='skipped'&&!frozen.has(key))break
    date=subDays(date,1)
  }
  return run
}

export function longestStreakFor(habit:Habit,completions:Completion[],freezes:HabitFreeze[]=[]){
  const relevant=completions.filter(c=>c.habitId===habit.id)
  const frozen=new Set(freezes.filter(f=>f.habitId===habit.id).map(f=>f.date))
  const endKeys=[...relevant.map(c=>c.date),...frozen].sort()
  if(!endKeys.length)return 0
  const results=new Map(relevant.map(c=>[c.date,c.status]))
  let best=0,run=0
  for(const date of eachDayOfInterval({start:parseISO(habit.startDate),end:parseISO(endKeys.at(-1)!)})){
    if(!isScheduled(habit,date))continue
    const key=iso(date),result=results.get(key)
    if(result==='complete'){run++;best=Math.max(best,run)}
    else if(result!=='skipped'&&!frozen.has(key))run=0
  }
  return best
}

export function completionRate(habit:Habit,completions:Completion[],days=30,now?:Date){
  const relevant=completions.filter(c=>c.habitId===habit.id).map(c=>c.date).sort()
  const end=now??(relevant.length?parseISO(relevant.at(-1)!):new Date())
  const range=eachDayOfInterval({start:subDays(end,days-1),end}).filter(date=>isScheduled(habit,date))
  const done=completions.filter(c=>c.habitId===habit.id&&c.status==='complete'&&range.some(date=>iso(date)===c.date)).length
  return percent(done,range.length)
}
