import { supabase } from '@/lib/supabase';
import { getDailyTargetPlayer } from '@/lib/game-engine';
import { verifyVictoryToken } from '@/lib/server-crypto';
import { PlayerCategory } from '@/types/game';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const category = (searchParams.get('category') as PlayerCategory) || 'International';

  // Resolve today's mystery player
  const todayPlayer = getDailyTargetPlayer(dateStr, category);

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, date, user_id, nickname, attempts, time_ms, created_at')
      .eq('date', dateStr)
      .order('time_ms', { ascending: true })
      .order('attempts', { ascending: true })
      .limit(15);

    if (error) {
      return NextResponse.json({
        leaderboard: [],
        todayPlayer: {
          name: todayPlayer.name,
          country: todayPlayer.country,
          role: todayPlayer.role,
          photoUrl: todayPlayer.photoUrl,
        },
      });
    }

    return NextResponse.json({
      leaderboard: data || [],
      todayPlayer: {
        name: todayPlayer.name,
        country: todayPlayer.country,
        role: todayPlayer.role,
        photoUrl: todayPlayer.photoUrl,
      },
    });
  } catch (err) {
    return NextResponse.json({
      leaderboard: [],
      todayPlayer: {
        name: todayPlayer.name,
        country: todayPlayer.country,
        role: todayPlayer.role,
        photoUrl: todayPlayer.photoUrl,
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, userId, nickname, attempts, timeMs, victoryToken } = body;

    if (!nickname) {
      return NextResponse.json({ error: 'Missing required nickname' }, { status: 400 });
    }

    let verifiedAttempts = attempts;
    let verifiedTimeMs = timeMs;

    // Verify victory token if present
    if (victoryToken) {
      const payload = verifyVictoryToken(victoryToken);
      if (!payload) {
        return NextResponse.json({ error: 'Invalid or tampered victory token' }, { status: 401 });
      }
      verifiedAttempts = payload.attempts;
      verifiedTimeMs = payload.timeMs;
    } else {
      // Basic bounds check if token isn't provided (for legacy local sessions)
      if (!verifiedAttempts || verifiedAttempts < 1 || verifiedAttempts > 8) {
        return NextResponse.json({ error: 'Invalid attempts value' }, { status: 400 });
      }
    }

    // Sanity check minimum solve time (2000ms minimum)
    const finalTimeMs = Math.max(2000, verifiedTimeMs || 15000);

    const todayStr = date || new Date().toISOString().split('T')[0];
    const uid = userId || `user_${Math.floor(Math.random() * 1000000)}`;
    const entryId = `${todayStr}_${uid}`;

    const { data, error } = await supabase.from('leaderboard').upsert({
      id: entryId,
      date: todayStr,
      user_id: uid,
      nickname: nickname.trim(),
      attempts: verifiedAttempts,
      time_ms: finalTimeMs,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ success: true, localOnly: true });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: true, localOnly: true });
  }
}

