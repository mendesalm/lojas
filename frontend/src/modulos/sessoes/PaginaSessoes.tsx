// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  HowToReg as PersonCheckIcon,
  CheckCircle as PresentIcon
} from '@mui/icons-material';
import { useAuth, clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

export const PaginaSessoes: React.FC = () => {
  const { lojaAtivaId } = useAuth();

  const [sessoes, setSessoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal Detalhes e Chamada
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [sessaoSelecionada, setSessaoSelecionada] = useState<any>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  // Modal Agendamento
  const [modalAgendamentoAberto, setModalAgendamentoAberto] = useState(false);
  const [salvandoSessao, setSalvandoSessao] = useState(false);
  const [erroAgendamento, setErroAgendamento] = useState('');
  const [novaSessao, setNovaSessao] = useState({
    titulo: '',
    numero_sessao: '',
    data_sessao: '',
    hora_inicio: '20:00',
    tipo: 'Ordinária',
    subtipo: 'Regular',
    pauta: '',
  });

  const carregarSessoes = async () => {
    try {
      setCarregando(true);
      const res = await clienteHttp.get(`/lojas/${lojaAtivaId}/sessoes`);
      setSessoes(res.data);
    } catch (err) {
      console.error('Erro ao listar sessões:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarSessoes();
  }, [lojaAtivaId]);

  const abrirDetalheSessao = async (id: number) => {
    try {
      setCarregandoDetalhe(true);
      setModalDetalheAberto(true);
      const res = await clienteHttp.get(`/lojas/${lojaAtivaId}/sessoes/${id}`);
      setSessaoSelecionada(res.data);
    } catch (err) {
      console.error('Erro ao carregar detalhes da sessão:', err);
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const handleSalvarSessao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvandoSessao(true);
      setErroAgendamento('');
      await clienteHttp.post(`/lojas/${lojaAtivaId}/sessoes`, {
        ...novaSessao,
        loja_id: lojaAtivaId,
        numero_sessao: novaSessao.numero_sessao ? parseInt(novaSessao.numero_sessao) : null,
      });
      setModalAgendamentoAberto(false);
      carregarSessoes();
      setNovaSessao({
        titulo: '',
        numero_sessao: '',
        data_sessao: '',
        hora_inicio: '20:00',
        tipo: 'Ordinária',
        subtipo: 'Regular',
        pauta: '',
      });
    } catch (err) {
      setErroAgendamento(extrairMensagemErro(err, 'Erro ao agendar sessão.'));
    } finally {
      setSalvandoSessao(false);
    }
  };

  const alterarStatusSessao = async (sessaoId: number, novoStatus: string) => {
    try {
      await clienteHttp.put(`/lojas/${lojaAtivaId}/sessoes/${sessaoId}`, {
        status: novoStatus,
      });
      carregarSessoes();
      if (sessaoSelecionada && sessaoSelecionada.id === sessaoId) {
        abrirDetalheSessao(sessaoId);
      }
    } catch (err) {
      alert(extrairMensagemErro(err, 'Erro ao alterar status da sessão.'));
    }
  };

  const theme = useTheme();
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const sessoesFiltradas = sessoes.filter((s) => {
    if (filtroStatus && s.status !== filtroStatus) return false;
    if (filtroDataInicio && s.data_sessao < filtroDataInicio) return false;
    if (filtroDataFim && s.data_sessao > filtroDataFim) return false;
    return true;
  });

  const obterChipStatus = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return (
          <Chip
            label="Em Andamento"
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px'
            }}
          />
        );
      case 'AGENDADA':
        return (
          <Chip
            label="Agendada"
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px'
            }}
          />
        );
      case 'ENCERRADA':
      case 'REALIZADA':
        return (
          <Chip
            label="Realizada"
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: 'rgba(148, 163, 184, 0.15)',
              color: theme.palette.text.secondary,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px'
            }}
          />
        );
      default:
        return <Chip label={status} size="small" sx={{ borderRadius: '12px' }} />;
    }
  };

  return (
    <Box>
      {/* Cabeçalho da Página */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
            Sessões Maçônicas
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Agendamento litúrgico, controle de presenças em tempo real e livro de chamada.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalAgendamentoAberto(true)}
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
          Nova Sessão
        </Button>
      </Box>

      {/* Barra de Filtros no Padrão SiGMa */}
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
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Data Início"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Data Fim"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              select
              label="Status da Sessão"
              size="small"
              fullWidth
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              <MenuItem value="">Todos os Status</MenuItem>
              <MenuItem value="AGENDADA">Agendada</MenuItem>
              <MenuItem value="EM_ANDAMENTO">Em Andamento</MenuItem>
              <MenuItem value="ENCERRADA">Encerrada / Realizada</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, mt: 2.5, flexWrap: 'wrap' }}>
          {['Todos', 'AGENDADA', 'EM_ANDAMENTO', 'ENCERRADA'].map((st) => {
            const isAtivo = (st === 'Todos' && !filtroStatus) || filtroStatus === st;
            const label = st === 'Todos' ? 'Todas as Sessões' : st === 'AGENDADA' ? 'Agendadas' : st === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Realizadas';
            return (
              <Chip
                key={st}
                label={label}
                onClick={() => setFiltroStatus(st === 'Todos' ? '' : st)}
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

      {/* Tabela de Sessões no Padrão Canônico SiGMa (Floating Pill Rows) */}
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
        <TableContainer component={Box} sx={{ backgroundColor: 'transparent', overflowX: 'auto' }}>
          <Table sx={{ borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, pl: 3 }}>DATA</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>TÍTULO DA SESSÃO</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>TIPO / GRAU</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>HORÁRIO</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>PRESENTES</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>STATUS</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, textAlign: 'right', pr: 3 }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                    <CircularProgress color="primary" />
                  </TableCell>
                </TableRow>
              ) : sessoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary', borderBottom: 'none' }}>
                    Nenhuma sessão encontrada para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                sessoesFiltradas.map((s) => (
                  <TableRow
                    key={s.id}
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
                        py: 1.2,
                        pl: 3,
                        borderTopLeftRadius: '50px',
                        borderBottomLeftRadius: '50px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: 'primary.main',
                      }}
                    >
                      {new Date(s.data_sessao).toLocaleDateString('pt-BR')}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.88rem' }}>
                        {s.titulo}
                      </Typography>
                      {s.numero_sessao && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Sessão nº {s.numero_sessao}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.primary' }}>
                        {s.tipo}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {s.subtipo || 'Regular'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2, fontSize: '0.85rem', color: 'text.secondary' }}>
                      {s.hora_inicio || '20:00'}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                      <Chip
                        label={`${s.total_presentes || 0} Irmãos`}
                        size="small"
                        icon={<PresentIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          height: '22px',
                          fontSize: '0.72rem',
                          borderRadius: '12px',
                          bgcolor: alpha(theme.palette.divider, 0.2),
                          color: 'text.primary'
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                      {obterChipStatus(s.status)}
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: 'none',
                        py: 1.2,
                        textAlign: 'right',
                        pr: 3,
                        borderTopRightRadius: '50px',
                        borderBottomRightRadius: '50px'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => abrirDetalheSessao(s.id)}
                          sx={{
                            color: 'primary.main',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            minWidth: 'auto',
                            padding: '4px 8px',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(56, 189, 248, 0.1)'
                            }
                          }}
                        >
                          Presenças
                        </Button>
                        {s.status === 'AGENDADA' && (
                          <Tooltip title="Iniciar Sessão (Abrir Trabalhos)">
                            <IconButton color="success" size="small" onClick={() => alterarStatusSessao(s.id, 'EM_ANDAMENTO')}>
                              <StartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {s.status === 'EM_ANDAMENTO' && (
                          <Tooltip title="Encerrar Sessão">
                            <IconButton color="error" size="small" onClick={() => alterarStatusSessao(s.id, 'ENCERRADA')}>
                              <StopIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal: Detalhes da Sessão & Livro de Presença */}
      <Dialog
        open={modalDetalheAberto}
        onClose={() => setModalDetalheAberto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: 1, borderColor: 'divider' }}>
          Detalhes da Sessão e Livro de Presença
        </DialogTitle>
        <DialogContent sx={{ minHeight: 350, py: 2.5 }}>
          {carregandoDetalhe || !sessaoSelecionada ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {sessaoSelecionada.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Data: {sessaoSelecionada.data_sessao} • Horário: {sessaoSelecionada.hora_inicio || '20:00'} • {sessaoSelecionada.tipo} ({sessaoSelecionada.subtipo})
                  </Typography>
                </Box>
                {obterChipStatus(sessaoSelecionada.status)}
              </Box>

              {sessaoSelecionada.pauta && (
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    PAUTA DOS TRABALHOS
                  </Typography>
                  <Typography variant="body2">{sessaoSelecionada.pauta}</Typography>
                </Box>
              )}

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Livro de Chamada ({sessaoSelecionada.presencas?.length || 0} Registros)
              </Typography>

              {sessaoSelecionada.presencas?.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                  Nenhuma presença registrada até o momento nesta sessão.
                </Typography>
              ) : (
                <List disablePadding>
                  {sessaoSelecionada.presencas.map((p: any, idx: number) => (
                    <React.Fragment key={p.id}>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {p.obreiro_nome || p.visitante_nome || 'Irmão'} {p.obreiro_grau ? `(${p.obreiro_grau})` : ''}
                            </Typography>
                          }
                          secondary={`Status: ${p.status_presenca} • Método: ${p.metodo_checkin || 'QR_CODE'} ${p.obreiro_cim ? `• CIM ${p.obreiro_cim}` : ''}`}
                        />
                        <Chip label={p.status_presenca} size="small" color={p.status_presenca === 'PRESENTE' ? 'success' : 'default'} />
                      </ListItem>
                      {idx < sessaoSelecionada.presencas.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalDetalheAberto(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Agendar Nova Sessão */}
      <Dialog
        open={modalAgendamentoAberto}
        onClose={() => setModalAgendamentoAberto(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSalvarSessao}>
          <DialogTitle sx={{ fontWeight: 700 }}>Agendar Nova Sessão</DialogTitle>
          <DialogContent>
            {erroAgendamento && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {erroAgendamento}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Título da Sessão"
                  fullWidth
                  required
                  placeholder="Ex: Sessão Magna de Iniciação"
                  value={novaSessao.titulo}
                  onChange={(e) => setNovaSessao({ ...novaSessao, titulo: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Data da Sessão"
                  type="date"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={novaSessao.data_sessao}
                  onChange={(e) => setNovaSessao({ ...novaSessao, data_sessao: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Horário de Início"
                  type="time"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={novaSessao.hora_inicio}
                  onChange={(e) => setNovaSessao({ ...novaSessao, hora_inicio: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Tipo de Sessão"
                  fullWidth
                  value={novaSessao.tipo}
                  onChange={(e) => setNovaSessao({ ...novaSessao, tipo: e.target.value })}
                >
                  <MenuItem value="Ordinária">Ordinária</MenuItem>
                  <MenuItem value="Magna">Magna</MenuItem>
                  <MenuItem value="Extraordinária">Extraordinária</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Número da Sessão no Ano"
                  type="number"
                  fullWidth
                  placeholder="Ex: 12"
                  value={novaSessao.numero_sessao}
                  onChange={(e) => setNovaSessao({ ...novaSessao, numero_sessao: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Pauta dos Trabalhos"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Descreva a ordem do dia e expedientes..."
                  value={novaSessao.pauta}
                  onChange={(e) => setNovaSessao({ ...novaSessao, pauta: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalAgendamentoAberto(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={salvandoSessao}>
              {salvandoSessao ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
