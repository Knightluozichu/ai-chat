import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'chat': ['./src/components/ChatMessages.tsx'],
          'auth': ['./src/components/Auth.tsx'],
          'sidebar': ['./src/components/ChatSidebar.tsx'],
          'icons': ['./src/components/icons.ts']
        }
      }
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    warmup: {
      clientFiles: [
        './src/App.tsx',
        './src/components/Auth.tsx',
        './src/components/ChatSidebar.tsx'
      ]
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});