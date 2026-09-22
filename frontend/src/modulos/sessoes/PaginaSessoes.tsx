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
  Divider
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

  const obterChipStatus = (status: string) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return <Chip label="Em Andamento" color="success" size="small" sx={{ fontWeight: 700 }} />;
      case 'AGENDADA':
        return <Chip label="Agendada" color="primary" size="small" variant="outlined" />;
      case 'ENCERRADA':
      case 'REALIZADA':
        return <Chip label="Encerrada" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Sessões Maçônicas & Frequência
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Agendamento litúrgico, controle de presenças em tempo real e livro de chamada.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalAgendamentoAberto(true)}
          sx={{ fontWeight: 600 }}
        >
          Agendar Sessão
        </Button>
      </Box>

      {/* Tabela de Sessões */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sessão</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo / Subtipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Horário</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Presentes</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress color="primary" />
                  </TableCell>
                </TableRow>
              ) : sessoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Nenhuma sessão agendada no histórico.
                  </TableCell>
                </TableRow>
              ) : (
                sessoes.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.data_sessao}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {s.titulo}
                      </Typography>
                      {s.numero_sessao && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Sessão nº {s.numero_sessao}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.tipo}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.subtipo}</Typography>
                    </TableCell>
                    <TableCell>{s.hora_inicio || '20:00'}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${s.total_presentes || 0} Irmãos`}
                        size="small"
                        color="default"
                        icon={<PresentIcon sx={{ fontSize: 16 }} />}
                      />
                    </TableCell>
                    <TableCell>{obterChipStatus(s.status)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Abrir Livro de Presença">
                          <IconButton color="primary" size="small" onClick={() => abrirDetalheSessao(s.id)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
      </Card>

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
