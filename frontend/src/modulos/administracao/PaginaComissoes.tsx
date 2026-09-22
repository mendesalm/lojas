// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Add as AddIcon, AccountTree as CommitteeIcon } from '@mui/icons-material';
import { useAuth, clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

export const PaginaComissoes: React.FC = () => {
  const { lojaAtivaId } = useAuth();

  const [comissoes, setComissoes] = useState<any[]>([]);
  const [obreiros, setObreiros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modal Nova Comissão
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [novaComissao, setNovaComissao] = useState({
    nome: '',
    descricao: '',
    tipo_comissao: 'Permanente',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    presidente_id: '',
  });

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resCom, resOb] = await Promise.all([
        clienteHttp.get(`/lojas/${lojaAtivaId}/comissoes`),
        clienteHttp.get(`/lojas/${lojaAtivaId}/obreiros`),
      ]);
      setComissoes(resCom.data);
      setObreiros(resOb.data);
      if (resOb.data.length > 0) {
        setNovaComissao((prev) => ({ ...prev, presidente_id: resOb.data[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar comissões:', err);
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
      await clienteHttp.post(`/lojas/${lojaAtivaId}/comissoes`, {
        ...novaComissao,
        loja_id: lojaAtivaId,
        presidente_id: parseInt(novaComissao.presidente_id),
      });
      setModalAberto(false);
      carregarDados();
      setNovaComissao({
        nome: '',
        descricao: '',
        tipo_comissao: 'Permanente',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        presidente_id: obreiros[0]?.id || '',
      });
    } catch (err) {
      setErro(extrairMensagemErro(err, 'Erro ao criar comissão.'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Comissões da Oficina
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Comissões permanentes e temporárias de sindicância, finanças, beneficência e festas.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalAberto(true)}
          sx={{ fontWeight: 600 }}
        >
          Criar Comissão
        </Button>
      </Box>

      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : comissoes.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CommitteeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Nenhuma comissão registrada</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Crie as comissões da oficina para organizar os trabalhos administrativos e sociais.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {comissoes.map((c) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {c.nome}
                    </Typography>
                    <Chip label={c.tipo_comissao} size="small" color={c.tipo_comissao === 'Permanente' ? 'primary' : 'default'} />
                  </Box>

                  {c.descricao && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      {c.descricao}
                    </Typography>
                  )}

                  <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
                      PRESIDENTE DA COMISSÃO
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {c.presidente_nome || 'Não definido'}
                    </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Período: {c.data_inicio} até {c.data_fim}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>
                    Membros ({c.obreiros?.length || 0})
                  </Typography>
                  <List dense disablePadding>
                    {c.obreiros?.map((m: any) => (
                      <ListItem key={m.id} sx={{ px: 0, py: 0.2 }}>
                        <ListItemText primary={`• ${m.obreiro_nome || 'Irmão'}`} secondary={m.cargo} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal: Nova Comissão */}
      <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSalvar}>
          <DialogTitle sx={{ fontWeight: 700 }}>Criar Nova Comissão</DialogTitle>
          <DialogContent>
            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Nome da Comissão"
                  fullWidth
                  required
                  placeholder="Ex: Comissão de Beneficência"
                  value={novaComissao.nome}
                  onChange={(e) => setNovaComissao({ ...novaComissao, nome: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Tipo de Comissão"
                  fullWidth
                  value={novaComissao.tipo_comissao}
                  onChange={(e) => setNovaComissao({ ...novaComissao, tipo_comissao: e.target.value })}
                >
                  <MenuItem value="Permanente">Permanente</MenuItem>
                  <MenuItem value="Temporária">Temporária</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Presidente da Comissão"
                  fullWidth
                  required
                  value={novaComissao.presidente_id}
                  onChange={(e) => setNovaComissao({ ...novaComissao, presidente_id: e.target.value })}
                >
                  {obreiros.map((ob) => (
                    <MenuItem key={ob.id} value={ob.id}>
                      {ob.nome_completo} ({ob.grau})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Data de Início"
                  type="date"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={novaComissao.data_inicio}
                  onChange={(e) => setNovaComissao({ ...novaComissao, data_inicio: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Data de Término"
                  type="date"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={novaComissao.data_fim}
                  onChange={(e) => setNovaComissao({ ...novaComissao, data_fim: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Descrição / Atribuições"
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="Finalidade desta comissão..."
                  value={novaComissao.descricao}
                  onChange={(e) => setNovaComissao({ ...novaComissao, descricao: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalAberto(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" color="primary" disabled={salvando}>
              {salvando ? 'Criando...' : 'Confirmar Comissão'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
