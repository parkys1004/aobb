import { useEffect, useState } from 'react';
import { getExtraKeys } from './apiKeyStore';
import { FREE_PROVIDERS, CUSTOM_SERVER_URL_NAME, CUSTOM_SERVER_KEY_NAME } from './providers';

export const GEMINI_PROVIDER_ID = 'gemini';
export const CUSTOM_PROVIDER_ID = 'custom';

const ACTIVE_STORAGE_KEY = 'gptpark_active_llm_provider';
const MODELS_STORAGE_KEY = 'gptpark_llm_model_overrides';

// 모델 이름은 비밀이 아니고 방문 간에 유지되는 편이 편하므로 localStorage에 둔다. (키는 저장하지 않는다)
const readStorage = (name: string): string | null => {
    try {
        return localStorage.getItem(name);
    } catch {
        return null;
    }
};

const writeStorage = (name: string, value: string): void => {
    try {
        localStorage.setItem(name, value);
    } catch {
        // 저장할 수 없으면 현재 세션의 메모리 값만 유지한다.
    }
};

let activeProvider: string = readStorage(ACTIVE_STORAGE_KEY) || GEMINI_PROVIDER_ID;
let modelOverrides: Record<string, string> = (() => {
    try {
        return JSON.parse(readStorage(MODELS_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
})();

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

export const getActiveProvider = (): string => activeProvider;
export const getModelOverrides = (): Record<string, string> => modelOverrides;

export const setActiveProvider = (id: string): void => {
    activeProvider = id;
    writeStorage(ACTIVE_STORAGE_KEY, id);
    notify();
};

export const setModelOverride = (id: string, model: string): void => {
    modelOverrides = { ...modelOverrides, [id]: model.trim() };
    writeStorage(MODELS_STORAGE_KEY, JSON.stringify(modelOverrides));
    notify();
};

export const useLlmSettings = () => {
    const [, setTick] = useState(0);
    useEffect(() => {
        const listener = () => setTick(t => t + 1);
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, []);
    return { activeProvider, modelOverrides, setActiveProvider, setModelOverride };
};

// 제공자별 OpenAI 호환 채팅 엔드포인트와 기본 모델. 모델 이름은 바뀔 수 있어 화면에서 덮어쓸 수 있다.
export const PROVIDER_ENDPOINTS: Record<string, { baseUrl: string; proModel: string; liteModel: string }> = {
    groq: { baseUrl: 'https://api.groq.com/openai/v1', proModel: 'llama-3.3-70b-versatile', liteModel: 'llama-3.1-8b-instant' },
    openrouter: { baseUrl: 'https://openrouter.ai/api/v1', proModel: 'meta-llama/llama-3.3-70b-instruct:free', liteModel: 'meta-llama/llama-3.3-70b-instruct:free' },
    mistral: { baseUrl: 'https://api.mistral.ai/v1', proModel: 'mistral-large-latest', liteModel: 'mistral-small-latest' },
    cerebras: { baseUrl: 'https://api.cerebras.ai/v1', proModel: 'llama-3.3-70b', liteModel: 'llama3.1-8b' },
    huggingface: { baseUrl: 'https://router.huggingface.co/v1', proModel: 'meta-llama/Llama-3.3-70B-Instruct', liteModel: 'meta-llama/Llama-3.3-70B-Instruct' },
};

export const getDefaultModel = (id: string): string => PROVIDER_ENDPOINTS[id]?.proModel ?? '';

export interface ChatEndpoint {
    label: string;
    baseUrl: string;
    key: string | null;
    model: string;
}

// Gemini가 선택되어 있으면 null을 돌려주고, 그 외에는 호출에 필요한 주소·키·모델을 확정해서 돌려준다.
export const resolveChatEndpoint = (tier: 'pro' | 'lite'): ChatEndpoint | null => {
    const id = activeProvider;
    if (id === GEMINI_PROVIDER_ID) return null;

    const extras = getExtraKeys();
    const override = modelOverrides[id];

    if (id === CUSTOM_PROVIDER_ID) {
        const baseUrl = extras[CUSTOM_SERVER_URL_NAME];
        if (!baseUrl) {
            throw new Error('자체 서버 주소가 설정되지 않았습니다. "API 키 관리"에서 서버 주소를 등록해주세요.');
        }
        // 모델 이름이 비어 있으면 호출 직전에 detectServerModel로 서버의 모델 목록에서 고른다.
        return { label: '자체 서버', baseUrl: baseUrl.replace(/\/+$/, ''), key: extras[CUSTOM_SERVER_KEY_NAME] || null, model: override || '' };
    }

    const provider = FREE_PROVIDERS.find(p => p.id === id);
    const endpoint = PROVIDER_ENDPOINTS[id];
    if (!provider || !endpoint) {
        throw new Error(`알 수 없는 제공자입니다: ${id}`);
    }
    const key = extras[provider.vaultName];
    if (!key) {
        throw new Error(`${provider.label} API 키가 설정되지 않았습니다. "API 키 관리"에서 키를 등록해주세요.`);
    }
    return {
        label: provider.label,
        baseUrl: endpoint.baseUrl,
        key,
        model: override || (tier === 'pro' ? endpoint.proModel : endpoint.liteModel),
    };
};

const detectedModels = new Map<string, string>();

// 자체 서버(OpenAI 호환)의 /models 목록에서 첫 모델을 골라 쓴다. 서버 주소별로 결과를 기억한다.
export const detectServerModel = async (endpoint: ChatEndpoint): Promise<string> => {
    const cached = detectedModels.get(endpoint.baseUrl);
    if (cached) return cached;
    const manual = '"API 키 관리"에서 모델 이름을 직접 입력해주세요. (예: llama3.1)';
    let id: string | undefined;
    try {
        const res = await fetch(`${endpoint.baseUrl}/models`, endpoint.key ? { headers: { Authorization: `Bearer ${endpoint.key}` } } : undefined);
        if (res.ok) {
            const data = await res.json();
            id = data?.data?.[0]?.id ?? data?.models?.[0]?.name;
        }
    } catch {
        // 아래에서 수동 입력 안내 오류로 처리한다.
    }
    if (!id) {
        throw new Error(`자체 서버에서 모델 목록을 가져오지 못했습니다. ${manual}`);
    }
    detectedModels.set(endpoint.baseUrl, id);
    return id;
};
