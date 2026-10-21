const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

const DEV_SERVER_URL = process.env.ELECTRON_DEV_SERVER_URL;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 960,
        minHeight: 640,
        title: 'GPT Park 블로깅',
        autoHideMenuBar: true,
        webPreferences: {
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
