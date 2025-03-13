import { defineConfig, loadEnv, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { Plugin } from 'vite'

// 基础配置
const createBaseConfig = (mode: string): UserConfig => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    build: {
      target: 'esnext',
      outDir: 'dist',
      assetsInlineLimit: 4096,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              'lucide-react',
              'framer-motion',
              'react-hot-toast'
            ],
            'markdown-vendor': [
              'react-markdown',
              'rehype-raw',
              'rehype-prism-plus',
              'remark-gfm',
              'mermaid'
            ],
            'utils-vendor': [
              'zustand',
              'lodash-es',
              'date-fns'
            ],
            'api-vendor': ['@supabase/supabase-js']
          }
        }
      }
    },

    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      strictPort: false,
      host: true,
      hmr: {
        overlay: true
      },
      proxy: env.VITE_API_URL ? {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, '')
        }
      } : undefined
    },

    css: {
      modules: {
        scopeBehaviour: 'local' as const,
        generateScopedName: mode === 'production'
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]'
      },
      devSourcemap: true
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        '@supabase/supabase-js',
        'mermaid'
      ],
      exclude: [],
      force: true
    },

    base: mode === 'production' ? './' : '/',
    
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  }
}

// 分析插件配置
const getAnalyzePlugin = async (): Promise<Plugin> => {
  const { visualizer } = await import('rollup-plugin-visualizer')
  return visualizer({
    filename: './dist/stats.html',
    open: false,
    gzipSize: true,
    brotliSize: true
  }) as Plugin
}

// 导出配置
export default defineConfig(async ({ mode }) => {
  const config = createBaseConfig(mode)
  
  // 仅在分析模式下添加可视化插件
  if (mode === 'analyze') {
    const analyzePlugin = await getAnalyzePlugin()
    if (!config.plugins) {
      config.plugins = []
    }
    if (Array.isArray(config.plugins)) {
      config.plugins.push(analyzePlugin)
    }
  }

  return config
})