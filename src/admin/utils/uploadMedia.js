import adminApi from '../services/adminApi';

const ENDPOINT = import.meta.env?.VITE_ADMIN_UPLOAD_ENDPOINT || '/api/admin/uploads';

export async function uploadAdminMedia(file, { fieldName = 'file', extra = {} } = {}) {
  if (!file) throw new Error('No file selected');
  if (!ENDPOINT) throw new Error('Upload endpoint not configured');

  const res = await adminApi.upload(ENDPOINT, file, { fieldName, ...extra });
  const url = res?.url || res?.url_path || res?.secure_url || res?.location || res?.data?.url || '';
  if (!url) {
    throw new Error(res?.message || 'Upload response missing URL');
  }
  return url;
}

export default uploadAdminMedia;
