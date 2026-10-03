const STORAGE_KEY = 'gemini_api_key';

export const getApiKey = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage unavailable; fall back to env
  }
  return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
};

export const getStoredApiKey = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setStoredApiKey = (key: string) => {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
