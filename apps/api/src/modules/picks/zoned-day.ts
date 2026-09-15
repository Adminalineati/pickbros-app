import { PICK_TIME_ZONE } from '../wallet/wallet.constants';

export function startOfZonedDay(timeZone = PICK_TIME_ZONE, now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  for (const offset of ['-06:00', '-05:00', '-07:00', '-08:00', '+00:00']) {
    const candidate = new Date(`${day}T00:00:00${offset}`);
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(candidate);
    if (formatted === `${day}, 00:00`) {
      return candidate;
    }
  }

  return new Date(`${day}T06:00:00.000Z`);
}
