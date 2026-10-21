import React, { useEffect, useRef, useState } from 'react';
import { useApiKey, useExtraKeys } from '../services/apiKeyStore';
import {
    FREE_PROVIDERS, CLI_TOOLS, CUSTOM_SERVER_PRESETS, CUSTOM_SERVER_URL_NAME, CUSTOM_SERVER_KEY_NAME,
    testProviderConnection, testCustomServer,
} from '../services/providers';
import { useLlmSettings, GEMINI_PROVIDER_ID, CUSTOM_PROVIDER_ID, getDefaultModel } from '../services/llmSettings';
import { encryptKeys, decryptKeys, saveVaultToLocalDrive, loadVaultFromLocalDrive } from '../utils/keyVault';
import { testGeminiConnection, ConnectionTestResult } from '../services/geminiService';
import { UsagePanel } from './UsagePanel';
import { Icon } from './Icon';

const GEMINI_KEY_NAME = 'GEMINI_API_KEY';

type Status = { type: 'success' | 'error'; message: string } | null;

const ConnectionTestModal: React.FC<{ onClose: () => void; onTest: () => Promise<ConnectionTestResult> }> = ({ onClose, onTest }) => {
    const [result, setResult] = useState<ConnectionTestResult | 'loading'>('loading');
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        onTest().then(setResult);
    }, [onTest]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70] p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Icon icon="bolt" className="w-5 h-5 text-blue-400" />Gemini API 연결 테스트</h3>
                {result === 'loading' ? (
                    <div className="flex flex-col items-center space-y-3 py-4">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-300 text-sm">API 서버에 연결하는 중입니다...</p>
                    </div>
                ) : (
                    <div className="py-2">
                        <Icon icon={result.success ? 'check-circle' : 'x-circle'} className={`w-10 h-10 mx-auto mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`} />
                        <p className="text-slate-200 text-sm">{result.message}</p>
                    </div>
                )}
                <button onClick={onClose} className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors text-sm">
                    닫기
                </button>
            </div>
        </div>
    );
};

export const ApiKeyManagerPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [sessionApiKey, setSessionApiKey] = useApiKey();
    const [inputKey, setInputKey] = useState(sessionApiKey ?? '');
    const [showKey, setShowKey] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [status, setStatus] = useState<Status>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const { activeProvider, modelOverrides, setActiveProvider, setModelOverride } = useLlmSettings();
    const [extraKeys, setExtraKeys] = useExtraKeys();
    const [extraInputs, setExtraInputs] = useState<Record<string, string>>(extraKeys);
    const [rowTests, setRowTests] = useState<Record<string, string>>({});
    const [copied, setCopied] = useState<string | null>(null);

    // 입력 즉시 세션에 반영해 저장 버튼을 누르기 전에도 글 생성에 쓸 수 있게 한다. (파일 저장은 별도)
    const setExtraInput = (name: string, value: string) => {
        const next = { ...extraInputs, [name]: value };
        setExtraInputs(next);
        setExtraKeys(next);
    };

    const runRowTest = async (id: string, run: () => Promise<{ success: boolean; message: string }>) => {
        setRowTests(prev => ({ ...prev, [id]: '테스트 중...' }));
        const result = await run();
        setRowTests(prev => ({ ...prev, [id]: `${result.success ? '성공' : '실패'}: ${result.message}` }));
    };

    const copyCommand = async (id: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            // 클립보드 권한이 없으면 사용자가 직접 선택해 복사한다.
        }
    };

    const handleSaveAndTest = async () => {
        if (!inputKey.trim()) {
            setStatus({ type: 'error', message: 'API 키를 입력해주세요.' });
            return;
        }
        if (passphrase.length < 4) {
            setStatus({ type: 'error', message: '암호화에 사용할 비밀번호를 4자 이상 입력해주세요.' });
            return;
        }
        setIsBusy(true);
        setStatus(null);
        try {
            setSessionApiKey(inputKey.trim());
            setExtraKeys(extraInputs);
            const vault = await encryptKeys({ [GEMINI_KEY_NAME]: inputKey.trim(), ...extraInputs }, passphrase);
            const result = await saveVaultToLocalDrive(vault);
            if (result === 'saved') {
                setStatus({ type: 'success', message: '로컬 드라이브에 암호화된 키 파일로 저장했습니다.' });
                setIsTestModalOpen(true);
            }
        } catch (error) {
            setStatus({ type: 'error', message: error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.' });
        } finally {
            setIsBusy(false);
        }
    };

    const handleLoad = async () => {
        if (passphrase.length < 4) {
            setStatus({ type: 'error', message: '파일을 저장할 때 사용했던 비밀번호를 입력해주세요.' });
            return;
        }
        setIsBusy(true);
        setStatus(null);
        try {
            const vault = await loadVaultFromLocalDrive();
            if (!vault) {
                setIsBusy(false);
                return;
            }
            const keys = await decryptKeys(vault, passphrase);
            const loadedKey = keys[GEMINI_KEY_NAME];
            if (!loadedKey) {
                throw new Error('선택한 파일에 Gemini API 키가 없습니다.');
            }
            setInputKey(loadedKey);
            setSessionApiKey(loadedKey);
            const { [GEMINI_KEY_NAME]: _gemini, ...loadedExtras } = keys;
            setExtraInputs(loadedExtras);
            setExtraKeys(loadedExtras);
            setStatus({ type: 'success', message: '키 파일을 불러와 이 세션에 적용했습니다.' });
        } catch (error) {
            setStatus({ type: 'error', message: error instanceof Error ? error.message : '불러오기 중 오류가 발생했습니다.' });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
                <div className="bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full mx-auto">
                    <div className="p-6 border-b border-slate-700 flex items-center gap-4">
                        <button onClick={onBack} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-slate-200 text-sm">← 돌아가기</button>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon icon="key" className="w-6 h-6 text-blue-400" />API 키 · 모델 설정</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <p className="text-slate-400 text-sm">
                            API 키는 앱 빌드에 내장되지 않고 이 브라우저 세션에만 임시로 보관됩니다. 계속 사용하려면 아래에서 로컬 드라이브에 암호화하여 저장한 뒤, 다음에 방문했을 때 불러와주세요.
                        </p>

                        <div className="bg-gray-900 rounded-md p-3 space-y-2">
                            <label className="block text-sm font-bold text-white">글 생성에 사용할 제공자</label>
                            <select
                                value={activeProvider}
                                onChange={e => setActiveProvider(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={GEMINI_PROVIDER_ID}>Gemini (기본 · 이미지 생성 지원)</option>
                                {FREE_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                                <option value={CUSTOM_PROVIDER_ID}>자체 서버</option>
                            </select>
                            {activeProvider !== GEMINI_PROVIDER_ID && (
                                <>
                                    <input
                                        type="text"
                                        value={modelOverrides[activeProvider] ?? ''}
                                        onChange={e => setModelOverride(activeProvider, e.target.value)}
                                        placeholder={activeProvider === CUSTOM_PROVIDER_ID ? '모델 이름 (필수, 예: llama3.1)' : `모델 이름 (비우면 기본값: ${getDefaultModel(activeProvider)})`}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-amber-400">
                                        Gemini 외 제공자는 글·주제 생성만 지원합니다. 이미지 생성은 Gemini 키가 있을 때만 동작하고, 없으면 건너뜁니다. 롱테일 주제 추천의 구글 검색도 Gemini에서만 사용됩니다.
                                    </p>
                                </>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Gemini API 키</label>
                            <div className="flex gap-2">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={inputKey}
                                    onChange={e => setInputKey(e.target.value)}
                                    placeholder="AIza..."
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="button" onClick={() => setShowKey(v => !v)} className="px-3 bg-gray-700 hover:bg-gray-600 rounded-md text-slate-300 text-xs">
                                    {showKey ? '숨기기' : '표시'}
                                </button>
                            </div>
                        </div>


                        <div className="pt-2 border-t border-slate-700 space-y-3">
                            <h3 className="text-sm font-bold text-white">무료 API 제공자</h3>
                            {FREE_PROVIDERS.map(provider => (
                                <div key={provider.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <label className="text-sm font-medium text-slate-300">{provider.label}</label>
                                        <a href={provider.keyUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">키 발급 ↗</a>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type={showKey ? 'text' : 'password'}
                                            value={extraInputs[provider.vaultName] ?? ''}
                                            onChange={e => setExtraInput(provider.vaultName, e.target.value)}
                                            placeholder={provider.placeholder}
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            disabled={!extraInputs[provider.vaultName]?.trim()}
                                            onClick={() => runRowTest(provider.id, () => testProviderConnection(provider, extraInputs[provider.vaultName].trim()))}
                                            className="px-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-md text-slate-300 text-xs"
                                        >
                                            테스트
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{provider.note}</p>
                                    {rowTests[provider.id] && <p className="text-xs text-slate-300 mt-1">{rowTests[provider.id]}</p>}
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-slate-700 space-y-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Icon icon="server" className="w-4 h-4" />자체 서버 (OpenAI 호환)</h3>
                            <div className="flex flex-wrap gap-2">
                                {CUSTOM_SERVER_PRESETS.map(preset => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => setExtraInput(CUSTOM_SERVER_URL_NAME, preset.url)}
                                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-slate-300"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={extraInputs[CUSTOM_SERVER_URL_NAME] ?? ''}
                                onChange={e => setExtraInput(CUSTOM_SERVER_URL_NAME, e.target.value)}
                                placeholder="http://localhost:11434/v1"
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={extraInputs[CUSTOM_SERVER_KEY_NAME] ?? ''}
                                    onChange={e => setExtraInput(CUSTOM_SERVER_KEY_NAME, e.target.value)}
                                    placeholder="API 키 (필요한 경우에만)"
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="button"
                                    disabled={!extraInputs[CUSTOM_SERVER_URL_NAME]?.trim()}
                                    onClick={() => runRowTest('custom', () => testCustomServer(extraInputs[CUSTOM_SERVER_URL_NAME].trim(), extraInputs[CUSTOM_SERVER_KEY_NAME]?.trim()))}
                                    className="px-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 rounded-md text-slate-300 text-xs"
                                >
                                    테스트
                                </button>
                            </div>
                            {rowTests.custom && <p className="text-xs text-slate-300">{rowTests.custom}</p>}
                        </div>

                        <div className="pt-2 border-t border-slate-700 space-y-3">
                            <h3 className="text-sm font-bold text-white">⌨️ CLI 도구 안내</h3>
                            <p className="text-xs text-slate-500">브라우저 앱에서는 CLI를 직접 실행할 수 없어 터미널에서 설치·로그인 명령을 복사해 사용합니다.</p>
                            {CLI_TOOLS.map(cli => (
                                <div key={cli.id} className="bg-gray-900 rounded-md p-3 space-y-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm font-medium text-slate-200">{cli.label}</span>
                                        <a href={cli.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">문서 ↗</a>
                                    </div>
                                    <p className="text-xs text-slate-500">{cli.freeNote}</p>
                                    {[{ key: `${cli.id}-install`, text: cli.install }, { key: `${cli.id}-login`, text: cli.login }].map(cmd => (
                                        <div key={cmd.key} className="flex items-center gap-2">
                                            <code className="flex-1 text-xs text-green-300 bg-black/40 rounded px-2 py-1 overflow-x-auto whitespace-nowrap">{cmd.text}</code>
                                            <button type="button" onClick={() => copyCommand(cmd.key, cmd.text)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-slate-300">
                                                {copied === cmd.key ? '복사됨' : '복사'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">암호화 비밀번호 (저장·불러오기 시 사용)</label>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={e => setPassphrase(e.target.value)}
                                placeholder="4자 이상 입력"
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {status && (
                            <p className={`text-sm rounded-md px-3 py-2 ${status.type === 'success' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                                {status.message}
                            </p>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleSaveAndTest}
                                disabled={isBusy}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2.5 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon icon="lock" className="w-4 h-4" />로컬 드라이브에 암호화 저장 &amp; 연결 테스트
                            </button>
                            <button
                                onClick={handleLoad}
                                disabled={isBusy}
                                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white font-semibold py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <Icon icon="folder-open" className="w-4 h-4" />저장된 키 파일 불러오기
                            </button>
                        </div>

                        <div className="pt-2 border-t border-slate-700">
                            <UsagePanel />
                        </div>
                    </div>
                </div>
            </div>

            {isTestModalOpen && (
                <ConnectionTestModal
                    onClose={() => setIsTestModalOpen(false)}
                    onTest={() => testGeminiConnection(inputKey)}
                />
            )}
        </>
    );
};
