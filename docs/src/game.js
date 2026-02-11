const answer=getDailyAnswer(players)

const maxBaseGuesses=7
let maxGuesses=maxBaseGuesses
let attempts=0
let hintUsed=false
let hintMode=false
let gameStatus="playing"

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

const welcomeModal=document.getElementById("welcomeModal")
const howModal=document.getElementById("howModal")
const playNowBtn=document.getElementById("playNowBtn")
const howToBtn=document.getElementById("howToBtn")
const howBackBtn=document.getElementById("howBackBtn")
const howPlayBtn=document.getElementById("howPlayBtn")

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

shareBtn.onclick=async()=>{
const status=gameStatus==="ended"&&message.innerText.includes("solved")?"Solved":"Unsolved"
const grid=buildShareGrid()
const text=`CrickSolve ${todayKey}\n${status} in ${attempts}/${maxGuesses}\n🔥 Streak: ${getStreak()}\n\n${grid}`

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

function enableHintMode(){
if(hintUsed||attempts<4||gameStatus==="ended")return
hintMode=true
hintNote.innerText="Click one locked box to break it open."
renderAttrCard()
}

function handleGuess(){
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

guessed.add(player.name)
attempts++

message.innerText=""
updateGuessesText()

if(player.name===answer.name){
revealAll()
renderAttrCard()
addNumericRow(player)
setStreak(getStreak()+1)
updateStreakUI()
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
hintNote:hintNote.innerText
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

function showResultModal(){
const won=message.innerText.includes("solved")
resultTitle.innerText=won?"🎉 You solved CrickSolve!":"😔 You didn’t solve it"
resultPlayer.innerText="Mystery Player: "+answer.name
resultMeta.innerText=`Guesses: ${attempts}/${maxGuesses}   •   🔥 Streak: ${getStreak()}`

if(answer.image&&answer.image.trim()!==""){
resultImg.src=answer.image
}else{
resultImg.src="https://ui-avatars.com/api/?name="+encodeURIComponent(answer.name)+"&background=111827&color=ffffff"
}

resultModal.classList.add("show")
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
revealed.country?"🟦":"⬛",
revealed.batting_hand?"🟦":"⬛",
revealed.bowling_type?"🟦":"⬛",
revealed.role?"🟦":"⬛",
revealed.ipl_team?"🟦":"⬛",
revealed.retired?"🟦":"⬛"
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
