import React from 'react';
import { Box, Typography, Grid, Paper, alpha, useTheme, Button } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface MetricGridWidgetProps {
    stats: {
        total: number;
        apprentices: number;
        fellows: number;
        masters: number;
    } | null | undefined;
    onClick: () => void;
    canManageLodge?: boolean;
}

const MetricGridWidget: React.FC<MetricGridWidgetProps> = ({ stats, onClick, canManageLodge }) => {
    const theme = useTheme();

    // Paleta de Cores baseada no "Estatísticas da Loja"
    const metrics = [
        {
            label: 'Membros Ativos',
            value: stats?.total || 0,
            icon: GroupsIcon,
            color: '#3b82f6', // Azul
        },
        {
            label: 'Aprendizes',
            value: stats?.apprentices || 0,
            icon: SchoolIcon,
            color: '#10b981', // Verde
        },
        {
            label: 'Companheiros',
            value: stats?.fellows || 0,
            icon: EmojiEventsIcon,
            color: '#facc15', // Amarelo
        },
        {
            label: 'Mestres',
            value: stats?.masters || 0,
            icon: WorkspacePremiumIcon,
            color: '#a855f7', // Roxo
        }
    ];

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
                <Typography variant="h6" sx={{ color: theme.palette.common.white, fontWeight: 700 }}>
                    Estatísticas da Loja
                </Typography>
                <Button 
                    variant="text" 
                    size="small" 
                    onClick={onClick}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ color: theme.palette.text.secondary, textTransform: 'none', fontWeight: 600 }}
                >
                    {canManageLodge ? 'Gerenciar' : 'Ver Quadro'}
                </Button>
            </Box>
            
            <Grid container spacing={1.5}>
                {metrics.map((metric, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                        <Paper
                            elevation={0}
                            onClick={index === 0 ? onClick : undefined} // Clicking "Membros Ativos" also opens it
                            sx={{
                                bgcolor: '#0A1428', // sigma-surface
                                borderRadius: '16px',
                                border: `1px solid ${alpha('#1E325C', 0.5)}`, // sigma-border
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                minHeight: '110px',
                                transition: 'all 0.2s ease',
                                cursor: index === 0 ? 'pointer' : 'default',
                                '&:hover': {
                                    bgcolor: '#0E1C36', // sigma-elevated
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 8px 24px ${alpha('#000', 0.4)}`,
                                    borderColor: alpha(metric.color, 0.4)
                                }
                            }}
                        >
                            <metric.icon sx={{ color: metric.color, mb: 1, fontSize: 28 }} />
                            <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.common.white, lineHeight: 1 }}>
                                {metric.value}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, textAlign: 'center', fontWeight: 500, lineHeight: 1.2 }}>
                                {metric.label}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default MetricGridWidget;
