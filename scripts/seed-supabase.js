const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo-cricksolve.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const playersPath = path.join(__dirname, '../src/data/players.ts');
const fileContent = fs.readFileSync(playersPath, 'utf-8');

// Extract JSON array from export const PLAYERS = [...]
const jsonMatch = fileContent.match(/export const PLAYERS: Player\[\] = (\[[\s\S]*\]);/);
if (!jsonMatch) {
  console.error('Failed to parse PLAYERS array from src/data/players.ts');
  process.exit(1);
}

const players = JSON.parse(jsonMatch[1]);

async function seedSupabase() {
  console.log(`Preparing to seed ${players.length} players to Supabase (${supabaseUrl})...`);

  const dbRows = players.map((p) => ({
    id: p.id,
    name: p.name,
    country: p.country,
    batting_hand: p.battingHand,
    bowling_type: p.bowlingType,
    role: p.role,
    ipl_team: p.iplTeam,
    retired: p.retired,
    birth_year: p.birthYear,
    tests: p.tests,
    odis: p.odis,
    t20is: p.t20is,
    category: p.category,
    photo_url: p.photoUrl,
    jersey_number: p.jerseyNumber || null,
    debut_year: p.debutYear || null,
    famous_teammate: p.famousTeammate || null,
    signature_performance: p.signaturePerformance || null,
  }));

  // Batch insert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < dbRows.length; i += chunkSize) {
    const chunk = dbRows.slice(i, i + chunkSize);
    const { error } = await supabase.from('players').upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.warn(`Chunk ${i / chunkSize + 1} notice:`, error.message);
    } else {
      console.log(`Seeded chunk ${i / chunkSize + 1} (${chunk.length} players)`);
    }
  }

  console.log('Seeding process finished successfully.');
}

seedSupabase();
