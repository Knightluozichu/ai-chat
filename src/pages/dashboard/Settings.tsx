import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BasicSettingsForm } from '../../components/settings/BasicSettingsForm';
import { AppearanceSettingsForm } from '../../components/settings/AppearanceSettingsForm';

type SettingCategory = 'basic' | 'ai' | 'appearance' | 'email';

interface SystemSetting {
  key: string;
  value: any;
  type: string;
  category: SettingCategory;
  description: string;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('basic');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category');

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      setError('获取设置失败');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (category: SettingCategory, value: any) => {
    try {
      const updates = Object.entries(value).map(([key, val]) => ({
        key,
        value: val,
        category
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) throw error;

      await fetchSettings();
    } catch (err) {
      setError('保存设置失败');
      console.error('Error saving settings:', err);
      throw err;
    }
  };

  const getCategorySettings = (category: SettingCategory) => {
    const categorySettings = settings.filter(s => s.category === category);
    return categorySettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, any>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* 侧边导航 */}
        <nav className="w-full md:w-64 space-y-1">
          {['basic', 'ai', 'appearance', 'email'].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category as SettingCategory)}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeCategory === category
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {category === 'basic' && '基本设置'}
              {category === 'ai' && 'AI 助手'}
              {category === 'appearance' && '外观'}
              {category === 'email' && '邮件通知'}
            </button>
          ))}
        </nav>

        {/* 主要内容区域 */}
        <div className="flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {activeCategory === 'basic' && (
              <BasicSettingsForm
                value={getCategorySettings('basic')}
                onSave={(value) => handleSaveSettings('basic', value)}
              />
            )}
            {activeCategory === 'appearance' && (
              <AppearanceSettingsForm
                value={{
                  theme: getCategorySettings('appearance').theme || 'system',
                  primaryColor: getCategorySettings('appearance').primaryColor || 'blue',
                  fontSize: getCategorySettings('appearance').fontSize || 'medium',
                  borderRadius: getCategorySettings('appearance').borderRadius || 'medium'
                }}
                onSave={(value) => handleSaveSettings('appearance', value)}
              />
            )}
            {/* 其他类别的设置表单将在后续添加 */}
            {!['basic', 'appearance'].includes(activeCategory) && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                该类别的设置正在开发中...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 