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
  Alert,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth, clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

export const PaginaVisitantes: React.FC = () => {
  const theme = useTheme();
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
      {/* Cabeçalho da Página */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
            Livro de Visitantes
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Registro de irmãos de outras oficinas que visitaram e compartilharam dos trabalhos.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalAberto(true)}
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
          Registrar Visitante
        </Button>
      </Box>

      {/* Barra de Busca no Padrão SiGMa */}
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
          placeholder="Buscar visitante por nome, CIM ou Loja de origem..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && carregarVisitantes()}
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
      </Paper>

      {/* Tabela de Visitantes no Padrão Canônico SiGMa (Floating Pill Rows) */}
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
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, pl: 3 }}>NOME DO IRMÃO</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>CIM</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>GRAU</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>LOJA DE ORIGEM</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1 }}>OBEDIÊNCIA / POTÊNCIA</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: '700', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: 'none', py: 1, textAlign: 'right', pr: 3 }}>TELEFONE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, borderBottom: 'none' }}>
                    <CircularProgress color="primary" />
                  </TableCell>
                </TableRow>
              ) : visitantes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary', borderBottom: 'none' }}>
                    Nenhum visitante cadastrado no livro da oficina.
                  </TableCell>
                </TableRow>
              ) : (
                visitantes.map((v) => (
                  <TableRow
                    key={v.id}
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
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: 'text.primary',
                      }}
                    >
                      {v.nome_completo}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2, fontFamily: 'monospace', fontWeight: 600, color: 'text.primary', fontSize: '0.8rem' }}>
                      {v.cim}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2 }}>
                      <Chip
                        label={v.grau || 'Mestre'}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: v.grau === 'Aprendiz' ? 'rgba(34, 197, 94, 0.15)' : v.grau === 'Companheiro' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                          color: v.grau === 'Aprendiz' ? '#22c55e' : v.grau === 'Companheiro' ? '#38bdf8' : '#D4AF37',
                          border: `1px solid ${v.grau === 'Aprendiz' ? 'rgba(34, 197, 94, 0.3)' : v.grau === 'Companheiro' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(212, 175, 55, 0.3)'}`,
                          borderRadius: '12px'
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2, fontSize: '0.85rem', color: 'text.primary' }}>
                      {v.nome_loja_manual ? `${v.nome_loja_manual} nº ${v.numero_loja_manual || ''}` : '—'}
                    </TableCell>

                    <TableCell sx={{ borderBottom: 'none', py: 1.2, fontSize: '0.85rem', color: 'text.secondary' }}>
                      {v.obediencia_loja_manual || '—'}
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: 'none',
                        py: 1.2,
                        textAlign: 'right',
                        pr: 3,
                        borderTopRightRadius: '50px',
                        borderBottomRightRadius: '50px',
                        fontSize: '0.85rem',
                        color: 'text.secondary'
                      }}
                    >
                      {v.telefone || '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
