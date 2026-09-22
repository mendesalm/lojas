import React, { useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Cake as CakeIcon, Gavel as GavelIcon, Event as EventIcon, AllInclusive as WeddingIcon, Architecture as ArchitectureIcon } from '@mui/icons-material';
import type { CalendarEvent } from '../services/dashboardService';
import { EVENT_COLORS, normalizeEventType } from '../constants/LodgeDashboardConstants';

interface LodgeCommemorativeEventsWidgetProps {
  commemorativeEvents: CalendarEvent[];
  currentDate: Date;
  canManageLodge?: boolean;
}

const LodgeCommemorativeEventsWidget: React.FC<LodgeCommemorativeEventsWidgetProps> = ({ commemorativeEvents, currentDate, canManageLodge }) => {
    const theme = useTheme();
    const COLORS = {
        cardBg: theme.palette.background.paper,
        gold: theme.palette.mode === 'dark' ? '#C49A45' : '#B8860B',
        goldGradient: theme.palette.mode === 'dark' ? 'linear-gradient(180deg, #DDB96B 0%, #B8862D 100%)' : 'linear-gradient(180deg, #F2D06B 0%, #D4AF37 100%)',
        textPrimary: theme.palette.text.primary,
        textSecondary: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        blueHighlight: theme.palette.mode === 'dark' ? '#528BC2' : '#1976d2'
    };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find the index of the first event that is today or in the future
  let targetIndex = -1;
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  
  if (commemorativeEvents && commemorativeEvents.length > 0) {
      for (let i = 0; i < commemorativeEvents.length; i++) {
          const parts = commemorativeEvents[i].full_date.split('-');
          const eventMonth = parseInt(parts[1], 10);
          const eventDay = parseInt(parts[2], 10);
          if (eventMonth > currentMonth || (eventMonth === currentMonth && eventDay >= currentDay)) {
              targetIndex = i;
              break;
          }
      }
  }

  useEffect(() => {
      if (targetIndex >= 0 && itemRefs.current[targetIndex]) {
          setTimeout(() => {
              itemRefs.current[targetIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
      }
  }, [targetIndex, commemorativeEvents]);

  return (
    <Card sx={{
      bgcolor: COLORS.cardBg,
      color: theme.palette.text.primary,
      borderRadius: '8px',
      border: `1px solid ${COLORS.borderColor}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      flexGrow: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }}>
      <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        
        <Box sx={{ p: 2.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography sx={{ fontFamily: '"Inter", sans-serif', color: COLORS.gold, fontSize: '1.2rem', fontWeight: 500 }}>
                Datas Comemorativas
            </Typography>
            
            <Box sx={{ 
                width: 48, 
                height: 48, 
                border: `1px solid rgba(196, 154, 69, 0.3)`, 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <CakeIcon sx={{ color: COLORS.gold, fontSize: 28 }} />
            </Box>
        </Box>

        <List disablePadding sx={{ overflowY: 'auto', flexGrow: 1, px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {commemorativeEvents && commemorativeEvents.length > 0 ? (
            commemorativeEvents.map((event, idx) => {
              const dateParts = event.full_date.split('-');
              const formattedDate = `${dateParts[2]}/${dateParts[1]}`;
              const isToday = parseInt(dateParts[1], 10) === (today.getMonth() + 1) && parseInt(dateParts[2], 10) === today.getDate();
              const displayType = normalizeEventType(event.type);

              let IconComponent = EventIcon;
              let typeColor = EVENT_COLORS[event.type] || COLORS.gold;

              if (['Elevação', 'Iniciação', 'Exaltação'].includes(displayType)) {
                IconComponent = ArchitectureIcon;
              } else if (displayType.includes('Aniversário') && !displayType.includes('Casamento')) {
                IconComponent = CakeIcon;
              } else if (displayType === 'Casamento' || displayType.includes('Casamento')) {
                IconComponent = WeddingIcon;
                typeColor = '#e81cff'; 
              } else if (displayType === 'Instalação') {
                IconComponent = GavelIcon;
              }
              const personName = event.title;

              return (
                <Box 
                  key={idx} 
                  sx={{ width: '100%' }}
                  ref={(el: HTMLDivElement | null) => {
                    itemRefs.current[idx] = el;
                  }}
                >
                  <ListItem disablePadding sx={{
                    alignItems: 'flex-start',
                    px: 1,
                    py: 1,
                    ...(isToday && {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: '8px',
                    })
                  }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ color: typeColor, fontWeight: 700, fontSize: '0.85rem', minWidth: '40px' }}>
                          {formattedDate}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                          <IconComponent sx={{ fontSize: 16, color: typeColor }} />
                        </Box>
                        <Typography sx={{ color: typeColor, fontWeight: 600, fontSize: '0.85rem' }}>
                          {displayType}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem', pl: 0 }}>
                        {personName}
                      </Typography>
                    </Box>
                  </ListItem>
                </Box>
              );
            })
          ) : (
            <ListItem sx={{ p: 1 }}>
              <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.85rem' }}>
                Nenhuma data em {capitalizedMonth}
              </Typography>
            </ListItem>
          )}
        </List>
      </CardContent>

      {/* Buttons area */}
      {canManageLodge && (
          <Box sx={{ display: 'flex', gap: 1.5, p: 2.5, pt: 0, justifyContent: 'center' }}>
              <Button 
                  variant="contained" 
                  onClick={() => {}}
                  sx={{ 
                      flex: 1, 
                      background: COLORS.goldGradient,
                      color: '#1A1D23',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontFamily: '"Inter", sans-serif',
                      boxShadow: 'none',
                      '&:hover': {
                          background: COLORS.goldGradient,
                          opacity: 0.9,
                          boxShadow: '0 2px 10px rgba(196,154,69,0.3)'
                      }
                  }}
              >
                  Editar
              </Button>
          </Box>
      )}
    </Card>
  );
};

export default LodgeCommemorativeEventsWidget;
