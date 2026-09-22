import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Grid,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Typography,
    IconButton,
    DialogContentText,
    Chip,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    alpha
} from '@mui/material';
import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Campaign,
    Event as EventIcon,
    Cake as CakeIcon,
    Gavel as GavelIcon,
    AllInclusive as WeddingIcon,
    Architecture as ArchitectureIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    WhatsApp as WhatsAppIcon,
    Email as EmailIcon
} from '@mui/icons-material';
import {
    getDashboardStats,
    getCalendarEvents,
    getNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    getLodgeMembers,
} from './services/dashboardService';
import type {
    DashboardStats,
    CalendarEvent,
    Notice,
    LodgeMember
} from './services/dashboardService';
import LodgeMembersWidget from './components/LodgeMembersWidget';
import LodgeCommemorativeEventsWidget from './components/LodgeCommemorativeEventsWidget';
import LodgeNoticesWidget from './components/LodgeNoticesWidget';
import LodgeSessionsWidget from './components/LodgeSessionsWidget';
import QuickAccessWidget from './components/QuickAccessWidget';
import { useAuth } from '@/compartilhado/contextos/AuthContext';
import { useTheme } from '@mui/material/styles';
import { normalizeEventType, EVENT_COLORS, ACCENT_COLOR } from './constants/LodgeDashboardConstants';

export const PaginaInicio: React.FC = () => {
    const { usuario, lojaAtivaId } = useAuth();
    const theme = useTheme();

    // Permissões
    const canManageLodge =
        usuario?.roles?.includes('super_admin') ||
        usuario?.roles?.includes('webmaster') ||
        usuario?.roles?.includes('admin') ||
        ['Venerável Mestre', 'Secretário', 'Secretário Adjunto'].includes(usuario?.active_role_name || '');

    const canManageNotices = canManageLodge;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        sessoes: true,
        aniversarios: true,
        maconicos: true,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const [noticeModalOpen, setNoticeModalOpen] = useState(false);
    const [allNoticesModalOpen, setAllNoticesModalOpen] = useState(false);
    const [addNoticeModalOpen, setAddNoticeModalOpen] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<{ title: string; content: string } | null>(null);
    const [notices, setNotices] = useState<Notice[]>([]);

    const [newNoticeTitle, setNewNoticeTitle] = useState('');
    const [newNoticeContent, setNewNoticeContent] = useState('');
    const [newNoticeExpiration, setNewNoticeExpiration] = useState('');
    const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null);

    const [membersModalOpen, setMembersModalOpen] = useState(false);
    const [membersList, setMembersList] = useState<LodgeMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [membersViewMode, setMembersViewMode] = useState<'table' | 'cards'>('table');

    const handleOpenMembersModal = async () => {
        setMembersModalOpen(true);
        if (membersList.length === 0) {
            setLoadingMembers(true);
            try {
                const list = await getLodgeMembers(lojaAtivaId);
                setMembersList(list);
            } catch (error) {
                console.error("Erro ao carregar lista de membros:", error);
            } finally {
                setLoadingMembers(false);
            }
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats(lojaAtivaId);
                setStats(data);
            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            }
        };
        fetchStats();
    }, [lojaAtivaId]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const events = await getCalendarEvents(currentDate.getMonth() + 1, currentDate.getFullYear(), lojaAtivaId);
                setCalendarEvents(events);
            } catch (error) {
                console.error("Erro ao carregar eventos do calendário:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [currentDate, lojaAtivaId]);

    const handlePrevMonth = useCallback(() => {
        setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1));
    }, []);

    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const handleDayClick = useCallback((day: number) => {
        setSelectedDay(day);
        setModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        setSelectedDay(null);
    }, []);

    const handleNoticeClick = (title: string, content: string) => {
        setSelectedNotice({ title, content });
        setNoticeModalOpen(true);
    };

    const handleCloseNoticeModal = () => {
        setNoticeModalOpen(false);
        setSelectedNotice(null);
    };

    const handleOpenAddNotice = () => {
        setAddNoticeModalOpen(true);
    };

    const handleCloseAddNotice = () => {
        setAddNoticeModalOpen(false);
        setNewNoticeTitle('');
        setNewNoticeContent('');
        setNewNoticeExpiration('');
        setEditingNoticeId(null);
    };

    const handleSaveNotice = async () => {
        if (!newNoticeTitle || !newNoticeContent) return;
        try {
            if (editingNoticeId) {
                const updatedNotice = await updateNotice(editingNoticeId, {
                    title: newNoticeTitle,
                    content: newNoticeContent,
                    expiration_date: newNoticeExpiration || null,
                    lodge_id: lojaAtivaId
                });
                setNotices(notices.map(n => n.id === editingNoticeId ? updatedNotice : n));
            } else {
                const newNotice = await createNotice({
                    title: newNoticeTitle,
                    content: newNoticeContent,
                    expiration_date: newNoticeExpiration || undefined,
                    lodge_id: lojaAtivaId
                });
                setNotices([newNotice, ...notices]);
                if (stats) {
                    setStats({
                        ...stats,
                        active_notices_count: stats.active_notices_count + 1,
                        active_notices: [newNotice, ...(stats.active_notices || [])]
                    });
                }
            }
            handleCloseAddNotice();
        } catch (error) {
            console.error("Erro ao salvar aviso:", error);
        }
    };

    const handleEditClick = (notice: Notice) => {
        setNewNoticeTitle(notice.title);
        setNewNoticeContent(notice.content);
        setNewNoticeExpiration(notice.expiration_date || '');
        setEditingNoticeId(notice.id);
        setAddNoticeModalOpen(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este aviso?')) return;
        try {
            await deleteNotice(id, lojaAtivaId);
            setNotices(notices.filter(n => n.id !== id));
            if (stats) {
                setStats({
                    ...stats,
                    active_notices_count: Math.max(0, stats.active_notices_count - 1),
                    active_notices: (stats.active_notices || []).filter(n => n.id !== id)
                });
            }
        } catch (error) {
            console.error("Erro ao excluir aviso:", error);
        }
    };

    const handleOpenAllNotices = async () => {
        setAllNoticesModalOpen(true);
        try {
            const data = await getNotices(lojaAtivaId);
            setNotices(data);
        } catch (error) {
            console.error("Erro ao buscar todos os avisos:", error);
        }
    };

    const { daysInMonth, firstDayOfMonth } = useMemo(() => {
        const days = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        return { daysInMonth: days, firstDayOfMonth: firstDay };
    }, [currentDate]);

    const filteredEvents = useMemo(() => {
        return calendarEvents.filter(event => {
            if (['sessao', 'evento'].includes(event.type)) return filters.sessoes;
            if (['aniversario', 'aniversario_familiar', 'casamento'].includes(event.type)) return filters.aniversarios;
            if (['iniciacao', 'elevacao', 'exaltacao', 'instalacao'].includes(event.type)) return filters.maconicos;
            return true;
        });
    }, [calendarEvents, filters]);

    const selectedEvents = useMemo(() => {
        return selectedDay ? filteredEvents.filter(e => e.date === selectedDay) : [];
    }, [filteredEvents, selectedDay]);

    const selectedDateObj = useMemo(() => {
        return selectedDay ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay) : null;
    }, [currentDate, selectedDay]);

    const commemorativeEvents = useMemo(() => {
        return calendarEvents
            .filter(event => event.type !== 'sessao' && event.type !== 'evento')
            .sort((a, b) => {
                const dayA = a.date || parseInt(a.full_date?.split('-')[2] || '0', 10);
                const dayB = b.date || parseInt(b.full_date?.split('-')[2] || '0', 10);
                return dayA - dayB;
            });
    }, [calendarEvents]);

    if (loading && !stats) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', bgcolor: theme.palette.background.default }}>
                <CircularProgress sx={{ color: ACCENT_COLOR }} />
            </Box>
        );
    }

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            bgcolor: 'transparent',
            color: theme.palette.text.primary,
            fontFamily: '"Inter", sans-serif',
            overflow: { xs: 'visible', md: 'hidden' },
        }}>

            <Grid container spacing={1.5} columns={10} sx={{ flexGrow: 1, height: '100%', minHeight: 0 }}>
                {/* Coluna Esquerda: Membros e Datas Comemorativas */}
                <Grid size={{ xs: 10, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: { xs: 'auto', md: '100%' }, overflowY: 'auto', pr: 0.5, minHeight: 0 }}>
                    <Box sx={{ flexShrink: 0 }}>
                        <LodgeMembersWidget stats={stats} onClick={handleOpenMembersModal} canManageLodge={canManageLodge} />
                    </Box>

                    <LodgeCommemorativeEventsWidget commemorativeEvents={commemorativeEvents} currentDate={currentDate} canManageLodge={canManageLodge} />
                </Grid>

                {/* Coluna Central: Calendário Maçônico Completo */}
                <Grid size={{ xs: 10, md: 6 }} sx={{ height: { xs: 'auto', md: '100%' }, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <LodgeSessionsWidget
                        currentDate={currentDate}
                        daysInMonth={daysInMonth}
                        firstDayOfMonth={firstDayOfMonth}
                        filteredEvents={filteredEvents}
                        filters={filters}
                        setFilters={setFilters}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                        onToday={handleToday}
                        onDayClick={handleDayClick}
                        canManageLodge={canManageLodge}
                    />
                </Grid>

                {/* Coluna Direita: Mural de Avisos e Acesso Rápido */}
                <Grid size={{ xs: 10, md: 2 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: { xs: 'auto', md: '100%' }, overflowY: 'auto', pr: 0.5, minHeight: 0 }}>
                    <LodgeNoticesWidget
                        stats={stats}
                        canManageNotices={canManageNotices}
                        onOpenAddNotice={handleOpenAddNotice}
                        onOpenAllNotices={handleOpenAllNotices}
                        onNoticeClick={handleNoticeClick}
                    />
                    
                    <Box sx={{ flexShrink: 0 }}>
                        <QuickAccessWidget onOpenClassifieds={() => alert('Módulo de Classificados')} />
                    </Box>
                </Grid>
            </Grid>

            {/* Modal de Detalhes do Dia no Calendário */}
            <Dialog open={modalOpen} onClose={handleCloseModal} slotProps={{ paper: { sx: { bgcolor: theme.palette.background.paper, minWidth: 320 } } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                        {selectedDateObj?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Typography>
                    <IconButton onClick={handleCloseModal} size="small" sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedEvents.length > 0 ? (
                        <List>
                            {selectedEvents.map((event, idx) => {
                                const normalizedType = normalizeEventType(event.type);
                                let IconComponent = EventIcon;
                                if (['Elevação', 'Iniciação', 'Exaltação'].includes(normalizedType)) {
                                    IconComponent = ArchitectureIcon;
                                } else if (normalizedType.includes('Aniversário') && !normalizedType.includes('Casamento')) {
                                    IconComponent = CakeIcon;
                                } else if (normalizedType === 'Instalação') {
                                    IconComponent = GavelIcon;
                                } else if (normalizedType.includes('Casamento')) {
                                    IconComponent = WeddingIcon;
                                }

                                const color = EVENT_COLORS[event.type] || 'info.main';

                                return (
                                    <ListItem key={idx} sx={{ px: 0, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'flex-start' }}>
                                        <IconComponent sx={{ color: color, fontSize: 18, mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                                                    {event.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', fontStyle: 'italic' }}>
                                                    {normalizedType}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
                            Nenhum evento registrado.
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Detalhes do Aviso */}
            <Dialog open={noticeModalOpen} onClose={handleCloseNoticeModal} slotProps={{ paper: { sx: { bgcolor: theme.palette.background.paper, minWidth: 400 } } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                        {selectedNotice?.title}
                    </Typography>
                    <IconButton onClick={handleCloseNoticeModal} size="small" sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    {selectedNotice && (
                        <Typography variant="body1" sx={{ color: theme.palette.text.primary, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: selectedNotice.content }} />
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={handleCloseNoticeModal} sx={{ color: ACCENT_COLOR }}>Fechar</Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Quadro de Obreiros da Loja */}
            <Dialog open={membersModalOpen} onClose={() => setMembersModalOpen(false)} maxWidth="lg" fullWidth slotProps={{ paper: { sx: { bgcolor: theme.palette.background.default, minHeight: '60vh' } } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Box>
                            <Typography variant="h5" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR, fontWeight: 700 }}>
                                Obreiros da Loja
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {stats?.lodge_members_stats?.total || 0} Irmãos Ativos
                            </Typography>
                        </Box>
                        <ToggleButtonGroup
                            value={membersViewMode}
                            exclusive
                            onChange={(_, newMode) => { if (newMode) setMembersViewMode(newMode); }}
                            size="small"
                            sx={{
                                height: 32,
                                bgcolor: alpha(theme.palette.background.paper, 0.6),
                                '& .MuiToggleButton-root': {
                                    px: 1.5,
                                    py: 0.5,
                                    border: `1px solid ${theme.palette.divider}`,
                                    color: theme.palette.text.secondary,
                                    textTransform: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    '&.Mui-selected': {
                                        bgcolor: alpha(ACCENT_COLOR, 0.15),
                                        color: ACCENT_COLOR,
                                        borderColor: ACCENT_COLOR,
                                    }
                                }
                            }}
                        >
                            <ToggleButton value="table" title="Visualização em Tabela">
                                <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Tabela
                            </ToggleButton>
                            <ToggleButton value="cards" title="Visualização em Grade">
                                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Grade
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                    <IconButton onClick={() => setMembersModalOpen(false)} sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, pb: 4 }}>
                    {loadingMembers ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress sx={{ color: ACCENT_COLOR }} />
                        </Box>
                    ) : membersList.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                            Nenhum obreiro encontrado.
                        </Box>
                    ) : membersViewMode === 'table' ? (
                        <TableContainer component={Box} sx={{ backgroundColor: 'transparent', overflowX: 'auto' }}>
                            <Table sx={{ borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: 650 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, pl: 3 }}>FOTO</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>CIM</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>NOME COMPLETO</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>GRAU</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>E-MAIL</TableCell>
                                        <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, pr: 3 }}>TELEFONE</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {membersList.map((member) => {
                                        const corGrau = member.degree === 'Aprendiz' 
                                            ? theme.palette.success.main 
                                            : member.degree === 'Companheiro' 
                                            ? theme.palette.info.main 
                                            : ACCENT_COLOR;

                                        return (
                                            <TableRow
                                                key={member.id}
                                                sx={{
                                                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.background.paper, 0.95),
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                                                    },
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <TableCell sx={{ borderBottom: 'none', borderTopLeftRadius: '50px', borderBottomLeftRadius: '50px', pl: 3, py: 1.2 }}>
                                                    <Avatar
                                                        src={member.profile_picture_path ? `${import.meta.env.VITE_LOJAS_API_URL || 'http://localhost:8001'}${member.profile_picture_path}` : undefined}
                                                        alt={member.full_name}
                                                        sx={{ width: 40, height: 40, border: `2px solid ${corGrau}`, bgcolor: alpha(corGrau, 0.1), color: corGrau, fontWeight: 700 }}
                                                    >
                                                        {member.full_name.charAt(0)}
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'monospace' }}>
                                                        {member.cim || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                        {member.full_name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                                                    <Chip
                                                        label={member.degree || 'Membro'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(corGrau, 0.1),
                                                            color: corGrau,
                                                            border: `1px solid ${alpha(corGrau, 0.3)}`,
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <EmailIcon sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.7 }} />
                                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                            {member.email || '—'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ borderBottom: 'none', borderTopRightRadius: '50px', borderBottomRightRadius: '50px', pr: 3, py: 1.2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {member.phone ? (
                                                            <>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => window.open(`https://wa.me/55${member.phone?.replace(/\D/g, '')}`, '_blank')}
                                                                    sx={{ color: '#22c55e', p: 0.5, '&:hover': { bgcolor: alpha('#22c55e', 0.1) } }}
                                                                    title="Abrir WhatsApp"
                                                                >
                                                                    <WhatsAppIcon sx={{ fontSize: 18 }} />
                                                                </IconButton>
                                                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                    {member.phone}
                                                                </Typography>
                                                            </>
                                                        ) : (
                                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                                —
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Grid container spacing={2}>
                            {membersList.map((member) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={member.id}>
                                <Card sx={{ bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', borderColor: ACCENT_COLOR } }}>
                                    <Box sx={{ position: 'relative', mb: 2 }}>
                                        <Avatar
                                            src={member.profile_picture_path ? `${import.meta.env.VITE_LOJAS_API_URL || 'http://localhost:8001'}${member.profile_picture_path}` : undefined}
                                            alt={member.full_name}
                                            sx={{ width: 80, height: 80, border: `2px solid ${member.degree === 'Aprendiz' ? theme.palette.success.main : member.degree === 'Companheiro' ? theme.palette.info.main : theme.palette.warning.main}` }}
                                        >
                                            {member.full_name.charAt(0)}
                                        </Avatar>
                                        <Chip
                                            label={member.degree || 'Membro'}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                bottom: -10,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                height: 20,
                                                fontSize: '0.65rem',
                                                bgcolor: theme.palette.background.default,
                                                color: member.degree === 'Aprendiz' ? 'success.main' : member.degree === 'Companheiro' ? 'info.main' : ACCENT_COLOR,
                                                border: `1px solid ${member.degree === 'Aprendiz' ? theme.palette.success.main : member.degree === 'Companheiro' ? theme.palette.info.main : theme.palette.warning.main}`
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 0.5, lineHeight: 1.2 }}>
                                        {member.full_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                                        CIM: {member.cim || 'N/A'}
                                    </Typography>
                                    <Box sx={{ width: '100%', pt: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span style={{ opacity: 0.5 }}>✉</span> {member.email}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <span style={{ opacity: 0.5 }}>📞</span> {member.phone || 'Sem telefone'}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Adicionar/Editar Aviso */}
            <Dialog open={addNoticeModalOpen} onClose={handleCloseAddNotice} slotProps={{ paper: { sx: { bgcolor: theme.palette.background.default, minWidth: 400 } } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="h6" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                        {editingNoticeId ? 'Editar Aviso' : 'Novo Aviso'}
                    </Typography>
                    <IconButton onClick={handleCloseAddNotice} size="small" sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <DialogContentText sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Publique um comunicado oficial para o quadro de obreiros da Loja.
                    </DialogContentText>
                    <TextField autoFocus margin="dense" id="title" label="Título do Aviso" type="text" fullWidth variant="outlined" value={newNoticeTitle} onChange={(e) => setNewNoticeTitle(e.target.value)} sx={{ mb: 2 }} />
                    <TextField margin="dense" id="content" label="Conteúdo" type="text" fullWidth multiline rows={4} variant="outlined" value={newNoticeContent} onChange={(e) => setNewNoticeContent(e.target.value)} />
                    <TextField margin="dense" id="expiration" label="Data de Expiração (Opcional)" type="date" fullWidth variant="outlined" slotProps={{ inputLabel: { shrink: true } }} value={newNoticeExpiration} onChange={(e) => setNewNoticeExpiration(e.target.value)} sx={{ '& input::-webkit-calendar-picker-indicator': { filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none' } }} />
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
                    <Button onClick={handleCloseAddNotice} sx={{ color: theme.palette.text.secondary }}>Cancelar</Button>
                    <Button onClick={handleSaveNotice} variant="contained" sx={{ bgcolor: ACCENT_COLOR, color: '#000', '&:hover': { bgcolor: 'warning.dark' } }}>
                        {editingNoticeId ? 'Salvar Alterações' : 'Publicar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de Todos os Avisos */}
            <Dialog open={allNoticesModalOpen} onClose={() => setAllNoticesModalOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { bgcolor: theme.palette.background.default, minHeight: '50vh' } } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                    <Box>
                        <Typography variant="h5" sx={{ fontFamily: '"Inter", sans-serif', color: ACCENT_COLOR }}>
                            Mural de Avisos - Completo
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Todos os comunicados da Loja
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setAllNoticesModalOpen(false)} sx={{ color: theme.palette.text.secondary }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, pb: 4 }}>
                    <List>
                        {notices.length > 0 ? (
                            notices.map((notice) => (
                                <ListItem key={notice.id} sx={{ bgcolor: theme.palette.background.paper, mb: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ width: '100%' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ color: ACCENT_COLOR, fontWeight: 700 }}>
                                                    {notice.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                                                    Publicado em: {new Date(notice.date_posted).toLocaleDateString('pt-BR')}
                                                </Typography>
                                                {notice.expiration_date && (
                                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                                                        Expira em: {new Date(notice.expiration_date).toLocaleDateString('pt-BR')}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {canManageNotices && (
                                                <Box>
                                                    <IconButton size="small" onClick={() => handleEditClick(notice)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: 'info.main' } }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDeleteClick(notice.id)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: 'error.main' } }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, whiteSpace: 'pre-line' }}>
                                            {notice.content}
                                        </Typography>
                                    </Box>
                                </ListItem>
                            ))
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 5 }}>
                                <Campaign sx={{ fontSize: 60, color: theme.palette.text.disabled, mb: 2 }} />
                                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                    Nenhum aviso encontrado.
                                </Typography>
                            </Box>
                        )}
                    </List>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default PaginaInicio;
