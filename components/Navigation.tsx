import type { ReactNode } from "react";
import {
  BookOpenText,
  Desktop,
  FloppyDisk,
  Key,
  Moon,
  PaperPlaneTilt,
  PencilSimpleLine,
  Question,
  Sun,
  TrendUp,
} from "@phosphor-icons/react";
import type { Theme } from "@/lib/theme";
import { ICON } from "@/components/ui";

export type Page = "create" | "trends" | "saved" | "publish" | "keys" | "help";

export const NAV: { id: Page; label: string; icon: ReactNode }[] = [
  { id: "create", label: "글 만들기", icon: <PencilSimpleLine {...ICON} /> },
  { id: "trends", label: "트렌드", icon: <TrendUp {...ICON} /> },
  { id: "saved", label: "저장한 글", icon: <FloppyDisk {...ICON} /> },
  { id: "publish", label: "발행", icon: <PaperPlaneTilt {...ICON} /> },
  { id: "keys", label: "API 키", icon: <Key {...ICON} /> },
  { id: "help", label: "사용법", icon: <Question {...ICON} /> },
];

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const THEMES: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: "auto", label: "시스템", icon: <Desktop size={16} /> },
  { value: "light", label: "라이트", icon: <Sun size={16} /> },
  { value: "dark", label: "다크", icon: <Moon size={16} /> },
];

/** 데스크톱 왼쪽 사이드바: 주요 메뉴와 테마. */
export function Sidebar({ page, onNavigate, theme, onThemeChange }: SidebarProps) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col overflow-y-auto border-r border-line bg-panel lg:flex">
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-onaccent">
          <BookOpenText size={20} weight="bold" />
        </span>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">올인원 블로깅</div>
          <div className="text-xs text-muted">AI 블로그 어시스턴트</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3" aria-label="주요 메뉴">
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition ${
                active
                  ? "bg-raised font-medium text-fg"
                  : "text-muted hover:bg-raised/60 hover:text-fg"
              }`}
            >
              <span className={active ? "text-accent" : ""}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-5 border-t border-line px-5 py-5">
        <div>
          <div className="label">화면 테마</div>
          <div className="seg" role="group" aria-label="화면 테마">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => onThemeChange(t.value)}
                aria-pressed={theme === t.value}
                title={t.label}
                aria-label={t.label}
                className="seg-item flex items-center justify-center px-0"
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-faint">Made by 5barTV</p>
      </div>
    </aside>
  );
}

/** 모바일 하단 탭바. */
export function BottomNav({
  page,
  onNavigate,
  theme,
  onThemeChange,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}) {
  const next: Theme = theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
  return (
    <nav
      aria-label="주요 메뉴"
      className="grid shrink-0 grid-cols-7 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {NAV.map((item) => {
        const active = page === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] transition ${
              active ? "text-fg" : "text-muted"
            }`}
          >
            <span className={active ? "text-accent" : ""}>{item.icon}</span>
            {item.label}
          </button>
        );
      })}
      <button
        onClick={() => onThemeChange(next)}
        aria-label="화면 테마 바꾸기"
        className="flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted transition"
      >
        {THEMES.find((t) => t.value === theme)?.icon}
        {THEMES.find((t) => t.value === theme)?.label}
      </button>
    </nav>
  );
}
