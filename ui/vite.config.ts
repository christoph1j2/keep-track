import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/keep-track/' : '/',
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the service worker when a new version is available
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'KeepTrack - Osobní finance',
        short_name: 'KeepTrack',
        description: 'Sledujte své příjmy a výdaje, nastavujte rozpočty a plánujte své finance s KeepTrack.',
        theme_color: '#1E3A8A',
        background_color: '#1E3A8A',
        display: 'standalone', // spustí aplikaci v samostatném okně bez prohlížečových prvků
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' // Důležité pro Android, aby si mohl ikonu oříznout do kruhu/čtverce
          }
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png', // Můžeš pak vyměnit za reálný screen aplikace
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide', // Pro desktop
            label: 'KeepTrack Desktop'
          },
          {
            src: 'pwa-512x512.png', // Můžeš pak vyměnit za reálný screen z mobilu
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow', // Pro mobil
            label: 'KeepTrack Mobile'
          }
        ]
      },
      devOptions: {
        enabled: true, // Povolit PWA funkce i v developmentu pro testování
      }
    })
  ],
}))
