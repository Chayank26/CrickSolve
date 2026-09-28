import { randomUUID } from 'crypto';
import { createRoom, toMemberRoomResponse } from '@/lib/multiplayer-manager';
import { createMultiplayerMembershipToken } from '@/lib/server-crypto';
import { multiplayerError, multiplayerJson, onlyFields, readJsonObject, readString } from '@/lib/multiplayer-http';
import { limitMultiplayerRequest } from '@/lib/multiplayer-rate-limit';

export async function POST(request: Request) {
  try {
    await limitMultiplayerRequest(request, 'create', 10);
    const body = await readJsonObject(request);
    onlyFields(body, ['hostName']);
    const name = readString(body.hostName ?? 'Host Cricketer', 'nickname', 20);
    const userId = randomUUID();
    const room = await createRoom(userId, name);
    return multiplayerJson({
      success: true, userId, ...toMemberRoomResponse(room, userId),
      membershipToken: createMultiplayerMembershipToken(room, userId, 'host'),
    });
  } catch (error) { return multiplayerError(error); }
}
