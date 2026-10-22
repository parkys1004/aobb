import React, { useEffect, useState } from 'react';

interface BlogPublisherBridge {
  publishNaver: (payload: {
    blogId: string;
    password: string;
    title: string;
    html: string;
    tags: string[];
    publish: boolean;
  }) => Promise<{ ok: true; postId?: string; url: string } | { ok: false; error: string }>;
  onProgress: (cb: (message: string) => void) => () => void;
}

const getBridge = (): BlogPublisherBridge | undefined =>
  (window as unknown as { blogPublisher?: BlogPublisherBridge }).blogPublisher;

const BLOG_ID_STORAGE_KEY = 'gptpark_naver_blog_id';

// API 연결 암호는 비밀이므로 디스크에 남기지 않고 앱이 켜져 있는 동안 메모리에만 둔다.
let sessionPassword = '';

const readBlogId = (): string => {
  try {
    return localStorage.getItem(BLOG_ID_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const NaverPublishModal: React.FC<{
  onClose: () => void;
  title: string;
  html: string;
  tags: string[];
}> = ({ onClose, title: initialTitle, html, tags }) => {
  const [blogId, setBlogId] = useState(readBlogId);
  const [password, setPassword] = useState(sessionPassword);
  const [title, setTitle] = useState(initialTitle);
  const [asDraft, setAsDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const bridge = getBridge();

  useEffect(() => bridge?.onProgress(setProgress), [bridge]);

  const handlePublish = async () => {
    if (!bridge) return;
    setError(null);
    setResultUrl(null);
    setBusy(true);
    sessionPassword = password;
    try {
      localStorage.setItem(BLOG_ID_STORAGE_KEY, blogId.trim());
    } catch {
      // 저장할 수 없으면 이번 입력값만 사용한다.
    }
    const res = await bridge.publishNaver({
      blogId: blogId.trim(),
      password: password.trim(),
      title: title.trim() || '제목 없음',
      html,
      tags,
      publish: !asDraft,
    });
    setBusy(false);
    setProgress(null);
    if ('error' in res) setError(res.error);
    else setResultUrl(res.url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={busy ? undefined : onClose}>
      <div className="bg-panel border border-line rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-fg">네이버 블로그에 등록</h2>
          <button onClick={onClose} disabled={busy} className="text-muted hover:text-fg text-2xl leading-none" aria-label="닫기">×</button>
        </div>

        {!bridge ? (
          <p className="text-sm text-muted">
            이 기능은 데스크톱 앱(Electron)에서만 사용할 수 있습니다. 브라우저에서는 네이버 서버의 CORS 제한으로 등록할 수 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted">
              네이버 블로그 관리 &gt; 메뉴·글·동영상 관리 &gt; 글 작성 API 설정에서 <b>API 연결 암호</b>를 발급받아 입력하세요.
              암호는 이 앱을 닫으면 사라집니다.
            </p>
            <div>
              <label htmlFor="naver-blog-id" className="block text-sm font-medium text-muted mb-1">블로그 ID</label>
              <input id="naver-blog-id" className="field" value={blogId} onChange={(e) => setBlogId(e.target.value)} placeholder="blog.naver.com/ 뒤의 아이디" />
            </div>
            <div>
              <label htmlFor="naver-blog-pw" className="block text-sm font-medium text-muted mb-1">API 연결 암호</label>
              <input id="naver-blog-pw" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="naver-blog-title" className="block text-sm font-medium text-muted mb-1">제목</label>
              <input id="naver-blog-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={asDraft} onChange={(e) => setAsDraft(e.target.checked)} />
              비공개로 등록 (확인 후 직접 공개)
            </label>

            {error && <p className="text-sm text-accent whitespace-pre-wrap">{error}</p>}
            {busy && progress && <p className="text-sm text-muted">{progress}...</p>}
            {resultUrl && (
              <p className="text-sm text-accent">
                등록되었습니다 ✓{' '}
                <a href={resultUrl} target="_blank" rel="noreferrer" className="underline">글 보기</a>
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={onClose} disabled={busy} className="btn btn-secondary">닫기</button>
              <button onClick={handlePublish} disabled={busy || !blogId.trim() || !password.trim()} className="btn btn-primary">
                {busy ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
