export const LODGE_DASHBOARD_CONSTANTS = {
  glassBgDark: '#151b26',
  glassBgLight: '#ffffff',
  glassBorderDark: 'rgba(212, 175, 55, 0.4)', // Golden border
  glassBorderLight: 'rgba(30, 136, 229, 0.2)', // Light blue border
};

export const getGlassStyles = (mode: 'light' | 'dark') => ({
  background: mode === 'dark' ? LODGE_DASHBOARD_CONSTANTS.glassBgDark : LODGE_DASHBOARD_CONSTANTS.glassBgLight,
  backdropFilter: 'none',
  border: `1px solid ${mode === 'dark' ? LODGE_DASHBOARD_CONSTANTS.glassBorderDark : LODGE_DASHBOARD_CONSTANTS.glassBorderLight}`,
  boxShadow: mode === 'dark' 
    ? '0 0 15px rgba(212, 175, 55, 0.15), inset 0 0 20px rgba(212, 175, 55, 0.05)'
    : '0 4px 20px rgba(0, 0, 0, 0.05)',
  borderRadius: 3,
});

export const ACCENT_COLOR = '#D4AF37'; // Tom dourado padrão maçônico

export const EVENT_COLORS: Record<string, string> = {
  'sessao': '#5B8FB9', // Azul Suave
  'evento': '#5B8FB9',
  'aniversario': '#81C784', // Verde Suave
  'aniversario_familiar': '#81C784',
  'casamento': '#e81cff',
  'iniciacao': '#9B72AA', // Púrpura Suave
  'elevacao': '#9B72AA',
  'exaltacao': '#9B72AA',
  'instalacao': '#D4AF37', // Dourado
};

export const normalizeEventType = (type: string): string => {
  if (!type) return '';
  const t = type.toLowerCase();
  if (t.includes('sessao') || t.includes('sessão')) return 'Sessão';
  if (t.includes('evento')) return 'Evento';
  if (t.includes('aniversario_familiar')) return 'Aniversário Familiar';
  if (t.includes('aniversário') || t.includes('aniversario')) return 'Aniversário';
  if (t.includes('casamento')) return 'Aniversário de Casamento';
  if (t.includes('iniciacao') || t.includes('iniciação')) return 'Iniciação';
  if (t.includes('elevacao') || t.includes('elevação')) return 'Elevação';
  if (t.includes('exaltacao') || t.includes('exaltação')) return 'Exaltação';
  if (t.includes('instalacao') || t.includes('instalação')) return 'Instalação';
  
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
};
