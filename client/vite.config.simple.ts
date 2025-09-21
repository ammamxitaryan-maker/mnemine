import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Ultra-simple config for debugging React error #310
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: false, // Disable minification completely
    sourcemap: true, // Enable sourcemaps for debugging
    cssCodeSplit: false,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // No manual chunks - let Vite handle it
        chunkFileNames: 'js/[name].js',
        entryFileNames: 'js/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
    chunkSizeWarningLimit: 5000,
    reportCompressedSize: false,
    assetsInlineLimit: 0, // Don't inline assets
    cssMinify: false,
    modulePreload: false,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
    ],
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
