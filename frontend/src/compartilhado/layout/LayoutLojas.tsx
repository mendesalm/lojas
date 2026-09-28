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
  Check as CheckIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { useAuth, clienteHttp, type LojaItem } from '@/compartilhado/contextos/AuthContext';
import { usePwaInstall } from '@/compartilhado/hooks/usePwaInstall';
import { LogoAnimadaLojas } from '@/compartilhado/componentes/LogoAnimadaLojas';
import { LodgeDetailsModal } from '@/compartilhado/componentes/LodgeDetailsModal';
import { obterUrlLojasBase } from '@/compartilhado/servicos/configuracaoApi';
import { LodgeIcon } from '@/assets/icons/LodgeIcon';
import { MemberPanelIcon } from '@/assets/icons/MemberPanelIcon';
import { AdminIcon } from '@/assets/icons/AdminIcon';
import SecretariaSvg from '@/assets/icons/Secretaria.svg';
import ChancelariaSvg from '@/assets/icons/chancelaria.svg';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 70;

export const LayoutLojas: React.FC = () => {
  const { podeInstalar, dispararInstalacao } = usePwaInstall();
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

        {podeInstalar && (
          <ListItem disablePadding sx={{ mb: 1, mt: 1 }}>
            <ListItemButton
              onClick={dispararInstalacao}
              sx={{
                borderRadius: 2,
                bgcolor: 'rgba(212, 175, 55, 0.15)',
                color: modoTema === 'dark' ? '#D4AF37' : '#B8860B',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                '&:hover': {
                  bgcolor: 'rgba(212, 175, 55, 0.25)',
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
                <GetAppIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Instalar Aplicativo
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        )}
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
                    src={`${obterUrlLojasBase()}${lojaInfo.logo_path}`}
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

          {/* Lado Direito: Instalar App, Switch de Tema, Usuário e Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
            {podeInstalar && (
              <Chip
                icon={<GetAppIcon sx={{ fontSize: '15px !important' }} />}
                label="Instalar App"
                size="small"
                onClick={dispararInstalacao}
                sx={{
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.3)',
                  color: modoTema === 'dark' ? '#D4AF37' : '#B8860B',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.4)' },
                }}
              />
            )}

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
          pb: { xs: 10, md: 1 },
        }}
      >
        <Box sx={{ maxWidth: '100%', margin: '0 auto', height: '100%' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Mobile Bottom Navigation Bar (Thumb Zone) */}
      <Box
        component="nav"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          bgcolor: modoTema === 'dark' ? 'rgba(7, 14, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: modoTema === 'dark' ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid rgba(0,0,0,0.1)',
          zIndex: theme.zIndex.appBar,
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 1,
          pb: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Início */}
        <Box
          component={RouterLink}
          to="/inicio"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 54,
            minHeight: 48,
            textDecoration: 'none',
            color: location.pathname === '/inicio' ? (modoTema === 'dark' ? '#D4AF37' : '#B8860B') : theme.palette.text.secondary,
            transition: 'all 0.2s',
          }}
        >
          <LodgeIcon active={location.pathname === '/inicio'} sx={{ height: 22, width: 'auto' }} />
          <Typography sx={{ fontSize: '0.65rem', mt: 0.5, fontWeight: location.pathname === '/inicio' ? 700 : 500 }}>
            Início
          </Typography>
        </Box>

        {/* Obreiros */}
        <Box
          component={RouterLink}
          to="/obreiros"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 54,
            minHeight: 48,
            textDecoration: 'none',
            color: location.pathname === '/obreiros' ? (modoTema === 'dark' ? '#D4AF37' : '#B8860B') : theme.palette.text.secondary,
            transition: 'all 0.2s',
          }}
        >
          <Box component="img" src={SecretariaSvg} alt="Obreiros" sx={{ height: 22, width: 'auto', filter: location.pathname === '/obreiros' ? 'drop-shadow(0px 0px 6px rgba(212, 175, 55, 0.8))' : 'none' }} />
          <Typography sx={{ fontSize: '0.65rem', mt: 0.5, fontWeight: location.pathname === '/obreiros' ? 700 : 500 }}>
            Obreiros
          </Typography>
        </Box>

        {/* Sessões */}
        <Box
          component={RouterLink}
          to="/sessoes"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 54,
            minHeight: 48,
            textDecoration: 'none',
            color: location.pathname === '/sessoes' ? (modoTema === 'dark' ? '#D4AF37' : '#B8860B') : theme.palette.text.secondary,
            transition: 'all 0.2s',
          }}
        >
          <Box component="img" src={ChancelariaSvg} alt="Sessões" sx={{ height: 22, width: 'auto', filter: location.pathname === '/sessoes' ? 'drop-shadow(0px 0px 6px rgba(212, 175, 55, 0.8))' : 'none' }} />
          <Typography sx={{ fontSize: '0.65rem', mt: 0.5, fontWeight: location.pathname === '/sessoes' ? 700 : 500 }}>
            Sessões
          </Typography>
        </Box>

        {/* Meu Cadastro */}
        <Box
          component={RouterLink}
          to="/meu-cadastro"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 54,
            minHeight: 48,
            textDecoration: 'none',
            color: location.pathname === '/meu-cadastro' ? (modoTema === 'dark' ? '#D4AF37' : '#B8860B') : theme.palette.text.secondary,
            transition: 'all 0.2s',
          }}
        >
          <MemberPanelIcon active={location.pathname === '/meu-cadastro'} sx={{ height: 22, width: 'auto' }} />
          <Typography sx={{ fontSize: '0.65rem', mt: 0.5, fontWeight: location.pathname === '/meu-cadastro' ? 700 : 500 }}>
            Cadastro
          </Typography>
        </Box>

        {/* Mais / Gaveta */}
        <Box
          onClick={() => setMobileOpen(true)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 54,
            minHeight: 48,
            cursor: 'pointer',
            color: mobileOpen ? (modoTema === 'dark' ? '#D4AF37' : '#B8860B') : theme.palette.text.secondary,
            transition: 'all 0.2s',
          }}
        >
          <MenuIcon sx={{ fontSize: 24 }} />
          <Typography sx={{ fontSize: '0.65rem', mt: 0.5, fontWeight: 500 }}>
            Mais
          </Typography>
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
