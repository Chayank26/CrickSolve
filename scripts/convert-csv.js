const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../docs/data/players_with_stats.csv');
const outputPath = path.join(__dirname, '../src/data/players.ts');

const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').filter((l) => l.trim().length > 0);

const header = lines[0].split(',');
const dataLines = lines.slice(1);

function parseCsvLine(text) {
  const result = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cell.trim());
      cell = '';
    } else {
      cell += c;
    }
  }
  result.push(cell.trim());
  return result;
}

const IPL_MAP = {
  CSK: 'Chennai Super Kings',
  MI: 'Mumbai Indians',
  RCB: 'Royal Challengers Bengaluru',
  KKR: 'Kolkata Knight Riders',
  SRH: 'Sunrisers Hyderabad',
  DC: 'Delhi Capitals',
  PBKS: 'Punjab Kings',
  RR: 'Rajasthan Royals',
  GT: 'Gujarat Titans',
  LSG: 'Lucknow Super Giants',
  NA: 'None',
};

const players = [];
const seenIds = new Set();

for (const line of dataLines) {
  const row = parseCsvLine(line);
  if (row.length < 16) continue;

  const rawId = row[0];
  const name = row[2];
  const dob = row[3];
  const gender = row[4];
  const rawBatting = row[5];
  const rawBowling = row[6];
  const rawRole = row[7];
  const country = row[9];
  const tests = parseInt(row[11], 10) || 0;
  const odis = parseInt(row[12], 10) || 0;
  const t20is = parseInt(row[13], 10) || 0;
  const rawIpl = row[14];
  const rawRetired = row[15];
  const photoUrl = row[16] || row[10] || 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/316600/316605.png';

  if (!name || name === 'player_name') continue;

  let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!id) id = `player-${rawId}`;

  if (seenIds.has(id)) {
    id = `${id}-${rawId}`;
  }
  seenIds.add(id);

  // Extract birth year
  let birthYear = 1990;
  if (dob) {
    const parts = dob.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      birthYear = parseInt(parts[2], 10) || 1990;
    }
  }

  // Batting Hand
  const battingHand = rawBatting?.includes('left') ? 'Left-hand bat' : 'Right-hand bat';

  // Bowling Type
  let bowlingType = 'None';
  if (rawBowling?.includes('fast')) {
    bowlingType = rawBowling.includes('left') ? 'Left-arm fast' : 'Right-arm fast';
  } else if (rawBowling?.includes('medium')) {
    bowlingType = 'Right-arm medium';
  } else if (rawBowling?.includes('offbreak')) {
    bowlingType = 'Right-arm offbreak';
  } else if (rawBowling?.includes('legbreak')) {
    bowlingType = 'Legbreak';
  } else if (rawBowling?.includes('orthodox')) {
    bowlingType = 'Left-arm orthodox';
  } else if (rawBowling?.includes('chinaman')) {
    bowlingType = 'Left-arm chinaman';
  }

  // Role
  let role = 'Batter';
  if (rawRole?.toLowerCase().includes('wicketkeeper')) {
    role = 'Wicketkeeper batter';
  } else if (rawRole?.toLowerCase().includes('allrounder')) {
    role = 'All-rounder';
  } else if (rawRole?.toLowerCase().includes('spinner') || rawRole?.toLowerCase().includes('pacer') || rawRole?.toLowerCase().includes('bowler')) {
    role = 'Bowler';
  } else {
    role = 'Batter';
  }

  const iplTeam = IPL_MAP[rawIpl] || 'None';
  const retired = rawRetired === 'y';

  let category = 'International';
  if (gender === 'f') {
    category = 'Womens';
  } else if (retired) {
    category = 'Legend';
  } else if (iplTeam !== 'None') {
    category = 'IPL';
  }

  players.push({
    id,
    name,
    country,
    battingHand,
    bowlingType,
    role,
    iplTeam,
    retired,
    birthYear,
    tests,
    odis,
    t20is,
    category,
    photoUrl: photoUrl.startsWith('http') ? photoUrl : 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/316600/316605.png',
  });
}

const fileContent = `import { Player } from '@/types/game';

export const PLAYERS: Player[] = ${JSON.stringify(players, null, 2)};
`;

fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Successfully imported ${players.length} players into ${outputPath}`);
