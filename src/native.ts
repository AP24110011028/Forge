import Database from '@tauri-apps/plugin-sql'
import { db, exportData, importData } from './db'

const isTauri=()=>typeof window!=='undefined'&&('__TAURI_INTERNALS__' in window)
let nativeDb:Database|null=null
let saveTimer:number|undefined
let hydrating=false

async function saveSnapshot(){
  if(!nativeDb||hydrating)return
  const payload=JSON.stringify(await exportData())
  await nativeDb.execute(
    `INSERT INTO local_snapshots (id, schema_version, payload, updated_at)
     VALUES (1, 1, $1, $2)
     ON CONFLICT(id) DO UPDATE SET payload=$1, updated_at=$2, schema_version=1`,
    [payload,new Date().toISOString()],
  )
}

function scheduleSave(){
  if(saveTimer)window.clearTimeout(saveTimer)
  saveTimer=window.setTimeout(()=>void saveSnapshot().catch(error=>console.error('PujiFlow SQLite autosave failed',error)),350)
}

export async function initializeNativePersistence(){
  if(!isTauri())return false
  nativeDb=await Database.load('sqlite:pujiflow.db')
  const rows=await nativeDb.select<Array<{payload:string}>>('SELECT payload FROM local_snapshots WHERE id = 1')
  if(rows[0]?.payload){
    hydrating=true
    try{await importData(JSON.parse(rows[0].payload))}finally{hydrating=false}
  }
  for(const table of db.tables){
    table.hook('creating',scheduleSave)
    table.hook('updating',scheduleSave)
    table.hook('deleting',scheduleSave)
  }
  if(!rows.length)await saveSnapshot()
  return true
}

export async function flushNativePersistence(){await saveSnapshot()}

