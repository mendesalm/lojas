import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Porta fixa (2026-09-22): ecossistema Sigma divide portas frontends fixas:
    // - e-Sigma Frontend: 5173
    // - CoReVM Frontend: 5174
    // - Lojas Frontend: 5175
    // Com strictPort: true, se a 5175 estiver ocupada o Vite falha explicitamente
    // em vez de subir silenciosamente em outra porta e gerar conflito com os outros módulos.
    port: 5175,
    strictPort: true,
    host: true,
  },
})
