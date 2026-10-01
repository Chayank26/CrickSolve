'use client';

import { useState } from 'react';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';

export function RematchControls() {
  const { room, userId, isReconnecting, requestRematch } = useMultiplayerStore();
  const [pending, setPending] = useState(false);
  if (room?.status !== 'finished') return null;
  const request = room.rematchRequest;
  const mine = request?.requestedBy === userId;
  const act = async (action: 'request' | 'accept' | 'cancel' | 'decline') => {
    if (pending) return;
    setPending(true);
    try { await requestRematch(action); } finally { setPending(false); }
  };
  const button = (label: string, action: 'request' | 'accept' | 'cancel' | 'decline') => (
    <button disabled={pending || isReconnecting} onClick={() => void act(action)}
      className="border-2 border-current px-3 py-2 text-xs font-black uppercase disabled:opacity-50">
      {label}
    </button>
  );
  return <div className="flex flex-wrap items-center gap-2" aria-busy={pending}>
    {!request ? button('Request rematch', 'request') : mine ? <>
      <span role="status" className="text-xs">Waiting for opponent to accept…</span>
      {button('Cancel request', 'cancel')}
    </> : <>
      <span role="status" className="text-xs">Opponent requested a rematch.</span>
      {button('Accept rematch', 'accept')}
      {button('Decline', 'decline')}
    </>}
  </div>;
}
