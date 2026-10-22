import React from 'react';
import { useApiKey, useExtraKeys } from '../services/apiKeyStore';
import { FREE_PROVIDERS, CUSTOM_SERVER_URL_NAME } from '../services/providers';
import { useLlmSettings, GEMINI_PROVIDER_ID, CUSTOM_PROVIDER_ID } from '../services/llmSettings';
import { Icon } from './Icon';

// 지금 선택된 글 생성 제공자로는 글을 만들 수 없는 설정 문제를 찾아 문장으로 돌려준다.
const useConfigIssue = (): string | null => {
    const [geminiKey] = useApiKey();
    const [extraKeys] = useExtraKeys();
    const { activeProvider } = useLlmSettings();

    if (activeProvider === GEMINI_PROVIDER_ID) {
        return geminiKey ? null : 'Gemini API 키가 설정되지 않았습니다.';
    }
    if (activeProvider === CUSTOM_PROVIDER_ID) {
        return extraKeys[CUSTOM_SERVER_URL_NAME] ? null : '자체 서버 주소가 설정되지 않았습니다.';
    }
    const provider = FREE_PROVIDERS.find(p => p.id === activeProvider);
    if (provider && !extraKeys[provider.vaultName]) {
        return `${provider.label} API 키가 설정되지 않았습니다.`;
    }
    return null;
};

// 화면 상단에 고정되는 설정 안내. 문제가 해결되면 저절로 사라진다.
export const ConfigNotice: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
    const issue = useConfigIssue();
    if (!issue) return null;

    return (
        <div role="alert" className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-accent/40 bg-accent/10 px-5 py-2.5 text-sm text-fg sm:px-8">
            <Icon icon="warning" className="h-4 w-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">
                <b className="text-accent">{issue}</b> 글 생성 전에 API 키를 등록해주세요.
            </span>
            {onOpenSettings && (
                <button onClick={onOpenSettings} className="btn btn-primary btn-sm shrink-0">
                    <Icon icon="key" className="h-4 w-4" />API 키 설정
                </button>
            )}
        </div>
    );
};
