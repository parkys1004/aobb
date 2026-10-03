export interface ModelSettings {
  text: string;        // blog post generation / regeneration
  fast: string;        // topic suggestions, interactive ideas
  imagen: string;      // primary image model (generateImages)
  geminiImage: string; // fallback image model (generateContent)
}

export const DEFAULT_MODELS: ModelSettings = {
  text: 'gemini-3.1-pro-preview',
  fast: 'gemini-3.5-flash',
  imagen: 'imagen-4.0-generate-001',
  geminiImage: 'gemini-2.5-flash-image',
};

const STORAGE_KEY = 'gemini_model_settings';

export const getStoredModels = (): Partial<ModelSettings> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const getModels = (): ModelSettings => {
  const stored = getStoredModels();
  const merged = { ...DEFAULT_MODELS };
  (Object.keys(DEFAULT_MODELS) as (keyof ModelSettings)[]).forEach((k) => {
    const v = stored[k]?.trim();
    if (v) merged[k] = v;
  });
  return merged;
};

// Saves only values that differ from defaults, so default updates still apply.
export const setStoredModels = (models: ModelSettings) => {
  const overrides: Partial<ModelSettings> = {};
  (Object.keys(DEFAULT_MODELS) as (keyof ModelSettings)[]).forEach((k) => {
    const v = models[k].trim();
    if (v && v !== DEFAULT_MODELS[k]) overrides[k] = v;
  });
  try {
    if (Object.keys(overrides).length) localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
