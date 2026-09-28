import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  Event as EventIcon,
  Cake as CakeIcon,
  Architecture as ArchitectureIcon,
  ViewList as ViewListIcon,
  CalendarMonth as CalendarMonthIcon,
  ChevronRight as ChevronRightIcon,
  AllInclusive as WeddingIcon
} from '@mui/icons-material';
import type { CalendarEvent } from '../services/dashboardService';
import { EVENT_COLORS, normalizeEventType, ACCENT_COLOR } from '../constants/LodgeDashboardConstants';

interface LodgeSessionsWidgetProps {
  currentDate: Date;
  daysInMonth: number;
  firstDayOfMonth: number;
  filteredEvents: CalendarEvent[];
  filters: {
    sessoes: boolean;
    aniversarios: boolean;
    maconicos: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    sessoes: boolean;
    aniversarios: boolean;
    maconicos: boolean;
  }>>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDayClick: (day: number) => void;
  canManageLodge?: boolean;
}

const LodgeSessionsWidget: React.FC<LodgeSessionsWidgetProps> = ({
  currentDate,
  daysInMonth,
  firstDayOfMonth,
  filteredEvents,
  filters,
  setFilters,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDayClick,
  canManageLodge
}) => {
  const theme = useTheme();

  // Alternador de visão responsivo: mobile inicia em lista para máximo conforto ergonômico
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'calendario'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'lista' : 'calendario';
  });

  // Lista de eventos ordenados por dia para visão em feed
  const eventosOrdenados = useMemo(() => {
    return [...filteredEvents].sort((a, b) => a.date - b.date);
  }, [filteredEvents]);

  const renderCalendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
    const borderCol = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const hoverBg = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

    // Empty cells for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ height: '100%', border: `1px solid ${borderCol}` }} />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const events = filteredEvents.filter(e => e.date === day);
      days.push(
        <Box
          key={day}
          onClick={() => onDayClick(day)}
          sx={{
            height: '100%',
            minHeight: '80px',
            border: isToday ? `1px solid ${ACCENT_COLOR}` : `1px solid ${borderCol}`,
            p: 1,
            position: 'relative',
            backgroundColor: isToday ? (theme.palette.mode === 'dark' ? 'rgba(163, 177, 198, 0.1)' : 'rgba(163, 177, 198, 0.15)') : 'transparent',
            '&:hover': { backgroundColor: hoverBg, cursor: 'pointer' },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Typography variant="caption" sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            color: isToday ? ACCENT_COLOR : theme.palette.text.secondary,
            fontSize: '0.8rem',
            fontFamily: '"Inter", sans-serif',
            fontWeight: isToday ? 700 : 400
          }}>
            {day.toString().padStart(2, '0')}
          </Typography>
          <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, overflowY: 'auto' }}>
            {events.map((event, idx) => (
              <Chip
                key={idx}
                label={normalizeEventType(event.title || event.type)}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  borderRadius: 4,
                  backgroundColor: event.type === 'sessao' ? 'info.main' : (EVENT_COLORS[event.type] || 'info.main'),
                  color: '#fff',
                  width: '100%',
                  justifyContent: 'flex-start',
                  px: 0.5,
                  '& .MuiChip-label': {
                    padding: 0,
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'left',
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      );
    }
    return days;
  }, [filteredEvents, currentDate, daysInMonth, firstDayOfMonth, onDayClick, theme]);

  return (
    <Card sx={{
      bgcolor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      borderRadius: '8px',
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ pt: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, pb: 1, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 1.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h3" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 800, color: '#C49A45', letterSpacing: -1, mb: 0 }}>
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                </Typography>
                <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: theme.palette.text.secondary, fontWeight: 300, letterSpacing: 1, mb: 1 }}>
                  {currentDate.getFullYear()}
                </Typography>
              </Box>

              {/* Alternador de Visão Lista / Mês */}
              <Box sx={{ display: 'flex', bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', p: 0.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Button
                  size="small"
                  onClick={() => setModoVisualizacao('lista')}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.5,
                    color: modoVisualizacao === 'lista' ? '#1A1D23' : theme.palette.text.secondary,
                    bgcolor: modoVisualizacao === 'lista' ? ACCENT_COLOR : 'transparent',
                    '&:hover': { bgcolor: modoVisualizacao === 'lista' ? ACCENT_COLOR : 'transparent' }
                  }}
                  startIcon={<ViewListIcon sx={{ fontSize: 16 }} />}
                >
                  Lista
                </Button>
                <Button
                  size="small"
                  onClick={() => setModoVisualizacao('calendario')}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.5,
                    color: modoVisualizacao === 'calendario' ? '#1A1D23' : theme.palette.text.secondary,
                    bgcolor: modoVisualizacao === 'calendario' ? ACCENT_COLOR : 'transparent',
                    '&:hover': { bgcolor: modoVisualizacao === 'calendario' ? ACCENT_COLOR : 'transparent' }
                  }}
                  startIcon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                >
                  Mês
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Chip
                label="Sessões"
                icon={<Box sx={{ display: 'flex', alignItems: 'center' }}><EventIcon sx={{ fontSize: 16 }} /><ArchitectureIcon sx={{ fontSize: 16, ml: -0.5 }} /></Box>}
                onClick={() => setFilters(prev => ({ ...prev, sessoes: !prev.sessoes }))}
                sx={{ borderRadius: 8, fontWeight: 700, px: 1, bgcolor: filters.sessoes ? '#5B8FB9' : theme.palette.action.selected, color: filters.sessoes ? '#fff' : theme.palette.text.secondary, border: 'none', '& .MuiChip-icon': { color: filters.sessoes ? '#fff' : 'inherit' } }}
              />
              <Chip
                label="Aniversários"
                icon={<CakeIcon sx={{ fontSize: 18 }} />}
                onClick={() => setFilters(prev => ({ ...prev, aniversarios: !prev.aniversarios }))}
                sx={{ borderRadius: 8, fontWeight: 700, px: 1, bgcolor: filters.aniversarios ? '#81C784' : theme.palette.action.selected, color: filters.aniversarios ? '#fff' : theme.palette.text.secondary, border: 'none', '& .MuiChip-icon': { color: filters.aniversarios ? '#fff' : 'inherit' } }}
              />
              <Chip
                label="Maçônicos"
                icon={<Box sx={{ display: 'flex', alignItems: 'center' }}><CakeIcon sx={{ fontSize: 16 }} /><ArchitectureIcon sx={{ fontSize: 16, ml: -0.5 }} /></Box>}
                onClick={() => setFilters(prev => ({ ...prev, maconicos: !prev.maconicos }))}
                sx={{ borderRadius: 8, fontWeight: 700, px: 1, bgcolor: filters.maconicos ? '#9B72AA' : theme.palette.action.selected, color: filters.maconicos ? '#fff' : theme.palette.text.secondary, border: 'none', '& .MuiChip-icon': { color: filters.maconicos ? '#fff' : 'inherit' } }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', sm: 'flex-start' } }}>
            <Button
              variant="outlined"
              onClick={onPrevMonth}
              sx={{ minWidth: 40, width: 40, height: 40, borderColor: theme.palette.divider, color: theme.palette.text.primary, borderRadius: 2 }}
            >
              <ArrowBackIosNew fontSize="small" />
            </Button>
            <Button
              variant="outlined"
              onClick={onToday}
              sx={{ height: 40, px: 2, borderColor: theme.palette.divider, color: ACCENT_COLOR, borderRadius: 2, fontWeight: 700, letterSpacing: 1, '&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(163, 177, 198, 0.1)' : 'rgba(163, 177, 198, 0.05)' } }}
            >
              HOJE
            </Button>
            <Button
              variant="outlined"
              onClick={onNextMonth}
              sx={{ minWidth: 40, width: 40, height: 40, borderColor: theme.palette.divider, color: theme.palette.text.primary, borderRadius: 2 }}
            >
              <ArrowForwardIos fontSize="small" />
            </Button>
          </Box>
        </Box>

        {modoVisualizacao === 'lista' ? (
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '520px' }}>
            {eventosOrdenados.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: theme.palette.text.secondary }}>
                <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>Nenhum evento neste mês</Typography>
                <Typography variant="caption">Ajuste os filtros de Sessões, Aniversários ou Maçônicos.</Typography>
              </Box>
            ) : (
              eventosOrdenados.map((event, idx) => {
                const dataObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), event.date);
                const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
                const corBadge = event.type === 'sessao' ? '#5B8FB9' : (EVENT_COLORS[event.type] || '#5B8FB9');

                return (
                  <Box
                    key={idx}
                    onClick={() => onDayClick(event.date)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                        borderColor: ACCENT_COLOR,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* Badge do Dia */}
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '10px',
                          bgcolor: theme.palette.mode === 'dark' ? '#0d131f' : '#f0f4f8',
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: ACCENT_COLOR, lineHeight: 1 }}>
                          {event.date.toString().padStart(2, '0')}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: theme.palette.text.secondary }}>
                          {diaSemana}
                        </Typography>
                      </Box>

                      {/* Informações do Evento */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label={normalizeEventType(event.title || event.type)}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: corBadge,
                              color: '#fff',
                              borderRadius: 4
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {event.title || 'Evento da Loja'}
                        </Typography>
                      </Box>
                    </Box>

                    <ChevronRightIcon sx={{ color: theme.palette.text.secondary }} />
                  </Box>
                );
              })
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', bgcolor: theme.palette.background.paper, py: 1, borderTop: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` }}>
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
                <Typography key={d} variant="caption" sx={{ textAlign: 'center', color: ACCENT_COLOR, fontWeight: 800, letterSpacing: 2 }}>
                  {d}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', flexGrow: 1, bgcolor: theme.palette.background.paper }}>
              {renderCalendarDays}
            </Box>
          </>
        )}
        
        {canManageLodge && (
          <Box sx={{ display: 'flex', gap: 1.5, p: 2.5, pt: 2, justifyContent: 'center', bgcolor: theme.palette.background.paper }}>
              <Button 
                  variant="contained" 
                  onClick={() => {}}
                  sx={{ 
                      flex: 1, 
                      maxWidth: '400px',
                      background: 'linear-gradient(180deg, #DDB96B 0%, #B8862D 100%)',
                      color: '#1A1D23',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontFamily: '"Inter", sans-serif',
                      boxShadow: 'none',
                      '&:hover': {
                          background: 'linear-gradient(180deg, #DDB96B 0%, #B8862D 100%)',
                          opacity: 0.9,
                          boxShadow: '0 2px 10px rgba(196,154,69,0.3)'
                      }
                  }}
              >
                  Editar Agenda
              </Button>
          </Box>
        )}

      </CardContent>
    </Card>
  );
};

export default LodgeSessionsWidget;
