import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isAnalyze = mode === 'analyze';
  
  // Conditionally import dyadComponentTagger only in development
  const plugins = [react()];
  
  if (!isProduction) {
    try {
      const dyadComponentTagger = require("@dyad-sh/react-vite-component-tagger");
      plugins.unshift(dyadComponentTagger());
    } catch (e) {
      // Ignore if package is not available
      console.log("dyadComponentTagger not available, skipping...");
    }
  }
  
  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      host: true, // Allow external connections
      cors: true,
      hmr: {
        overlay: true,
      },
    },
    build: {
      target: 'es2015', // More compatible target
      minify: isProduction ? 'terser' : false, // Use terser instead of esbuild for better compatibility
      sourcemap: !isProduction,
      cssCodeSplit: false, // Disable CSS code splitting to avoid issues
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: isProduction ? (id) => {
            // Simplified chunking strategy for production
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-ui';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animations';
              }
              return 'vendor';
            }
          } : undefined,
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
        external: [], // No externals
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
      },
      chunkSizeWarningLimit: isProduction ? 1000 : 1000,
      reportCompressedSize: isProduction,
      // Simplified build optimizations
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: true,
      } : undefined,
      // Performance optimizations
      assetsInlineLimit: isProduction ? 4096 : 0,
      cssMinify: isProduction,
      modulePreload: {
        polyfill: false,
      },
    },
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'date-fns',
        'clsx',
        'tailwind-merge'
      ],
      exclude: ['@vite/client', '@vite/env'],
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          'dist/',
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    },
  };
});