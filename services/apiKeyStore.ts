import { useEffect, useState } from 'react';

const SESSION_STORAGE_KEY = 'gptpark_runtime_gemini_api_key';

type Listener = (key: string | null) => void;

const listeners = new Set<Listener>();

const readInitialKey = (): string | null => {
    try {
        return sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
        return null;
    }
};

let currentApiKey: string | null = readInitialKey();

export const getApiKey = (): string | null => currentApiKey;

export const hasApiKey = (): boolean => !!currentApiKey;

// 브라우저 빌드에 키를 내장하지 않고, 이 세션 동안만 메모리(및 탭 종료 시 사라지는 sessionStorage)에 보관한다.
// 영구 저장은 사용자가 로컬 드라이브에 암호화하여 저장하는 파일이 담당한다.
export const setApiKey = (key: string | null): void => {
    currentApiKey = key && key.trim() ? key.trim() : null;
    try {
        if (currentApiKey) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, currentApiKey);
        } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch {
        // 시크릿 모드 등으로 sessionStorage를 사용할 수 없는 경우, 메모리 값만 유지한다.
    }
    listeners.forEach(listener => listener(currentApiKey));
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

// Gemini 외 추가 제공자 키와 자체 서버 설정(주소 등)을 이름별로 세션 동안만 보관한다.
const EXTRA_STORAGE_KEY = 'gptpark_runtime_extra_keys';

const readInitialExtras = (): Record<string, string> => {
    try {
        return JSON.parse(sessionStorage.getItem(EXTRA_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

let extraKeys: Record<string, string> = readInitialExtras();
const extraListeners = new Set<(values: Record<string, string>) => void>();

export const getExtraKeys = (): Record<string, string> => extraKeys;

export const setExtraKeys = (values: Record<string, string>): void => {
    extraKeys = Object.fromEntries(Object.entries(values).filter(([, v]) => v && v.trim()).map(([k, v]) => [k, v.trim()]));
    try {
        sessionStorage.setItem(EXTRA_STORAGE_KEY, JSON.stringify(extraKeys));
    } catch {
        // sessionStorage를 사용할 수 없으면 메모리 값만 유지한다.
    }
    extraListeners.forEach(listener => listener(extraKeys));
};

export const useExtraKeys = (): [Record<string, string>, (values: Record<string, string>) => void] => {
    const [values, setValues] = useState<Record<string, string>>(extraKeys);
    useEffect(() => {
        extraListeners.add(setValues);
        return () => { extraListeners.delete(setValues); };
    }, []);
    return [values, setExtraKeys];
};
