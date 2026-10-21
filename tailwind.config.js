/** @type {import('tailwindcss').Config} */
// 색은 전부 CSS 변수(src/index.css)에서 오고, 다크/라이트는 변수 값만 바뀐다.
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./utils/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: c("bg"),
        panel: c("panel"),
        raised: c("raised"),
        line: c("line"),
        strong: c("line-strong"),
        fg: c("fg"),
        muted: c("muted"),
        faint: c("faint"),
        placeholder: c("placeholder"),
        accent: c("accent"),
        onaccent: c("on-accent"),
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', "Pretendard", '"Malgun Gothic"', "system-ui", "sans-serif"],
        korean: ['"Pretendard Variable"', "Pretendard", '"Malgun Gothic"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
