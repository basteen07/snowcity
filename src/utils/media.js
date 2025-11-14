import { http } from '../services/apiClient';

function apiBaseUrl() {
  try { return http?.defaults?.baseURL || ''; } catch { return ''; }
}

function toAbsolute(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = apiBaseUrl();
  try {
    if (path.startsWith('/')) return base ? new URL(path, base).toString() : path;
    return base ? new URL(`/${path}`, base).toString() : path;
  } catch {
    return path;
  }
}

function rawUploadsUrl(id) {
  if (id === undefined || id === null || id === '') return '';
  return toAbsolute(`/api/uploads/${encodeURIComponent(String(id))}/raw`);
}

function parseMaybeJson(candidate) {
  if (typeof candidate !== 'string') return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const startsJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
  if (!startsJson) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

const NUMERIC_ID_RE = /^[0-9]+$/;

function asMediaId(str) {
  if (typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  return NUMERIC_ID_RE.test(trimmed) ? trimmed : null;
}

function resolveImage(obj, fallback = '', seen = new Set()) {
  if (!obj) return fallback;

  if (typeof obj === 'string') {
    const parsed = parseMaybeJson(obj);
    if (parsed) {
      const resolved = resolveImage(parsed, fallback, seen);
      return resolved || fallback;
    }
    const mediaId = asMediaId(obj);
    if (mediaId) return rawUploadsUrl(mediaId);
    return toAbsolute(obj) || fallback;
  }

  if (typeof obj === 'number') {
    return rawUploadsUrl(obj);
  }

  if (Array.isArray(obj)) {
    for (const entry of obj) {
      const resolved = resolveImage(entry, fallback, seen);
      if (resolved) return resolved;
    }
    return fallback;
  }

  if (typeof obj !== 'object') return fallback;

  if (seen.has(obj)) return fallback;
  seen.add(obj);

  const id = obj.image_media_id ?? obj.media_id ?? obj.cover_media_id ?? obj.banner_media_id ?? obj.thumbnail_media_id ?? obj?.media?.media_id ?? obj?.image?.media_id ?? null;
  if (id) return rawUploadsUrl(id);

  const collections = [obj.gallery, obj.images, obj.media_items, obj.media, obj.cover, obj.cover_image, obj.cover_media];
  for (const collection of collections) {
    if (Array.isArray(collection)) {
      for (const entry of collection) {
        if (!entry || entry === obj) continue;
        const resolved = resolveImage(entry, fallback, seen);
        if (resolved) return resolved;
      }
    } else if (collection && collection !== obj) {
      const resolved = resolveImage(collection, fallback, seen);
      if (resolved) return resolved;
    }
  }

  const p =
    obj.url_path ??
    obj.media_url ??
    obj.url ??
    obj.image_url ??
    obj.cover_image ??
    obj.web_image ??
    obj.mobile_image ??
    obj.image ??
    obj.thumbnail ??
    obj.path ??
    obj.src ??
    obj.value ??
    null;
  if (typeof p === 'string') {
    return resolveImage(p, fallback, seen) || fallback;
  }
  if (Array.isArray(p) || typeof p === 'object') {
    return resolveImage(p, fallback, seen) || fallback;
  }
  return fallback;
}

export function imgSrc(objOrUrl, fallback = '') {
  if (!objOrUrl && objOrUrl !== 0) return fallback || '';
  return resolveImage(objOrUrl, fallback) || (fallback || '');
}

export { toAbsolute as absoluteUrl, rawUploadsUrl };
