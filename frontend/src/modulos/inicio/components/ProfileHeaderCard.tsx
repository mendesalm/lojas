import React from 'react';
import { Box, Typography, Avatar, Chip, useTheme, alpha } from '@mui/material';
import { useAuth } from '@/compartilhado/contextos/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';

interface ProfileHeaderCardProps {
    lodgeName?: string;
    lodgeNumber?: string;
    city?: string;
}

const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({ lodgeName, lodgeNumber, city }) => {
    const theme = useTheme();
    const { usuario } = useAuth();
    
    // As cores "Sigma" da nova paleta
    const accentColor = '#facc15'; // Dourado
    const surfaceColor = '#0A1428'; // Azul Escuro

    return (
        <Box 
            sx={{
                width: '100%',
                mb: 2,
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: surfaceColor,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                border: `1px solid ${alpha(accentColor, 0.15)}`,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Faixa superior (Banner da Loja) */}
            <Box 
                sx={{
                    background: `linear-gradient(90deg, ${alpha('#1E325C', 0.8)}, ${alpha(surfaceColor, 0.9)})`,
                    py: 1.5,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderBottom: `1px solid ${alpha('#1E325C', 0.5)}`
                }}
            >
                <CorporateFareIcon sx={{ color: alpha(theme.palette.common.white, 0.7), fontSize: 20 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1.2, color: alpha(theme.palette.common.white, 0.8), textTransform: 'uppercase' }}>
                    {lodgeName ? `${lodgeName} ${lodgeNumber ? `Nº ${lodgeNumber}` : ''}` : 'Painel da Loja'}
                </Typography>
            </Box>

            {/* Corpo do Cartão (Identidade do Usuário) */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Avatar
                    sx={{
                        width: 72,
                        height: 72,
                        bgcolor: alpha(accentColor, 0.1),
                        color: accentColor,
                        border: `2px solid ${alpha(accentColor, 0.5)}`,
                        fontWeight: 700,
                        fontSize: '1.8rem',
                        boxShadow: `0 0 15px ${alpha(accentColor, 0.15)}`
                    }}
                >
                    {usuario?.nome?.charAt(0) || <AccountCircleIcon fontSize="large" />}
                </Avatar>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Bem-vindo,
                    </Typography>
                    <Typography variant="h6" sx={{ color: theme.palette.common.white, fontWeight: 700, mb: 0.5 }}>
                        Ir∴ {usuario?.nome || 'Irmão'}
                    </Typography>
                    
                    {/* Pills / Chips */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {usuario?.cim && (
                            <Chip 
                                label={`CIM ${usuario.cim}`}
                                size="small"
                                sx={{ 
                                    bgcolor: alpha(theme.palette.info.main, 0.2), 
                                    color: theme.palette.info.light,
                                    fontWeight: 700,
                                    borderRadius: '8px'
                                }}
                            />
                        )}
                        {usuario?.active_role_name && (
                            <Chip 
                                label={usuario.active_role_name}
                                size="small"
                                sx={{ 
                                    bgcolor: alpha(accentColor, 0.15), 
                                    color: accentColor,
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                    border: `1px solid ${alpha(accentColor, 0.3)}`
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ProfileHeaderCard;
