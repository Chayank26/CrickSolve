import { test, expect, Page } from '@playwright/test';

const names = ['Virat Kohli', 'Rohit Sharma', 'Mahendra Singh Dhoni', 'Sachin Tendulkar', 'Jasprit Bumrah', 'Ravindra Jadeja', 'Hardik Pandya'];
const sessionKey = 'cricksolve.multiplayer.session.v1';

async function session(page: Page) {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), sessionKey);
}
async function snapshot(page: Page) {
  const saved = await session(page);
  const response = await page.request.get(`/api/multiplayer/room?code=${saved.roomCode}`, {
    headers: { Authorization: `Bearer ${saved.membershipToken}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}
async function guess(page: Page, name: string) {
  await page.getByPlaceholder('Enter Cricketer Name (e.g. Virat Kohli)...').fill(name);
  const response = page.waitForResponse((r) => r.url().endsWith('/api/puzzle/guess') && r.request().method() === 'POST');
  await page.getByRole('button', { name: /^GUESS \(/ }).click();
  const result = await response;
  expect(result.ok()).toBeTruthy();
  return result.json();
}

test('two browser contexts create, play, recover, finish and mutually rematch', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage(); const guest = await guestContext.newPage();
  try {
    await host.goto('/');
    await host.getByRole('button', { name: /GOT IT, LET.S PLAY/ }).click();
    await host.getByRole('button', { name: '1v1 BATTLE' }).click();
    await host.getByPlaceholder('e.g. MasterBlaster99').fill('Integration Host');
    await host.getByRole('button', { name: 'CREATE BATTLE ROOM' }).click();
    await expect.poll(() => session(host)).toBeTruthy();
    const saved = await session(host);
    await guest.goto(`/?room=${saved.roomCode}`);
    await guest.getByPlaceholder('e.g. MasterBlaster99').fill('Integration Guest');
    await guest.getByRole('button', { name: 'ENTER BATTLE ROOM' }).click();
    await expect.poll(() => session(guest)).toBeTruthy();
    expect((await session(guest)).userId).not.toBe(saved.userId);
    await guest.getByRole('button', { name: /I AM READY/ }).click();
    await host.getByRole('button', { name: /START MATCH NOW/ }).click();
    await expect(host.getByPlaceholder('Enter Cricketer Name (e.g. Virat Kohli)...')).toBeEnabled();
    await expect(guest.getByPlaceholder('Enter Cricketer Name (e.g. Virat Kohli)...')).toBeEnabled();
    const initialRound = (await snapshot(host)).room.roundId;

    // The production target is random. A solve may legitimately end the duel early.
    let data;
    for (let i = 0; i < 7; i++) {
      data = await test.step(`Host guess ${i + 1}: ${names[i]}`, () => guess(host, names[i]));
      expect(data.room.targetPlayerId).toBeUndefined();
      if (data.room.status === 'finished') break;
      if (i === 3) {
        const hintButton = host.getByRole('button', { name: /BONUS HINT/ });
        if (await hintButton.isEnabled()) {
          await hintButton.click();
          await host.getByRole('button', { name: /: locked$/ }).first().click();
          await expect.poll(async () => (await snapshot(host)).hint).toBeTruthy();
        }
        const before = await snapshot(host);
        await host.reload();
        await expect.poll(async () => (await snapshot(host)).guesses.length).toBe(4);
        await expect(host.getByRole('button', { name: 'GUESS (5/7)' })).toBeVisible();
        expect((await snapshot(host)).hint).toEqual(before.hint);
        expect((await session(host)).userId).toBe(saved.userId);
        await hostContext.setOffline(true);
        await expect(host.getByText('Reconnecting… Your accepted guesses and bonus hint are saved.')).toBeVisible();
        await hostContext.setOffline(false);
        await expect(host.getByPlaceholder('Enter Cricketer Name (e.g. Virat Kohli)...')).toBeEnabled();
      }
    }
    if (data.room.status !== 'finished') {
      await expect(host.getByPlaceholder('NO GUESSES LEFT — WAITING FOR OPPONENT')).toBeDisabled();
      for (const name of names) { data = await test.step(`Guest guess: ${name}`, () => guess(guest, name)); if (data.room.status === 'finished') break; }
    }
    await expect(host.getByRole('heading', { name: /SPECTACULAR WIN|NO ONE SOLVED IT|DUEL FINISHED/ })).toBeVisible();
    await expect(guest.getByRole('heading', { name: /SPECTACULAR WIN|NO ONE SOLVED IT|DUEL FINISHED/ })).toBeVisible();
    await host.getByRole('button', { name: 'Request rematch', exact: true }).last().click();
    await guest.getByRole('button', { name: 'Decline', exact: true }).last().click();
    await expect(host.getByRole('button', { name: 'Request rematch', exact: true }).last()).toBeVisible();
    await host.getByRole('button', { name: 'Request rematch', exact: true }).last().click();
    await guest.getByRole('button', { name: 'Accept rematch', exact: true }).last().click();
    await expect(guest.getByRole('button', { name: /I AM READY/ })).toBeVisible();
    await expect.poll(async () => (await snapshot(host)).room.roundId).not.toBe(initialRound);
    const reset = await snapshot(host);
    expect(reset.guesses).toEqual([]); expect(reset.hint).toBeNull();
    expect(reset.room.status).toBe('waiting');
    expect(reset.room.participants.every((p: { guessesCount: number }) => p.guessesCount === 0)).toBeTruthy();

    // A host leave frees its slot and gives the remaining player host controls.
    await host.getByRole('button', { name: /LEAVE LOBBY/ }).click();
    await expect.poll(() => session(host)).toBeNull();
    await expect.poll(async () => (await snapshot(guest)).room.hostId).toBe((await session(guest)).userId);
    await guest.reload();
    await expect(guest.getByRole('button', { name: /NEED AT LEAST 2 PLAYERS/ }).last()).toBeVisible();
    await host.goto(`/?room=${saved.roomCode}`);
    await host.getByRole('button', { name: 'ENTER BATTLE ROOM' }).click();
    await expect.poll(() => session(host)).toBeTruthy();
    await host.getByRole('button', { name: /I AM READY/ }).click();
    await guest.getByRole('button', { name: /START MATCH NOW/ }).click();
    await expect(host.getByPlaceholder('Enter Cricketer Name (e.g. Virat Kohli)...')).toBeEnabled();
    await host.getByTitle('Leave and forfeit this duel').click();
    await expect.poll(() => session(host)).toBeNull();
    await expect(guest.getByRole('heading', { name: 'WIN BY FORFEIT' })).toBeVisible();
    await expect(guest.getByText(/Your opponent left or did not reconnect/)).toBeVisible();
    expect((await snapshot(guest)).room.finishReason).toBe('forfeit');
    await expect(guest.getByRole('button', { name: 'Request rematch', exact: true })).toHaveCount(0);

  } finally { await hostContext.close(); await guestContext.close(); }
});
