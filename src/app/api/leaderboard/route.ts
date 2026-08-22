import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, date, user_id, nickname, attempts, time_ms, created_at')
      .eq('date', dateStr)
      .order('attempts', { ascending: true })
      .order('time_ms', { ascending: true })
      .limit(10);

    if (error) {
      // Return empty array fallback if table is not provisioned on live DB yet
      return NextResponse.json({ leaderboard: [] });
    }

    return NextResponse.json({ leaderboard: data || [] });
  } catch (err) {
    return NextResponse.json({ leaderboard: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, userId, nickname, attempts, timeMs } = body;

    if (!userId || !nickname || !attempts) {
      return NextResponse.json({ error: 'Missing required leaderboard parameters' }, { status: 400 });
    }

    const todayStr = date || new Date().toISOString().split('T')[0];
    const entryId = `${todayStr}_${userId}`;

    const { data, error } = await supabase.from('leaderboard').upsert({
      id: entryId,
      date: todayStr,
      user_id: userId,
      nickname,
      attempts,
      time_ms: timeMs || 0,
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
