import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, BrainCircuit, CalendarDays, CheckCircle2, Clock3, Command, GraduationCap, Home, LibraryBig, ListTodo, Repeat2, Search, Settings2, X } from 'lucide-react'

const commands=[
  {label:'Dashboard',path:'/',icon:Home,keys:'G D'},
  {label:'Smart daily planner',path:'/day-plan',icon:ListTodo,keys:'G P'},
  {label:'Daily habit check-in',path:'/daily',icon:CheckCircle2,keys:'G T'},
  {label:'Habit system',path:'/habits',icon:Repeat2,keys:'G H'},
  {label:'GATE command center',path:'/gate',icon:GraduationCap,keys:'G G'},
  {label:'AI Engineer roadmap',path:'/roadmap',icon:BrainCircuit,keys:'G R'},
  {label:'Learning hub',path:'/learning',icon:LibraryBig,keys:'G L'},
  {label:'Calendar',path:'/calendar',icon:CalendarDays,keys:'G C'},
  {label:'Analytics',path:'/analytics',icon:BarChart3,keys:'G A'},
  {label:'Settings',path:'/settings',icon:Settings2,keys:'G S'},
]

export default function CommandPalette(){
  const navigate=useNavigate(),[open,setOpen]=useState(false),[query,setQuery]=useState('')
  const filtered=useMemo(()=>commands.filter(command=>command.label.toLowerCase().includes(query.toLowerCase())),[query])
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{const target=event.target as HTMLElement;if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(value=>!value);return}if(event.key==='Escape')setOpen(false);if(!event.metaKey&&!event.ctrlKey&&!event.altKey&&target.tagName!=='INPUT'&&target.tagName!=='TEXTAREA'&&event.key.toLowerCase()==='q'){event.preventDefault();document.querySelector<HTMLInputElement>('.quick-capture input')?.focus()}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[])
  const choose=(path:string)=>{navigate(path);setOpen(false);setQuery('')}
  if(!open)return <button className="command-trigger" onClick={()=>setOpen(true)} aria-label="Open command palette"><Command size={14}/><span>Command</span><kbd>⌘K</kbd></button>
  return <div className="command-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setOpen(false)}><section className="command-palette"><header><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Jump to anything…"/><button onClick={()=>setOpen(false)}><X/></button></header><div>{filtered.map((command,index)=>{const Icon=command.icon;return <button key={command.path} className={index===0?'selected':''} onClick={()=>choose(command.path)}><span><Icon size={17}/></span><b>{command.label}</b><kbd>{command.keys}</kbd></button>})}{!filtered.length&&<p>No matching destination.</p>}</div><footer><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span><span><Clock3 size={13}/> Offline and instant</span></footer></section></div>
}
