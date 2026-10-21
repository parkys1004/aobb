export interface FreeProvider {
    id: string;
    label: string;
    vaultName: string;
    placeholder: string;
    note: string;
    keyUrl: string;
    testUrl: string;
    // 'bearer'는 Authorization 헤더로 키를 전달한다.
    authHeader: 'bearer';
}

// Gemini는 기존 단일 키 흐름(apiKeyStore)이 담당하므로 여기에는 추가 무료 제공자만 둔다.
export const FREE_PROVIDERS: FreeProvider[] = [
    {
        id: 'groq',
        label: 'Groq',
        vaultName: 'GROQ_API_KEY',
        placeholder: 'gsk_...',
        note: '무료 티어 · Llama 등 오픈 모델 · OpenAI 호환',
        keyUrl: 'https://console.groq.com/keys',
        testUrl: 'https://api.groq.com/openai/v1/models',
        authHeader: 'bearer',
    },
    {
        id: 'openrouter',
        label: 'OpenRouter',
        vaultName: 'OPENROUTER_API_KEY',
        placeholder: 'sk-or-...',
        note: "':free' 접미사가 붙은 모델은 무료",
        keyUrl: 'https://openrouter.ai/keys',
        testUrl: 'https://openrouter.ai/api/v1/auth/key',
        authHeader: 'bearer',
    },
    {
        id: 'mistral',
        label: 'Mistral',
        vaultName: 'MISTRAL_API_KEY',
        placeholder: '키 입력',
        note: '무료 Experiment 플랜 제공',
        keyUrl: 'https://console.mistral.ai/api-keys',
        testUrl: 'https://api.mistral.ai/v1/models',
        authHeader: 'bearer',
    },
    {
        id: 'cerebras',
        label: 'Cerebras',
        vaultName: 'CEREBRAS_API_KEY',
        placeholder: 'csk-...',
        note: '무료 티어 · 빠른 추론',
        keyUrl: 'https://cloud.cerebras.ai/platform',
        testUrl: 'https://api.cerebras.ai/v1/models',
        authHeader: 'bearer',
    },
    {
        id: 'huggingface',
        label: 'Hugging Face',
        vaultName: 'HUGGINGFACE_API_KEY',
        placeholder: 'hf_...',
        note: '무료 Inference API 토큰 (read 권한)',
        keyUrl: 'https://huggingface.co/settings/tokens',
        testUrl: 'https://huggingface.co/api/whoami-v2',
        authHeader: 'bearer',
    },
];

export interface CliTool {
    id: string;
    label: string;
    install: string;
    login: string;
    freeNote: string;
    docsUrl: string;
}

export const CLI_TOOLS: CliTool[] = [
    {
        id: 'gemini-cli',
        label: 'Gemini CLI',
        install: 'npm install -g @google/gemini-cli',
        login: 'gemini',
        freeNote: 'Google 계정 로그인 시 무료 한도 제공',
        docsUrl: 'https://github.com/google-gemini/gemini-cli',
    },
    {
        id: 'claude-code',
        label: 'Claude Code',
        install: 'npm install -g @anthropic-ai/claude-code',
        login: 'claude',
        freeNote: 'Claude 구독 또는 API 크레딧 필요 (무료 아님)',
        docsUrl: 'https://docs.claude.com/en/docs/claude-code',
    },
    {
        id: 'codex-cli',
        label: 'Codex CLI',
        install: 'npm install -g @openai/codex',
        login: 'codex',
        freeNote: 'ChatGPT 계정 또는 OpenAI API 키로 로그인',
        docsUrl: 'https://github.com/openai/codex',
    },
    {
        id: 'qwen-code',
        label: 'Qwen Code',
        install: 'npm install -g @qwen-code/qwen-code',
        login: 'qwen',
        freeNote: 'Qwen OAuth 로그인 시 무료 한도 제공',
        docsUrl: 'https://github.com/QwenLM/qwen-code',
    },
    {
        id: 'opencode',
        label: 'OpenCode',
        install: 'npm install -g opencode-ai',
        login: 'opencode auth login',
        freeNote: '위 무료 제공자 키(Groq, OpenRouter 등)를 연결해 사용',
        docsUrl: 'https://opencode.ai/docs',
    },
];

export interface ProviderTestResult {
    success: boolean;
    message: string;
}

export const testProviderConnection = async (provider: FreeProvider, key: string): Promise<ProviderTestResult> => {
    try {
        const res = await fetch(provider.testUrl, { headers: { Authorization: `Bearer ${key}` } });
        if (res.ok) return { success: true, message: `${provider.label} 연결에 성공했습니다.` };
        if (res.status === 401 || res.status === 403) {
            return { success: false, message: `${provider.label} 키가 유효하지 않습니다. (${res.status})` };
        }
        return { success: false, message: `${provider.label} 서버가 오류를 반환했습니다. (${res.status})` };
    } catch {
        return { success: false, message: `${provider.label}에 연결할 수 없습니다. 네트워크 또는 CORS 설정을 확인하세요.` };
    }
};

export const CUSTOM_SERVER_URL_NAME = 'CUSTOM_SERVER_URL';
export const CUSTOM_SERVER_KEY_NAME = 'CUSTOM_SERVER_KEY';

// Ollama, LM Studio, vLLM 등 OpenAI 호환 자체 서버. 키는 선택 사항이다.
export const CUSTOM_SERVER_PRESETS = [
    { label: 'Ollama', url: 'http://localhost:11434/v1' },
    { label: 'LM Studio', url: 'http://localhost:1234/v1' },
    { label: 'vLLM', url: 'http://localhost:8000/v1' },
];

export const testCustomServer = async (baseUrl: string, key?: string): Promise<ProviderTestResult> => {
    const url = `${baseUrl.replace(/\/+$/, '')}/models`;
    try {
        const res = await fetch(url, key ? { headers: { Authorization: `Bearer ${key}` } } : undefined);
        if (res.ok) return { success: true, message: '자체 서버 연결에 성공했습니다.' };
        return { success: false, message: `자체 서버가 오류를 반환했습니다. (${res.status})` };
    } catch {
        return { success: false, message: '자체 서버에 연결할 수 없습니다. 서버 실행 여부와 CORS 허용(Ollama는 OLLAMA_ORIGINS)을 확인하세요.' };
    }
};
