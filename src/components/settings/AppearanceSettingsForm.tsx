import { useState, useEffect } from 'react';
import { Save, Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore, ThemeMode, ThemeColor, ThemeSize } from '../../store/themeStore';

interface AppearanceSettingsFormProps {
  value: {
    theme: ThemeMode;
    primaryColor: ThemeColor;
    fontSize: ThemeSize;
    borderRadius: ThemeSize;
  };
  onSave: (value: any) => Promise<void>;
}

const THEME_OPTIONS = [
  { value: 'light', label: '浅色模式', icon: Sun },
  { value: 'dark', label: '深色模式', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
];

const COLOR_OPTIONS = [
  { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
  { value: 'purple', label: '紫色', class: 'bg-purple-500' },
  { value: 'green', label: '绿色', class: 'bg-green-500' },
  { value: 'red', label: '红色', class: 'bg-red-500' },
  { value: 'orange', label: '橙色', class: 'bg-orange-500' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
];

export const AppearanceSettingsForm = ({ value, onSave }: AppearanceSettingsFormProps) => {
  const [formData, setFormData] = useState(value);
  const [saving, setSaving] = useState(false);
  const { setTheme, setPrimaryColor, setFontSize, setBorderRadius } = useThemeStore();

  // 当表单数据变化时，立即应用主题预览
  useEffect(() => {
    setTheme(formData.theme);
    setPrimaryColor(formData.primaryColor);
    setFontSize(formData.fontSize);
    setBorderRadius(formData.borderRadius);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (themeValue: string) => {
    setFormData({ 
      ...formData, 
      theme: themeValue as ThemeMode
    });
  };

  const handleColorChange = (colorValue: string) => {
    setFormData({ 
      ...formData, 
      primaryColor: colorValue as ThemeColor
    });
  };

  const handleSizeChange = (sizeValue: string, type: 'fontSize' | 'borderRadius') => {
    setFormData({ 
      ...formData, 
      [type]: sizeValue as ThemeSize
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 主题模式选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          主题模式
        </label>
        <div className="grid grid-cols-3 gap-4">
          {THEME_OPTIONS.map(({ value: themeValue, label, icon: Icon }) => (
            <button
              key={themeValue}
              type="button"
              onClick={() => handleThemeChange(themeValue)}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                formData.theme === themeValue
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${
                formData.theme === themeValue
                  ? 'text-blue-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
              <span className={`text-sm ${
                formData.theme === themeValue
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 主题颜色选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          主题颜色
        </label>
        <div className="flex flex-wrap gap-4">
          {COLOR_OPTIONS.map(({ value: colorValue, label, class: bgClass }) => (
            <button
              key={colorValue}
              type="button"
              onClick={() => handleColorChange(colorValue)}
              className={`group relative rounded-full p-1 ${
                formData.primaryColor === colorValue
                  ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-blue-500'
                  : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${bgClass}`} />
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 字体大小选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          字体大小
        </label>
        <div className="flex space-x-4">
          {SIZE_OPTIONS.map(({ value: sizeValue, label }) => (
            <button
              key={sizeValue}
              type="button"
              onClick={() => handleSizeChange(sizeValue, 'fontSize')}
              className={`px-4 py-2 rounded-lg ${
                formData.fontSize === sizeValue
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 圆角大小选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          圆角大小
        </label>
        <div className="flex space-x-4">
          {SIZE_OPTIONS.map(({ value: sizeValue, label }) => (
            <button
              key={sizeValue}
              type="button"
              onClick={() => handleSizeChange(sizeValue, 'borderRadius')}
              className={`px-4 py-2 rounded-lg ${
                formData.borderRadius === sizeValue
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              保存更改
            </>
          )}
        </button>
      </div>
    </form>
  );
}; 