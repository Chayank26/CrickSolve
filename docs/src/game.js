const maxBaseGuesses=7
const streakKeyDaily="cricksolve_streak"
const uidKey="cricksolve_uid"
const nameKey="cricksolve_name"
const modeKey="cricksolve_mode"
const unlimitedCycleKey="cricksolve_unlimited_cycle"

let mode="daily"
let answer=null

let maxGuesses=maxBaseGuesses
let attempts=0
let hintUsed=false
let hintMode=false
let gameStatus="playing"

let timerStartMs=null
let timerEndMs=null

let unlimitedStreak=0

const guessed=new Set()

const input=document.getElementById("guessInput")
const button=document.getElementById("guessBtn")
const hintBtn=document.getElementById("hintBtn")
const message=document.getElementById("message")
const guessesLeft=document.getElementById("guessesLeft")
const board=document.getElementById("board")
const suggestionsBox=document.getElementById("suggestions")
const attrs=document.querySelectorAll(".attr")

const modal=document.getElementById("continueModal")
const continueYes=document.getElementById("continueYes")
const continueNo=document.getElementById("continueNo")
const hintNote=document.getElementById("hintNote")

const streakEl=document.getElementById("streak")
const switchModeBtn=document.getElementById("switchModeBtn")
const switchModeText=document.getElementById("switchModeText")

const todayKey=getTodayKey()
let storageKeyDaily="cricksolve_"+todayKey
let storageKeyUnlimited="cricksolve_unlimited"

const resultModal=document.getElementById("resultModal")
const resultImg=document.getElementById("resultImg")
const resultTitle=document.getElementById("resultTitle")
const resultPlayer=document.getElementById("resultPlayer")
const resultMeta=document.getElementById("resultMeta")
const shareBtn=document.getElementById("shareBtn")
const closeResult=document.getElementById("closeResult")

const leaderboardBox=document.getElementById("leaderboardBox")
const leaderboardTop=document.getElementById("leaderboardTop")
const leaderboardYou=document.getElementById("leaderboardYou")
const leaderboardCount=document.getElementById("leaderboardCount")

const modeModal=document.getElementById("modeModal")
const dailyModeBtn=document.getElementById("dailyModeBtn")
const unlimitedModeBtn=document.getElementById("unlimitedModeBtn")

const howModal=document.getElementById("howModal")
const howToBtn=document.getElementById("howToBtn")
const howBackBtn=document.getElementById("howBackBtn")
const howCloseBtn=document.getElementById("howCloseBtn")

let revealed={
country:false,
batting_hand:false,
bowling_type:false,
role:false,
ipl_team:false,
retired:false
}

init()

function init(){
mode=localStorage.getItem(modeKey)||"daily"

unlimitedStreak=sessionStorage.getItem("cricksolve_unlimited_streak")
unlimitedStreak=parseInt(unlimitedStreak)||0

answer=getAnswerForMode()

updateSwitchBtn()
applyModeTheme()
updateStreakUI()
restoreIfExists()
updateGuessesText()
renderAttrCard()

disableGameInput()
showModeModalIfNeeded()

button.onclick=handleGuess
hintBtn.onclick=enableHintMode

continueYes.onclick=()=>{
modal.classList.remove("show")
maxGuesses=8
updateGuessesText()
persist()
}

continueNo.onclick=()=>{
modal.classList.remove("show")
if(mode==="daily"){
setDailyStreak(0)
updateStreakUI()
}
endGame("Game over! Mystery player: "+answer.name)
}

closeResult.onclick=()=>{
resultModal.classList.remove("show")
if(mode==="unlimited"){
resetGameState(true)
enableGameInput()
}
}

switchModeBtn.onclick=()=>{
if(mode==="daily"){
mode="unlimited"
localStorage.setItem(modeKey,"unlimited")
resetGameState(true)
enableGameInput()
}else{
mode="daily"
localStorage.setItem(modeKey,"daily")
resetGameState(true)
enableGameInput()
}
}

dailyModeBtn.onclick=()=>{
mode="daily"
localStorage.setItem(modeKey,"daily")
resetGameState(true)
modeModal.classList.remove("show")
enableGameInput()
}

unlimitedModeBtn.onclick=()=>{
mode="unlimited"
localStorage.setItem(modeKey,"unlimited")
resetGameState(true)
modeModal.classList.remove("show")
enableGameInput()
}

howToBtn.onclick=()=>{
modeModal.classList.remove("show")
howModal.classList.add("show")
}

howBackBtn.onclick=()=>{
howModal.classList.remove("show")
modeModal.classList.add("show")
}

howCloseBtn.onclick=()=>{
howModal.classList.remove("show")
modeModal.classList.remove("show")
enableGameInput()
}

shareBtn.onclick=async()=>{
const status=gameStatus==="ended"&&message.innerText.includes("solved")?"Solved":"Unsolved"
const grid=buildShareGrid()
const timeText=timerStartMs&&timerEndMs?formatTime(timerEndMs-timerStartMs):"NA"
const label=mode==="daily"?"Daily":"Unlimited"
const streakText=mode==="daily"?"🔥 Streak: "+getDailyStreak():"⚡ Streak: "+unlimitedStreak
const text=`CrickSolve (${label}) ${todayKey}\n${status} in ${attempts}/${maxGuesses}\n⏱ ${timeText}\n${streakText}\n\n${grid}`

try{
if(navigator.share){
await navigator.share({text})
}else{
await navigator.clipboard.writeText(text)
shareBtn.innerText="✅ Copied"
setTimeout(()=>shareBtn.innerText="📋 Copy",1200)
}
}catch{
await navigator.clipboard.writeText(text)
shareBtn.innerText="✅ Copied"
setTimeout(()=>shareBtn.innerText="📋 Copy",1200)
}
}

input.addEventListener("input",()=>{
const q=input.value.trim().toLowerCase()
suggestionsBox.innerHTML=""
if(!q)return
players
.filter(p=>p.name.toLowerCase().includes(q))
.slice(0,10)
.forEach(p=>{
const div=document.createElement("div")
div.className="suggestion"
div.innerText=p.name
div.onclick=()=>{
input.value=p.name
suggestionsBox.innerHTML=""
}
suggestionsBox.appendChild(div)
})
})

document.addEventListener("click",e=>{
if(!e.target.closest(".search-box"))suggestionsBox.innerHTML=""
})

attrs.forEach(btn=>{
btn.addEventListener("click",()=>{
if(!hintMode||gameStatus==="ended")return
const key=btn.dataset.key
if(revealed[key])return

btn.classList.add("breaking")
setTimeout(()=>btn.classList.remove("breaking"),220)

revealed[key]=true
hintUsed=true
hintMode=false
hintBtn.disabled=true
hintNote.innerText="Hint used."
renderAttrCard()
persist()
})
})
}

function updateSwitchBtn(){
if(mode==="daily"){
switchModeText.innerText="Unlimited Mode"
}else{
switchModeText.innerText="Daily Puzzle"
}
}

function getAnswerForMode(){
if(mode==="daily")return getDailyAnswer(players)
return getUnlimitedAnswer(players)
}

function showModeModalIfNeeded(){
const state=loadState()
if(state&&state.status==="ended"){
modeModal.classList.remove("show")
howModal.classList.remove("show")
enableGameInput()
return
}
if(state&&state.attempts>0){
modeModal.classList.remove("show")
howModal.classList.remove("show")
enableGameInput()
return
}
modeModal.classList.add("show")
}

function resetGameState(repickAnswer){
attempts=0
maxGuesses=maxBaseGuesses
hintUsed=false
hintMode=false
gameStatus="playing"
timerStartMs=null
timerEndMs=null

guessed.clear()
board.innerHTML=""
message.innerText=""
hintNote.innerText="Hint unlock available after 4 guesses."
suggestionsBox.innerHTML=""
input.value=""

revealed={
country:false,
batting_hand:false,
bowling_type:false,
role:false,
ipl_team:false,
retired:false
}

if(repickAnswer)answer=getAnswerForMode()

updateSwitchBtn()
applyModeTheme()
updateStreakUI()
updateGuessesText()
renderAttrCard()

saveState(null,true)
resultModal.classList.remove("show")
modal.classList.remove("show")
}

function enableHintMode(){
if(hintUsed||attempts<4||gameStatus==="ended")return
hintMode=true
hintNote.innerText="Click one locked box to break it open."
renderAttrCard()
}

async function handleGuess(){
if(attempts>=maxGuesses||gameStatus==="ended")return

hintMode=false
suggestionsBox.innerHTML=""

const q=input.value.trim().toLowerCase()
if(!q)return

const player=players.find(p=>p.name.toLowerCase()===q)

if(!player){
message.innerText="Player not found"
return
}

if(guessed.has(player.name)){
message.innerText="Already guessed"
return
}

if(attempts===0&&!timerStartMs){
timerStartMs=Date.now()
persist()
if(mode==="daily")await trackPlayOnce()
}

guessed.add(player.name)
attempts++

message.innerText=""
updateGuessesText()

if(player.name===answer.name){
timerEndMs=Date.now()
input.value=""
revealAll()
renderAttrCard()
addNumericRow(player)

if(mode==="daily"){
setDailyStreak(getDailyStreak()+1)
updateStreakUI()
await submitWin()
}else{
unlimitedStreak++
sessionStorage.setItem("cricksolve_unlimited_streak",String(unlimitedStreak))
updateStreakUI()
}

endGame("🎉 You solved CrickSolve!")
return
}

unlockMatches(player)
renderAttrCard()
addNumericRow(player)

if(attempts===4&&!hintUsed){
hintBtn.disabled=false
hintNote.innerText="Hint unlocked! Click 'Use Hint (1)'."
}

persist()
input.value=""

if(attempts===maxBaseGuesses&&maxGuesses===maxBaseGuesses){
modal.classList.add("show")
persist()
return
}

if(attempts===maxGuesses){
timerEndMs=Date.now()
input.value=""

if(mode==="daily"){
setDailyStreak(0)
updateStreakUI()
}else{
unlimitedStreak=0
sessionStorage.setItem("cricksolve_unlimited_streak","0")
updateStreakUI()
}

endGame("Game over! Mystery player: "+answer.name)
return
}
}

function unlockMatches(p){
if(p.country===answer.country)revealed.country=true
if(p.batting_hand===answer.batting_hand)revealed.batting_hand=true
if(p.bowling_type===answer.bowling_type)revealed.bowling_type=true
if(p.role===answer.role)revealed.role=true
if(p.ipl_team===answer.ipl_team)revealed.ipl_team=true
if(!!p.retired===!!answer.retired)revealed.retired=true
}

function revealAll(){
Object.keys(revealed).forEach(k=>revealed[k]=true)
}

function renderAttrCard(){
attrs.forEach(btn=>{
const key=btn.dataset.key
const valueEl=btn.querySelector(".value")
let val="????"
if(key==="retired")val=answer.retired?"YES":"NO"
else val=answer[key]

const isRevealed=revealed[key]
valueEl.innerText=isRevealed?val:"🔒"
valueEl.className="value "+(isRevealed?"revealed":"masked")

btn.classList.toggle("open",isRevealed)

btn.classList.remove("hintable","locked")
if(hintMode&&!isRevealed){
btn.classList.add("hintable","locked")
}
})
}

function addNumericRow(p){
const tr=document.createElement("tr")
tr.className="row-in"
addText(tr,p.name)
addNumber(tr,p.birth_year,answer.birth_year)
addNumber(tr,p.test,answer.test)
addNumber(tr,p.odi,answer.odi)
addNumber(tr,p.t20,answer.t20)
board.appendChild(tr)
setTimeout(()=>tr.classList.remove("row-in"),260)
}

function addText(tr,text){
const td=document.createElement("td")
td.innerText=text
tr.appendChild(td)
}

function addNumber(tr,val,ans){
const td=document.createElement("td")
if(val===ans){
td.innerText=val
td.className="correct"
}else if(val<ans){
td.innerText=val+" ↑"
td.className="partial"
}else{
td.innerText=val+" ↓"
td.className="partial"
}
tr.appendChild(td)
}

function updateGuessesText(){
guessesLeft.innerText=`Guesses: ${attempts}/${maxGuesses}`
}

function endGame(text){
gameStatus="ended"
message.innerText=text
button.disabled=true
hintBtn.disabled=true
input.disabled=true
suggestionsBox.innerHTML=""
if(!timerEndMs)timerEndMs=Date.now()
showResultModal()
persist()
}

function persist(){
saveState({
mode,
attempts,
maxGuesses,
hintUsed,
revealed,
guessed:[...guessed],
rows:[...board.querySelectorAll("tr")].map(tr=>[...tr.children].map(td=>td.innerText)),
status:gameStatus,
message:message.innerText,
hintNote:hintNote.innerText,
timerStartMs,
timerEndMs,
answerName:answer?answer.name:null
})
}

function restoreIfExists(){
const state=loadState()
if(!state)return
if(state.mode&&state.mode!==mode){
resetGameState(true)
return
}

attempts=state.attempts||0
maxGuesses=state.maxGuesses||maxBaseGuesses
hintUsed=!!state.hintUsed
revealed=state.revealed||revealed
gameStatus=state.status||"playing"
timerStartMs=state.timerStartMs||null
timerEndMs=state.timerEndMs||null

if(mode==="unlimited"&&state.answerName){
const found=players.find(p=>p.name===state.answerName)
if(found)answer=found
}

guessed.clear()
;(state.guessed||[]).forEach(x=>guessed.add(x))

board.innerHTML=""
;(state.rows||[]).forEach(r=>{
const tr=document.createElement("tr")
r.forEach(cell=>{
const td=document.createElement("td")
td.innerText=cell
tr.appendChild(td)
})
board.appendChild(tr)
})

message.innerText=state.message||""
hintNote.innerText=state.hintNote||hintNote.innerText

if(gameStatus==="ended"){
button.disabled=true
hintBtn.disabled=true
input.disabled=true
showResultModal()
}else{
button.disabled=false
input.disabled=false
hintBtn.disabled=hintUsed||attempts<4
}

updateGuessesText()
renderAttrCard()
}

async function showResultModal(){
const won=message.innerText.includes("solved")
resultTitle.innerText=won?"🎉 You solved CrickSolve!":"😔 You didn’t solve it"
resultPlayer.innerText="Mystery Player: "+answer.name

const timeText=timerStartMs&&timerEndMs?formatTime(timerEndMs-timerStartMs):"NA"
if(mode==="daily"){
resultMeta.innerText=`Guesses: ${attempts}/${maxGuesses}   •   ⏱ ${timeText}   •   🔥 Streak: ${getDailyStreak()}`
}else{
resultMeta.innerText=`Guesses: ${attempts}/${maxGuesses}   •   ⏱ ${timeText}   •   ⚡ Streak: ${unlimitedStreak}`
}

if(answer.image&&answer.image.trim()!==""){
resultImg.src=answer.image
}else{
resultImg.src="https://ui-avatars.com/api/?name="+encodeURIComponent(answer.name)+"&background=111827&color=ffffff"
}

if(mode==="daily"){
leaderboardBox.style.display="block"
await loadLeaderboard(won)
}else{
leaderboardBox.style.display="none"
leaderboardTop.innerHTML=""
leaderboardYou.innerText=""
leaderboardCount.innerText=""
}

resultModal.classList.add("show")
}

function disableGameInput(){
button.disabled=true
hintBtn.disabled=true
input.disabled=true
}

function enableGameInput(){
button.disabled=false
input.disabled=false
hintBtn.disabled=hintUsed||attempts<4||gameStatus==="ended"
}

function saveState(state,clear){
const key=mode==="daily"?storageKeyDaily:storageKeyUnlimited
if(clear){
localStorage.removeItem(key)
return
}
localStorage.setItem(key,JSON.stringify(state))
}

function loadState(){
const key=mode==="daily"?storageKeyDaily:storageKeyUnlimited
const raw=localStorage.getItem(key)
if(!raw)return null
try{return JSON.parse(raw)}catch{return null}
}

function setDailyStreak(n){
localStorage.setItem(streakKeyDaily,String(n))
}

function getDailyStreak(){
const raw=localStorage.getItem(streakKeyDaily)
return parseInt(raw)||0
}

function updateStreakUI(){
if(mode==="daily"){
streakEl.innerText="🔥 Daily Streak: "+getDailyStreak()
}else{
streakEl.innerText="⚡ Unlimited Streak: "+unlimitedStreak
}
}

function getTodayKey(){
const d=new Date()
const y=d.getFullYear()
const m=String(d.getMonth()+1).padStart(2,"0")
const day=String(d.getDate()).padStart(2,"0")
return `${y}-${m}-${day}`
}

function hashString(s){
let h=2166136261
for(let i=0;i<s.length;i++){
h^=s.charCodeAt(i)
h=Math.imul(h,16777619)
}
return h>>>0
}

function getDailyAnswer(players){
const key=getTodayKey()
const ids=players.map(p=>p.name).sort()
const idx=hashString(key+"|"+ids.length)%ids.length
const chosenName=ids[idx]
return players.find(p=>p.name===chosenName)
}

function getUnlimitedAnswer(players){
let cycle=[]
try{
cycle=JSON.parse(localStorage.getItem(unlimitedCycleKey)||"[]")
}catch{
cycle=[]
}
if(!Array.isArray(cycle)||cycle.length===0){
cycle=players.map(p=>p.name)
shuffle(cycle)
}
const name=cycle.shift()
localStorage.setItem(unlimitedCycleKey,JSON.stringify(cycle))
return players.find(p=>p.name===name)||players[Math.floor(Math.random()*players.length)]
}

function shuffle(arr){
for(let i=arr.length-1;i>0;i--){
const j=Math.floor(Math.random()*(i+1))
const t=arr[i]
arr[i]=arr[j]
arr[j]=t
}
}

function buildShareGrid(){
const attrLine=[
revealed.country?"🟩":"⬛",
revealed.batting_hand?"🟩":"⬛",
revealed.bowling_type?"🟩":"⬛",
revealed.role?"🟩":"⬛",
revealed.ipl_team?"🟩":"⬛",
revealed.retired?"🟩":"⬛"
].join("")
const numLines=[...board.querySelectorAll("tr")].map(tr=>{
const tds=[...tr.children]
const cells=tds.slice(1).map(td=>{
const v=td.innerText
if(v.includes("↑"))return "⬆️"
if(v.includes("↓"))return "⬇️"
return "🟩"
})
return cells.join("")
})
return `Attrs: ${attrLine}\nNums:\n${numLines.join("\n")}`
}

function getUid(){
let uid=localStorage.getItem(uidKey)
if(uid)return uid
uid=crypto.randomUUID()
localStorage.setItem(uidKey,uid)
return uid
}

function getNickname(){
return (localStorage.getItem(nameKey)||"").trim()
}

function askNicknameOnce(){
let name=getNickname()
if(name)return name
name=prompt("Enter a nickname for the leaderboard (optional):")||""
name=name.trim().slice(0,16)
if(name==="")name="Anonymous"
localStorage.setItem(nameKey,name)
return name
}

function formatTime(ms){
const total=Math.max(0,Math.floor(ms/1000))
const m=Math.floor(total/60)
const s=total%60
return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}

async function waitForDb(timeoutMs=2000){
const start=Date.now()
while(Date.now()-start<timeoutMs){
if(window.db)return true
await new Promise(r=>setTimeout(r,50))
}
return false
}

async function trackPlayOnce(){
if(!window.db){
const ok=await waitForDb(2000)
if(!ok)return
}
try{
const { doc,setDoc,serverTimestamp }=await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js")
const uid=getUid()
const id=todayKey+"_"+uid
await setDoc(doc(window.db,"plays",id),{
date:todayKey,
uid,
createdAt:serverTimestamp()
},{merge:true})
}catch{}
}

async function submitWin(){
if(!window.db){
const ok=await waitForDb(2000)
if(!ok)return
}
try{
const { doc,setDoc,serverTimestamp }=await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js")
const uid=getUid()
const nickname=askNicknameOnce()
const timeMs=(timerEndMs||Date.now())-(timerStartMs||Date.now())
const id=todayKey+"_"+uid
await setDoc(doc(window.db,"leaderboard",id),{
date:todayKey,
uid,
nickname,
timeMs,
attempts,
createdAt:serverTimestamp()
},{merge:true})
}catch{}
}

async function loadLeaderboard(won){
if(!window.db){
const ok=await waitForDb(2000)
if(!ok){
leaderboardTop.innerHTML="<p style='opacity:.7'>Leaderboard unavailable.</p>"
leaderboardYou.innerText=""
leaderboardCount.innerText=""
return
}
}
try{
const { collection,getDocs,query,where,orderBy,limit }=await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js")

leaderboardTop.innerHTML="Loading..."
leaderboardYou.innerText=""
leaderboardCount.innerText=""

const qTop=query(
collection(window.db,"leaderboard"),
where("date","==",todayKey),
orderBy("timeMs","asc"),
limit(3)
)

const snapTop=await getDocs(qTop)
const top=[]
snapTop.forEach(d=>top.push(d.data()))

leaderboardTop.innerHTML=""
if(top.length===0){
leaderboardTop.innerHTML="<p style='opacity:.7'>No winners yet today.</p>"
}else{
top.forEach((x,i)=>{
const div=document.createElement("div")
div.className="lb-row"
div.innerHTML=`
<div class="lb-left">
  <div class="lb-rank">${i===0?"🥇":i===1?"🥈":"🥉"}</div>
  <div>${escapeHtml(x.nickname||"Anonymous")}</div>
</div>
<div class="lb-time">${formatTime(x.timeMs||0)}</div>
`
leaderboardTop.appendChild(div)
})
}

const qPlays=query(
collection(window.db,"plays"),
where("date","==",todayKey)
)

const snapPlays=await getDocs(qPlays)
leaderboardCount.innerText=`Players today: ${snapPlays.size}`

if(!won){
leaderboardYou.innerText=""
return
}

const qAll=query(
collection(window.db,"leaderboard"),
where("date","==",todayKey),
orderBy("timeMs","asc")
)

const snapAll=await getDocs(qAll)
const all=[]
snapAll.forEach(d=>all.push(d.data()))

const uid=getUid()
const myIndex=all.findIndex(x=>x.uid===uid)

if(myIndex!==-1){
leaderboardYou.innerText=`You: #${myIndex+1} • ${formatTime(all[myIndex].timeMs)}`
}else{
leaderboardYou.innerText=""
}
}catch(e){
console.log("Leaderboard error:",e)
leaderboardTop.innerHTML="<p style='opacity:.7'>Leaderboard unavailable.</p>"
leaderboardYou.innerText=""
leaderboardCount.innerText=""
}
}

function escapeHtml(s){
return String(s).replace(/[&<>"']/g,m=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"
}[m]))
}

function applyModeTheme(){
document.body.classList.toggle("mode-unlimited",mode==="unlimited")
document.body.classList.toggle("mode-daily",mode==="daily")
}
