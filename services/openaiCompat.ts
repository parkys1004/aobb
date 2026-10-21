import type { ChatEndpoint } from './llmSettings';

interface ChatRequest {
    prompt: string;
    json: boolean;
    temperature?: number;
}

const post = (endpoint: ChatEndpoint, body: Record<string, unknown>) =>
    fetch(`${endpoint.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(endpoint.key ? { Authorization: `Bearer ${endpoint.key}` } : {}),
        },
        body: JSON.stringify(body),
    });

// 모델이 ```json 펜스로 감싸 답하는 경우가 있어 JSON.parse 전에 벗겨낸다.
export const stripJsonFence = (text: string): string => {
    const trimmed = text.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenced ? fenced[1] : trimmed;
};

export const chatCompletion = async (endpoint: ChatEndpoint, { prompt, json, temperature }: ChatRequest): Promise<string> => {
    const body: Record<string, unknown> = {
        model: endpoint.model,
        messages: [{ role: 'user', content: prompt }],
        ...(temperature !== undefined ? { temperature } : {}),
    };

    let res: Response;
    try {
        res = await post(endpoint, json ? { ...body, response_format: { type: 'json_object' } } : body);
        // 일부 제공자·모델은 response_format을 지원하지 않아 400을 돌려준다. 프롬프트의 JSON 지시만으로 한 번 더 시도한다.
        if (json && res.status === 400) {
            res = await post(endpoint, body);
        }
    } catch {
        throw new Error(`${endpoint.label}에 연결할 수 없습니다. 네트워크 또는 CORS 설정을 확인해주세요.`);
    }

    if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        if (res.status === 429) {
            throw new Error(`${endpoint.label}의 무료 요청 한도를 초과했습니다. 잠시 후 다시 시도하거나 다른 제공자를 선택해주세요. (429)`);
        }
        if (res.status === 401 || res.status === 403) {
            throw new Error(`${endpoint.label} API 키가 유효하지 않습니다. (${res.status})`);
        }
        throw new Error(`${endpoint.label} 오류 (${res.status}): ${detail}`);
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error(`${endpoint.label}가 빈 응답을 반환했습니다.`);
    }
    return json ? stripJsonFence(content) : content;
};
