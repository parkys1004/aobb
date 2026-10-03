import React, { useState } from 'react';
import { getStoredApiKey, setStoredApiKey } from '../services/apiKeyStore';
import { DEFAULT_MODELS, ModelSettings, getModels, setStoredModels } from '../services/modelConfig';

const MODEL_FIELDS: { key: keyof ModelSettings; label: string }[] = [
  { key: 'text', label: '글 생성 모델' },
  { key: 'fast', label: '주제 추천 모델 (빠른 모델)' },
  { key: 'imagen', label: '이미지 모델 (Imagen)' },
  { key: 'geminiImage', label: '이미지 대체 모델 (Gemini)' },
];

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [key, setKey] = useState(getStoredApiKey());
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<ModelSettings>(getModels());

  const handleSave = () => {
    setStoredApiKey(key.trim());
    setStoredModels(models);
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white mb-1">설정</h2>
        <p className="text-gray-400 text-sm mb-4">
          Gemini API 키를 입력하세요. 키는 이 브라우저(localStorage)에만 저장됩니다.{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">키 발급받기</a>
        </p>
        <label className="block text-sm text-gray-300 mb-1" htmlFor="gemini-key">Gemini API Key</label>
        <div className="flex space-x-2">
          <input
            id="gemini-key"
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="AIza..."
            autoComplete="off"
            className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <button onClick={() => setShow(!show)} className="px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">
            {show ? '숨김' : '보기'}
          </button>
        </div>
        <h3 className="text-sm font-semibold text-white mt-6 mb-1">모델 설정</h3>
        <p className="text-gray-400 text-xs mb-3">모델이 404 오류를 내면 사용 가능한 모델명으로 바꾸세요. 비우면 기본값을 씁니다.</p>
        <div className="space-y-3">
          {MODEL_FIELDS.map(({ key: k, label }) => (
            <div key={k}>
              <label className="block text-xs text-gray-300 mb-1" htmlFor={`model-${k}`}>{label}</label>
              <input
                id={`model-${k}`}
                type="text"
                value={models[k]}
                onChange={(e) => { setModels({ ...models, [k]: e.target.value }); setSaved(false); }}
                placeholder={DEFAULT_MODELS[k]}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <button onClick={() => { setModels({ ...DEFAULT_MODELS }); setSaved(false); }} className="text-xs text-blue-400 underline">기본값으로 되돌리기</button>
        </div>
        <div className="flex justify-end space-x-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">닫기</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500">
            {saved ? '저장됨 ✓' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};
