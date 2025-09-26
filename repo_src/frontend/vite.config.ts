import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  plugins: [
    react(),
    // PWA plugin temporarily disabled to fix build issues
    // To re-enable: uncomment and install vite-plugin-pwa
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173, // Default Vite port
    host: true, // Allow access from network
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
}); 