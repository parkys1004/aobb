import { useEffect, useState } from 'react';

// Gemini API 키만으로는 Google Cloud Billing API에 접근할 수 없어 실제 청구 금액을 가져올 수 없다.
// 대신 각 API 응답에 포함된 usageMetadata(토큰 수)를 이 세션 동안 누적하고,
// 사용자가 직접 입력한 단가를 곱해 "예상 비용"을 실시간으로 계산한다.

export interface TokenUsageMetadata {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
}

export interface ModelUsage {
    callCount: number;
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
    imageCount: number;
}

export interface UsageState {
    byModel: Record<string, ModelUsage>;
}

const emptyModelUsage = (): ModelUsage => ({ callCount: 0, promptTokens: 0, outputTokens: 0, totalTokens: 0, imageCount: 0 });

let state: UsageState = { byModel: {} };

type Listener = (state: UsageState) => void;
const listeners = new Set<Listener>();

const notify = (): void => listeners.forEach(listener => listener(state));

export const recordTokenUsage = (model: string, usage: TokenUsageMetadata | undefined): void => {
    const prev = state.byModel[model] ?? emptyModelUsage();
    const promptTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;
    const totalTokens = usage?.totalTokenCount ?? (promptTokens + outputTokens);

    state = {
        byModel: {
            ...state.byModel,
            [model]: {
                ...prev,
                callCount: prev.callCount + 1,
                promptTokens: prev.promptTokens + promptTokens,
                outputTokens: prev.outputTokens + outputTokens,
                totalTokens: prev.totalTokens + totalTokens,
            },
        },
    };
    notify();
};

export const recordImageUsage = (model: string, count: number = 1): void => {
    const prev = state.byModel[model] ?? emptyModelUsage();
    state = {
        byModel: {
            ...state.byModel,
            [model]: { ...prev, callCount: prev.callCount + 1, imageCount: prev.imageCount + count },
        },
    };
    notify();
};

export const resetUsage = (): void => {
    state = { byModel: {} };
    notify();
};

export const getUsage = (): UsageState => state;

export const subscribeUsage = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useUsage = (): UsageState => {
    const [value, setValue] = useState<UsageState>(state);
    useEffect(() => subscribeUsage(setValue), []);
    return value;
};
