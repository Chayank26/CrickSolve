import { PLAYERS } from '../src/data/players';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_PLAYERS_DIR = path.join(process.cwd(), 'public', 'players');
if (!fs.existsSync(PUBLIC_PLAYERS_DIR)) {
  fs.mkdirSync(PUBLIC_PLAYERS_DIR, { recursive: true });
}

const USER_AGENT = 'CrickSolveApp/1.0 (https://cricksolve.app; contact@cricksolve.app)';

async function fetchWikiLeadThumb(name: string): Promise<string | null> {
  const variations = [
    name,
    `${name} (cricketer)`,
    `${name} (cricket)`,
    name.replace(/Steven/g, 'Steve'),
    name.replace(/ ul /gi, '-ul-'),
    name.replace(/ Ur /gi, '-ur-'),
  ];

  const uniqueTitles = Array.from(new Set(variations));

  for (const t of uniqueTitles) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages&format=json&pithumbsize=500`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) continue;
      const data = await res.json();
      const pages = data.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      if (pageId && pageId !== '-1' && pages[pageId]?.thumbnail?.source) {
        return pages[pageId].thumbnail.source;
      }
    } catch {
      // Continue
    }
  }
  return null;
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 500) return false; // ignore empty/corrupt responses
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  console.log(`Starting high-definition portrait enrichment for all ${PLAYERS.length} players...`);
  let downloadedCount = 0;
  let alreadyLocalCount = 0;
  let missingCount = 0;

  for (let i = 0; i < PLAYERS.length; i++) {
    const player = PLAYERS[i];
    const localFileName = `${player.id}.png`;
    const localFilePath = path.join(PUBLIC_PLAYERS_DIR, localFileName);
    const localPublicUrl = `/players/${localFileName}`;

    // If already downloaded and valid file exists locally, use local URL
    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1000) {
      player.photoUrl = localPublicUrl;
      alreadyLocalCount++;
      continue;
    }

    const isFlagUrl = !player.photoUrl || player.photoUrl.includes('sportmonks.com');

    // 1. Try existing valid non-flag URL first
    let sourceUrl: string | null = null;
    if (!isFlagUrl && player.photoUrl.startsWith('http')) {
      sourceUrl = player.photoUrl;
    }

    // 2. If flag or no valid URL, query Wikipedia API with exact title matching
    if (!sourceUrl) {
      sourceUrl = await fetchWikiLeadThumb(player.name);
    }

    if (sourceUrl) {
      const success = await downloadImage(sourceUrl, localFilePath);
      if (success) {
        player.photoUrl = localPublicUrl;
        downloadedCount++;
        console.log(`[${i + 1}/${PLAYERS.length}] ✅ Downloaded: ${player.name}`);
      } else {
        // Fallback to Wikipedia search if direct download of old URL failed
        const wikiUrl = await fetchWikiLeadThumb(player.name);
        if (wikiUrl && (await downloadImage(wikiUrl, localFilePath))) {
          player.photoUrl = localPublicUrl;
          downloadedCount++;
          console.log(`[${i + 1}/${PLAYERS.length}] ✅ Downloaded from Wiki: ${player.name}`);
        } else {
          missingCount++;
          console.log(`[${i + 1}/${PLAYERS.length}] ❌ Failed to fetch: ${player.name}`);
        }
      }
    } else {
      missingCount++;
      console.log(`[${i + 1}/${PLAYERS.length}] ⚠️ No portrait found for: ${player.name}`);
    }

    // Gentle 60ms delay
    await new Promise((r) => setTimeout(r, 60));
  }

  // Update PLAYERS dataset
  const outputCode = `import { Player } from '@/types/game';\n\nexport const PLAYERS: Player[] = ${JSON.stringify(PLAYERS, null, 2)};\n`;
  fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'players.ts'), outputCode, 'utf-8');

  console.log(`\n========================================`);
  console.log(`🎉 Enrichment Complete!`);
  console.log(`- Total Players: ${PLAYERS.length}`);
  console.log(`- Downloaded & Localized: ${downloadedCount}`);
  console.log(`- Already Local: ${alreadyLocalCount}`);
  console.log(`- Missing / Flags: ${missingCount}`);
  console.log(`========================================`);
}

run();
