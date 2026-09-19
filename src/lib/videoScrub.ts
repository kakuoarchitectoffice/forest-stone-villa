// A short, refresh-rate-independent ease prevents touch/wheel jumps without
// introducing a long catch-up animation. Never seek to the MP4's empty end time.
export const SEEK_EPSILON = 1 / 120;

export function videoTimeForProgress(duration: number, progress: number) {
  return Math.min(Math.max(0, duration - 1 / 30), duration * Math.min(1, Math.max(0, progress)));
}

export function smoothVideoTime(current: number, target: number, elapsedMs: number) {
  if (Math.abs(target - current) <= SEEK_EPSILON) return target;
  const alpha = 1 - Math.exp(-Math.min(64, Math.max(0, elapsedMs)) / 90);
  const next = current + (target - current) * alpha;
  return Math.abs(target - next) <= SEEK_EPSILON ? target : next;
}
