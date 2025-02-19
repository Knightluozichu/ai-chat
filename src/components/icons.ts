// 动态导入图标
import { LucideIcon } from 'lucide-react';

type IconLoaderMap = {
  [key: string]: () => Promise<{ default: LucideIcon }>;
};

const icons: IconLoaderMap = {
  'send': () => import('lucide-react/dist/esm/icons/send'),
  'log-out': () => import('lucide-react/dist/esm/icons/log-out'),
  'bot': () => import('lucide-react/dist/esm/icons/bot'),
  'message-square': () => import('lucide-react/dist/esm/icons/message-square'),
  'plus': () => import('lucide-react/dist/esm/icons/plus'),
  'trash': () => import('lucide-react/dist/esm/icons/trash'),
  'edit': () => import('lucide-react/dist/esm/icons/edit'),
  'file-text': () => import('lucide-react/dist/esm/icons/file-text'),
  'chevron-right': () => import('lucide-react/dist/esm/icons/chevron-right'),
  'chevron-down': () => import('lucide-react/dist/esm/icons/chevron-down'),
  'folder': () => import('lucide-react/dist/esm/icons/folder'),
  'file': () => import('lucide-react/dist/esm/icons/file'),
  'alert-circle': () => import('lucide-react/dist/esm/icons/alert-circle'),
};

export async function loadIcon(name: string) {
  const normalizedName = name.toLowerCase();
  const loader = icons[normalizedName];
  if (!loader) {
    throw new Error(`Icon ${name} not found`);
  }
  const module = await loader();
  return module.default;
};