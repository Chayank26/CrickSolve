export class RoomActionError extends Error {
  constructor(message: string, public status: number = 409, public retryAfter?: number) {
    super(message);
  }
}
