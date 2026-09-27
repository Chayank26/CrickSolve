import { NextResponse } from 'next/server';
import { RoomActionError } from '@/lib/multiplayer-errors';
import { verifyMultiplayerMembershipToken } from '@/lib/server-crypto';

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const maxBytes = 4096;
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RoomActionError('Request body is too large', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RoomActionError('A JSON object is required', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RoomActionError('Request body is too large', 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RoomActionError('Invalid JSON', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RoomActionError('A JSON object is required', 400);
  return body;
}

export function onlyFields(body: Record<string, unknown>, fields: string[]) {
  if (Object.keys(body).some((key) => !fields.includes(key))) throw new RoomActionError('Unsupported request field', 400);
}

export function readString(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RoomActionError(`Invalid ${label}`, 400);
  }
  return value.trim();
}
export function readRoomCode(value: unknown) {
  const code = readString(value, 'room code', 6).toUpperCase();
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)) throw new RoomActionError('Invalid room code', 400);
  return code;
}
export function readRoundId(value: unknown) {
  const id = readString(value, 'round ID', 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new RoomActionError('Invalid round ID', 400);
  return id;
}
export function requestMembership(request: Request, roomCode: string) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || header.length > 2048) throw new RoomActionError('Valid room membership is required', 401);
  const token = header.slice(7);
  const membership = verifyMultiplayerMembershipToken(token, roomCode);
  if (!membership) throw new RoomActionError('Valid room membership is required', 401);
  return { membershipToken: token, userId: membership.userId, membership };
}
export function multiplayerJson(body: unknown) {
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
export function multiplayerError(error: unknown) {
  if (error instanceof RoomActionError) return NextResponse.json({ error: error.message }, {
    status: error.status,
    headers: { 'Cache-Control': 'no-store', ...(error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {}) },
  });
  if (error instanceof Error && error.message === 'ROOM_BUSY') {
    return NextResponse.json({ error: 'Another room action is being processed. Please retry.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json({ error: 'Multiplayer is temporarily unavailable. Please retry.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
