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

function resolveImage(obj, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  const id = obj.image_media_id ?? obj.media_id ?? obj.cover_media_id ?? obj.banner_media_id ?? obj.thumbnail_media_id ?? obj?.media?.media_id ?? obj?.image?.media_id ?? null;
  if (id) return rawUploadsUrl(id);
  const p = obj.url_path ?? obj.image_url ?? obj.cover_image ?? obj.web_image ?? obj.mobile_image ?? obj.image ?? obj.thumbnail ?? null;
  return toAbsolute(p) || fallback;
}

export function imgSrc(objOrUrl, fallback = '') {
  if (!objOrUrl) return fallback || '';
  if (typeof objOrUrl === 'string') return toAbsolute(objOrUrl) || (fallback || '');
  if (typeof objOrUrl === 'number') return rawUploadsUrl(objOrUrl);
  return resolveImage(objOrUrl, fallback);
}

export { toAbsolute as absoluteUrl, rawUploadsUrl };
