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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth, clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

export const PaginaVisitantes: React.FC = () => {
  const { lojaAtivaId } = useAuth();

  const [visitantes, setVisitantes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

  // Modal Novo Visitante
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [novoVisitante, setNovoVisitante] = useState({
    nome_completo: '',
    cim: '',
    grau: 'Mestre',
    nome_loja_manual: '',
    numero_loja_manual: '',
    obediencia_loja_manual: '',
    telefone: '',
    email: '',
  });

  const carregarVisitantes = async () => {
    try {
      setCarregando(true);
      const url = termoBusca
        ? `/lojas/${lojaAtivaId}/visitantes?busca=${encodeURIComponent(termoBusca)}`
        : `/lojas/${lojaAtivaId}/visitantes`;
      const res = await clienteHttp.get(url);
      setVisitantes(res.data);
    } catch (err) {
      console.error('Erro ao carregar visitantes:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarVisitantes();
  }, [lojaAtivaId]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      setErro('');
      await clienteHttp.post(`/lojas/${lojaAtivaId}/visitantes`, novoVisitante);
      setModalAberto(false);
      carregarVisitantes();
      setNovoVisitante({
        nome_completo: '',
        cim: '',
        grau: 'Mestre',
        nome_loja_manual: '',
        numero_loja_manual: '',
        obediencia_loja_manual: '',
        telefone: '',
        email: '',
      });
    } catch (err) {
      setErro(extrairMensagemErro(err, 'Erro ao cadastrar visitante.'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Livro de Visitantes
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Registro de irmãos visitantes de outras oficinas maçônicas que visitaram os trabalhos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalAberto(true)}
          sx={{ fontWeight: 600 }}
        >
          Registrar Visitante
        </Button>
      </Box>

      {/* Tabela de Visitantes */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nome do Irmão</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CIM</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Grau</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Loja de Origem</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Obediência / Potência</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Telefone</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress color="primary" />
                  </TableCell>
                </TableRow>
              ) : visitantes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Nenhum visitante cadastrado no livro da oficina.
                  </TableCell>
                </TableRow>
              ) : (
                visitantes.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{v.nome_completo}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{v.cim}</TableCell>
                    <TableCell>
                      <Chip label={v.grau} size="small" />
                    </TableCell>
                    <TableCell>
                      {v.nome_loja_manual ? `${v.nome_loja_manual} nº ${v.numero_loja_manual || ''}` : '—'}
                    </TableCell>
                    <TableCell>{v.obediencia_loja_manual || '—'}</TableCell>
                    <TableCell>{v.telefone || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal: Novo Visitante */}
      <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSalvar}>
          <DialogTitle sx={{ fontWeight: 700 }}>Registrar Visitante</DialogTitle>
          <DialogContent>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Nome Completo do Irmão"
                  fullWidth
                  required
                  value={novoVisitante.nome_completo}
                  onChange={(e) => setNovoVisitante({ ...novoVisitante, nome_completo: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="CIM"
                  fullWidth
                  required
                  value={novoVisitante.cim}
                  onChange={(e) => setNovoVisitante({ ...novoVisitante, cim: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Grau"
                  fullWidth
                  value={novoVisitante.grau}
                  onChange={(e) => setNovoVisitante({ ...novoVisitante, grau: e.target.value })}
                >
                  <MenuItem value="Aprendiz">Aprendiz</MenuItem>
                  <MenuItem value="Companheiro">Companheiro</MenuItem>
                  <MenuItem value="Mestre">Mestre</MenuItem>
                  <MenuItem value="Mestre Instalado">Mestre Instalado</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Telefone"
                  fullWidth
                  value={novoVisitante.telefone}
                  onChange={(e) => setNovoVisitante({ ...novoVisitante, telefone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Nome da Loja de Origem"
                  fullWidth
                  placeholder="Ex: União e Justiça"
                  value={novoVisitante.nome_loja_manual}
                  onChange={(e) => setNovoVisitante({ ...novoVisitante, nome_loja_manual: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Número"
                  fullWidth
                  placeholder="Ex: 1907"
                  value={novoVisitante.numero_loja_manual}
                  onChange={(e) => setNovoVisitante({ ...novoVisitante, numero_loja_manual: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Potência / Obediência"
                  fullWidth
                  placeholder="Ex: GOB-GO / GLEGO"
                  value={novoVisitante.obediencia_loja_manual}
                  onChange={(e) => setNovoVisitante({ ...novoVisitante, obediencia_loja_manual: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalAberto(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Visitante'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
