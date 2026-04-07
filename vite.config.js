import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sayva Toco',
        short_name: 'TocoApp',
        display: 'standalone',
        theme_color: '#f3f4f6',
        background_color: '#f3f4f6',
        icons: [],
      },
    }),
  ],
})
