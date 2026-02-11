const fs=require("fs")
const path=require("path")

const csvPath=path.join(__dirname,"players_with_stats.csv")
const outputPath=path.join(__dirname,"data.js")

const rows=fs.readFileSync(csvPath,"utf8").split("\n").filter(r=>r.trim()!=="")
const headers=rows[0].split(",").map(h=>h.trim())

const players=rows.slice(1).map(row=>{
    const values=row.split(",")
    let obj={}
    headers.forEach((h,i)=>{
        obj[h]=values[i]?.trim()
    })

    if(!obj.player_name)return null

    const ipl=(obj.ipl_team||"NA").trim()
    const retiredRaw=(obj.retired||"n").trim().toLowerCase()

    return{
        name:obj.player_name,
        country:obj.country,
        batting_hand:obj.batting_hand,
        bowling_type:(obj.bowling_type||"does not bowl").trim(),
        role:obj.role,
        birth_year:parseInt((obj.dateofbirth||"").slice(6,10))||0,
        test:parseInt(obj.Test)||0,
        odi:parseInt(obj.ODI)||0,
        t20:parseInt(obj.T20)||0,
        ipl_team:ipl===""?"NA":ipl,
        retired:retiredRaw==="y",
        image:obj.player_image||""
    }
}).filter(Boolean)

fs.writeFileSync(outputPath,"const players="+JSON.stringify(players,null,2))

console.log("data.js generated with",players.length,"players")
