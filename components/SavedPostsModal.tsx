import React, { useEffect, useRef, useState } from 'react';
import { SavedPost, buildExportJson, deletePost, importFromJson, listPosts } from '../services/postStorage';

const downloadJson = (filename: string, json: string) => {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const safeName = (title: string) => title.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || 'post';

export const SavedPostsModal: React.FC<{ onClose: () => void; onLoad: (post: SavedPost) => void }> = ({ onClose, onLoad }) => {
  const [posts, setPosts] = useState<SavedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => listPosts().then(setPosts).catch((e) => setError(String(e?.message || e)));
  useEffect(() => { refresh(); }, []);

  const handleDelete = async (post: SavedPost) => {
    if (!window.confirm(`"${post.title}" 글을 삭제할까요?`)) return;
    await deletePost(post.id);
    refresh();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    e.target.value = '';
    if (files.length === 0) return;
    setError(null);
    let total = 0;
    try {
      for (const file of files) total += await importFromJson(await file.text());
      setMessage(`${total}개의 글을 가져왔습니다.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    refresh();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-2xl p-6 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">저장된 글</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label="닫기">×</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-600">⬆ 파일에서 가져오기</button>
          <button
            onClick={() => posts && downloadJson(`blog-posts-${new Date().toISOString().slice(0, 10)}.json`, buildExportJson(posts))}
            disabled={!posts || posts.length === 0}
            className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⬇ 전체 내보내기
          </button>
          <input ref={fileInputRef} type="file" accept=".json,application/json" multiple className="hidden" onChange={handleImport} />
          {message && <span className="text-sm text-green-400 self-center">{message}</span>}
        </div>
        <div className="overflow-y-auto space-y-2">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!posts && !error && <p className="text-gray-400 text-sm">불러오는 중...</p>}
          {posts && posts.length === 0 && <p className="text-gray-400 text-sm">저장된 글이 없습니다.</p>}
          {posts?.map((post) => (
            <div key={post.id} className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-md p-3">
              {post.content.imageBase64 ? (
                <img src={`data:image/jpeg;base64,${post.content.imageBase64}`} alt="" className="w-20 h-12 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-20 h-12 bg-gray-700 rounded flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{post.title}</p>
                <p className="text-gray-400 text-xs">{new Date(post.savedAt).toLocaleString('ko-KR')}</p>
              </div>
              <button onClick={() => downloadJson(`${safeName(post.title)}.json`, buildExportJson([post]))} className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded hover:bg-gray-600">내보내기</button>
              <button onClick={() => { onLoad(post); onClose(); }} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500">불러오기</button>
              <button onClick={() => handleDelete(post)} className="px-3 py-1.5 text-sm bg-gray-700 text-red-300 rounded hover:bg-gray-600">삭제</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
