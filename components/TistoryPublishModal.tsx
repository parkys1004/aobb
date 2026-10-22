import React, { useState } from 'react';

const BLOG_NAME_STORAGE_KEY = 'gptpark_tistory_blog_name';

const readBlogName = (): string => {
  try {
    return localStorage.getItem(BLOG_NAME_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

// 티스토리는 공식 글쓰기 API가 종료되어, 제목/본문을 클립보드에 복사하고 글쓰기 페이지를 열어 주는 방식으로 돕는다.
export const TistoryPublishModal: React.FC<{
  onClose: () => void;
  title: string;
  html: string;
}> = ({ onClose, title, html }) => {
  const [blogName, setBlogName] = useState(readBlogName);
  const [status, setStatus] = useState<string | null>(null);

  const name = blogName.trim().replace(/^https?:\/\//, '').replace(/\.tistory\.com.*$/, '');

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label}을(를) 복사했습니다 ✓`);
    } catch {
      setStatus('복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  const openEditor = async () => {
    try {
      localStorage.setItem(BLOG_NAME_STORAGE_KEY, name);
    } catch {
      // 저장할 수 없으면 이번 입력값만 사용한다.
    }
    await copy(html, 'HTML');
    window.open(`https://${name}.tistory.com/manage/newpost/`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-panel border border-line rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-fg">티스토리에 등록</h2>
          <button onClick={onClose} className="text-muted hover:text-fg text-2xl leading-none" aria-label="닫기">×</button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-muted">
            티스토리는 글 등록 API가 종료되어 자동 등록이 불가능합니다. 아래 순서로 직접 붙여넣어 주세요.
          </p>
          <ol className="text-sm text-muted list-decimal list-inside space-y-1">
            <li>블로그 이름을 입력하고 <b>HTML 복사 후 글쓰기 열기</b>를 누릅니다.</li>
            <li>에디터 우측 상단 <b>기본모드 &gt; HTML</b>로 전환합니다.</li>
            <li>본문에 붙여넣기(Ctrl+V)한 뒤 제목을 넣고 발행합니다.</li>
            <li>이미지는 결과 화면에서 다운로드해 에디터에 직접 첨부합니다.</li>
          </ol>
          <div>
            <label htmlFor="tistory-blog-name" className="block text-sm font-medium text-muted mb-1">블로그 이름</label>
            <div className="flex items-center gap-2">
              <input id="tistory-blog-name" className="field" value={blogName} onChange={(e) => setBlogName(e.target.value)} placeholder="myblog" />
              <span className="text-sm text-muted whitespace-nowrap">.tistory.com</span>
            </div>
          </div>

          {status && <p className="text-sm text-accent">{status}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <button onClick={() => copy(title, '제목')} disabled={!title} className="btn btn-secondary">제목 복사</button>
            <button onClick={() => copy(html, 'HTML')} className="btn btn-secondary">HTML 복사</button>
            <button onClick={openEditor} disabled={!name} className="btn btn-primary">HTML 복사 후 글쓰기 열기</button>
          </div>
        </div>
      </div>
    </div>
  );
};
