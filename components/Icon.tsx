import React from 'react';
import {
  ChartBar,
  Check,
  CheckCircle,
  Clipboard,
  Code,
  Eye,
  FileArrowUp,
  FolderOpen,
  HardDrives,
  Image,
  Key,
  Lightbulb,
  Lightning,
  LockKey,
  MagicWand,
  PencilSimple,
  Play,
  Sparkle,
  Star,
  UploadSimple,
  Warning,
  XCircle,
} from '@phosphor-icons/react';

const ICONS = {
  clipboard: Clipboard,
  check: Check,
  wand: MagicWand,
  code: Code,
  eye: Eye,
  lightbulb: Lightbulb,
  'document-arrow-up': FileArrowUp,
  sparkles: Sparkle,
  star: Star,
  photo: Image,
  key: Key,
  lock: LockKey,
  'folder-open': FolderOpen,
  'chart-bar': ChartBar,
  pencil: PencilSimple,
  warning: Warning,
  'x-circle': XCircle,
  'check-circle': CheckCircle,
  upload: UploadSimple,
  play: Play,
  server: HardDrives,
  bolt: Lightning,
} as const;

interface IconProps {
  icon: keyof typeof ICONS;
  className?: string;
}

/** 앱 전체에서 아이콘은 Phosphor 한 종류, regular 굵기로 통일한다. 크기는 className 의 w-/h- 로 정한다. */
export const Icon: React.FC<IconProps> = ({ icon, className = 'w-5 h-5' }) => {
  const Component = ICONS[icon];
  return <Component size="1em" weight="regular" className={className} aria-hidden="true" />;
};
