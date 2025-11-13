export const DEV_USE_FAKE_OTP = import.meta.env?.VITE_DEV_USE_FAKE_OTP === 'true';
export const DEV_FAKE_TOKEN = import.meta.env?.VITE_DEV_FAKE_TOKEN || 'dev-token';
export const DEV_FAKE_USER = {
  id: 'dev-user',
  name: 'Developer',
  email: 'dev@example.com',
  phone: '9999999999'
};
export const DEV_TOKEN_EXPIRES_AT = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();