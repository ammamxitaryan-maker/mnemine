import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
            date: ['date-fns'],
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
      ],
    },
    // Enhanced CSS optimization
    css: {
      devSourcemap: false,
    },
  };
});