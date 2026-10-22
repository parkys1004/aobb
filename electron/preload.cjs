const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blogPublisher', {
    publishNaver: (payload) => ipcRenderer.invoke('naver-blog:publish', payload),
    onProgress: (cb) => {
        const handler = (_e, message) => cb(message);
        ipcRenderer.on('naver-blog:progress', handler);
        return () => ipcRenderer.removeListener('naver-blog:progress', handler);
    },
});

contextBridge.exposeInMainWorld('secureKeys', {
    load: () => ipcRenderer.invoke('secure-keys:load'),
    save: (json) => ipcRenderer.invoke('secure-keys:save', json),
});
