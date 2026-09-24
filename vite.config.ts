import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// React Fast Refresh uses an inline development preamble. Keep the strict
// production policy in the built HTML; only the local development server relaxes it.
const developmentCsp: Plugin = {
  name: 'tab-development-csp',
  apply: 'serve',
  transformIndexHtml(html) {

    return html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '<!-- Strict CSP is enabled in production builds. -->');

  },
};
export default defineConfig({
  base: process.env.VITE_BASE || './',
  plugins: [developmentCsp, react(), tailwindcss()],
  server: { watch: { ignored: ['**/.qa-preview/**', '**/test-results*/**', '**/playwright-report/**', '**/docs/qa/**', '**/episode/screenshots/**'] } },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022',
    // Keep font URLs same-origin under the strict production CSP.
    assetsInlineLimit: 0,
    manifest: true,
    sourcemap: false,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {

          // CommonJS interop is also used by React. Keep it out of lazy OCR.
          if (id.includes('commonjsHelpers')) return 'shared-runtime';

          if (id.includes('tesseract.js')) return 'ocr-engine';

          if (id.includes('canvas-confetti')) return 'celebration';

        },
      },
    },
  },
});
