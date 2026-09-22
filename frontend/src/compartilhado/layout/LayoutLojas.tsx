// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Switch,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Brightness4,
  Brightness7,
  Logout as LogoutIcon,
  ArrowDropDown as ArrowDropDownIcon,
  SwapHoriz as SwapHorizIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useAuth, clienteHttp, type LojaItem } from '@/compartilhado/contextos/AuthContext';
import { LogoAnimadaLojas } from '@/compartilhado/componentes/LogoAnimadaLojas';
import { LodgeDetailsModal } from '@/compartilhado/componentes/LodgeDetailsModal';
import { LodgeIcon } from '@/assets/icons/LodgeIcon';
import { MemberPanelIcon } from '@/assets/icons/MemberPanelIcon';
import { AdminIcon } from '@/assets/icons/AdminIcon';
import SecretariaSvg from '@/assets/icons/Secretaria.svg';
import ChancelariaSvg from '@/assets/icons/chancelaria.svg';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 70;

export const LayoutLojas: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    usuario,
    logout,
    modoTema,
    alternarModoTema,
    lojaAtivaId,
    lojasDisponiveis,
    selecionarLoja
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [lojaInfo, setLojaInfo] = useState<any>(null);
  const [carregandoLoja, setCarregandoLoja] = useState(false);
  const [anchorElLojas, setAnchorElLojas] = useState<null | HTMLElement>(null);
  const [lodgeDetailsOpen, setLodgeDetailsOpen] = useState(false);

  const carregarDadosLoja = async () => {
    if (!lojaAtivaId) return;
    try {
      setCarregandoLoja(true);
      const res = await clienteHttp.get(`/lojas/${lojaAtivaId}`);
      setLojaInfo(res.data);
    } catch (err) {
      console.error('Erro ao carregar dados da Loja:', err);
    } finally {
      setCarregandoLoja(false);
    }
  };

  useEffect(() => {
    carregarDadosLoja();
  }, [lojaAtivaId]);

  const renderSvgIcon = (src: string, active: boolean) => (
    <Box
      component="img"
      src={src}
      alt="Ícone"
      sx={{
        height: 28,
        width: 'auto',
        filter: active ? 'drop-shadow(0px 0px 8px rgba(212, 175, 55, 0.8))' : 'none',
        transition: 'all 0.3s',
      }}
    />
  );

  const itensMenu = [
    {
      texto: 'Início',
      rota: '/inicio',
      renderIcon: (active: boolean) => <LodgeIcon active={active} sx={{ height: 28, width: 'auto' }} />,
    },
    {
      texto: 'Quadro de Obreiros',
      rota: '/obreiros',
      renderIcon: (active: boolean) => renderSvgIcon(SecretariaSvg, active),
    },
    {
      texto: 'Sessões & Frequência',
      rota: '/sessoes',
      renderIcon: (active: boolean) => renderSvgIcon(ChancelariaSvg, active),
    },
    {
      texto: 'Livro de Visitantes',
      rota: '/visitantes',
      renderIcon: (active: boolean) => <MemberPanelIcon active={active} sx={{ height: 28, width: 'auto' }} />,
    },
    {
      texto: 'Comissões',
      rota: '/comissoes',
      renderIcon: (active: boolean) => <AdminIcon active={active} sx={{ height: 28, width: 'auto' }} />,
    },
    {
      texto: 'Dados da Oficina',
      rota: '/dados-loja',
      renderIcon: (active: boolean) => <LodgeIcon active={active} sx={{ height: 28, width: 'auto' }} />,
    },
    {
      texto: 'Meu Cadastro',
      rota: '/meu-cadastro',
      renderIcon: (active: boolean) => <MemberPanelIcon active={active} sx={{ height: 28, width: 'auto' }} />,
    },
  ];

  const conteudoDrawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: theme.palette.background.paper, borderRight: `1px solid ${theme.palette.divider}` }}>
      {/* Cabeçalho da Sidebar */}
      <Box sx={{ height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 2, fontWeight: 700 }}>
          MENU PRINCIPAL
        </Typography>
      </Box>

      {/* Lista de Navegação */}
      <List sx={{ px: 2, pt: 3, flexGrow: 1 }}>
        {itensMenu.map((item) => {
          const ativo = location.pathname === item.rota;
          return (
            <ListItem key={item.texto} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={RouterLink}
                to={item.rota}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  bgcolor: ativo
                    ? (modoTema === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.15)')
                    : 'transparent',
                  color: ativo
                    ? (modoTema === 'dark' ? '#D4AF37' : '#B8860B')
                    : theme.palette.text.secondary,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: ativo
                      ? (modoTema === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.25)')
                      : (modoTema === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)'),
                    color: ativo
                      ? (modoTema === 'dark' ? '#D4AF37' : '#B8860B')
                      : theme.palette.text.primary,
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 44,
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'inherit',
                    mr: 1,
                  }}
                >
                  {item.renderIcon(ativo)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: '0.88rem',
                        fontWeight: ativo ? 600 : 400,
                        fontFamily: '"Inter", sans-serif',
                      }}
                    >
                      {item.texto}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Rodapé Oficial SiGMa com Logo Animada */}
      <Box sx={{ mt: 'auto', p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ height: 44, width: 44, filter: 'drop-shadow(0px 0px 8px rgba(0, 176, 255, 0.3))', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogoAnimadaLojas theme="cyber" width="100%" height="100%" showText={false} />
        </Box>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontFamily: "'Tektur', sans-serif",
            textTransform: 'uppercase',
            fontWeight: 700,
            lineHeight: 1,
            background: modoTema === 'dark' ? 'linear-gradient(45deg, #B4B4B4, #9F9F9F)' : 'linear-gradient(45deg, #475569, #334155)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          SiGMa
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            letterSpacing: '0.05em',
            textAlign: 'center',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}
        >
          Sistema Integrado de Gerenciamento Maçônico
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Top Header */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: HEADER_HEIGHT,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
          zIndex: theme.zIndex.drawer + 1,
          width: '100%',
        }}
      >
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: { xs: 1, md: 3 } }}>
          {/* Lado Esquerdo: Hamburger e Info da Loja com link para modal */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            <IconButton
              color="inherit"
              aria-label="Abrir menu"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 0, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {carregandoLoja ? (
              <CircularProgress size={20} color="primary" />
            ) : lojaInfo ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.85 },
                }}
                onClick={() => setLodgeDetailsOpen(true)}
              >
                {lojaInfo.logo_path && (
                  <Box
                    component="img"
                    src={`${import.meta.env.VITE_LOJAS_API_URL || 'http://localhost:8001'}${lojaInfo.logo_path}`}
                    alt="Logo da Loja"
                    sx={{
                      height: { xs: 32, md: 44 },
                      width: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                )}
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: modoTema === 'dark' ? '#C49A45' : '#B8860B',
                      letterSpacing: '-0.01em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Loja Maçônica {lojaInfo.nome_loja} - Nº {lojaInfo.numero_loja}
                  </Typography>
                  {lojaInfo.filiacao_formatada ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic', fontSize: '0.65rem', color: theme.palette.text.secondary, lineHeight: 1.1 }}>
                        {lojaInfo.filiacao_formatada.split('\n')[0]}
                      </Typography>
                      {lojaInfo.filiacao_formatada.split('\n')[1] && (
                        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: theme.palette.text.secondary, lineHeight: 1.1 }}>
                          {lojaInfo.filiacao_formatada.split('\n')[1]}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', color: theme.palette.text.secondary, lineHeight: 1.1 }}>
                      Federada ao Grande Oriente do Brasil
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : (
              <Typography variant="h6" sx={{ color: '#C49A45', fontWeight: 700 }}>
                Módulo Lojas
              </Typography>
            )}

            {/* Seletor de Lojas da Pluri-filiação */}
            {lojasDisponiveis.length > 1 && (
              <>
                <Chip
                  icon={<SwapHorizIcon sx={{ fontSize: '14px !important' }} />}
                  label="Alternar Loja"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorElLojas(e.currentTarget);
                  }}
                  deleteIcon={<ArrowDropDownIcon />}
                  onDelete={(e) => {
                    e.stopPropagation();
                    setAnchorElLojas(e.currentTarget as any);
                  }}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.25)',
                    color: modoTema === 'dark' ? '#D4AF37' : '#B8860B',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(212, 175, 55, 0.3)',
                    },
                  }}
                />

                <Menu
                  anchorEl={anchorElLojas}
                  open={Boolean(anchorElLojas)}
                  onClose={() => setAnchorElLojas(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1,
                        minWidth: 280,
                        bgcolor: 'background.paper',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        borderRadius: 2,
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Suas Lojas Associadas ({lojasDisponiveis.length})
                    </Typography>
                  </Box>

                  {lojasDisponiveis.map((loja) => {
                    const isAtiva = String(loja.codigo_loja) === String(lojaAtivaId) || String(loja.id) === String(lojaAtivaId);
                    return (
                      <MenuItem
                        key={loja.id}
                        onClick={() => {
                          selecionarLoja(loja);
                          setAnchorElLojas(null);
                        }}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1.2,
                          px: 2,
                          bgcolor: isAtiva ? (theme.palette.mode === 'dark' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.15)') : 'transparent',
                          '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: isAtiva ? 700 : 500, color: isAtiva ? '#C49A45' : 'text.primary' }}>
                            {loja.titulo_loja || 'ARLS'} {loja.nome_loja} nº {loja.numero_loja}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {loja.rito ? `Rito ${loja.rito}` : ''} {loja.classe ? `• ${loja.classe}` : ''}
                          </Typography>
                        </Box>

                        {isAtiva && (
                          <CheckIcon sx={{ color: '#C49A45', fontSize: 18, ml: 1 }} />
                        )}
                      </MenuItem>
                    );
                  })}
                </Menu>
              </>
            )}
          </Box>

          {/* Lado Direito: Switch de Tema, Usuário e Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
            <Switch
              checked={modoTema === 'dark'}
              onChange={alternarModoTema}
              color="primary"
              icon={<Brightness7 sx={{ fontSize: 16, color: '#f59e0b', m: 0.5 }} />}
              checkedIcon={<Brightness4 sx={{ fontSize: 16, color: '#e0f2fe', m: 0.5 }} />}
              sx={{
                '& .MuiSwitch-switchBase': {
                  padding: 1,
                  '&.Mui-checked': {
                    color: '#fff',
                    transform: 'translateX(14px)',
                    '& + .MuiSwitch-track': {
                      backgroundColor: 'rgba(56, 189, 248, 0.5)',
                      opacity: 1,
                      border: 0,
                    },
                  },
                },
                '& .MuiSwitch-track': {
                  borderRadius: 22 / 2,
                  backgroundColor: 'rgba(217, 119, 6, 0.4)',
                  opacity: 1,
                },
              }}
            />

            {usuario && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                    {usuario.nome || usuario.email || 'Usuário'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, letterSpacing: 0.5 }}>
                    {usuario.cim ? `CIM ${usuario.cim}` : (usuario.active_role_name || 'Obreiro')}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.primary.dark,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                  }}
                  variant="rounded"
                >
                  {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : <PersonIcon />}
                </Avatar>
              </Box>
            )}

            <IconButton
              onClick={() => {
                logout();
                navigate('/login');
              }}
              sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.error.main } }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navegação Lateral */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: theme.palette.background.paper, borderRight: 'none' },
          }}
        >
          {conteudoDrawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: theme.palette.background.paper,
              borderRight: 'none',
              top: HEADER_HEIGHT,
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            },
          }}
          open
        >
          {conteudoDrawer}
        </Drawer>
      </Box>

      {/* Área de Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${HEADER_HEIGHT}px`,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: theme.palette.background.default,
          backgroundImage: modoTema === 'dark' ? 'radial-gradient(circle at 100% 0%, rgba(0, 176, 255, 0.03) 0%, transparent 40%)' : 'none',
          height: { xs: 'auto', md: `calc(100vh - ${HEADER_HEIGHT}px)` },
          overflow: 'auto',
          pt: { xs: 1, md: 1 },
          px: { xs: 1, md: 2 },
          pb: { xs: 1, md: 1 },
        }}
      >
        <Box sx={{ maxWidth: '100%', margin: '0 auto', height: '100%' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Modal de Detalhes da Loja */}
      {lojaInfo && (
        <LodgeDetailsModal
          open={lodgeDetailsOpen}
          onClose={() => setLodgeDetailsOpen(false)}
          lodgeData={lojaInfo}
          isAdmin={true}
          onUpdate={carregarDadosLoja}
        />
      )}
    </Box>
  );
};
export default LayoutLojas;
