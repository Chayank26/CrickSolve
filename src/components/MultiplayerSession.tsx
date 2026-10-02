'use client';

import { useEffect } from 'react';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';

export function MultiplayerSession() {
  const { room, recoveryPending, isConnecting, error, restoreSession } = useMultiplayerStore();
  useEffect(() => {
    const resume = () => {
      const state = useMultiplayerStore.getState();
      if (state.room) {
        state.startRoomSync();
        void state.syncRoomSnapshot();
      } else void state.restoreSession();
    };
    const visible = () => { if (document.visibilityState === 'visible') resume(); };
    resume();
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', visible);
      // Refresh/unmount is not an explicit leave and must retain credentials.
      useMultiplayerStore.getState().stopRoomSync();
    };
  }, []);

  if (room || (!recoveryPending && !error)) return null;
  return (
    <div role="status" className="border-2 border-black bg-white p-3 text-sm font-bold">
      <p>{error || 'Restoring your multiplayer duel…'}</p>
      {recoveryPending && <div className="flex gap-4 mt-2">
        <button disabled={isConnecting} onClick={() => void restoreSession()} className="underline disabled:opacity-50">Retry connection</button>
        <p className="text-xs">Reconnect before leaving. During an active duel, a 60-second absence forfeits the round.</p>
      </div>}
    </div>
  );
}
