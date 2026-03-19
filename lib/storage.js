/**
 * POLYGLOT OS — localStorage helpers
 * Temporary persistence layer (replaced by SQLite in Layer 4)
 */

const PREFIX = 'polyglot_';

export function loadJSON(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error('loadJSON failed:', key, e);
    return fallback;
  }
}

export function saveJSON(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('saveJSON failed:', key, e);
  }
}

export function removeKey(key) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREFIX + key);
}
