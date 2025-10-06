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
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@tanstack/react-query'],
            icons: ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      target: 'esnext',
      cssCodeSplit: true,
    },
    define: {
      // Ensure proper debugging environment
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
  };
});