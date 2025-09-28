import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
          // UI component libraries  
          'ui-vendor': ['lucide-react', '@radix-ui/react-slot', '@radix-ui/react-toast'],
          
          // Map related libraries (largest dependencies)
          'map-vendor': ['leaflet'],
          
          // Supabase and auth
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Utility libraries
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority']
        }
      }
    },
    // Increase chunk size warning limit to reduce noise
    chunkSizeWarningLimit: 1000,
    // Optimize for production
    minify: 'esbuild',
  },
}));
