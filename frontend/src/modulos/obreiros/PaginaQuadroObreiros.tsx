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
  Alert
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Quadro de Obreiros
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Gestão dos membros regulares, dados civis, graus maçônicos e cargos na oficina.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalCadastroAberto(true)}
          sx={{ fontWeight: 600 }}
        >
          Novo Obreiro
        </Button>
      </Box>

      {/* Barra de Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 8, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Pesquisar por Nome, CIM, CPF ou E-mail..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && carregarObreiros()}
                slotProps={{
                  input: {
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Filtrar por Grau"
                value={filtroGrau}
                onChange={(e) => setFiltroGrau(e.target.value)}
              >
                <MenuItem value="">Todos os Graus</MenuItem>
                <MenuItem value="Aprendiz">Aprendiz</MenuItem>
                <MenuItem value="Companheiro">Companheiro</MenuItem>
                <MenuItem value="Mestre">Mestre</MenuItem>
                <MenuItem value="Mestre Instalado">Mestre Instalado</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button variant="outlined" onClick={carregarObreiros} startIcon={<FilterIcon />}>
                Filtrar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela do Quadro de Membros */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Obreiro</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>CIM</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Grau</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cargo em Loja</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contato</TableCell>
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
              ) : obreiros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    Nenhum obreiro encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                obreiros.map((ob) => (
                  <TableRow key={ob.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={ob.caminho_foto_perfil}
                          sx={{ width: 38, height: 38, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}
                        >
                          {ob.nome_completo.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {ob.nome_completo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {ob.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {ob.cim || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip label={ob.grau || 'Aprendiz'} size="small" color={obterCorGrau(ob.grau) as any} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: ob.cargo_atual ? 600 : 400, color: ob.cargo_atual ? 'primary.main' : 'text.secondary' }}>
                        {ob.cargo_atual || 'Membro do Quadro'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {ob.telefone && (
                          <Tooltip title="Abrir WhatsApp">
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
                          <Tooltip title="Enviar E-mail">
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
                    <TableCell>
                      <Chip label={ob.status || 'Ativo'} size="small" variant="outlined" color={ob.status === 'Ativo' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Visualizar Ficha Completa">
                        <IconButton color="primary" onClick={() => abrirDetalhe(ob.id)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

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
