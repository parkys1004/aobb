const ENDPOINT = 'https://api.blog.naver.com/xmlrpc';
const DATA_IMG_RE = /(<img\b[^>]*?\bsrc=")data:(image\/[\w.+-]+);base64,([A-Za-z0-9+/=]+)(")/gi;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const encodeValue = (v) => {
    if (typeof v === 'boolean') return `<value><boolean>${v ? 1 : 0}</boolean></value>`;
    if (typeof v === 'number') return `<value><int>${v}</int></value>`;
    if (Array.isArray(v)) return `<value><array><data>${v.map(encodeValue).join('')}</data></array></value>`;
    if (v && typeof v === 'object') {
        if (v.__base64) return `<value><base64>${v.__base64}</base64></value>`;
        const members = Object.entries(v).map(([k, val]) => `<member><name>${esc(k)}</name>${encodeValue(val)}</member>`);
        return `<value><struct>${members.join('')}</struct></value>`;
    }
    return `<value><string>${esc(v)}</string></value>`;
};

const buildCall = (method, params) =>
    `<?xml version="1.0" encoding="UTF-8"?><methodCall><methodName>${method}</methodName><params>${params
        .map((p) => `<param>${encodeValue(p)}</param>`)
        .join('')}</params></methodCall>`;

const decode = (s) =>
    s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const call = async (method, params) => {
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
        body: buildCall(method, params),
    });
    const text = await res.text();
    if (text.includes('<fault>')) {
        const msg = text.match(/<name>faultString<\/name>\s*<value>\s*(?:<string>)?([\s\S]*?)(?:<\/string>)?\s*<\/value>/);
        throw new Error(msg ? decode(msg[1].trim()) : '네이버 블로그 API 오류');
    }
    if (!res.ok) throw new Error(`네이버 블로그 API 응답 오류 (HTTP ${res.status})`);
    return text;
};

const uploadImages = async (blogId, password, html, onProgress) => {
    const matches = [...html.matchAll(DATA_IMG_RE)];
    const urls = [];
    for (let i = 0; i < matches.length; i++) {
        const [, , mime, b64] = matches[i];
        onProgress?.(`이미지 업로드 중 (${i + 1}/${matches.length})`);
        const ext = mime.split('/')[1].replace('jpeg', 'jpg').replace(/\+.*/, '');
        const out = await call('metaWeblog.newMediaObject', [
            blogId,
            blogId,
            password,
            { name: `image-${Date.now()}-${i + 1}.${ext}`, type: mime, bits: { __base64: b64 } },
        ]);
        const url = out.match(/<name>url<\/name>\s*<value>\s*(?:<string>)?([^<\s]+)/);
        if (!url) throw new Error('이미지 업로드 응답에서 URL을 찾지 못했습니다.');
        urls.push(decode(url[1]));
    }
    let idx = 0;
    return html.replace(DATA_IMG_RE, (_m, pre, _mime, _b64, post) => `${pre}${urls[idx++]}${post}`);
};

// 네이버 블로그 XML-RPC(MetaWeblog)로 글을 등록한다. password는 블로그 관리 > 글 작성 API 설정의 "API 연결 암호"다.
const publishPost = async ({ blogId, password, title, html, tags, publish }, onProgress) => {
    if (!blogId || !password) throw new Error('블로그 ID와 API 연결 암호를 입력해주세요.');
    const cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    const body = await uploadImages(blogId, password, cleaned, onProgress);
    onProgress?.('글 등록 중');
    const post = { title, description: body };
    if (tags && tags.length) post.tags = tags.join(',');
    const out = await call('metaWeblog.newPost', [blogId, blogId, password, post, publish !== false]);
    const postId = (out.match(/<string>([^<]+)<\/string>/) || out.match(/<int>(\d+)<\/int>/) || [])[1];
    return { postId, url: postId ? `https://blog.naver.com/${blogId}/${postId}` : `https://blog.naver.com/${blogId}` };
};

module.exports = { publishPost };
