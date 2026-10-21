import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API 키는 더 이상 빌드 시점에 내장하지 않는다. 사용자가 앱 내 "API 키 관리" 팝업에서
// 직접 입력/로컬 암호화 파일 불러오기를 통해 런타임에 제공한다 (services/apiKeyStore.ts).
export default defineConfig(() => ({
    server: {
        port: 3000,
        host: '0.0.0.0',
    },
    base: './',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    }
}));
