import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowBackIosNew, ArrowForwardIos, Event as EventIcon, Cake as CakeIcon, Architecture as ArchitectureIcon } from '@mui/icons-material';
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
        <Box sx={{ pt: { xs: 1.5, md: 2 }, px: { xs: 1.5, md: 2 }, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 800, color: '#C49A45', letterSpacing: -1, mb: 0 }}>
              {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
            </Typography>
            <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: theme.palette.text.secondary, fontWeight: 300, letterSpacing: 1, mb: 1.5 }}>
              {currentDate.getFullYear()}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
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
          <Box sx={{ display: 'flex', gap: 1 }}>
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
