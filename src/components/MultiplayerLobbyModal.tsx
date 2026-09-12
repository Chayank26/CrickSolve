'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useMultiplayerStore } from '@/store/useMultiplayerStore';
import { playUnlockSound, playWinSound } from '@/lib/audio';
import {
  X,
  Swords,
  Copy,
  Check,
  Crown,
  Users,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogOut,
  Sparkles,
} from 'lucide-react';

export function MultiplayerLobbyModal() {
  const { activeModal, setActiveModal, soundEnabled, setGameMode, resetGame } = useGameStore();
  const {
    userId,
    nickname,
    setNickname,
    room,
    isConnecting,
    error,
    countdown,
    createRoom,
    joinRoom,
    toggleReady,
    startMatchCountdown,
    leaveRoom,
  } = useMultiplayerStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [inputName, setInputName] = useState(nickname || 'Cricketer');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync nickname with store
  useEffect(() => {
    if (nickname) setInputName(nickname);
  }, [nickname]);

  // Handle URL room code parameter on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom && !room) {
        setInputRoomCode(urlRoom.toUpperCase());
        setActiveTab('join');
        setActiveModal('multiplayer');
      }
    }
  }, [room, setActiveModal]);

  // When countdown completes and match starts, close modal and switch game mode
  useEffect(() => {
    if (countdown === 1) {
      playWinSound(soundEnabled);
    }
    if (countdown === null && room?.status === 'in_progress') {
      // Close modal and set game mode to multiplayer
      setActiveModal(null);
      // Reset local game board with target player from room
      if (room.targetPlayerId) {
        setGameMode('unlimited');
        resetGame(room.targetPlayerId);
      }
    }
  }, [countdown, room, setActiveModal, setGameMode, resetGame, soundEnabled]);

  if (activeModal !== 'multiplayer' && countdown === null) return null;

  const isHost = room?.hostId === userId;
  const currentParticipant = room?.participants.find((p) => p.userId === userId);
  const isReady = !!currentParticipant?.isReady;
  const canStart =
    isHost &&
    room &&
    room.participants.length >= 2 &&
    room.participants.every((p) => p.isReady);

  const handleCreate = async () => {
    if (!inputName.trim()) return;
    setNickname(inputName.trim());
    playUnlockSound(soundEnabled);
    await createRoom(inputName.trim());
  };

  const handleJoin = async () => {
    if (!inputName.trim() || !inputRoomCode.trim()) return;
    setNickname(inputName.trim());
    playUnlockSound(soundEnabled);
    await joinRoom(inputRoomCode.trim(), inputName.trim());
  };

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}?room=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    playUnlockSound(soundEnabled);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLeave = () => {
    leaveRoom();
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* 3-2-1 Synchronized Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 text-center"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.2, rotate: -15, opacity: 0 }}
              animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 200 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="bg-[#CCFF00] border-6 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] px-12 py-8 rotate-1">
                <span className="text-8xl md:text-9xl font-black text-black">
                  {countdown > 0 ? countdown : 'START!'}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest mt-4">
                {countdown > 0 ? 'GET READY TO GUESS!' : 'CRICKET BATTLE COMMENCING!'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-lg bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col my-auto relative"
      >
        {/* Header Bar */}
        <div className="bg-[#7E22CE] border-b-4 border-black p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-[#CCFF00]" />
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white">
              1v1 LIVE MULTIPLAYER
            </h2>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="bg-black text-white p-1.5 border-2 border-black hover:bg-neutral-800 transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="bg-red-500 text-white border-b-4 border-black px-4 py-2 text-xs md:text-sm font-black uppercase flex items-center justify-between">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className="p-5 flex flex-col gap-5">
          {!room ? (
            /* ========================================================
               VIEW A: CREATE / JOIN LOBBY
               ======================================================== */
            <div className="flex flex-col gap-5">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-3 text-sm font-black border-3 border-black uppercase transition-all ${
                    activeTab === 'create'
                      ? 'bg-[#CCFF00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-black hover:bg-slate-100'
                  }`}
                >
                  CREATE ROOM
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`py-3 text-sm font-black border-3 border-black uppercase transition-all ${
                    activeTab === 'join'
                      ? 'bg-[#CCFF00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-black hover:bg-slate-100'
                  }`}
                >
                  JOIN ROOM
                </button>
              </div>

              {/* Nickname Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase text-neutral-800">
                  YOUR CRICKETER HANDLE
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. MasterBlaster99"
                  className="w-full bg-slate-50 border-3 border-black px-4 py-2.5 text-base font-black uppercase text-black placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                />
              </div>

              {activeTab === 'create' ? (
                /* Create Room Form */
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-100 border-3 border-black p-3.5 text-xs font-bold leading-relaxed text-neutral-800">
                    💡 <strong>HOW IT WORKS:</strong> Create a room to get a unique 6-letter room code. Invite a friend, race in real-time, and watch their Wordle grid update live as you guess!
                  </div>

                  <button
                    disabled={isConnecting || !inputName.trim()}
                    onClick={handleCreate}
                    className="w-full bg-[#CCFF00] text-black border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] py-3.5 text-sm md:text-base font-black uppercase hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-black" />
                    <span>{isConnecting ? 'CREATING ROOM...' : '⚡ CREATE BATTLE ROOM'}</span>
                  </button>
                </div>
              ) : (
                /* Join Room Form */
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase text-neutral-800">
                      ENTER 6-LETTER ROOM CODE
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={inputRoomCode}
                      onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                      placeholder="e.g. 3EJFST"
                      className="w-full bg-slate-50 border-3 border-black px-4 py-2.5 text-center text-xl tracking-widest font-black uppercase text-black placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
                    />
                  </div>

                  <button
                    disabled={isConnecting || !inputName.trim() || inputRoomCode.trim().length < 4}
                    onClick={handleJoin}
                    className="w-full bg-[#7E22CE] text-white border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] py-3.5 text-sm md:text-base font-black uppercase hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-5 h-5 text-[#CCFF00]" />
                    <span>{isConnecting ? 'JOINING ROOM...' : 'ENTER BATTLE ROOM'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================
               VIEW B: ACTIVE ROOM LOBBY
               ======================================================== */
            <div className="flex flex-col gap-5">
              {/* Room Code Banner */}
              <div className="bg-black text-white border-3 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                    BATTLE ROOM CODE
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-[#CCFF00] tracking-wider">
                    {room.roomCode}
                  </span>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="bg-[#CCFF00] text-black border-2 border-black px-4 py-2 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'LINK COPIED!' : 'COPY INVITE LINK'}</span>
                </button>
              </div>

              {/* Participants List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-neutral-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>PLAYERS IN LOBBY ({room.participants.length}/8)</span>
                  </span>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase">
                    {room.participants.length < 2 ? '⏳ Waiting for opponent to join...' : 'Ready to fight!'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {room.participants.map((p) => {
                    const isSelf = p.userId === userId;
                    const isRoomHost = p.role === 'host';
                    return (
                      <div
                        key={p.userId}
                        className={`border-3 border-black p-3 flex items-center justify-between transition-all ${
                          p.isReady
                            ? 'bg-[#CCFF00]/20 border-black'
                            : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isRoomHost ? (
                            <div className="bg-[#7E22CE] text-[#CCFF00] p-1.5 border-2 border-black">
                              <Crown className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="bg-black text-white p-1.5 border-2 border-black">
                              <Swords className="w-4 h-4" />
                            </div>
                          )}

                          <div className="flex flex-col">
                            <span className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                              {p.nickname}
                              {isSelf && (
                                <span className="text-[10px] bg-black text-[#CCFF00] px-1.5 py-0.2 font-black">
                                  YOU
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">
                              {isRoomHost ? 'Room Leader' : 'Challenger'}
                            </span>
                          </div>
                        </div>

                        {/* Ready Status Badge */}
                        <div className="flex items-center gap-1.5">
                          {p.isReady ? (
                            <span className="bg-[#CCFF00] text-black border-2 border-black px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>READY</span>
                            </span>
                          ) : (
                            <span className="bg-neutral-200 text-neutral-700 border-2 border-black px-2.5 py-1 text-xs font-black uppercase flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>WAITING</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                {/* Ready Up Toggle */}
                <button
                  onClick={() => {
                    playUnlockSound(soundEnabled);
                    toggleReady();
                  }}
                  className={`w-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-3 text-sm md:text-base font-black uppercase transition-all flex items-center justify-center gap-2 ${
                    isReady
                      ? 'bg-neutral-200 text-black hover:bg-neutral-300'
                      : 'bg-[#CCFF00] text-black hover:brightness-105'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isReady ? 'CANCEL READY' : 'I AM READY 👊'}</span>
                </button>

                {/* Host Start Button */}
                {isHost && (
                  <button
                    disabled={!canStart}
                    onClick={() => {
                      playWinSound(soundEnabled);
                      startMatchCountdown();
                    }}
                    className="w-full bg-[#7E22CE] text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-3 text-sm md:text-base font-black uppercase hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 text-[#CCFF00] fill-current" />
                    <span>
                      {room.participants.length < 2
                        ? 'NEED AT LEAST 2 PLAYERS'
                        : !room.participants.every((p) => p.isReady)
                        ? 'WAITING FOR ALL PLAYERS TO READY'
                        : 'START MATCH NOW 🚀'}
                    </span>
                  </button>
                )}

                {/* Leave Room Button */}
                <button
                  onClick={handleLeave}
                  className="w-full bg-white text-red-600 border-2 border-black hover:bg-red-50 py-2 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>LEAVE LOBBY</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
