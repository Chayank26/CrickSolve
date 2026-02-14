const answer=getDailyAnswer(players)

const maxBaseGuesses=7
let maxGuesses=maxBaseGuesses
let attempts=0
let hintUsed=false
let hintMode=false
let gameStatus="playing"

let timerStartMs=null
let timerEndMs=null

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

const todayKey=getTodayKey()
const storageKey="cricksolve_"+todayKey
const streakKey="cricksolve_streak"

const resultModal=document.getElementById("resultModal")
const resultImg=document.getElementById("resultImg")
const resultTitle=document.getElementById("resultTitle")
const resultPlayer=document.getElementById("resultPlayer")
const resultMeta=document.getElementById("resultMeta")
const shareBtn=document.getElementById("shareBtn")
const closeResult=document.getElementById("closeResult")

const leaderboardTop=document.getElementById("leaderboardTop")
const leaderboardYou=document.getElementById("leaderboardYou")
const leaderboardCount=document.getElementById("leaderboardCount")

const welcomeModal=document.getElementById("welcomeModal")
const howModal=document.getElementById("howModal")
const playNowBtn=document.getElementById("playNowBtn")
const howToBtn=document.getElementById("howToBtn")
const howBackBtn=document.getElementById("howBackBtn")
const howPlayBtn=document.getElementById("howPlayBtn")

const uidKey="cricksolve_uid"
const nameKey="cricksolve_name"

let revealed={
country:false,
batting_hand:false,
bowling_type:false,
role:false,
ipl_team:false,
retired:false
}

updateStreakUI()
restoreIfExists()
updateGuessesText()
renderAttrCard()
showWelcomeIfNeeded()

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
setStreak(0)
updateStreakUI()
endGame("Game over! Mystery player: "+answer.name)
}

closeResult.onclick=()=>resultModal.classList.remove("show")

shareBtn.onclick=async()=>{
const status=gameStatus==="ended"&&message.innerText.includes("solved")?"Solved":"Unsolved"
const grid=buildShareGrid()
const timeText=timerStartMs&&timerEndMs?formatTime(timerEndMs-timerStartMs):"NA"
const text=`CrickSolve ${todayKey}\n${status} in ${attempts}/${maxGuesses}\n⏱ ${timeText}\n🔥 Streak: ${getStreak()}\n\n${grid}`

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

playNowBtn.onclick=()=>{
welcomeModal.classList.remove("show")
enableGameInput()
}

howToBtn.onclick=()=>{
welcomeModal.classList.remove("show")
howModal.classList.add("show")
}

howBackBtn.onclick=()=>{
howModal.classList.remove("show")
welcomeModal.classList.add("show")
disableGameInput()
}

howPlayBtn.onclick=()=>{
howModal.classList.remove("show")
enableGameInput()
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
await trackPlayOnce()
}

guessed.add(player.name)
attempts++

message.innerText=""
updateGuessesText()

if(player.name===answer.name){
timerEndMs=Date.now()
revealAll()
renderAttrCard()
addNumericRow(player)
setStreak(getStreak()+1)
updateStreakUI()
await submitWin()
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
setStreak(0)
updateStreakUI()
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
showResultModal()
persist()
}

function persist(){
saveState({
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
timerEndMs
})
}

function restoreIfExists(){
const state=loadState()
if(!state)return

attempts=state.attempts||0
maxGuesses=state.maxGuesses||maxBaseGuesses
hintUsed=!!state.hintUsed
revealed=state.revealed||revealed
gameStatus=state.status||"playing"
timerStartMs=state.timerStartMs||null
timerEndMs=state.timerEndMs||null

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
resultMeta.innerText=`Guesses: ${attempts}/${maxGuesses}   •   ⏱ ${timeText}   •   🔥 Streak: ${getStreak()}`

if(answer.image&&answer.image.trim()!==""){
resultImg.src=answer.image
}else{
resultImg.src="https://ui-avatars.com/api/?name="+encodeURIComponent(answer.name)+"&background=111827&color=ffffff"
}

resultModal.classList.add("show")

if(won)await loadLeaderboard()
else{
leaderboardTop.innerHTML=""
leaderboardYou.innerText=""
leaderboardCount.innerText=""
}
}

function saveState(state){
localStorage.setItem(storageKey,JSON.stringify(state))
}

function loadState(){
const raw=localStorage.getItem(storageKey)
if(!raw)return null
try{return JSON.parse(raw)}catch{return null}
}

function setStreak(n){
localStorage.setItem(streakKey,String(n))
}

function getStreak(){
const raw=localStorage.getItem(streakKey)
return parseInt(raw)||0
}

function updateStreakUI(){
streakEl.innerText="🔥 Streak: "+getStreak()
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

function showWelcomeIfNeeded(){
const state=loadState()
if(state&&state.status==="ended"){
welcomeModal.classList.remove("show")
howModal.classList.remove("show")
return
}
if(state&&state.attempts>0){
welcomeModal.classList.remove("show")
howModal.classList.remove("show")
return
}
welcomeModal.classList.add("show")
disableGameInput()
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

async function trackPlayOnce(){
if(!window.db)return
try{
const { doc,setDoc,serverTimestamp }=await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js")
const uid=getUid()
const id=todayKey+"_"+uid

await setDoc(doc(window.db,"plays",id),{
date:todayKey,
uid,
createdAt:serverTimestamp()
},{merge:true})
}catch(e){
console.log("trackPlayOnce error:",e)
}
}

async function submitWin(){
if(!window.db)return
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
}catch(e){
console.log("submitWin error:",e)
}
}

async function loadLeaderboard(){
if(!window.db)return
try{
const { collection,getDocs,query,where,orderBy,limit }=await import("https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js")

leaderboardTop.innerHTML="<p style='opacity:.7'>Loading...</p>"
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
leaderboardYou.innerText=`You: #${myIndex+1} • ${formatTime(all[myIndex].timeMs||0)}`
}else{
leaderboardYou.innerText="You are not ranked today."
}

const qPlays=query(
collection(window.db,"plays"),
where("date","==",todayKey)
)

const snapPlays=await getDocs(qPlays)
leaderboardCount.innerText=`Players today: ${snapPlays.size}`

}catch(e){
console.log("loadLeaderboard error:",e)
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
