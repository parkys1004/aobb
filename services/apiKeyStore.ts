import { useEffect, useState } from 'react';

const GEMINI_KEY_NAME = 'GEMINI_API_KEY';
// 데스크톱 앱이 아닌 환경(브라우저)에서만 쓰는 대체 저장소 이름이다.
const FALLBACK_STORAGE_KEY = 'gptpark_api_keys_v2';

interface SecureKeysBridge {
    load: () => Promise<string | null>;
    save: (json: string) => Promise<{ ok: boolean; error?: string }>;
}

const getBridge = (): SecureKeysBridge | undefined =>
    (window as unknown as { secureKeys?: SecureKeysBridge }).secureKeys;

type Listener = (key: string | null) => void;
const listeners = new Set<Listener>();
const extraListeners = new Set<(values: Record<string, string>) => void>();
const readyListeners = new Set<(ready: boolean) => void>();

let currentApiKey: string | null = null;
let extraKeys: Record<string, string> = {};
let ready = false;

const cleanExtras = (values: Record<string, string>): Record<string, string> =>
    Object.fromEntries(Object.entries(values).filter(([, v]) => v && v.trim()).map(([k, v]) => [k, v.trim()]));

// 키 전체를 한 덩어리로 저장한다. 앱에서는 OS 계정에 묶인 암호화(safeStorage)로 userData에 저장되어
// 비밀번호 없이도 앱을 닫거나 업데이트한 뒤에 남는다.
let persistTimer: ReturnType<typeof setTimeout> | undefined;
const persist = () => {
    if (!ready) return; // 불러오기가 끝나기 전에 빈 값으로 덮어쓰지 않는다.
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        const json = JSON.stringify({ ...(currentApiKey ? { [GEMINI_KEY_NAME]: currentApiKey } : {}), ...extraKeys });
        const bridge = getBridge();
        if (bridge) {
            bridge.save(json).catch(() => undefined);
            return;
        }
        try {
            localStorage.setItem(FALLBACK_STORAGE_KEY, json);
        } catch {
            // 저장할 수 없으면 현재 세션의 메모리 값만 유지한다.
        }
    }, 300);
};

const applyLoaded = (json: string | null) => {
    if (json) {
        try {
            const { [GEMINI_KEY_NAME]: gemini, ...rest } = JSON.parse(json) as Record<string, string>;
            // 불러오는 동안 사용자가 이미 입력한 값이 있으면 그 값을 우선한다.
            if (!currentApiKey && gemini) currentApiKey = gemini;
            extraKeys = { ...cleanExtras(rest), ...extraKeys };
        } catch {
            // 손상된 저장 데이터는 무시한다.
        }
    }
    ready = true;
    listeners.forEach(listener => listener(currentApiKey));
    extraListeners.forEach(listener => listener(extraKeys));
    readyListeners.forEach(listener => listener(true));
};

const bridge = getBridge();
if (bridge) {
    bridge.load().then(applyLoaded, () => applyLoaded(null));
} else {
    let stored: string | null = null;
    try {
        stored = localStorage.getItem(FALLBACK_STORAGE_KEY);
    } catch {
        // 접근할 수 없으면 빈 상태로 시작한다.
    }
    applyLoaded(stored);
}

export const getApiKey = (): string | null => currentApiKey;

export const hasApiKey = (): boolean => !!currentApiKey;

export const setApiKey = (key: string | null): void => {
    currentApiKey = key && key.trim() ? key.trim() : null;
    listeners.forEach(listener => listener(currentApiKey));
    persist();
};

export const subscribeApiKey = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useApiKey = (): [string | null, (key: string | null) => void] => {
    const [key, setKeyState] = useState<string | null>(currentApiKey);
    useEffect(() => subscribeApiKey(setKeyState), []);
    return [key, setApiKey];
};

// Gemini 외 추가 제공자 키와 자체 서버 설정(주소 등)을 이름별로 보관한다.
export const getExtraKeys = (): Record<string, string> => extraKeys;

export const setExtraKeys = (values: Record<string, string>): void => {
    extraKeys = cleanExtras(values);
    extraListeners.forEach(listener => listener(extraKeys));
    persist();
};

export const useExtraKeys = (): [Record<string, string>, (values: Record<string, string>) => void] => {
    const [values, setValues] = useState<Record<string, string>>(extraKeys);
    useEffect(() => {
        extraListeners.add(setValues);
        return () => { extraListeners.delete(setValues); };
    }, []);
    return [values, setExtraKeys];
};

// 저장된 키를 불러오는 중에는 "키가 없다"는 안내를 띄우지 않도록 완료 여부를 알려준다.
export const useKeysReady = (): boolean => {
    const [value, setValue] = useState(ready);
    useEffect(() => {
        readyListeners.add(setValue);
        setValue(ready);
        return () => { readyListeners.delete(setValue); };
    }, []);
    return value;
};
