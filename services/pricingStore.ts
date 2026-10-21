import { useEffect, useState } from 'react';

// 모델별 단가(사용자가 직접 입력). Google 공식 가격 페이지 기준 금액을 사용자가 넣어야 하며,
// 이 앱은 정확한 공식 단가를 대신 조회해주지 않는다 (API 키만으로는 조회 불가능).
export interface ModelPrice {
    inputPerMillion: number;
    outputPerMillion: number;
    perImage: number;
}

export type PricingConfig = Record<string, ModelPrice>;

const STORAGE_KEY = 'gptpark_model_pricing_config';

const emptyPrice = (): ModelPrice => ({ inputPerMillion: 0, outputPerMillion: 0, perImage: 0 });

const readInitial = (): PricingConfig => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

let config: PricingConfig = readInitial();

type Listener = (config: PricingConfig) => void;
const listeners = new Set<Listener>();
const notify = (): void => listeners.forEach(listener => listener(config));

export const getPricing = (): PricingConfig => config;

export const getModelPrice = (model: string): ModelPrice => config[model] ?? emptyPrice();

export const setModelPrice = (model: string, price: Partial<ModelPrice>): void => {
    config = { ...config, [model]: { ...emptyPrice(), ...config[model], ...price } };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
        // localStorage 사용 불가 시 메모리에만 유지
    }
    notify();
};

export const subscribePricing = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const usePricing = (): PricingConfig => {
    const [value, setValue] = useState<PricingConfig>(config);
    useEffect(() => subscribePricing(setValue), []);
    return value;
};
