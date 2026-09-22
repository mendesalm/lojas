// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Alert,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth, clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2.5 }}>{children}</Box>}
    </div>
  );
}

export const PaginaQuadroObreiros: React.FC = () => {
  const theme = useTheme();
  const { lojaAtivaId } = useAuth();

  const [obreiros, setObreiros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroGrau, setFiltroGrau] = useState('');

  // Detalhes do Obreiro (Modal)
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [obreiroSelecionado, setObreiroSelecionado] = useState<any>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [abaDetalhe, setAbaDetalhe] = useState(0);

  // Cadastro de Novo Obreiro (Modal)
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');
  const [novoObreiro, setNovoObreiro] = useState({
    nome_completo: '',
    cim: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    grau: 'Aprendiz',
    tipo_sanguineo: '',
    estado_civil: '',
    profissao: '',
    cidade: '',
    estado: '',
    nome_pai: '',
    nome_mae: '',
  });

  const carregarObreiros = async () => {
    try {
      setCarregando(true);
      let url = `/lojas/${lojaAtivaId}/obreiros?`;
      if (termoBusca) url += `busca=${encodeURIComponent(termoBusca)}&`;
      if (filtroGrau) url += `grau=${encodeURIComponent(filtroGrau)}&`;

      const res = await clienteHttp.get(url);
      setObreiros(res.data);
    } catch (err) {
      console.error('Erro ao listar obreiros:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarObreiros();
  }, [lojaAtivaId, filtroGrau]);

  const abrirDetalhe = async (id: number) => {
    try {
      setCarregandoDetalhe(true);
      setModalDetalheAberto(true);
      setAbaDetalhe(0);
      const res = await clienteHttp.get(`/lojas/${lojaAtivaId}/obreiros/${id}`);
      setObreiroSelecionado(res.data);
    } catch (err) {
      console.error('Erro ao abrir detalhes do obreiro:', err);
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const handleSalvarObreiro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvandoCadastro(true);
      setErroCadastro('');
      await clienteHttp.post(`/lojas/${lojaAtivaId}/obreiros`, {
        ...novoObreiro,
        loja_id: lojaAtivaId,
        data_nascimento: novoObreiro.data_nascimento || null,
      });
      setModalCadastroAberto(false);
      carregarObreiros();
      setNovoObreiro({
        nome_completo: '',
        cim: '',
        cpf: '',
        rg: '',
        data_nascimento: '',
        email: '',
        telefone: '',
        grau: 'Aprendiz',
        tipo_sanguineo: '',
        estado_civil: '',
        profissao: '',
        cidade: '',
        estado: '',
        nome_pai: '',
        nome_mae: '',
      });
    } catch (err) {
      setErroCadastro(extrairMensagemErro(err, 'Erro ao cadastrar obreiro.'));
    } finally {
      setSalvandoCadastro(false);
    }
  };

  const obterCorGrau = (grau: string) => {
    switch (grau) {
      case 'Mestre Instalado':
        return 'warning';
      case 'Mestre':
        return 'primary';
      case 'Companheiro':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Cabeçalho da Página */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
            Gestão de Membros
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Quadro oficial de obreiros, dados civis, graus e cargos na oficina.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setModalCadastroAberto(true)}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)',
              }
            }}
          >
            Novo Membro
          </Button>
        </Box>
      </Box>

      {/* Barra de Filtros no Padrão Paper do SiGMa */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '16px',
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar membro por nome, email ou CIM..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && carregarObreiros()}
          sx={{
            mb: 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'transparent',
              '& fieldset': {
                borderColor: alpha(theme.palette.divider, 0.2),
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
            }
          }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, mt: 2.5, flexWrap: 'wrap' }}>
          {['Todos', 'Aprendiz', 'Companheiro', 'Mestre', 'Mestre Instalado'].map((grau) => {
            const isAtivo = (grau === 'Todos' && !filtroGrau) || filtroGrau === grau;
            return (
              <Chip
                key={grau}
                label={grau === 'Todos' ? 'Todos os Graus' : grau}
                onClick={() => setFiltroGrau(grau === 'Todos' ? '' : grau)}
                sx={{
                  fontWeight: isAtivo ? 700 : 500,
                  backgroundColor: isAtivo ? alpha(theme.palette.primary.main, 0.2) : 'transparent',
                  color: isAtivo ? theme.palette.primary.main : theme.palette.text.secondary,
                  border: `1px solid ${isAtivo ? theme.palette.primary.main : alpha(theme.palette.divider, 0.2)}`,
                  borderRadius: '16px',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* Tabela do Quadro de Membros no Padrão Canônico SiGMa (Floating Pill Rows) */}
      <Paper
        elevation={3}
        sx={{
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          borderRadius: '16px',
          p: 3,
          mt: 2
        }}
      >
        <TableContainer
          component={Box}
          sx={{
            backgroundColor: 'transparent',
            overflowX: 'auto'
          }}
        >
          <Table
            sx={{
              borderCollapse: 'separate',
              borderSpacing: '0 8px',
              minWidth: 700
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, pl: 3 }}>FOTO</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>CIM</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>NOME COMPLETO</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>GRAU SIMBÓLICO</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>CARGO EM LOJA</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>CONTATO</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>STATUS</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, textAlign: 'right', pr: 3 }}>AÇÃO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                    <CircularProgress color="primary" />
                  </TableCell>
                </TableRow>
              ) : obreiros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary', borderBottom: 'none' }}>
                    Nenhum obreiro encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                obreiros.map((ob) => (
                  <TableRow
                    key={ob.id}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.7),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.background.paper, 0.9),
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <TableCell
                      sx={{
                        borderBottom: 'none',
                        py: 1,
                        pl: 3,
                        borderTopLeftRadius: '50px',
                        borderBottomLeftRadius: '50px',
                        color: 'text.primary'
                      }}
                    >
                      <Avatar
                        src={ob.caminho_foto_perfil ? `${import.meta.env.VITE_LOJAS_API_URL || 'http://localhost:8001'}${ob.caminho_foto_perfil}` : undefined}
                        alt={ob.nome_completo}
                        sx={{
                          width: 34,
                          height: 34,
                          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                          bgcolor: 'primary.dark',
                          color: '#fff',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        {ob.nome_completo.charAt(0)}
                      </Avatar>
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', fontFamily: 'monospace' }}>
                      {ob.cim || '—'}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.85rem', fontWeight: 600, color: 'text.primary' }}>
                      {ob.nome_completo}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                      <Chip
                        label={ob.grau || 'Aprendiz'}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: ob.grau === 'Aprendiz' ? 'rgba(34, 197, 94, 0.15)' : ob.grau === 'Companheiro' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                          color: ob.grau === 'Aprendiz' ? '#22c55e' : ob.grau === 'Companheiro' ? '#38bdf8' : '#D4AF37',
                          border: `1px solid ${ob.grau === 'Aprendiz' ? 'rgba(34, 197, 94, 0.3)' : ob.grau === 'Companheiro' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`,
                          borderRadius: '12px'
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1, fontSize: '0.8rem', color: ob.cargo_atual ? '#D4AF37' : 'text.secondary', fontWeight: ob.cargo_atual ? 600 : 400 }}>
                      {ob.cargo_atual || 'Membro do Quadro'}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {ob.telefone && (
                          <Tooltip title={`WhatsApp: ${ob.telefone}`}>
                            <IconButton
                              size="small"
                              color="success"
                              component="a"
                              href={`https://wa.me/${ob.telefone.replace(/\D/g, '')}`}
                              target="_blank"
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {ob.email && (
                          <Tooltip title={`E-mail: ${ob.email}`}>
                            <IconButton
                              size="small"
                              color="inherit"
                              component="a"
                              href={`mailto:${ob.email}`}
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                      <Chip
                        label={ob.status || 'Ativo'}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '0.7rem',
                          backgroundColor: (ob.status === 'Ativo' || !ob.status) ? '#22c55e' : alpha(theme.palette.warning.main, 0.8),
                          color: '#fff',
                          fontWeight: 700,
                          borderRadius: '12px',
                          px: 1
                        }}
                      />
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: 'none',
                        py: 1,
                        textAlign: 'right',
                        pr: 3,
                        borderTopRightRadius: '50px',
                        borderBottomRightRadius: '50px'
                      }}
                    >
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => abrirDetalhe(ob.id)}
                        sx={{
                          color: 'primary.main',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          minWidth: 'auto',
                          padding: '4px 10px',
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: 'rgba(56, 189, 248, 0.1)'
                          }
                        }}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal: Ficha Detalhada do Obreiro */}
      <Dialog
        open={modalDetalheAberto}
        onClose={() => setModalDetalheAberto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: 'divider' }}>
          Ficha Cadastral do Obreiro
        </DialogTitle>
        <DialogContent sx={{ minHeight: 350 }}>
          {carregandoDetalhe || !obreiroSelecionado ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                <Avatar
                  src={obreiroSelecionado.caminho_foto_perfil}
                  sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24, fontWeight: 700 }}
                >
                  {obreiroSelecionado.nome_completo.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {obreiroSelecionado.nome_completo}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    CIM: {obreiroSelecionado.cim || 'Não Informado'} • CPF: {obreiroSelecionado.cpf || '—'}
                  </Typography>
                </Box>
              </Box>

              <Tabs value={abaDetalhe} onChange={(_, val) => setAbaDetalhe(val)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Dados Civis" />
                <Tab label="Dados Maçônicos" />
                <Tab label="Família" />
                <Tab label="Mandatos & Honrarias" />
              </Tabs>

              {/* Aba 1: Dados Civis */}
              <CustomTabPanel value={abaDetalhe} index={0}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>DATA DE NASCIMENTO</Typography>
                    <Typography variant="body2">{obreiroSelecionado.data_nascimento || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ESTADO CIVIL</Typography>
                    <Typography variant="body2">{obreiroSelecionado.estado_civil || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TIPO SANGUÍNEO</Typography>
                    <Typography variant="body2">{obreiroSelecionado.tipo_sanguineo || '—'}</Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>FILIAÇÃO (PAI)</Typography>
                    <Typography variant="body2">{obreiroSelecionado.nome_pai || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>FILIAÇÃO (MÃE)</Typography>
                    <Typography variant="body2">{obreiroSelecionado.nome_mae || '—'}</Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>PROFISSÃO</Typography>
                    <Typography variant="body2">{obreiroSelecionado.profissao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ENDEREÇO</Typography>
                    <Typography variant="body2">
                      {obreiroSelecionado.logradouro ? `${obreiroSelecionado.logradouro}, ${obreiroSelecionado.numero || 'SN'} - ${obreiroSelecionado.bairro || ''} (${obreiroSelecionado.cidade || ''}/${obreiroSelecionado.estado || ''})` : '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </CustomTabPanel>

              {/* Aba 2: Dados Maçônicos */}
              <CustomTabPanel value={abaDetalhe} index={1}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>GRAU SIMBÓLICO</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {obreiroSelecionado.grau}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>INICIAÇÃO</Typography>
                    <Typography variant="body2">{obreiroSelecionado.data_iniciacao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ELEVAÇÃO</Typography>
                    <Typography variant="body2">{obreiroSelecionado.data_elevacao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>EXALTAÇÃO</Typography>
                    <Typography variant="body2">{obreiroSelecionado.data_exaltacao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>INSTALAÇÃO</Typography>
                    <Typography variant="body2">{obreiroSelecionado.data_instalacao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>REGULARIDADE FINANCEIRA</Typography>
                    <Typography variant="body2" sx={{ color: obreiroSelecionado.regularidade_financeira ? 'success.main' : 'error.main', fontWeight: 600 }}>
                      {obreiroSelecionado.regularidade_financeira ? 'Regular' : 'Pendente'}
                    </Typography>
                  </Grid>
                </Grid>
              </CustomTabPanel>

              {/* Aba 3: Família */}
              <CustomTabPanel value={abaDetalhe} index={2}>
                {obreiroSelecionado.familiares?.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                    Nenhum familiar cadastrado.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {obreiroSelecionado.familiares.map((fam: any) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={fam.id}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{fam.nome_completo}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {fam.tipo_relacionamento} {fam.telefone ? `• ${fam.telefone}` : ''}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CustomTabPanel>

              {/* Aba 4: Mandatos & Honrarias */}
              <CustomTabPanel value={abaDetalhe} index={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Histórico de Mandatos em Loja</Typography>
                {obreiroSelecionado.mandatos?.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Nenhum mandato registrado nesta oficina.
                  </Typography>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    {obreiroSelecionado.mandatos.map((m: any) => (
                      <Box key={m.id} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.cargo_nome || `Cargo #${m.cargo_id}`}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Início: {m.data_inicio} {m.data_fim ? `• Fim: ${m.data_fim}` : '• Atual'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CustomTabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalDetalheAberto(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Novo Obreiro */}
      <Dialog
        open={modalCadastroAberto}
        onClose={() => setModalCadastroAberto(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSalvarObreiro}>
          <DialogTitle sx={{ fontWeight: 700 }}>Cadastrar Novo Obreiro</DialogTitle>
          <DialogContent>
            {erroCadastro && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {erroCadastro}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Nome Completo"
                  fullWidth
                  required
                  value={novoObreiro.nome_completo}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, nome_completo: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="CIM (7 dígitos)"
                  fullWidth
                  value={novoObreiro.cim}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, cim: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="CPF"
                  fullWidth
                  value={novoObreiro.cpf}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, cpf: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="E-mail"
                  type="email"
                  fullWidth
                  required
                  value={novoObreiro.email}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, email: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Telefone (WhatsApp)"
                  fullWidth
                  value={novoObreiro.telefone}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, telefone: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Grau Maçônico"
                  fullWidth
                  value={novoObreiro.grau}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, grau: e.target.value })}
                >
                  <MenuItem value="Aprendiz">Aprendiz</MenuItem>
                  <MenuItem value="Companheiro">Companheiro</MenuItem>
                  <MenuItem value="Mestre">Mestre</MenuItem>
                  <MenuItem value="Mestre Instalado">Mestre Instalado</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Data de Nascimento"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={novoObreiro.data_nascimento}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, data_nascimento: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Tipo Sanguíneo"
                  fullWidth
                  placeholder="Ex: O+, A+, etc."
                  value={novoObreiro.tipo_sanguineo}
                  onChange={(e) => setNovoObreiro({ ...novoObreiro, tipo_sanguineo: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalCadastroAberto(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={salvandoCadastro}>
              {salvandoCadastro ? 'Salvando...' : 'Cadastrar Obreiro'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
