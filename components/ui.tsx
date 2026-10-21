import type React from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowsInLineVertical,
  ArrowsOutLineVertical,
  CaretDown,
  CaretUp,
  CaretUpDown,
  X,
} from "@phosphor-icons/react";

export const ICON = { size: 18, weight: "regular" as const };

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  title?: string;
  ariaLabel: string;
}

/** 브라우저 기본 화살표 대신 아이콘 라이브러리의 캐럿을 쓰는 select. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  disabled,
  title,
  ariaLabel,
}: SelectProps<T>) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as T)}
        className="field appearance-none pr-9 disabled:opacity-40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <CaretUpDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}

interface SegmentedProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; hint?: string }[];
  ariaLabel: string;
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={value === o.value}
          title={o.hint}
          onClick={() => onChange(o.value)}
          className="seg-item"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: string }[];
  ariaLabel: string;
}

/** 밑줄형 탭. 좁은 화면에서는 가로로 스크롤된다. */
export function Tabs<T extends string>({ value, onChange, tabs, ariaLabel }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1"
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`-mb-px h-10 shrink-0 border-b-2 px-3 text-sm transition ${
            value === t.value
              ? "border-accent font-medium text-fg"
              : "border-transparent text-muted hover:text-fg"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-[60ch] text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-strong px-6 py-10">
      <span className="text-faint">{icon}</span>
      <div>
        <div className="font-medium">{title}</div>
        <p className="mt-1 max-w-[46ch] text-sm text-muted">{body}</p>
      </div>
      {action}
    </div>
  );
}

type ScrollTag = "div" | "main" | "section" | "pre";

interface ScrollAreaProps {
  children: ReactNode;
  /** 바깥 래퍼(위치, 크기, 반응형 표시 여부). 상하 버튼은 이 래퍼의 오른쪽 가운데에 붙는다. */
  className?: string;
  /** 접힌 상태일 때만 래퍼에 붙는 클래스(예: 화면에 고정하는 sticky). 펼치면 빠진다. */
  collapsedClassName?: string;
  /** 실제로 스크롤되는 요소의 클래스. */
  scrollClassName?: string;
  /** 접힌 상태일 때만 스크롤 요소에 붙는 높이 제한(max-h, overflow). 펼치면 빠져서 전체 높이가 된다. */
  limitClassName?: string;
  as?: ScrollTag;
  size?: "md" | "sm";
  ariaLabel?: string;
  /** 켜면 내용이 넘칠 때 "전체 펼치기" 버튼이 생기고, 펼치면 높이 제한이 풀려 전체 내용이 보인다. */
  expandable?: boolean;
  /** 영역을 클릭해도 펼치고 접는다(글자를 드래그해 선택하는 중이거나 버튼 등을 누를 때는 제외). */
  expandOnClick?: boolean;
  /** 펼치기 버튼 위치. 기본은 오른쪽 위. */
  togglePosition?: "top" | "bottom";
}

const INTERACTIVE = "button, a, input, textarea, select, summary, label, [role=tab], [role=checkbox]";

/**
 * 세로 스크롤 영역. 내용이 넘쳐서 스크롤바가 생기면 오른쪽 가운데에 위/아래 이동 버튼이 나타난다.
 * 버튼을 누르면 화면의 80% 만큼 부드럽게 이동하고, 맨 위/맨 아래에서는 해당 버튼이 비활성화된다.
 * expandable 이면 영역을 눌러(또는 펼치기 버튼으로) 높이 제한을 풀고 전체 내용을 볼 수 있다.
 */
export function ScrollArea({
  children,
  className = "",
  collapsedClassName = "",
  scrollClassName = "",
  limitClassName = "",
  as: Tag = "div",
  size = "md",
  ariaLabel,
  expandable = false,
  expandOnClick = true,
  togglePosition = "top",
}: ScrollAreaProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ scrollable: false, atTop: true, atBottom: true });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const scrollable = el.scrollHeight - el.clientHeight > 2;
      const atTop = el.scrollTop <= 1;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      setState((prev) =>
        prev.scrollable === scrollable && prev.atTop === atTop && prev.atBottom === atBottom
          ? prev
          : { scrollable, atTop, atBottom },
      );
    };

    el.addEventListener("scroll", update, { passive: true });
    // 영역 크기가 바뀌거나 내용 길이가 바뀌어도 스크롤 가능 여부를 다시 계산한다.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (contentRef.current) observer.observe(contentRef.current);
    update();
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function scrollPage(direction: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ top: direction * el.clientHeight * 0.8, behavior: reduce ? "auto" : "smooth" });
  }

  function handleClick(e: React.MouseEvent) {
    if (!expandable || !expandOnClick) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return; // 글자를 드래그해서 선택한 뒤의 클릭은 무시
    if (!expanded && !state.scrollable) return; // 펼칠 게 없으면 무시
    setExpanded((v) => !v);
  }

  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? 14 : 18;
  const buttonClass = `pointer-events-auto flex ${dim} items-center justify-center rounded-full border border-line bg-panel text-muted shadow-md transition hover:text-fg active:translate-y-px disabled:pointer-events-none disabled:opacity-30`;
  const showToggle = expandable && (state.scrollable || expanded);
  const clickable = expandable && expandOnClick && (state.scrollable || expanded);

  return (
    <div
      className={`relative ${className} ${expanded ? "" : collapsedClassName}`}
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel}
    >
      <Tag
        ref={scrollRef as never}
        className={`${scrollClassName} ${expanded ? "" : limitClassName} ${clickable ? "cursor-pointer" : ""}`}
        onClick={handleClick}
      >
        <div ref={contentRef}>{children}</div>
      </Tag>

      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={`absolute right-3 z-20 flex h-7 items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 text-xs text-muted shadow-md transition hover:text-fg active:translate-y-px ${
            togglePosition === "bottom" ? "bottom-3" : "top-2"
          }`}
        >
          {expanded ? <ArrowsInLineVertical size={14} /> : <ArrowsOutLineVertical size={14} />}
          {expanded ? "접기" : "전체 펼치기"}
        </button>
      )}

      {state.scrollable && !expanded && (
        <div className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => scrollPage(-1)}
            disabled={state.atTop}
            aria-label="위로 스크롤"
            title="위로 이동"
            className={buttonClass}
          >
            <CaretUp size={icon} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => scrollPage(1)}
            disabled={state.atBottom}
            aria-label="아래로 스크롤"
            title="아래로 이동"
            className={buttonClass}
          >
            <CaretDown size={icon} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

interface InfoDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

/** 안내문을 보여주는 큰 모달. 본문이 길면 안에서 스크롤되고, Esc 나 바깥 영역 클릭으로 닫힌다. */
export function InfoDialog({ open, title, children, onClose }: InfoDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        className="flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-xl border border-line bg-panel shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2 id="info-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="닫기"
            className="btn btn-ghost h-9 w-9 shrink-0 px-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        <div className="flex justify-end border-t border-line px-5 py-3 sm:px-6">
          <button onClick={onClose} className="btn btn-primary btn-sm">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

interface ExpandableTextareaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
  ariaLabel: string;
  id?: string;
}

/** 접힌 상태에서는 정해진 줄 수만 보이고, 펼치면 내용 전체가 보이도록 높이가 늘어나는 입력창. */
export function ExpandableTextarea({
  value,
  onChange,
  rows = 12,
  className = "",
  ariaLabel,
  id,
}: ExpandableTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (expanded) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
      setOverflowing(true);
    } else {
      el.style.height = "";
      setOverflowing(el.scrollHeight > el.clientHeight + 2);
    }
  }, [value, expanded]);

  return (
    <div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        aria-label={ariaLabel}
        className={`field resize-none ${expanded ? "overflow-hidden" : ""} ${className}`}
      />
      {(overflowing || expanded) && (
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="btn btn-ghost btn-sm"
          >
            {expanded ? <ArrowsInLineVertical size={14} /> : <ArrowsOutLineVertical size={14} />}
            {expanded ? "접기" : "전체 펼치기"}
          </button>
        </div>
      )}
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 되돌릴 수 없는 작업을 확인받는 모달. 취소 버튼에 먼저 포커스가 가고, Esc 나 바깥 영역 클릭으로 닫힌다.
 * (z-index 50 은 모달 전용 층이다.)
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel = "처리 중",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => previous?.focus?.();
  }, [open]);

  if (!open) return null;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !busy) {
      e.stopPropagation();
      onCancel();
    } else if (e.key === "Tab") {
      // 모달 밖으로 포커스가 나가지 않게 두 버튼 사이에서만 돈다.
      const first = cancelRef.current;
      const last = confirmRef.current;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-2xl"
      >
        <h2 id="confirm-title" className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <div className="mt-3 space-y-3 text-sm text-muted">{children}</div>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} onClick={onCancel} disabled={busy} className="btn btn-secondary">
            취소
          </button>
          <button ref={confirmRef} onClick={onConfirm} disabled={busy} className="btn btn-primary">
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
