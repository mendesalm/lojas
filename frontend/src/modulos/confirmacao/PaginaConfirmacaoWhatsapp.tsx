// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  LinkOff as LinkOffIcon,
  Print as PrintIcon,
  QrCode2 as QrCodeIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartAltIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { useAuth } from '@/compartilhado/contextos/AuthContext';
import {
  servicoConfirmacao,
  type ListaConfirmacao,
  type PainelConfirmacao,
  type PublicadorAutorizado,
  type WhatsappGrupo,
  type WhatsappStatus,
} from './servicoConfirmacao';

const DIAS_SEMANA = [
  { valor: 0, nome: 'Segunda-feira' },
  { valor: 1, nome: 'Terça-feira' },
  { valor: 2, nome: 'Quarta-feira' },
  { valor: 3, nome: 'Quinta-feira' },
  { valor: 4, nome: 'Sexta-feira' },
  { valor: 5, nome: 'Sábado' },
  { valor: 6, nome: 'Domingo' },
];

export const PaginaConfirmacaoWhatsapp: React.FC = () => {
  const { lojaAtivaId } = useAuth();
  const [aba, setAba] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [painel, setPainel] = useState<PainelConfirmacao | null>(null);
  const [historico, setHistorico] = useState<ListaConfirmacao[]>([]);
  const [publicadores, setPublicadores] = useState<PublicadorAutorizado[]>([]);
  const [waStatus, setWaStatus] = useState<WhatsappStatus | null>(null);
  const [waGrupos, setWaGrupos] = useState<WhatsappGrupo[]>([]);

  // Formulário de Publicação
  const [textoAnuncio, setTextoAnuncio] = useState('');
  const [tituloEvento, setTituloEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [incluirAnunciante, setIncluirAnunciante] = useState(true);
  const [primeiroNomeAnunc, setPrimeiroNomeAnunc] = useState('');
  const [ultimoNomeAnunc, setUltimoNomeAnunc] = useState('');
  const [acompAnunc, setAcompAnunc] = useState<number>(0);
  const [publicando, setPublicando] = useState(false);

  // Filtro & Inserção Manual
  const [busca, setBusca] = useState('');
  const [modalManualAberto, setModalManualAberto] = useState(false);
  const [manualPrimeiro, setManualPrimeiro] = useState('');
  const [manualUltimo, setManualUltimo] = useState('');
  const [manualAcomp, setManualAcomp] = useState<number>(0);
  const [manualObs, setManualObs] = useState('');

  // Publicadores
  const [novoPubEmail, setNovoPubEmail] = useState('');
  const [novoPubNome, setNovoPubNome] = useState('');
  const [novoPubObs, setNovoPubObs] = useState('');

  // Configuração / Horários & Regras
  const [cfgSlug, setCfgSlug] = useState('');
  const [cfgUrlBase, setCfgUrlBase] = useState('');
  const [cfgGrupoJid, setCfgGrupoJid] = useState('');
  const [cfgGrupoNome, setCfgGrupoNome] = useState('');
  const [cfgHorariosNormais, setCfgHorariosNormais] = useState('08:00,14:00,18:00');
  const [cfgHorariosEvento, setCfgHorariosEvento] = useState('08:00,14:00');
  const [cfgDiaReset, setCfgDiaReset] = useState<number>(5);
  const [cfgHorarioReset, setCfgHorarioReset] = useState('00:00');
  const [cfgRepublicar, setCfgRepublicar] = useState(true);
  const [salvandoCfg, setSalvandoCfg] = useState(false);

  const carregarPainel = useCallback(async () => {
    if (!lojaAtivaId) return;
    try {
      setCarregando(true);
      setErro(null);
      const dados = await servicoConfirmacao.obterPainel(lojaAtivaId);
      setPainel(dados);
      setPrimeiroNomeAnunc((prev) => prev || dados.usuario_logado_primeiro_nome);
      setUltimoNomeAnunc((prev) => prev || dados.usuario_logado_ultimo_nome);

      setCfgSlug(dados.configuracao.slug_publico);
      setCfgUrlBase(dados.configuracao.url_publica_base || '');
      setCfgGrupoJid(dados.configuracao.grupo_whatsapp_jid || '');
      setCfgGrupoNome(dados.configuracao.grupo_whatsapp_nome || '');
      setCfgHorariosNormais(dados.configuracao.horarios_dias_normais);
      setCfgHorariosEvento(dados.configuracao.horarios_dia_evento);
      setCfgDiaReset(dados.configuracao.dia_semana_reset);
      setCfgHorarioReset(dados.configuracao.horario_reset);
      setCfgRepublicar(dados.configuracao.republicar_ao_confirmar);
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao carregar painel de confirmação WhatsApp.');
    } finally {
      setCarregando(false);
    }
  }, [lojaAtivaId]);

  useEffect(() => {
    carregarPainel();
  }, [carregarPainel]);

  const carregarAbaSecundaria = useCallback(
    async (indiceAba: number) => {
      if (!lojaAtivaId) return;
      try {
        if (indiceAba === 1) {
          const hist = await servicoConfirmacao.listarHistorico(lojaAtivaId);
          setHistorico(hist);
        } else if (indiceAba === 2 && painel?.eh_gestao_loja) {
          const pubs = await servicoConfirmacao.listarPublicadores(lojaAtivaId);
          setPublicadores(pubs);
        } else if (indiceAba === 3 && painel?.eh_gestao_loja) {
          const st = await servicoConfirmacao.whatsappStatus(lojaAtivaId);
          setWaStatus(st);
          if (st.connected) {
            const grp = await servicoConfirmacao.whatsappGrupos(lojaAtivaId);
            setWaGrupos(grp.groups || []);
          }
        }
      } catch (err: any) {
        setErro(err?.response?.data?.detail || 'Erro ao carregar dados da aba.');
      }
    },
    [lojaAtivaId, painel?.eh_gestao_loja]
  );

  useEffect(() => {
    carregarAbaSecundaria(aba);
  }, [aba, carregarAbaSecundaria]);

  const handlePreviewTexto = async () => {
    if (!lojaAtivaId || textoAnuncio.trim().length < 3) return;
    try {
      const prev = await servicoConfirmacao.previewAnuncio(lojaAtivaId, textoAnuncio);
      setDataEvento(prev.data_evento);
      setTituloEvento(prev.titulo_sugerido);
    } catch {
      // Silencioso no preview
    }
  };

  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaAtivaId) return;
    try {
      setPublicando(true);
      setErro(null);
      setAviso(null);
      await servicoConfirmacao.publicarLista(lojaAtivaId, {
        texto_anuncio: textoAnuncio,
        titulo: tituloEvento || undefined,
        data_evento: dataEvento || undefined,
        incluir_anunciante: incluirAnunciante,
        primeiro_nome_anunciante: primeiroNomeAnunc,
        ultimo_nome_anunciante: ultimoNomeAnunc,
        acompanhantes_anunciante: acompAnunc,
      });
      setAviso('Lista publicada e enviada ao grupo do WhatsApp!');
      setTextoAnuncio('');
      setTituloEvento('');
      setDataEvento('');
      await carregarPainel();
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao publicar lista.');
    } finally {
      setPublicando(false);
    }
  };

  const handleDispararAgora = async () => {
    if (!lojaAtivaId) return;
    try {
      setErro(null);
      const log = await servicoConfirmacao.dispararAgora(lojaAtivaId);
      setAviso(
        log.modo_simulador
          ? 'Disparo registrado em Modo Simulador (configure WA_GATEWAY_URL e grupo para envio real).'
          : log.sucesso
          ? 'Lista disparada no grupo do WhatsApp!'
          : `Falha no disparo: ${log.erro}`
      );
      await carregarPainel();
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao disparar lista.');
    }
  };

  const handleResetarLista = async () => {
    if (!lojaAtivaId) return;
    try {
      setErro(null);
      await servicoConfirmacao.resetarLista(lojaAtivaId);
      setAviso('Lista atual arquivada. O link público está em espera até a próxima publicação.');
      await carregarPainel();
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao arquivar lista.');
    }
  };

  const handleBaixarCsv = async (listaId: number) => {
    if (!lojaAtivaId) return;
    try {
      const blob = await servicoConfirmacao.baixarCsv(lojaAtivaId, listaId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lista_confirmacao_${listaId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao exportar CSV.');
    }
  };

  const handleTogglePresente = async (regId: number, atual: boolean) => {
    if (!lojaAtivaId) return;
    try {
      await servicoConfirmacao.atualizarRegistro(lojaAtivaId, regId, { presente: !atual });
      await carregarPainel();
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao atualizar check-in.');
    }
  };

  const handleRemoverRegistro = async (regId: number) => {
    if (!lojaAtivaId) return;
    try {
      await servicoConfirmacao.removerRegistro(lojaAtivaId, regId);
      await carregarPainel();
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao remover registro.');
    }
  };

  const handleInserirManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaAtivaId) return;
    try {
      await servicoConfirmacao.inserirRegistroManual(lojaAtivaId, {
        primeiro_nome: manualPrimeiro,
        ultimo_nome: manualUltimo,
        acompanhantes: manualAcomp,
        observacao: manualObs || undefined,
      });
      setModalManualAberto(false);
      setManualPrimeiro('');
      setManualUltimo('');
      setManualAcomp(0);
      setManualObs('');
      await carregarPainel();
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao inserir registro manual.');
    }
  };

  const handleAdicionarPublicador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaAtivaId) return;
    try {
      await servicoConfirmacao.adicionarPublicador(lojaAtivaId, {
        email: novoPubEmail,
        nome: novoPubNome || undefined,
        observacao: novoPubObs || undefined,
      });
      setNovoPubEmail('');
      setNovoPubNome('');
      setNovoPubObs('');
      await carregarAbaSecundaria(2);
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao autorizar publicador.');
    }
  };

  const handleSalvarConfiguracao = async () => {
    if (!lojaAtivaId) return;
    try {
      setSalvandoCfg(true);
      setErro(null);
      await servicoConfirmacao.atualizarConfiguracao(lojaAtivaId, {
        slug_publico: cfgSlug,
        url_publica_base: cfgUrlBase || null,
        grupo_whatsapp_jid: cfgGrupoJid || null,
        grupo_whatsapp_nome: cfgGrupoNome || null,
        horarios_dias_normais: cfgHorariosNormais,
        horarios_dia_evento: cfgHorariosEvento,
        dia_semana_reset: cfgDiaReset,
        horario_reset: cfgHorarioReset,
        republicar_ao_confirmar: cfgRepublicar,
      });
      setAviso('Configurações salvas com sucesso!');
      await carregarPainel();
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao salvar configurações.');
    } finally {
      setSalvandoCfg(false);
    }
  };

  const registrosFiltrados = useMemo(() => {
    if (!painel?.registros) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return painel.registros;
    return painel.registros.filter((r) =>
      `${r.primeiro_nome} ${r.ultimo_nome} ${r.origem} ${r.status}`.toLowerCase().includes(q)
    );
  }, [painel?.registros, busca]);

  if (carregando && !painel) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3, gap: 1.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WhatsAppIcon color="primary" /> Lista de Confirmação via WhatsApp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Publicação semanal, link público sem login, disparos automáticos e relatório de presença
          </Typography>
        </Box>
        {painel?.url_publica_efetiva && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(painel.url_publica_efetiva);
              setAviso('Link público copiado para a área de transferência!');
            }}
          >
            Copiar Link Público
          </Button>
        )}
      </Stack>

      {erro && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}
      {aviso && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={aba} onChange={(_e, v) => setAba(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Publicar & Relatório" />
          <Tab label="Histórico Semanal" icon={<HistoryIcon fontSize="small" />} iconPosition="start" />
          {painel?.eh_gestao_loja && <Tab label="Publicadores Autorizados" />}
          {painel?.eh_gestao_loja && <Tab label="WhatsApp & Logs" icon={<QrCodeIcon fontSize="small" />} iconPosition="start" />}
          {painel?.eh_gestao_loja && <Tab label="Horários & Regras" icon={<ScheduleIcon fontSize="small" />} iconPosition="start" />}
        </Tabs>
      </Paper>

      {/* ABA 0: PUBLICAR & RELATÓRIO */}
      {aba === 0 && (
        <Stack spacing={3}>
          {/* Cards Totalizadores */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Irmãos Confirmados
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {painel?.totais.irmaos_confirmados ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Acompanhantes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {painel?.totais.acompanhantes ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Geral de Pessoas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {painel?.totais.total_pessoas ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Próximo Disparo
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {painel?.proximo_disparo || 'Sem agendamentos'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Formulário de Nova Publicação */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Publicar Novo Anúncio Semanal
              </Typography>
              <form onSubmit={handlePublicar}>
                <Stack spacing={2}>
                  <TextField
                    label="Texto do Anúncio (cole ou digite o convite — a data e o título são extraídos automaticamente)"
                    multiline
                    minRows={3}
                    value={textoAnuncio}
                    onChange={(e) => setTextoAnuncio(e.target.value)}
                    onBlur={handlePreviewTexto}
                    placeholder='Ex.: Solicito aos Irmãos preencher a Lista de Confirmação no jantar do irmão fulano e cunhada cicrana, dia 27/11/2026'
                    required
                  />
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      label="Título Sugerido (editável)"
                      value={tituloEvento}
                      onChange={(e) => setTituloEvento(e.target.value)}
                      sx={{ flex: 2 }}
                    />
                    <TextField
                      label="Data do Evento"
                      type="date"
                      value={dataEvento}
                      onChange={(e) => setDataEvento(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={{ flex: 1 }}
                    />
                    <Button variant="outlined" onClick={handlePreviewTexto} sx={{ whiteSpace: 'nowrap' }}>
                      Extrair Data/Título
                    </Button>
                  </Stack>

                  <Divider />

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={incluirAnunciante}
                        onChange={(e) => setIncluirAnunciante(e.target.checked)}
                      />
                    }
                    label="Eu vou participar deste evento (já me incluir como #1 na lista)"
                  />

                  {incluirAnunciante && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Meu Primeiro Nome"
                        value={primeiroNomeAnunc}
                        onChange={(e) => setPrimeiroNomeAnunc(e.target.value)}
                      />
                      <TextField
                        label="Meu Último Nome"
                        value={ultimoNomeAnunc}
                        onChange={(e) => setUltimoNomeAnunc(e.target.value)}
                      />
                      <TextField
                        label="Meus Acompanhantes"
                        type="number"
                        value={acompAnunc}
                        onChange={(e) => setAcompAnunc(Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
                        slotProps={{ htmlInput: { min: 0, max: 50 } }}
                      />
                    </Stack>
                  )}

                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={publicando || !textoAnuncio.trim()}
                      startIcon={<SendIcon />}
                    >
                      {publicando ? 'Publicando...' : 'Publicar e Disparar no WhatsApp'}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>

          {/* Relatório da Lista Aberta */}
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 1.5, mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {painel?.lista_aberta ? painel.lista_aberta.titulo : 'Nenhuma Lista Aberta no Momento'}
                  </Typography>
                  {painel?.lista_aberta && (
                    <Typography variant="caption" color="text.secondary">
                      Evento: {painel.lista_aberta.data_evento.split('-').reverse().join('/')} • Publicado por{' '}
                      {painel.lista_aberta.publicado_por_nome}
                    </Typography>
                  )}
                </Box>

                {painel?.lista_aberta && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setModalManualAberto(true)}>
                      Inserir Manual
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<SendIcon />} onClick={handleDispararAgora}>
                      Disparar Agora
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleBaixarCsv(painel.lista_aberta!.id)}
                    >
                      CSV
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
                      Imprimir / PDF
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<RestartAltIcon />}
                      onClick={handleResetarLista}
                    >
                      Encerrar / Reset
                    </Button>
                  </Stack>
                )}
              </Stack>

              {painel?.lista_aberta && (
                <>
                  <TextField
                    label="Buscar na lista (nome, origem ou status)"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    sx={{ mb: 2, maxWidth: 360 }}
                  />
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Primeiro Nome</TableCell>
                          <TableCell>Último Nome</TableCell>
                          <TableCell align="center">Acompanhantes</TableCell>
                          <TableCell align="center">Total</TableCell>
                          <TableCell>Origem</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="center">Check-in</TableCell>
                          <TableCell align="right">Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {registrosFiltrados.map((r, idx) => (
                          <TableRow key={r.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{r.primeiro_nome}</TableCell>
                            <TableCell>{r.ultimo_nome}</TableCell>
                            <TableCell align="center">{r.acompanhantes}</TableCell>
                            <TableCell align="center">{r.total_pessoas}</TableCell>
                            <TableCell>
                              <Chip label={r.origem} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={r.status}
                                size="small"
                                color={r.status === 'CONFIRMADO' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Switch
                                size="small"
                                checked={r.presente}
                                onChange={() => handleTogglePresente(r.id, r.presente)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Remover">
                                <IconButton size="small" color="error" onClick={() => handleRemoverRegistro(r.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {registrosFiltrados.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} align="center">
                              Nenhum registro encontrado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* ABA 1: HISTÓRICO SEMANAL */}
      {aba === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Histórico Semanal de Listas
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Data Evento</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Irmãos</TableCell>
                    <TableCell align="center">Acomp.</TableCell>
                    <TableCell align="center">Total Pessoas</TableCell>
                    <TableCell align="right">Exportar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historico.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.data_evento.split('-').reverse().join('/')}</TableCell>
                      <TableCell>{l.titulo}</TableCell>
                      <TableCell>
                        <Chip label={l.status} size="small" color={l.status === 'ABERTA' ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="center">{l.totais?.irmaos_confirmados ?? 0}</TableCell>
                      <TableCell align="center">{l.totais?.acompanhantes ?? 0}</TableCell>
                      <TableCell align="center">{l.totais?.total_pessoas ?? 0}</TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleBaixarCsv(l.id)}>
                          CSV
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {historico.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        Nenhuma lista registrada ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ABA 2: PUBLICADORES AUTORIZADOS */}
      {aba === 2 && painel?.eh_gestao_loja && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Publicadores Autorizados (além da Diretoria)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Venerável Mestre, Secretário, Tesoureiro, Chanceler e Webmaster já têm acesso automático. Aqui você pode autorizar outros Irmãos (ex.: Mestre de Banquetes) pelo e-mail cadastrado no e-Sigma.
            </Typography>

            <form onSubmit={handleAdicionarPublicador}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                  label="E-mail do Irmão no e-Sigma"
                  type="email"
                  value={novoPubEmail}
                  onChange={(e) => setNovoPubEmail(e.target.value)}
                  required
                />
                <TextField label="Nome" value={novoPubNome} onChange={(e) => setNovoPubNome(e.target.value)} />
                <TextField
                  label="Cargo / Observação"
                  value={novoPubObs}
                  onChange={(e) => setNovoPubObs(e.target.value)}
                />
                <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ whiteSpace: 'nowrap' }}>
                  Autorizar
                </Button>
              </Stack>
            </form>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>E-mail</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Observação</TableCell>
                    <TableCell align="right">Remover</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {publicadores.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.email}</TableCell>
                      <TableCell>{p.nome || '-'}</TableCell>
                      <TableCell>{p.observacao || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={async () => {
                            if (!lojaAtivaId) return;
                            await servicoConfirmacao.removerPublicador(lojaAtivaId, p.id);
                            await carregarAbaSecundaria(2);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ABA 3: WHATSAPP & LOGS */}
      {aba === 3 && painel?.eh_gestao_loja && (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Conexão WhatsApp da Loja
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status atual: <strong>{waStatus?.status || 'desconhecido'}</strong>
                    {waStatus?.phone_number ? ` (${waStatus.phone_number})` : ''}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => carregarAbaSecundaria(3)}
                  >
                    Atualizar
                  </Button>
                  {!waStatus?.connected ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<QrCodeIcon />}
                      onClick={async () => {
                        if (!lojaAtivaId) return;
                        const st = await servicoConfirmacao.whatsappConectar(lojaAtivaId);
                        setWaStatus(st);
                      }}
                    >
                      Conectar / Gerar QR
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<LinkOffIcon />}
                      onClick={async () => {
                        if (!lojaAtivaId) return;
                        const st = await servicoConfirmacao.whatsappDesconectar(lojaAtivaId);
                        setWaStatus(st);
                      }}
                    >
                      Desconectar
                    </Button>
                  )}
                </Stack>
              </Stack>

              {waStatus?.qr_code && (
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <img
                    src={waStatus.qr_code}
                    alt="QR Code WhatsApp"
                    style={{ width: 220, height: 220, borderRadius: 8 }}
                  />
                  <Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">
                    Escaneie este QR Code no WhatsApp do número dedicado da Loja.
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grupo Oficial da Loja</InputLabel>
                  <Select
                    label="Grupo Oficial da Loja"
                    value={cfgGrupoJid}
                    onChange={(e) => {
                      const jid = String(e.target.value);
                      setCfgGrupoJid(jid);
                      const found = waGrupos.find((g) => g.jid === jid);
                      if (found) setCfgGrupoNome(found.name);
                    }}
                  >
                    <MenuItem value="">
                      <em>Nenhum grupo selecionado (Modo Simulador)</em>
                    </MenuItem>
                    {waGrupos.map((g) => (
                      <MenuItem key={g.jid} value={g.jid}>
                        {g.name} ({g.participants_count} participantes)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={handleSalvarConfiguracao} disabled={salvandoCfg}>
                  Salvar Grupo
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Logs Recentes de Disparos
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Data/Hora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Modo</TableCell>
                      <TableCell>Resultado</TableCell>
                      <TableCell>Detalhe</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(painel?.logs_recentes || []).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.criado_em).toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{log.tipo_disparo}</TableCell>
                        <TableCell>{log.modo_simulador ? 'Simulador' : 'WhatsApp'}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.sucesso ? 'Sucesso' : 'Erro'}
                            size="small"
                            color={log.sucesso ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{log.erro || log.slot_agendado || 'OK'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* ABA 4: HORÁRIOS & REGRAS */}
      {aba === 4 && painel?.eh_gestao_loja && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Horários Automáticos e Link Público
            </Typography>
            <Stack spacing={2.5} sx={{ maxWidth: 680 }}>
              <TextField
                label="Slug Público (ex.: jpj)"
                value={cfgSlug}
                onChange={(e) => setCfgSlug(e.target.value)}
                helperText={`URL padrão: https://lojas.e-sigma.app/confirmacao/${cfgSlug || 'slug'}`}
              />
              <TextField
                label="URL Pública Personalizada (opcional, ex.: https://lojajoaopedrojunqueira.com.br/confirmacao)"
                value={cfgUrlBase}
                onChange={(e) => setCfgUrlBase(e.target.value)}
              />
              <TextField
                label="Horários nos dias anteriores ao evento (HH:MM separados por vírgula)"
                value={cfgHorariosNormais}
                onChange={(e) => setCfgHorariosNormais(e.target.value)}
              />
              <TextField
                label="Horários no dia do evento (HH:MM separados por vírgula)"
                value={cfgHorariosEvento}
                onChange={(e) => setCfgHorariosEvento(e.target.value)}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Dia do Reset Semanal</InputLabel>
                  <Select
                    label="Dia do Reset Semanal"
                    value={cfgDiaReset}
                    onChange={(e) => setCfgDiaReset(Number(e.target.value))}
                  >
                    {DIAS_SEMANA.map((d) => (
                      <MenuItem key={d.valor} value={d.valor}>
                        {d.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Horário do Reset (HH:MM)"
                  value={cfgHorarioReset}
                  onChange={(e) => setCfgHorarioReset(e.target.value)}
                />
              </Stack>
              <FormControlLabel
                control={
                  <Switch checked={cfgRepublicar} onChange={(e) => setCfgRepublicar(e.target.checked)} />
                }
                label="Republicar lista automaticamente no grupo a cada confirmação ou cancelamento pelo link"
              />
              <Box>
                <Button variant="contained" onClick={handleSalvarConfiguracao} disabled={salvandoCfg}>
                  {salvandoCfg ? 'Salvando...' : 'Salvar Regras e Horários'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Modal de Inserção Manual */}
      <Dialog open={modalManualAberto} onClose={() => setModalManualAberto(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleInserirManual}>
          <DialogTitle>Inserir Confirmação Manual</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Primeiro Nome"
                value={manualPrimeiro}
                onChange={(e) => setManualPrimeiro(e.target.value)}
                required
              />
              <TextField
                label="Último Nome"
                value={manualUltimo}
                onChange={(e) => setManualUltimo(e.target.value)}
              />
              <TextField
                label="Acompanhantes"
                type="number"
                value={manualAcomp}
                onChange={(e) => setManualAcomp(Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
                slotProps={{ htmlInput: { min: 0, max: 50 } }}
              />
              <TextField
                label="Observação (opcional)"
                value={manualObs}
                onChange={(e) => setManualObs(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalManualAberto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Adicionar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PaginaConfirmacaoWhatsapp;
