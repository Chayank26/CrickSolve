const maxBaseGuesses=7
const streakKeyDaily="cricksolve_streak"
const streakLastSolvedKey="cricksolve_streak_last_solved"
const uidKey="cricksolve_uid"
const nameKey="cricksolve_name"
const modeKey="cricksolve_mode"
const unlimitedCycleKey="cricksolve_unlimited_cycle"

const practiceDateKeyKey="cricksolve_practice_date"

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

let dailyDateKey=getTodayKey()
let isPracticeDaily=false

let nextPuzzleInterval=null

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

const practiceBadge=document.getElementById("practiceBadge")

const resultModal=document.getElementById("resultModal")
const resultImg=document.getElementById("resultImg")
const resultTitle=document.getElementById("resultTitle")
const resultPlayer=document.getElementById("resultPlayer")
const resultMeta=document.getElementById("resultMeta")
const shareBtn=document.getElementById("shareBtn")
const closeResult=document.getElementById("closeResult")
const nextPuzzleTimer=document.getElementById("nextPuzzleTimer")

const leaderboardBox=document.getElementById("leaderboardBox")
const leaderboardTop=document.getElementById("leaderboardTop")
const leaderboardYou=document.getElementById("leaderboardYou")
const leaderboardCount=document.getElementById("leaderboardCount")

const modeModal=document.getElementById("modeModal")
const dailyModeBtn=document.getElementById("dailyModeBtn")
const unlimitedModeBtn=document.getElementById("unlimitedModeBtn")

const howHeaderBtn=document.getElementById("howHeaderBtn")
const howModal=document.getElementById("howModal")
const howToBtn=document.getElementById("howToBtn")
const howBackBtn=document.getElementById("howBackBtn")
const howCloseBtn=document.getElementById("howCloseBtn")

const pastGamesBtn=document.getElementById("pastGamesBtn")
const calendarModal=document.getElementById("calendarModal")
const calPrev=document.getElementById("calPrev")
const calNext=document.getElementById("calNext")
const calMonthLabel=document.getElementById("calMonthLabel")
const calGrid=document.getElementById("calGrid")
const calClose=document.getElementById("calClose")

let calendarViewYear=null
let calendarViewMonth=null

let howOpenedFrom="mode"

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

validateDailyStreak()

dailyDateKey=getTodayKey()
localStorage.removeItem(practiceDateKeyKey)
isPracticeDaily=false

answer=getAnswerForMode()

updateSwitchBtn()
applyModeTheme()
updateStreakUI()
updatePracticeBadge()
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
if(mode==="daily"&&!isPracticeDaily){
setDailyStreak(0)
localStorage.removeItem(streakLastSolvedKey)
updateStreakUI()
}
endGame("Game over! Mystery player: "+answer.name)
}

closeResult.onclick=()=>{
resultModal.classList.remove("show")
stopNextPuzzleTimer()
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
dailyDateKey=getTodayKey()
localStorage.removeItem(practiceDateKeyKey)
isPracticeDaily=false
resetGameState(true)
enableGameInput()
}
}

dailyModeBtn.onclick=()=>{
mode="daily"
localStorage.setItem(modeKey,"daily")
dailyDateKey=getTodayKey()
localStorage.removeItem(practiceDateKeyKey)
isPracticeDaily=false
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

howHeaderBtn.onclick=()=>{
howOpenedFrom="header"
howModal.classList.add("show")
}

howToBtn.onclick=()=>{
howOpenedFrom="mode"
modeModal.classList.remove("show")
howModal.classList.add("show")
}

howBackBtn.onclick=()=>{
howModal.classList.remove("show")
if(howOpenedFrom==="mode")modeModal.classList.add("show")
}

howCloseBtn.onclick=()=>{
howModal.classList.remove("show")
if(howOpenedFrom==="mode"){
modeModal.classList.remove("show")
enableGameInput()
}
}

pastGamesBtn.onclick=()=>{
openCalendar()
}

calClose.onclick=()=>{
calendarModal.classList.remove("show")
}

calPrev.onclick=()=>{
if(calendarViewYear===null)return
const d=new Date(calendarViewYear,calendarViewMonth,1)
d.setMonth(d.getMonth()-1)
calendarViewYear=d.getFullYear()
calendarViewMonth=d.getMonth()
renderCalendar()
}

calNext.onclick=()=>{
if(calendarViewYear===null)return
const d=new Date(calendarViewYear,calendarViewMonth,1)
d.setMonth(d.getMonth()+1)
calendarViewYear=d.getFullYear()
calendarViewMonth=d.getMonth()
renderCalendar()
}

shareBtn.onclick=async()=>{
const status=gameStatus==="ended"&&message.innerText.includes("solved")?"Solved":"Unsolved"
const grid=buildShareGrid()
const timeText=timerStartMs&&timerEndMs?formatTime(timerEndMs-timerStartMs):"NA"
const label=mode==="daily"?(isPracticeDaily?`Daily Practice`:`Daily`):"Unlimited"
const dateText=mode==="daily"?dailyDateKey:getTodayKey()
const streakText=mode==="daily"
?(isPracticeDaily?`🧪 Practice (no streak)`:`🔥 Streak: ${getDailyStreak()}`)
:`⚡ Streak: ${unlimitedStreak}`
const text=`CrickSolve (${label}) ${dateText}\n${status} in ${attempts}/${maxGuesses}\n⏱ ${timeText}\n${streakText}\n\n${grid}`

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

function updatePracticeBadge(){
if(mode!=="daily"){
practiceBadge.style.display="none"
return
}
if(isPracticeDaily){
practiceBadge.style.display="inline-block"
practiceBadge.innerText="Practice • "+dailyDateKey
}else{
practiceBadge.style.display="none"
practiceBadge.innerText=""
}
}

function getAnswerForMode(){
if(mode==="daily")return getDailyAnswer(players,dailyDateKey)
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
updatePracticeBadge()
updateGuessesText()
renderAttrCard()

saveState(null,true)
resultModal.classList.remove("show")
modal.classList.remove("show")
stopNextPuzzleTimer()
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
if(mode==="daily"&&!isPracticeDaily)await trackPlayOnce()
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
if(!isPracticeDaily){
applyDailyWinStreak()
updateStreakUI()
await submitWin()
}else{
updateStreakUI()
}
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
if(!isPracticeDaily){
setDailyStreak(0)
localStorage.removeItem(streakLastSolvedKey)
updateStreakUI()
}
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
answerName:answer?answer.name:null,
dailyDateKey,
isPracticeDaily
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

if(mode==="daily"){
dailyDateKey=state.dailyDateKey||getTodayKey()
isPracticeDaily=!!state.isPracticeDaily
answer=getDailyAnswer(players,dailyDateKey)
}else{
isPracticeDaily=false
dailyDateKey=getTodayKey()
if(state.answerName){
const found=players.find(p=>p.name===state.answerName)
if(found)answer=found
}
}

updatePracticeBadge()

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
const streakText=isPracticeDaily?"🧪 Practice (no streak)":"🔥 Streak: "+getDailyStreak()
resultMeta.innerText=`Guesses: ${attempts}/${maxGuesses}   •   ⏱ ${timeText}   •   ${streakText}`
}else{
resultMeta.innerText=`Guesses: ${attempts}/${maxGuesses}   •   ⏱ ${timeText}   •   ⚡ Streak: ${unlimitedStreak}`
}

if(answer.image&&answer.image.trim()!==""){
resultImg.src=answer.image
}else{
resultImg.src="https://ui-avatars.com/api/?name="+encodeURIComponent(answer.name)+"&background=111827&color=ffffff"
}

if(mode==="daily"&&!isPracticeDaily){
leaderboardBox.style.display="block"
await loadLeaderboard(won)
}else{
leaderboardBox.style.display="none"
leaderboardTop.innerHTML=""
leaderboardYou.innerText=""
leaderboardCount.innerText=""
}

if(mode==="daily"&&!isPracticeDaily){
nextPuzzleTimer.style.display="block"
startNextPuzzleTimer()
}else{
nextPuzzleTimer.style.display="none"
stopNextPuzzleTimer()
}

resultModal.classList.add("show")
}

function startNextPuzzleTimer(){
stopNextPuzzleTimer()
updateNextPuzzleTimer()
nextPuzzleInterval=setInterval(updateNextPuzzleTimer,1000)
}

function stopNextPuzzleTimer(){
if(nextPuzzleInterval){
clearInterval(nextPuzzleInterval)
nextPuzzleInterval=null
}
}

function updateNextPuzzleTimer(){
const now=new Date()
const next=new Date(now)
next.setHours(24,0,0,0)
const ms=next-now
const total=Math.max(0,Math.floor(ms/1000))
const h=Math.floor(total/3600)
const m=Math.floor((total%3600)/60)
const s=total%60
nextPuzzleTimer.innerText=`Next puzzle in ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
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
const key=mode==="daily"?"cricksolve_"+dailyDateKey:"cricksolve_unlimited"
if(clear){
localStorage.removeItem(key)
return
}
localStorage.setItem(key,JSON.stringify(state))
}

function loadState(){
const key=mode==="daily"?"cricksolve_"+dailyDateKey:"cricksolve_unlimited"
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

function validateDailyStreak(){
const last=localStorage.getItem(streakLastSolvedKey)||""
if(!last)return
const today=getTodayKey()
if(last===today)return
const y=getYesterdayKey()
if(last!==y){
setDailyStreak(0)
localStorage.removeItem(streakLastSolvedKey)
}
}

function applyDailyWinStreak(){
const today=getTodayKey()
const last=localStorage.getItem(streakLastSolvedKey)||""
if(last===today)return
const y=getYesterdayKey()
if(last===y){
setDailyStreak(getDailyStreak()+1)
}else{
setDailyStreak(1)
}
localStorage.setItem(streakLastSolvedKey,today)
}

function getYesterdayKey(){
const d=new Date()
d.setDate(d.getDate()-1)
return toKey(d)
}

function updateStreakUI(){
if(mode==="daily"){
streakEl.innerText="🔥 Daily Streak: "+getDailyStreak()
}else{
streakEl.innerText="⚡ Unlimited Streak: "+unlimitedStreak
}
}

function getTodayKey(){
return toKey(new Date())
}

function toKey(d){
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

function getDailyAnswer(players,dateKey){
const ids=players.map(p=>p.name).sort()
const idx=hashString(dateKey+"|"+ids.length)%ids.length
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
const id=getTodayKey()+"_"+uid
await setDoc(doc(window.db,"plays",id),{
date:getTodayKey(),
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
const id=getTodayKey()+"_"+uid
await setDoc(doc(window.db,"leaderboard",id),{
date:getTodayKey(),
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

const today=getTodayKey()

leaderboardTop.innerHTML="Loading..."
leaderboardYou.innerText=""
leaderboardCount.innerText=""

const qTop=query(
collection(window.db,"leaderboard"),
where("date","==",today),
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
where("date","==",today)
)

const snapPlays=await getDocs(qPlays)
leaderboardCount.innerText=`Players today: ${snapPlays.size}`

if(!won){
leaderboardYou.innerText=""
return
}

const qAll=query(
collection(window.db,"leaderboard"),
where("date","==",today),
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

/* Calendar */

function openCalendar(){
const today=new Date()
calendarViewYear=today.getFullYear()
calendarViewMonth=today.getMonth()
renderCalendar()
calendarModal.classList.add("show")
}

function renderCalendar(){
calGrid.innerHTML=""

const viewDate=new Date(calendarViewYear,calendarViewMonth,1)
const monthName=viewDate.toLocaleString("en-US",{month:"long"})
calMonthLabel.innerText=`${monthName} ${calendarViewYear}`

const firstDayIndex=viewDate.getDay()
const daysInMonth=new Date(calendarViewYear,calendarViewMonth+1,0).getDate()

for(let i=0;i<firstDayIndex;i++){
const div=document.createElement("div")
div.className="cal-day muted"
div.innerText=""
calGrid.appendChild(div)
}

for(let day=1;day<=daysInMonth;day++){
const d=new Date(calendarViewYear,calendarViewMonth,day)
const key=toKey(d)

const div=document.createElement("div")
div.className="cal-day"
div.innerText=String(day)

const todayKey=getTodayKey()
if(key===todayKey)div.classList.add("today")

const status=getDayStatus(key)
div.classList.add(status)

const clickable=isKeyWithinLastNDays(key,90)
if(!clickable){
div.classList.add("muted")
div.onclick=null
}else{
div.onclick=()=>{
calendarModal.classList.remove("show")
startPracticeDaily(key)
}
}

calGrid.appendChild(div)
}
}

function isKeyWithinLastNDays(key,n){
const today=new Date()
today.setHours(0,0,0,0)
const d=fromKey(key)
if(!d)return false
d.setHours(0,0,0,0)
const diffDays=Math.floor((today-d)/(1000*60*60*24))
return diffDays>=0&&diffDays<=n
}

function fromKey(key){
const parts=key.split("-")
if(parts.length!==3)return null
const y=parseInt(parts[0])
const m=parseInt(parts[1])
const d=parseInt(parts[2])
if(!y||!m||!d)return null
return new Date(y,m-1,d)
}

function getDayStatus(dateKey){
const raw=localStorage.getItem("cricksolve_"+dateKey)
if(!raw)return "none"
let st=null
try{st=JSON.parse(raw)}catch{return "none"}
if(!st)return "none"
if(st.status==="ended"){
if((st.message||"").includes("solved"))return "won"
return "lost"
}
if((st.attempts||0)>0)return "progress"
return "none"
}

function startPracticeDaily(dateKey){
mode="daily"
localStorage.setItem(modeKey,"daily")

dailyDateKey=dateKey
isPracticeDaily=dateKey!==getTodayKey()
localStorage.setItem(practiceDateKeyKey,dateKey)

resetGameState(true)
enableGameInput()
}
