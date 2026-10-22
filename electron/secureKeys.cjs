const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

const file = () => path.join(app.getPath('userData'), 'api-keys.bin');

// OS 계정(Windows DPAPI 등)에 묶인 키로 암호화해 userData에 저장한다. 비밀번호 입력이 필요 없다.
const load = () => {
    try {
        if (!fs.existsSync(file()) || !safeStorage.isEncryptionAvailable()) return null;
        return safeStorage.decryptString(fs.readFileSync(file()));
    } catch {
        return null;
    }
};

const save = (json) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('이 PC에서는 암호화 저장소를 사용할 수 없습니다.');
    fs.writeFileSync(file(), safeStorage.encryptString(json));
};

module.exports = { load, save };
