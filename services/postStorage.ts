import type { ColorTheme, GeneratedContent } from '../types';

// IndexedDB is used because posts contain base64 images that exceed localStorage's ~5MB limit.
export interface SavedPost {
  id: string;
  title: string;
  topic: string;
  savedAt: number;
  theme: ColorTheme;
  content: GeneratedContent;
  thumbnailDataUrl: string | null;
}

const DB_NAME = 'blog-post-store';
const STORE = 'posts';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async <T,>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
};

export const savePost = async (input: Omit<SavedPost, 'id' | 'savedAt'>): Promise<SavedPost> => {
  const post: SavedPost = { ...input, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, savedAt: Date.now() };
  await run('readwrite', (s) => s.put(post));
  return post;
};

export const listPosts = async (): Promise<SavedPost[]> => {
  const posts = await run<SavedPost[]>('readonly', (s) => s.getAll());
  return posts.sort((a, b) => b.savedAt - a.savedAt);
};

export const deletePost = async (id: string): Promise<void> => {
  await run('readwrite', (s) => s.delete(id));
};

const EXPORT_FORMAT = 'blog-posts-export';

export const buildExportJson = (posts: SavedPost[]): string =>
  JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: Date.now(), posts }, null, 2);

const isValidPost = (p: any): p is SavedPost =>
  p &&
  typeof p === 'object' &&
  typeof p.title === 'string' &&
  p.content &&
  typeof p.content.blogPostHtml === 'string' &&
  p.content.supplementaryInfo &&
  typeof p.content.supplementaryInfo === 'object';

// Accepts an export bundle, a single post, or an array of posts. Returns the number imported.
export const importFromJson = async (text: string): Promise<number> => {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('올바른 JSON 파일이 아닙니다.');
  }
  const candidates: any[] = Array.isArray(data) ? data : Array.isArray(data?.posts) ? data.posts : [data];
  const valid = candidates.filter(isValidPost);
  if (valid.length === 0) throw new Error('가져올 수 있는 글이 없습니다. 이 앱에서 내보낸 파일인지 확인하세요.');

  for (const p of valid) {
    // New id so importing never overwrites an existing post.
    await savePost({
      title: p.title,
      topic: p.topic || '',
      theme: p.theme,
      content: p.content,
      thumbnailDataUrl: p.thumbnailDataUrl ?? null,
    });
  }
  return valid.length;
};
