import { useEffect, useState } from "react";

export type Theme = "auto" | "light" | "dark";

const KEY = "gptpark.blog.theme";

export function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

/** auto 는 data-theme 를 지워서 시스템 설정(prefers-color-scheme)을 따른다. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      if (theme === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      /* 저장 실패는 무시 */
    }
  }, [theme]);

  return [theme, setTheme];
}
