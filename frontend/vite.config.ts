import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      '@schema': fileURLToPath(new URL('./src/schema', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  build: {
    rollupOptions: {
      // Silence noisy Next.js-style "use client" module-level directive warnings.
      onwarn(warning, defaultHandler) {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          typeof warning.message === 'string' &&
          warning.message.includes("'use client'")
        ) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
});
