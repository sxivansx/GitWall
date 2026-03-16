const cache = new Map<string, { data: Buffer; time: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function getCached(key: string): Buffer | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

export function setCache(key: string, data: Buffer) {
  cache.set(key, { data, time: Date.now() });
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}
