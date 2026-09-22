import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Restaurant,
    Storefront,
    AccountBalanceWallet,
    Description,
    CardTravel,
    HowToReg,
    Assignment,
    LocalLibrary,
    FactCheck,
    FlashOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface QuickAccessWidgetProps {
    onOpenClassifieds?: () => void;
    onOpenDiningScale?: () => void;
}

const QuickAccessWidget: React.FC<QuickAccessWidgetProps> = ({ onOpenClassifieds, onOpenDiningScale }) => {
    const theme = useTheme();
    const COLORS = {
        cardBg: theme.palette.background.paper,
        gold: theme.palette.mode === 'dark' ? '#C49A45' : '#B8860B',
        textPrimary: theme.palette.text.primary,
        textSecondary: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        blueHighlight: theme.palette.mode === 'dark' ? '#528BC2' : '#1976d2'
    };

    const navigate = useNavigate();

    const actions = [
        {
            icon: <FactCheck fontSize="small" />,
            label: 'Sessões',
            color: '#22c55e', 
            onClick: () => navigate('/sessoes')
        },
        {
            icon: <Restaurant fontSize="small" />,
            label: 'Escala do Ágape',
            color: '#f59e0b', 
            onClick: onOpenDiningScale || (() => alert('Escala do Ágape em estruturação.'))
        },
        {
            icon: <Description fontSize="small" />,
            label: 'Quadro Obreiros',
            color: '#0ea5e9', 
            onClick: () => navigate('/obreiros')
        },
        {
            icon: <AccountBalanceWallet fontSize="small" />,
            label: 'Mandatos',
            color: '#8b5cf6', 
            onClick: () => navigate('/mandatos') 
        },
        {
            icon: <Storefront fontSize="small" />,
            label: 'Classificados',
            color: COLORS.gold, 
            onClick: onOpenClassifieds || (() => alert('Classificados em estruturação.'))
        },
        {
            icon: <HowToReg fontSize="small" />,
            label: 'Presenças',
            color: '#14b8a6', 
            onClick: () => navigate('/sessoes') 
        },
        {
            icon: <CardTravel fontSize="small" />,
            label: 'Visitantes',
            color: '#f43f5e', 
            onClick: () => navigate('/visitantes') 
        },
        {
            icon: <Assignment fontSize="small" />,
            label: 'Comissões',
            color: '#64748b', 
            onClick: () => navigate('/comissoes')
        },
        {
            icon: <LocalLibrary fontSize="small" />,
            label: 'Hierarquia',
            color: '#eab308', 
            onClick: () => navigate('/hierarquia') 
        }
    ];

    return (
        <Card
            sx={{
                bgcolor: COLORS.cardBg,
                color: theme.palette.text.primary,
                borderRadius: '8px',
                border: `1px solid ${COLORS.borderColor}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 300
            }}
        >
            <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                <Box sx={{ p: 2.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography sx={{ fontFamily: '"Inter", sans-serif', color: COLORS.gold, fontSize: '1.2rem', fontWeight: 500 }}>
                        Acesso Rápido
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
                        <FlashOn sx={{ color: COLORS.gold, fontSize: 28 }} />
                    </Box>
                </Box>

                <Box sx={{ p: 2, pt: 1, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                    <Grid container spacing={1.5} columns={3}>
                        {actions.map((action, index) => (
                            <Grid size={1} key={index}>
                                <Button
                                    fullWidth
                                    onClick={action.onClick}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1,
                                        p: 1.5,
                                        height: '100%',
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                        border: `1px solid ${COLORS.borderColor}`,
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        color: COLORS.textPrimary,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                            borderColor: action.color,
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <Box sx={{
                                        color: action.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: `${action.color}15`
                                    }}>
                                        {action.icon}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        align="center"
                                        sx={{
                                            fontSize: '0.7rem',
                                            lineHeight: 1.2,
                                            fontFamily: '"Inter", sans-serif',
                                            fontWeight: 500
                                        }}
                                    >
                                        {action.label}
                                    </Typography>
                                </Button>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </CardContent>
        </Card>
    );
};

export default QuickAccessWidget;
