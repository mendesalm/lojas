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
  Divider,
  Switch,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  EmojiPeople as VisitorIcon,
  AccountTree as CommitteeIcon,
  AccountBalance as LodgeIcon,
  Person as PersonIcon,
  Brightness4,
  Brightness7,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth, clienteHttp } from '@/compartilhado/contextos/AuthContext';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 70;

export const LayoutLojas: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { usuario, logout, modoTema, alternarModoTema, lojaAtivaId } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [lojaInfo, setLojaInfo] = useState<any>(null);
  const [carregandoLoja, setCarregandoLoja] = useState(false);

  useEffect(() => {
    async function carregarDadosLoja() {
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
    }
    carregarDadosLoja();
  }, [lojaAtivaId]);

  const itensMenu = [
    { texto: 'Início', rota: '/', icone: <HomeIcon /> },
    { texto: 'Quadro de Obreiros', rota: '/obreiros', icone: <PeopleIcon /> },
    { texto: 'Sessões & Frequência', rota: '/sessoes', icone: <EventNoteIcon /> },
    { texto: 'Livro de Visitantes', rota: '/visitantes', icone: <VisitorIcon /> },
    { texto: 'Comissões', rota: '/comissoes', icone: <CommitteeIcon /> },
    { texto: 'Dados da Oficina', rota: '/dados-loja', icone: <LodgeIcon /> },
    { texto: 'Meu Cadastro', rota: '/meu-cadastro', icone: <PersonIcon /> },
  ];

  const conteudoDrawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Cinzel", "Times New Roman", serif',
            color: 'primary.main',
            fontWeight: 700,
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          🏛️ LOJAS
        </Typography>
      </Box>

      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
        {itensMenu.map((item) => {
          const ativo = location.pathname === item.rota;
          return (
            <ListItem key={item.texto} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.rota}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  bgcolor: ativo ? (modoTema === 'dark' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.2)') : 'transparent',
                  color: ativo ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: modoTema === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    color: 'text.primary',
                  },
                }}
              >
                <ListItemIcon sx={{ color: ativo ? 'primary.main' : 'inherit', minWidth: 40 }}>
                  {item.icone}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: ativo ? 600 : 400 }}>
                      {item.texto}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>
          SIGMA 2.0 • MÓDULO LOJAS
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          Gestão de Secretaria & Chancelaria
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* TopBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          height: HEADER_HEIGHT,
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ height: '100%', display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          {/* Lado Esquerdo: Botão Menu + Info da Loja */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {carregandoLoja ? (
              <CircularProgress size={20} color="primary" />
            ) : lojaInfo ? (
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: 'primary.main',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {lojaInfo.titulo_loja || 'ARLS'} {lojaInfo.nome_loja} nº {lojaInfo.numero_loja}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.1 }}>
                  {lojaInfo.filiacao_formatada?.split('\n')[0] || 'Oficina Regular e Reconhecida'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                Módulo Lojas
              </Typography>
            )}
          </Box>

          {/* Lado Direito: Tema + Usuário + Logout */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Alternar tema claro/escuro">
              <Switch
                checked={modoTema === 'dark'}
                onChange={alternarModoTema}
                icon={<Brightness7 sx={{ fontSize: 16, color: '#f59e0b', m: 0.5 }} />}
                checkedIcon={<Brightness4 sx={{ fontSize: 16, color: '#38bdf8', m: 0.5 }} />}
              />
            </Tooltip>

            {usuario && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {usuario.nome}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {usuario.cim ? `CIM ${usuario.cim}` : usuario.email}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 700,
                  }}
                >
                  {usuario.nome.charAt(0).toUpperCase()}
                </Avatar>
              </Box>
            )}

            <Tooltip title="Sair do Sistema">
              <IconButton
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {conteudoDrawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              top: HEADER_HEIGHT,
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {conteudoDrawer}
        </Drawer>
      </Box>

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: `${HEADER_HEIGHT}px`,
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
