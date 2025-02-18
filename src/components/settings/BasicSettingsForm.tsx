import { useState } from 'react';
import { Save } from 'lucide-react';

interface BasicSettingsFormProps {
  value: {
    title: string;
    description: string;
    logo?: string;
  };
  onSave: (value: any) => Promise<void>;
}

export const BasicSettingsForm = ({ value, onSave }: BasicSettingsFormProps) => {
  const [formData, setFormData] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label 
          htmlFor="title" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          网站标题
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label 
          htmlFor="description" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          网站描述
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label 
          htmlFor="logo" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Logo URL
        </label>
        <input
          type="url"
          id="logo"
          value={formData.logo || ''}
          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
          placeholder="https://example.com/logo.png"
        />
        {formData.logo && (
          <div className="mt-2">
            <img
              src={formData.logo}
              alt="Logo 预览"
              className="h-12 w-auto object-contain"
            />
          </div>
        )}
      </div>

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