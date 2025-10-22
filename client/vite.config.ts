import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173, // Explicitly set the port
      host: true, // Allow external connections
      open: false, // Don't auto-open browser (let debugger handle it)
      proxy: {
        '/api': {
          target: 'http://localhost:10112',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: '../server/public', // Build to server public directory
      sourcemap: false, // Disable source maps for production
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            // Enhanced chunk splitting for better caching
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@tanstack/react-query'],
            icons: ['lucide-react'],
            radix: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-progress', '@radix-ui/react-slot', '@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/react-tooltip'],
            utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
            i18n: ['react-i18next', 'i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
            charts: ['recharts'],
            // Remove date-fns from manual chunks to avoid initialization issues
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      target: 'esnext',
      cssCodeSplit: true,
      // Enhanced build optimizations
      reportCompressedSize: true,
      assetsInlineLimit: 4096,
    },
    define: {
      // Ensure proper debugging environment
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      // Define environment variables for production build
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || 'https://mnemine-fanp.onrender.com'),
      'import.meta.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || 'wss://mnemine-fanp.onrender.com/ws'),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(process.env.VITE_APP_NAME || 'FastMine'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION || '1.0.0'),
      'import.meta.env.VITE_ADMIN_TELEGRAM_IDS': JSON.stringify(process.env.VITE_ADMIN_TELEGRAM_IDS || '6760298907'),
    },
    // Enhanced optimization settings
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'date-fns',
      ],
    },
    // Enhanced CSS optimization
    css: {
      devSourcemap: false,
    },
  };
});