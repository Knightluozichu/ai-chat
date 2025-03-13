import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      // 构建分析插件（仅在生产构建时启用）
      mode === 'production' && visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    build: {
      // 构建目标
      target: 'esnext',
      // 输出目录
      outDir: 'dist',
      // 小于此阈值的资源将被内联为 base64
      assetsInlineLimit: 4096,
      // 启用 gzip 压缩大小报告
      reportCompressedSize: true,
      // 禁用 brotli 压缩大小报告（可以减少构建时间）
      brotliSize: false,
      // 分块策略
      rollupOptions: {
        output: {
          // 静态资源分类打包
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          // 手动分块
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
      },
      // 调整 chunk 大小警告限制
      chunkSizeWarningLimit: 1000,
      // 生产环境移除 console 和 debugger
      minify: 'esbuild',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      // 启用 CSS 代码分割
      cssCodeSplit: true,
      // 构建缓存
      commonjsOptions: {
        include: [/node_modules/],
        extensions: ['.js', '.cjs'],
        // 启用缓存
        cache: true,
        // 排除不需要转换的模块
        exclude: ['node_modules/mermaid/**']
      }
    },

    // 开发服务器配置
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      strictPort: false,
      host: true,
      // 启用 HMR
      hmr: {
        overlay: true
      },
      // 代理配置
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      },
      // 开发服务器响应头
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    },

    preview: {
      port: 4173,
      host: true,
      strictPort: false
    },

    // 优化依赖预构建
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
      // 强制预构建这些依赖
      force: true,
      // 启用缓存
      cacheDir: 'node_modules/.vite'
    },

    // CSS 配置
    css: {
      modules: {
        scopeBehaviour: 'local',
        // 生成的类名格式
        generateScopedName: mode === 'production' 
          ? '[hash:base64:8]' 
          : '[name]__[local]__[hash:base64:5]'
      },
      // PostCSS 配置
      postcss: {
        plugins: [
          require('autoprefixer'),
          require('tailwindcss')
        ]
      },
      // 预处理器配置
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/styles/variables.scss";'
        }
      },
      // 是否生成 sourcemap
      devSourcemap: true
    },

    // 类型检查
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          jsx: 'preserve',
          jsxImportSource: 'react'
        }
      }
    },

    // 性能优化
    base: mode === 'production' ? './' : '/',
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  }
})