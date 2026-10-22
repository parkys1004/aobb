const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const { publishPost } = require('./naverBlog.cjs');
const secureKeys = require('./secureKeys.cjs');

const DEV_SERVER_URL = process.env.ELECTRON_DEV_SERVER_URL;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 960,
        minHeight: 640,
        title: '올인원 블로깅',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // 키 발급·문서 링크 등 외부 주소는 앱 창 대신 기본 브라우저로 연다.
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:/i.test(url)) shell.openExternal(url);
        return { action: 'deny' };
    });

    if (DEV_SERVER_URL) {
        win.loadURL(DEV_SERVER_URL);
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
};

ipcMain.handle('secure-keys:load', () => secureKeys.load());
ipcMain.handle('secure-keys:save', (_event, json) => {
    try {
        secureKeys.save(String(json));
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
});

ipcMain.handle('naver-blog:publish', async (event, payload) => {
    try {
        const result = await publishPost(payload, (message) => event.sender.send('naver-blog:progress', message));
        return { ok: true, ...result };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
});

app.whenReady().then(() => {
    if (!DEV_SERVER_URL) Menu.setApplicationMenu(null);
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
