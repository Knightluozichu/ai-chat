// 动态导入图标
export const loadIcon = async (name: string) => {
  const icons = {
    'send': () => import('lucide-react/dist/esm/icons/send'),
    'log-out': () => import('lucide-react/dist/esm/icons/log-out'),
    'bot': () => import('lucide-react/dist/esm/icons/bot'),
    'message-square': () => import('lucide-react/dist/esm/icons/message-square'),
    'edit2': () => import('lucide-react/dist/esm/icons/edit-2'),
    'check': () => import('lucide-react/dist/esm/icons/check'),
    'x': () => import('lucide-react/dist/esm/icons/x'),
    'trash2': () => import('lucide-react/dist/esm/icons/trash-2'),
    'chevron-left': () => import('lucide-react/dist/esm/icons/chevron-left'),
    'chevron-right': () => import('lucide-react/dist/esm/icons/chevron-right'),
    'database': () => import('lucide-react/dist/esm/icons/database'),
    'upload': () => import('lucide-react/dist/esm/icons/upload'),
    'search': () => import('lucide-react/dist/esm/icons/search'),
    'file-text': () => import('lucide-react/dist/esm/icons/file-text'),
    'download': () => import('lucide-react/dist/esm/icons/download'),
    'loader2': () => import('lucide-react/dist/esm/icons/loader-2'),
    'alert-circle': () => import('lucide-react/dist/esm/icons/alert-circle'),
  };

  const loader = icons[name.toLowerCase()];
  if (!loader) {
    throw new Error(`Icon ${name} not found`);
  }

  const module = await loader();
  return module.default;
};