import { PLAYERS } from '../src/data/players';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_PLAYERS_DIR = path.join(process.cwd(), 'public', 'players');
if (!fs.existsSync(PUBLIC_PLAYERS_DIR)) {
  fs.mkdirSync(PUBLIC_PLAYERS_DIR, { recursive: true });
}

const WIKI_USER_AGENT = 'CrickSolveApp/1.0 (https://cricksolve.app; contact@cricksolve.app)';
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchWikiThumb(name: string): Promise<string | null> {
  const variations = [
    name,
    `${name} (cricketer)`,
    `${name} (cricket)`,
    name.replace(/Steven/g, 'Steve'),
    name.replace(/Philip/g, 'Phil'),
    name.replace(/RP Singh/g, 'R. P. Singh'),
    name.replace(/B Sai Sudharsan/g, 'Sai Sudharsan'),
    name.replace(/Varun Chakaravarthy/g, 'Varun Chakravarthy'),
    name.replace(/ ul /gi, '-ul-'),
    name.replace(/ ur /gi, '-ur-'),
  ];

  for (const t of Array.from(new Set(variations))) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=pageimages|extracts&exintro=true&explaintext=true&format=json&pithumbsize=500`;
      const res = await fetch(url, { headers: { 'User-Agent': WIKI_USER_AGENT } });
      if (!res.ok) continue;
      const data = await res.json();
      const pages = data.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      if (pageId && pageId !== '-1') {
        const page = pages[pageId];
        const extract = (page.extract || '').toLowerCase();
        if (extract.includes('cricket') || extract.includes('batsman') || extract.includes('bowler') || extract.includes('all-rounder') || extract.includes('ipl')) {
          if (page.thumbnail?.source) {
            return page.thumbnail.source;
          }
        }
      }
    } catch {
      // Continue
    }
  }
  return null;
}

async function fetchBingImageUrls(query: string): Promise<string[]> {
  try {
    const url = 'https://www.bing.com/images/async?q=' + encodeURIComponent(query) + '&first=0&count=15&mmasync=1';
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_USER_AGENT } });
    if (!res.ok) return [];
    const text = await res.text();
    const regex = /murl&quot;:&quot;([^&]+)&quot;/g;
    let match;
    const urls: string[] = [];
    while ((match = regex.exec(text)) !== null) {
      // Filter out obvious junk / flags
      const u = match[1];
      if (!u.includes('/countries/') && !u.includes('flag') && !u.endsWith('.svg')) {
        urls.push(u);
      }
    }
    return urls;
  } catch {
    return [];
  }
}

async function downloadFirstValidImage(urls: string[], destPath: string): Promise<boolean> {
  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': BROWSER_USER_AGENT,
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 2500) {
        fs.writeFileSync(destPath, buf);
        return true;
      }
    } catch {
      // Try next url
    }
  }
  return false;
}

async function run() {
  console.log(`Starting complete portrait resolution for all ${PLAYERS.length} cricketers...`);
  let alreadyDone = 0;
  let newlyDownloaded = 0;
  let failed: string[] = [];

  for (let i = 0; i < PLAYERS.length; i++) {
    const player = PLAYERS[i];
    const localFileName = `${player.id}.png`;
    const localFilePath = path.join(PUBLIC_PLAYERS_DIR, localFileName);
    const localPublicUrl = `/players/${localFileName}`;

    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 1500) {
      player.photoUrl = localPublicUrl;
      alreadyDone++;
      continue;
    }

    console.log(`[${i + 1}/${PLAYERS.length}] Finding portrait for: ${player.name} (${player.country})...`);

    let candidateUrls: string[] = [];

    // 1. Wikipedia direct lead
    const wikiUrl = await fetchWikiThumb(player.name);
    if (wikiUrl) candidateUrls.push(wikiUrl);

    // 2. Bing queries
    const query1 = `${player.name} ${player.country} cricketer portrait headshot`;
    const q1Urls = await fetchBingImageUrls(query1);
    candidateUrls.push(...q1Urls);

    // 3. Fallback name variants (e.g. Steve Smith, Phil Salt, Sai Sudharsan)
    const altName = player.name
      .replace(/Steven/g, 'Steve')
      .replace(/Philip/g, 'Phil')
      .replace(/RP Singh/g, 'R. P. Singh')
      .replace(/B Sai Sudharsan/g, 'Sai Sudharsan')
      .replace(/Varun Chakaravarthy/g, 'Varun Chakravarthy');

    if (altName !== player.name) {
      const q2Urls = await fetchBingImageUrls(`${altName} cricket headshot portrait`);
      candidateUrls.push(...q2Urls);
    }

    // 4. Try generic cricket player query
    if (candidateUrls.length === 0) {
      const q3Urls = await fetchBingImageUrls(`${player.name} cricket player`);
      candidateUrls.push(...q3Urls);
    }

    const ok = await downloadFirstValidImage(candidateUrls, localFilePath);
    if (ok) {
      player.photoUrl = localPublicUrl;
      newlyDownloaded++;
      console.log(`  ✅ Successfully saved portrait (${fs.statSync(localFilePath).size} bytes)`);
    } else {
      failed.push(`${player.name} (${player.id})`);
      console.log(`  ❌ Failed for ${player.name}`);
    }

    // Polite rate delay
    await new Promise((r) => setTimeout(r, 100));
  }

  // Update PLAYERS dataset
  const outputCode = `import { Player } from '@/types/game';\n\nexport const PLAYERS: Player[] = ${JSON.stringify(PLAYERS, null, 2)};\n`;
  fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'players.ts'), outputCode, 'utf-8');

  console.log(`\n========================================`);
  console.log(`🎉 Portrait Sync Complete!`);
  console.log(`- Total Players: ${PLAYERS.length}`);
  console.log(`- Already Ready: ${alreadyDone}`);
  console.log(`- Newly Downloaded: ${newlyDownloaded}`);
  console.log(`- Total Ready: ${alreadyDone + newlyDownloaded} / ${PLAYERS.length}`);
  console.log(`- Failed (${failed.length}):`, failed);
  console.log(`========================================`);
}

run();
