// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  People as PeopleIcon,
  Event as EventIcon,
  Cake as CakeIcon,
  Campaign as NoticeIcon,
  WhatsApp as WhatsAppIcon,
  QrCodeScanner as QrCodeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth, clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

export const PaginaInicio: React.FC = () => {
  const { lojaAtivaId, usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [totalObreiros, setTotalObreiros] = useState(0);
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);
  const [sessaoAtiva, setSessaoAtiva] = useState<any>(null);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [modalCheckInAberto, setModalCheckInAberto] = useState(false);
  const [checkInSucesso, setCheckInSucesso] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState('');

  const carregarPainel = async () => {
    try {
      setCarregando(true);
      const mesAtual = new Date().getMonth() + 1;

      const [resObreiros, resAniv, resSessao, resAvisos] = await Promise.all([
        clienteHttp.get(`/lojas/${lojaAtivaId}/obreiros`),
        clienteHttp.get(`/lojas/${lojaAtivaId}/aniversariantes?mes=${mesAtual}`),
        clienteHttp.get(`/lojas/${lojaAtivaId}/sessoes/ativa`),
        clienteHttp.get(`/lojas/${lojaAtivaId}/avisos?apenas_ativos=true`),
      ]);

      setTotalObreiros(resObreiros.data.length);
      setAniversariantes(resAniv.data.membros || []);
      setSessaoAtiva(resSessao.data);
      setAvisos(resAvisos.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados do painel:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPainel();
  }, [lojaAtivaId]);

  const realizarCheckIn = async () => {
    if (!sessaoAtiva) return;
    try {
      setMensagemStatus('Registrando presença...');
      await clienteHttp.post(`/lojas/${lojaAtivaId}/sessoes/${sessaoAtiva.id}/check-in`, {
        metodo: 'QR_CODE',
      });
      setCheckInSucesso(true);
      setMensagemStatus('Presença confirmada com sucesso!');
      setTimeout(() => {
        setModalCheckInAberto(false);
        setCheckInSucesso(false);
        setMensagemStatus('');
      }, 2000);
    } catch (err) {
      setMensagemStatus(extrairMensagemErro(err, 'Falha ao registrar presença'));
    }
  };

  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Painel de Controle da Loja
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Visão geral dos trabalhos litúrgicos, aniversariantes do mês e comunicados oficiais.
        </Typography>
      </Box>

      {/* Cards de Métricas Principais */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(212, 175, 55, 0.15)', color: 'primary.main', width: 52, height: 52 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  QUADRO DE OBREIROS
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalObreiros}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: 'secondary.main', width: 52, height: 52 }}>
                <CakeIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  ANIVERSARIANTES
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {aniversariantes.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', width: 52, height: 52 }}>
                <EventIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  SESSÃO HOJE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: sessaoAtiva ? '#22c55e' : 'text.secondary' }}>
                  {sessaoAtiva ? sessaoAtiva.status : 'Nenhuma'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', width: 52, height: 52 }}>
                <NoticeIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  AVISOS ATIVOS
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {avisos.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Seção 2: Sessão Ativa / Check-in + Aniversariantes */}
      <Grid container spacing={3}>
        {/* Coluna Esquerda: Sessão Ativa & Mural */}
        <Grid size={{ xs: 12, md: 7 }}>
          {sessaoAtiva ? (
            <Card sx={{ mb: 3, border: '1px solid rgba(212, 175, 55, 0.4)', bgcolor: 'rgba(212, 175, 55, 0.03)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Chip label="Sessão Ativa no Templo" color="primary" size="small" sx={{ mb: 1, fontWeight: 700 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {sessaoAtiva.titulo}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {sessaoAtiva.tipo} • {sessaoAtiva.subtipo}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<QrCodeIcon />}
                    onClick={() => setModalCheckInAberto(true)}
                    sx={{ px: 2.5, py: 1 }}
                  >
                    Fazer Check-in
                  </Button>
                </Box>
                {sessaoAtiva.pauta && (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.paper', borderRadius: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                      PAUTA DOS TRABALHOS:
                    </Typography>
                    <Typography variant="body2">{sessaoAtiva.pauta}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Nenhuma Sessão em Andamento
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                  Aguarde a abertura dos trabalhos pela Venerabilidade ou consulte as próximas convocações na aba Sessões.
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Mural de Avisos */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                📢 Mural de Avisos da Secretaria
              </Typography>
              {avisos.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                  Nenhum aviso publicado no momento.
                </Typography>
              ) : (
                <List disablePadding>
                  {avisos.map((aviso, idx) => (
                    <React.Fragment key={aviso.id}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {aviso.titulo}
                              </Typography>
                              <Chip label={aviso.tipo} size="small" variant="outlined" />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                              {aviso.conteudo}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {idx < avisos.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Coluna Direita: Aniversariantes do Mês com WhatsApp */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                🎂 Aniversariantes do Mês ({aniversariantes.length})
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                Parabenize os irmãos da oficina diretamente pelo WhatsApp.
              </Typography>

              {aniversariantes.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                  Nenhum aniversariante registrado para este mês.
                </Typography>
              ) : (
                <List disablePadding>
                  {aniversariantes.map((membro, idx) => {
                    const temTelefone = Boolean(membro.telefone);
                    const telFormatado = membro.telefone ? membro.telefone.replace(/\D/g, '') : '';
                    const linkWhatsApp = `https://wa.me/${telFormatado}?text=Prezado%20Irmão%20${encodeURIComponent(membro.nome_completo)},%20parabéns%20pelo%20seu%20aniversário!%20Muita%20paz,%20saúde%20e%20prosperidade!`;

                    return (
                      <React.Fragment key={membro.id}>
                        <ListItem
                          sx={{ px: 0, py: 1.2 }}
                          secondaryAction={
                            temTelefone && (
                              <IconButton
                                edge="end"
                                color="success"
                                component="a"
                                href={linkWhatsApp}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Enviar mensagem no WhatsApp"
                              >
                                <WhatsAppIcon />
                              </IconButton>
                            )
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={membro.caminho_foto_perfil}
                              sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}
                            >
                              {membro.dia}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {membro.nome_completo}
                              </Typography>
                            }
                            secondary={`Dia ${membro.dia} • ${membro.grau || 'Obreiro'} ${membro.cim ? `(CIM ${membro.cim})` : ''}`}
                          />
                        </ListItem>
                        {idx < aniversariantes.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal de Check-in na Sessão */}
      <Dialog open={modalCheckInAberto} onClose={() => setModalCheckInAberto(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
          Registro de Presença
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {checkInSucesso ? (
            <Box>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Presença Confirmada!
              </Typography>
            </Box>
          ) : (
            <Box>
              <QrCodeIcon color="primary" sx={{ fontSize: 60, mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Confirmar presença na sessão:
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 2 }}>
                {sessaoAtiva?.titulo}
              </Typography>
              {mensagemStatus && (
                <Typography variant="caption" sx={{ color: 'error.main', display: 'block' }}>
                  {mensagemStatus}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          {!checkInSucesso && (
            <>
              <Button onClick={() => setModalCheckInAberto(false)} color="inherit">
                Cancelar
              </Button>
              <Button onClick={realizarCheckIn} variant="contained" color="primary">
                Confirmar Check-in
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
