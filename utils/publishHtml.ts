import type { GeneratedContent } from '../types';

const escapeAttr = (value: string): string => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const figure = (base64: string, alt: string): string =>
  `<figure style="margin: 25px 0;"><img src="data:image/jpeg;base64,${base64}" alt="${escapeAttr(alt)}" style="width: 100%; max-height: 400px; border-radius: 8px; object-fit: contain;"><figcaption style="text-align: center; font-size: 14px; color: #6c757d; margin-top: 8px;">${escapeAttr(alt)}</figcaption></figure>`;

// 이미지 자리표시자를 실제 <img>(data URL)로 채운 발행용 HTML. 네이버는 등록 시 이미지를 업로드해 주소로 바꾼다.
export const buildHtmlWithImages = (content: GeneratedContent): string => {
  let html = content.blogPostHtml;
  html = html.replace('<!--IMAGE_PLACEHOLDER-->', content.imageBase64 ? figure(content.imageBase64, content.supplementaryInfo.altText) : '');
  content.subImages?.forEach((image, index) => {
    html = html.replace(`<!--SUB_IMAGE_PLACEHOLDER_${index + 1}-->`, image.base64 ? figure(image.base64, image.altText) : '');
  });
  return html.replace(/<!--SUB_IMAGE_PLACEHOLDER_\d+-->/g, '');
};

// 이미지를 뺀 본문 HTML. 티스토리처럼 이미지를 직접 첨부하는 경우에 쓴다.
export const buildHtmlWithoutImages = (content: GeneratedContent): string =>
  content.blogPostHtml.replace('<!--IMAGE_PLACEHOLDER-->', '').replace(/<!--SUB_IMAGE_PLACEHOLDER_\d+-->/g, '');

export const countCharsNoSpaces = (html: string): number => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style').forEach(node => node.remove());
  return (doc.body.textContent || '').replace(/\s/g, '').length;
};
