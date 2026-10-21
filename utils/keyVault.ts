const PBKDF2_ITERATIONS = 250_000;
const VAULT_FILENAME = 'gptpark-api-keys.vault.json';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface EncryptedVaultFile {
    version: 1;
    createdAt: string;
    salt: string;
    iv: string;
    ciphertext: string;
}

const toBase64 = (bytes: ArrayBuffer | Uint8Array): string => {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = '';
    for (let i = 0; i < view.byteLength; i++) {
        binary += String.fromCharCode(view[i]);
    }
    return btoa(binary);
};

const fromBase64 = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

const deriveKey = async (passphrase: string, salt: Uint8Array): Promise<CryptoKey> => {
    const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

// 사용자가 지정한 비밀번호로부터 파생한 AES-256-GCM 키로 API 키 목록을 암호화한다.
// 원문 API 키는 이 함수를 벗어나 브라우저 저장소(localStorage 등)에 남지 않는다.
export const encryptKeys = async (keys: Record<string, string>, passphrase: string): Promise<EncryptedVaultFile> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const plaintext = textEncoder.encode(JSON.stringify(keys));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext);

    return {
        version: 1,
        createdAt: new Date().toISOString(),
        salt: toBase64(salt),
        iv: toBase64(iv),
        ciphertext: toBase64(ciphertext),
    };
};

export const decryptKeys = async (file: EncryptedVaultFile, passphrase: string): Promise<Record<string, string>> => {
    const salt = fromBase64(file.salt);
    const iv = fromBase64(file.iv);
    const key = await deriveKey(passphrase, salt);
    try {
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, fromBase64(file.ciphertext));
        return JSON.parse(textDecoder.decode(plaintext));
    } catch {
        throw new Error('복호화에 실패했습니다. 비밀번호를 확인해주세요.');
    }
};

interface FileSystemFileHandleLike {
    createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
    getFile(): Promise<File>;
}

interface WindowWithFilePicker extends Window {
    showSaveFilePicker?: (options?: unknown) => Promise<FileSystemFileHandleLike>;
    showOpenFilePicker?: (options?: unknown) => Promise<FileSystemFileHandleLike[]>;
}

const isUserCancelled = (error: unknown): boolean =>
    error instanceof DOMException && error.name === 'AbortError';

// 가능하면 OS 저장 대화상자(File System Access API)로 사용자가 직접 저장 위치를 고르게 하고,
// 지원하지 않는 브라우저에서는 다운로드 폴더로 저장되는 방식으로 대체한다.
export const saveVaultToLocalDrive = async (file: EncryptedVaultFile): Promise<'saved' | 'cancelled'> => {
    const json = JSON.stringify(file, null, 2);
    const win = window as WindowWithFilePicker;

    if (typeof win.showSaveFilePicker === 'function') {
        try {
            const handle = await win.showSaveFilePicker({
                suggestedName: VAULT_FILENAME,
                types: [{ description: 'GPT PARK 암호화 키 파일', accept: { 'application/json': ['.json'] } }],
            });
            const writable = await handle.createWritable();
            await writable.write(json);
            await writable.close();
            return 'saved';
        } catch (error) {
            if (isUserCancelled(error)) return 'cancelled';
            throw error;
        }
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = VAULT_FILENAME;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    return 'saved';
};

export const loadVaultFromLocalDrive = async (): Promise<EncryptedVaultFile | null> => {
    const win = window as WindowWithFilePicker;

    if (typeof win.showOpenFilePicker === 'function') {
        try {
            const [handle] = await win.showOpenFilePicker({
                types: [{ description: 'GPT PARK 암호화 키 파일', accept: { 'application/json': ['.json'] } }],
                multiple: false,
            });
            const fileObj = await handle.getFile();
            const text = await fileObj.text();
            return JSON.parse(text) as EncryptedVaultFile;
        } catch (error) {
            if (isUserCancelled(error)) return null;
            throw error;
        }
    }

    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = () => {
            const selected = input.files?.[0];
            if (!selected) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    resolve(JSON.parse(reader.result as string) as EncryptedVaultFile);
                } catch {
                    reject(new Error('올바른 키 파일 형식이 아닙니다.'));
                }
            };
            reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
            reader.readAsText(selected);
        };
        input.click();
    });
};
