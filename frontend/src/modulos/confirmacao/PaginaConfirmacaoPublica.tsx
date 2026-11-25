// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { servicoConfirmacao, type PainelPublico } from './servicoConfirmacao';

const TOKEN_STORAGE_KEY = 'esigma_confirmacao_token_aparelho';

function obterOuGerarTokenAparelho(): string {
  try {
    const existente = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (existente && existente.length >= 6) return existente;
    const novo =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, novo);
    return novo;
  } catch {
    return `dev-${Date.now()}`;
  }
}

function tentarObterNomeSessaoLocal(): { primeiro: string; ultimo: string } {
  try {
    const chaves = ['esigma_usuario', 'usuario', 'user'];
    for (const chave of chaves) {
      const bruto = localStorage.getItem(chave);
      if (!bruto) continue;
      const obj = JSON.parse(bruto);
      const nomeCompleto = String(obj?.nome_completo || obj?.nome || '').trim();
      if (nomeCompleto) {
        const partes = nomeCompleto.split(/\s+/);
        return {
          primeiro: partes[0] || '',
          ultimo: partes.length > 1 ? partes[partes.length - 1] : '',
        };
      }
    }
  } catch {
    // Ignora caso não haja sessão no localStorage
  }
  return { primeiro: '', ultimo: '' };
}

export const PaginaConfirmacaoPublica: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [tokenAparelho] = useState<string>(() => obterOuGerarTokenAparelho());

  const [painel, setPainel] = useState<PainelPublico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const [primeiroNome, setPrimeiroNome] = useState('');
  const [ultimoNome, setUltimoNome] = useState('');
  const [acompanhantes, setAcompanhantes] = useState<number>(0);

  const carregar = useCallback(async () => {
    if (!slug) return;
    try {
      setCarregando(true);
      setErro(null);
      const dados = await servicoConfirmacao.obterPainelPublico(slug, tokenAparelho);
      setPainel(dados);

      if (dados.meu_registro) {
        setPrimeiroNome(dados.meu_registro.primeiro_nome);
        setUltimoNome(dados.meu_registro.ultimo_nome);
        setAcompanhantes(dados.meu_registro.acompanhantes);
      } else {
        const qPrimeiro = searchParams.get('primeiro_nome') || '';
        const qUltimo = searchParams.get('ultimo_nome') || '';
        if (qPrimeiro || qUltimo) {
          setPrimeiroNome(qPrimeiro);
          setUltimoNome(qUltimo);
        } else {
          const sso = tentarObterNomeSessaoLocal();
          if (sso.primeiro) setPrimeiroNome(sso.primeiro);
          if (sso.ultimo) setUltimoNome(sso.ultimo);
        }
      }
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Não foi possível carregar a lista de confirmação.');
    } finally {
      setCarregando(false);
    }
  }, [slug, tokenAparelho, searchParams]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleConfirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    if (!primeiroNome.trim()) {
      setErro('Informe seu Primeiro Nome.');
      return;
    }
    try {
      setEnviando(true);
      setErro(null);
      setSucesso(null);
      const atualizado = await servicoConfirmacao.confirmarPublico(slug, {
        primeiro_nome: primeiroNome.trim(),
        ultimo_nome: ultimoNome.trim(),
        acompanhantes: Math.max(0, Number(acompanhantes) || 0),
        token_aparelho: tokenAparelho,
      });
      setPainel(atualizado);
      setSucesso(
        painel?.meu_registro
          ? 'Sua confirmação foi atualizada com sucesso!'
          : 'Presença confirmada com sucesso!'
      );
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao registrar confirmação.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = async () => {
    if (!slug) return;
    try {
      setEnviando(true);
      setErro(null);
      setSucesso(null);
      const atualizado = await servicoConfirmacao.cancelarPublico(slug, tokenAparelho);
      setPainel(atualizado);
      setSucesso('Sua confirmação foi cancelada.');
    } catch (err: any) {
      setErro(err?.response?.data?.detail || 'Erro ao cancelar confirmação.');
    } finally {
      setEnviando(false);
    }
  };

  const formatarDataBr = (iso?: string | null) => {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#070F1E',
        color: '#ffffff',
        py: { xs: 2, sm: 4 },
        px: 1.5,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={2.5}>
          {/* Cabeçalho da Loja */}
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="overline" sx={{ color: '#DDB96B', letterSpacing: 2, fontWeight: 700 }}>
              Lista Semanal de Confirmação
            </Typography>
            <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700, mt: 0.5 }}>
              {painel ? `A∴R∴L∴S∴ ${painel.nome_loja}${painel.numero_loja ? ` nº ${painel.numero_loja}` : ''}` : 'Carregando...'}
            </Typography>
          </Box>

          {carregando && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#DDB96B' }} />
            </Box>
          )}

          {erro && <Alert severity="error">{erro}</Alert>}
          {sucesso && <Alert severity="success">{sucesso}</Alert>}

          {!carregando && painel?.em_espera && (
            <Card sx={{ bgcolor: 'rgba(14, 28, 54, 0.85)', border: '1px solid rgba(221, 185, 107, 0.3)' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <EventIcon sx={{ fontSize: 48, color: '#DDB96B', mb: 1 }} />
                <Typography variant="h6" sx={{ color: '#FDE68A', fontWeight: 700, mb: 1 }}>
                  Lista em Espera
                </Typography>
                <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                  Nenhuma lista de confirmação foi publicada para esta semana ainda. Aguarde o próximo anúncio no grupo da Loja.
                </Typography>
              </CardContent>
            </Card>
          )}

          {!carregando && painel && !painel.em_espera && (
            <>
              {/* Card do Evento */}
              <Card sx={{ bgcolor: 'rgba(14, 28, 54, 0.85)', border: '1px solid rgba(221, 185, 107, 0.3)' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<EventIcon />}
                      label={formatarDataBr(painel.data_evento)}
                      size="small"
                      sx={{ bgcolor: 'rgba(221, 185, 107, 0.2)', color: '#FDE68A', fontWeight: 700 }}
                    />
                    <Chip
                      icon={<GroupsIcon />}
                      label={`${painel.totais.total_pessoas} pessoa(s)`}
                      size="small"
                      sx={{ bgcolor: 'rgba(56, 189, 248, 0.15)', color: '#7DD3FC', fontWeight: 600 }}
                    />
                  </Stack>
                  <Typography variant="h6" sx={{ color: '#FDE68A', fontWeight: 700, mb: 1 }}>
                    {painel.titulo}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#E2E8F0', whiteSpace: 'pre-line' }}>
                    {painel.texto_anuncio}
                  </Typography>
                </CardContent>
              </Card>

              {/* Formulário de Confirmação */}
              <Card sx={{ bgcolor: 'rgba(14, 28, 54, 0.85)', border: '1px solid rgba(221, 185, 107, 0.3)' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: '#DDB96B', fontWeight: 700, mb: 2 }}>
                    {painel.meu_registro ? 'Atualizar Minha Confirmação' : 'Confirmar Minha Presença'}
                  </Typography>
                  <form onSubmit={handleConfirmar}>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                          label="Primeiro Nome"
                          value={primeiroNome}
                          onChange={(e) => setPrimeiroNome(e.target.value)}
                          required
                          fullWidth
                          slotProps={{
                            inputLabel: { sx: { color: '#CBD5E1' } },
                            htmlInput: { maxLength: 100 },
                          }}
                        />
                        <TextField
                          label="Último Nome"
                          value={ultimoNome}
                          onChange={(e) => setUltimoNome(e.target.value)}
                          fullWidth
                          slotProps={{
                            inputLabel: { sx: { color: '#CBD5E1' } },
                            htmlInput: { maxLength: 100 },
                          }}
                        />
                      </Stack>

                      <Box>
                        <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 0.75 }}>
                          Número de Acompanhantes (cunhada, familiares, etc.)
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <IconButton
                            onClick={() => setAcompanhantes((prev) => Math.max(0, prev - 1))}
                            sx={{ border: '1px solid rgba(221, 185, 107, 0.4)', color: '#DDB96B' }}
                            aria-label="Diminuir acompanhantes"
                          >
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            type="number"
                            value={acompanhantes}
                            onChange={(e) => setAcompanhantes(Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
                            sx={{ width: 110 }}
                            slotProps={{
                              htmlInput: { min: 0, max: 50, style: { textAlign: 'center' } },
                            }}
                          />
                          <IconButton
                            onClick={() => setAcompanhantes((prev) => Math.min(50, prev + 1))}
                            sx={{ border: '1px solid rgba(221, 185, 107, 0.4)', color: '#DDB96B' }}
                            aria-label="Aumentar acompanhantes"
                          >
                            <AddIcon />
                          </IconButton>
                        </Stack>
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button
                          type="submit"
                          variant="contained"
                          fullWidth
                          disabled={enviando}
                          startIcon={<CheckCircleIcon />}
                        >
                          {painel.meu_registro ? 'Atualizar Confirmação' : 'Confirmar Presença'}
                        </Button>
                        {painel.meu_registro && (
                          <Button
                            type="button"
                            variant="outlined"
                            color="error"
                            disabled={enviando}
                            onClick={handleCancelar}
                            startIcon={<CancelIcon />}
                          >
                            Cancelar
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </form>
                </CardContent>
              </Card>

              {/* Lista de Confirmados */}
              <Card sx={{ bgcolor: 'rgba(14, 28, 54, 0.85)', border: '1px solid rgba(221, 185, 107, 0.22)' }}>
                <CardContent>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}
                  >
                    <Typography variant="subtitle1" sx={{ color: '#FDE68A', fontWeight: 700 }}>
                      Confirmados ({painel.totais.irmaos_confirmados})
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                      {painel.totais.irmaos_confirmados} Irmão(s) + {painel.totais.acompanhantes} acomp. ={' '}
                      <strong>{painel.totais.total_pessoas} pessoas</strong>
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 1 }} />
                  {painel.confirmados.length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#94A3B8', py: 2, textAlign: 'center' }}>
                      Nenhuma confirmação registrada até o momento. Seja o primeiro!
                    </Typography>
                  ) : (
                    <List dense disablePadding>
                      {painel.confirmados.map((item, idx) => (
                        <ListItem key={item.id} divider={idx < painel.confirmados.length - 1} sx={{ px: 0 }}>
                          <ListItemText
                            primary={`${idx + 1}. ${item.primeiro_nome} ${item.ultimo_nome}`.trim()}
                            secondary={
                              item.acompanhantes > 0
                                ? `+${item.acompanhantes} acompanhante(s) (Total: ${item.total_pessoas})`
                                : 'Sem acompanhantes'
                            }
                            slotProps={{
                              primary: { sx: { color: '#ffffff', fontWeight: 600 } },
                              secondary: { sx: { color: '#94A3B8' } },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default PaginaConfirmacaoPublica;
