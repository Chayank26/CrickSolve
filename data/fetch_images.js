const fs=require("fs")
const path=require("path")

const inputCsv=path.join(__dirname,"players_with_stats.csv")
const outputCsv=path.join(__dirname,"players_with_images.csv")

function parseCSV(text){
const lines=text.split("\n").filter(x=>x.trim()!=="")
const headers=lines[0].split(",").map(h=>h.trim())
const rows=lines.slice(1).map(line=>{
const vals=line.split(",")
let obj={}
headers.forEach((h,i)=>obj[h]=vals[i]?.trim()||"")
return obj
})
return{headers,rows}
}

function toCSV(headers,rows){
const escape=v=>{
if(v==null)return""
const s=String(v)
if(s.includes(",")||s.includes('"')||s.includes("\n")){
return `"${s.replace(/"/g,'""')}"`
}
return s
}
const out=[headers.join(",")]
rows.forEach(r=>{
out.push(headers.map(h=>escape(r[h]||"")).join(","))
})
return out.join("\n")
}

async function sleep(ms){
return new Promise(r=>setTimeout(r,ms))
}

async function fetchJson(url){
const res=await fetch(url,{
headers:{
"User-Agent":"CrickSolve/1.0 (student project)",
"Accept":"application/json"
}
})
if(!res.ok)throw new Error("HTTP "+res.status)
return await res.json()
}

async function fetchWithRetry(url,tries=3){
let lastErr=null
for(let i=0;i<tries;i++){
try{
return await fetchJson(url)
}catch(e){
lastErr=e
await sleep(1200*(i+1))
}
}
throw lastErr
}

async function getWikipediaImage(playerName){
const q=encodeURIComponent(playerName)
const searchUrl=`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&origin=*`

const s=await fetchWithRetry(searchUrl,3)
const top=s?.query?.search?.[0]
if(!top)return""

const title=top.title
const pageUrl=`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=500&format=json&origin=*`

const p=await fetchWithRetry(pageUrl,3)
const pages=p?.query?.pages||{}
const firstKey=Object.keys(pages)[0]
const page=pages[firstKey]

if(!page||!page.thumbnail||!page.thumbnail.source)return""
return page.thumbnail.source
}

async function main(){
const raw=fs.readFileSync(inputCsv,"utf8")
const {headers,rows}=parseCSV(raw)

if(!headers.includes("player_name")){
console.log("ERROR: player_name column not found")
return
}

if(!headers.includes("player_image"))headers.push("player_image")

let done=0
for(let i=0;i<rows.length;i++){
const r=rows[i]
const name=r.player_name
if(!name)continue

if(r.player_image&&r.player_image.trim()!==""){
done++
continue
}

try{
const img=await getWikipediaImage(name)
r.player_image=img||""
done++
console.log(`[${done}/${rows.length}] ${name} -> ${img? "FOUND":"NOT FOUND"}`)
}catch(e){
r.player_image=""
done++
console.log(`[${done}/${rows.length}] ${name} -> ERROR (${e.message})`)
}

await sleep(750)
}

fs.writeFileSync(outputCsv,toCSV(headers,rows),"utf8")
console.log("DONE. Saved:",outputCsv)
}

main()
