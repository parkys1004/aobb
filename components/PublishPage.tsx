import React, { useEffect, useMemo, useState } from 'react';
import type { GeneratedContent } from '../types';
import { listPosts, SavedPost } from '../services/postStorage';
import { buildHtmlWithImages, buildHtmlWithoutImages, countCharsNoSpaces } from '../utils/publishHtml';
import { NaverPublishModal } from './NaverPublishModal';
import { TistoryPublishModal } from './TistoryPublishModal';
import { PageHeader } from './ui';
import { Icon } from './Icon';

interface Source {
  id: string;
  title: string;
  subtitle: string;
  content: GeneratedContent;
  thumbnail: string | null;
}

const CURRENT_ID = 'current';

// 방금 만든 글과 저장해 둔 글을 불러와 네이버 블로그·티스토리에 발행하는 화면.
export const PublishPage: React.FC<{
  currentContent: GeneratedContent | null;
  currentTitle: string;
  currentThumbnail: string | null;
}> = ({ currentContent, currentTitle, currentThumbnail }) => {
  const [saved, setSaved] = useState<SavedPost[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(currentContent ? CURRENT_ID : null);
  const [naverOpen, setNaverOpen] = useState(false);
  const [tistoryOpen, setTistoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPosts().then(setSaved).catch(e => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const sources = useMemo<Source[]>(() => {
    const list: Source[] = [];
    if (currentContent) {
      list.push({
        id: CURRENT_ID,
        title: currentContent.supplementaryInfo.seoTitles?.[0] || currentTitle || '제목 없음',
        subtitle: '방금 생성한 글 (저장 전)',
        content: currentContent,
        thumbnail: currentThumbnail,
      });
    }
    (saved ?? []).forEach(post => list.push({
      id: post.id,
      title: post.title,
      subtitle: new Date(post.savedAt).toLocaleString('ko-KR'),
      content: post.content,
      thumbnail: post.thumbnailDataUrl,
    }));
    return list;
  }, [currentContent, currentTitle, currentThumbnail, saved]);

  const selected = sources.find(s => s.id === selectedId) ?? null;
  const previewHtml = useMemo(
    () => (selected ? buildHtmlWithImages(selected.content).replace(/<script[\s\S]*?<\/script>/gi, '') : ''),
    [selected]
  );
  const charCount = useMemo(() => (selected ? countCharsNoSpaces(previewHtml) : 0), [selected, previewHtml]);
  const imageSrc = (s: Source): string | null =>
    s.thumbnail ?? (s.content.imageBase64 ? `data:image/jpeg;base64,${s.content.imageBase64}` : null);
  const imageCount = selected
    ? (selected.content.imageBase64 ? 1 : 0) + (selected.content.subImages?.filter(i => i.base64).length ?? 0)
    : 0;

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8">
      <PageHeader title="발행" description="만들어 둔 글을 불러와 네이버 블로그와 티스토리에 발행합니다." />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div className="panel p-3">
          <h2 className="px-2 pb-2 pt-1 text-sm font-semibold text-fg">발행할 글 선택</h2>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto">
            {error && <p className="px-2 text-sm text-accent">{error}</p>}
            {!saved && !error && <p className="px-2 text-sm text-muted">불러오는 중...</p>}
            {saved && sources.length === 0 && (
              <p className="px-2 py-4 text-sm text-muted">발행할 글이 없습니다. 글 만들기에서 글을 만든 뒤 저장해 주세요.</p>
            )}
            {sources.map(source => {
              const active = source.id === selectedId;
              const src = imageSrc(source);
              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedId(source.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${active ? 'border-accent bg-raised' : 'border-line bg-bg hover:border-strong'}`}
                >
                  {src ? (
                    <img src={src} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-20 shrink-0 rounded bg-raised" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{source.title}</span>
                    <span className="block truncate text-xs text-muted">{source.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel min-w-0 p-5">
          {!selected ? (
            <p className="py-16 text-center text-sm text-muted">왼쪽에서 발행할 글을 선택해 주세요.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                {imageSrc(selected) && (
                  <img src={imageSrc(selected)!} alt="" className="hidden h-20 w-36 shrink-0 rounded-lg object-cover sm:block" />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-fg">{selected.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    글자수(공백제외) {charCount.toLocaleString()}자 · 이미지 {imageCount}장
                  </p>
                  <p className="mt-1 truncate text-xs text-accent">{selected.content.supplementaryInfo.keywords.join(', ')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setNaverOpen(true)} className="btn btn-primary">
                  <Icon icon="upload" className="h-4 w-4" />네이버 블로그 발행
                </button>
                <button onClick={() => setTistoryOpen(true)} className="btn btn-primary">
                  <Icon icon="upload" className="h-4 w-4" />티스토리 발행
                </button>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-fg">미리보기</h3>
                {/* sandbox 속성으로 스크립트 실행을 막은 채 본문만 보여 준다. */}
                <iframe title="발행 미리보기" sandbox="" srcDoc={previewHtml} className="h-[480px] w-full rounded-lg border border-line bg-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && naverOpen && (
        <NaverPublishModal
          onClose={() => setNaverOpen(false)}
          title={selected.title}
          html={buildHtmlWithImages(selected.content)}
          tags={selected.content.supplementaryInfo.keywords}
        />
      )}
      {selected && tistoryOpen && (
        <TistoryPublishModal
          onClose={() => setTistoryOpen(false)}
          title={selected.title}
          html={buildHtmlWithoutImages(selected.content)}
        />
      )}
    </div>
  );
};
