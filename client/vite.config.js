import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // avendo molte dipendenze pesanti, vite fa il pre-building di tutte le dipendenze ad ogni avvio, rallentando l'avvio dell'applicazione - per evitare questo si usa optimizeDeps force false
  optimizeDeps: {
    force: false 
  }
})
