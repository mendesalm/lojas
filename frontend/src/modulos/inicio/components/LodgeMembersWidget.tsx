import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { DashboardStats } from '../services/dashboardService';
import MembersSvg from '@/assets/icons/members.svg';

interface LodgeMembersWidgetProps {
    stats: DashboardStats | null;
    onClick: () => void;
    canManageLodge?: boolean;
}

const LodgeMembersWidget: React.FC<LodgeMembersWidgetProps> = ({ stats, onClick, canManageLodge }) => {
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

    return (
        <Card
            sx={{
                bgcolor: COLORS.cardBg,
                color: theme.palette.text.primary,
                borderRadius: '8px',
                border: `1px solid ${COLORS.borderColor}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '220px'
            }}
        >
            <CardContent sx={{ p: 2.5, pb: 1, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography sx={{ fontFamily: '"Inter", sans-serif', color: COLORS.gold, fontSize: '1.2rem', fontWeight: 500 }}>
                        Membros
                    </Typography>
                    
                    <Box sx={{ 
                        width: 48, 
                        height: 48, 
                        border: `1px solid rgba(196, 154, 69, 0.3)`, 
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img src={MembersSvg} alt="Membros" style={{ height: 28, width: 'auto' }} />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mt: 3, mb: 1 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem' }}>Aprendizes</Typography>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '1.1rem', mt: 0.5 }}>
                            {String(stats?.lodge_members_stats?.apprentices || 0).padStart(2, '0')}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem' }}>Companheiros</Typography>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '1.1rem', mt: 0.5 }}>
                            {String(stats?.lodge_members_stats?.fellows || 0).padStart(2, '0')}
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '0.85rem' }}>Mestres</Typography>
                        <Typography sx={{ color: COLORS.textPrimary, fontSize: '1.1rem', mt: 0.5 }}>
                            {String(stats?.lodge_members_stats?.masters || 0).padStart(2, '0')}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Typography sx={{ color: COLORS.blueHighlight, fontSize: '1.1rem', fontWeight: 500, letterSpacing: 0.5 }}>
                        TOTAL: {stats?.lodge_members_stats?.total || 0}
                    </Typography>
                </Box>
            </CardContent>

            {/* Buttons area */}
            <Box sx={{ display: 'flex', gap: 1.5, p: 2.5, pt: 1 }}>
                <Button 
                    variant="outlined" 
                    onClick={onClick}
                    sx={{ 
                        flex: 1, 
                        color: COLORS.textPrimary, 
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        textTransform: 'none',
                        fontFamily: '"Inter", sans-serif',
                        '&:hover': { borderColor: COLORS.gold, bgcolor: 'rgba(196,154,69,0.05)' }
                    }}
                >
                    Ver Detalhes
                </Button>
                {canManageLodge && (
                    <Button 
                        variant="contained" 
                        onClick={onClick}
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
                )}
            </Box>
        </Card>
    );
};

export default LodgeMembersWidget;
