// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  MenuItem
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth, clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

export const PaginaDadosLoja: React.FC = () => {
  const { lojaAtivaId } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [dadosLoja, setDadosLoja] = useState<any>(null);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const res = await clienteHttp.get(`/lojas/${lojaAtivaId}`);
      setDadosLoja(res.data);
    } catch (err) {
      console.error('Erro ao carregar dados da loja:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [lojaAtivaId]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      setErro('');
      setSucesso(false);
      await clienteHttp.put(`/lojas/${lojaAtivaId}`, {
        cnpj: dadosLoja.cnpj,
        telefone: dadosLoja.telefone,
        email: dadosLoja.email,
        logradouro: dadosLoja.logradouro,
        numero: dadosLoja.numero,
        bairro: dadosLoja.bairro,
        cidade: dadosLoja.cidade,
        estado: dadosLoja.estado,
        cep: dadosLoja.cep,
        dia_sessao: dadosLoja.dia_sessao,
        horario_sessao: dadosLoja.horario_sessao,
      });
      setSucesso(true);
      carregarDados();
    } catch (err) {
      setErro(extrairMensagemErro(err, 'Erro ao atualizar dados da loja.'));
    } finally {
      setSalvando(false);
    }
  };

  if (carregando || !dadosLoja) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Dados da Oficina
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Informações cadastrais, endereço do templo, filiação e horários regulares de reunião.
        </Typography>
      </Box>

      {sucesso && <Alert severity="success" sx={{ mb: 2 }}>Dados da Loja atualizados com sucesso!</Alert>}
      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <form onSubmit={handleSalvar}>
        <Grid container spacing={3}>
          {/* Informações Institucionais (Read-Only) */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                  Filiação Institucional
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TÍTULO E NOME</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {dadosLoja.titulo_loja} {dadosLoja.nome_loja} nº {dadosLoja.numero_loja}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>POTÊNCIA / JURISDIÇÃO</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {dadosLoja.filiacao_formatada || dadosLoja.potencia_nome || '—'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>RITO PRATICADO</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {dadosLoja.rito || 'REAA'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>CÓDIGO INSTITUCIONAL</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {dadosLoja.codigo_loja}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Endereço e Horários (Editáveis) */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Templo & Reuniões
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      label="Dia Regular das Sessões"
                      fullWidth
                      value={dadosLoja.dia_sessao || 'Quartas-feiras'}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, dia_sessao: e.target.value })}
                    >
                      <MenuItem value="Segundas-feiras">Segundas-feiras</MenuItem>
                      <MenuItem value="Terças-feiras">Terças-feiras</MenuItem>
                      <MenuItem value="Quartas-feiras">Quartas-feiras</MenuItem>
                      <MenuItem value="Quintas-feiras">Quintas-feiras</MenuItem>
                      <MenuItem value="Sextas-feiras">Sextas-feiras</MenuItem>
                      <MenuItem value="Sábados">Sábados</MenuItem>
                      <MenuItem value="Domingos">Domingos</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Horário Regular"
                      type="time"
                      fullWidth
                      slotProps={{ inputLabel: { shrink: true } }}
                      value={dadosLoja.horario_sessao || '20:00'}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, horario_sessao: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="CNPJ"
                      fullWidth
                      value={dadosLoja.cnpj || ''}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, cnpj: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Telefone Institucional"
                      fullWidth
                      value={dadosLoja.telefone || ''}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, telefone: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="E-mail da Secretaria"
                      type="email"
                      fullWidth
                      value={dadosLoja.email || ''}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, email: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Logradouro do Templo"
                      fullWidth
                      value={dadosLoja.logradouro || ''}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, logradouro: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Número"
                      fullWidth
                      value={dadosLoja.numero || ''}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, numero: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Bairro"
                      fullWidth
                      value={dadosLoja.bairro || ''}
                      onChange={(e) => setDadosLoja({ ...dadosLoja, bairro: e.target.value })}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Cidade / UF"
                      fullWidth
                      value={`${dadosLoja.cidade || ''} / ${dadosLoja.estado || ''}`}
                      onChange={(e) => {
                        const partes = e.target.value.split('/');
                        setDadosLoja({ ...dadosLoja, cidade: partes[0]?.trim(), estado: partes[1]?.trim() });
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, textAlign: 'right' }}>
                  <Button type="submit" variant="contained" color="primary" startIcon={<SaveIcon />} disabled={salvando}>
                    {salvando ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
