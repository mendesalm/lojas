/**
 * Utilitário centralizado para resolução dinâmica de URLs da API em runtime.
 * Suporta perfeitamente:
 * 1. Variáveis de ambiente Vite (.env / VITE_LOJAS_API_URL / VITE_ESIGMA_API_URL)
 * 2. Detecção automática de ambiente em produção (domínio *.e-sigma.app)
 * 3. Fallback para localhost em desenvolvimento local
 */

export function obterUrlLojasApi(): string {
  if (import.meta.env.VITE_LOJAS_API_URL) {
    return import.meta.env.VITE_LOJAS_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('e-sigma.app')) {
    return '/api/v1';
  }
  return 'http://localhost:8001/api/v1';
}

export function obterUrlLojasBase(): string {
  if (typeof window !== 'undefined' && window.location.hostname.includes('e-sigma.app')) {
    return window.location.origin;
  }
  const api = obterUrlLojasApi();
  return api.replace(/\/api\/v1\/?$/, '');
}

export function obterUrlEsigmaApi(): string {
  if (import.meta.env.VITE_ESIGMA_API_URL) {
    return import.meta.env.VITE_ESIGMA_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('e-sigma.app')) {
    return 'https://e-sigma.app/api/v1';
  }
  return 'http://localhost:8000/api/v1';
}
