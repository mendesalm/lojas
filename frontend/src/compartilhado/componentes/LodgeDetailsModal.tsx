// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Grid,
  IconButton,
  Avatar,
  useTheme,
  Alert
} from '@mui/material';
import { Close as CloseIcon, PhotoCamera } from '@mui/icons-material';
import { clienteHttp, extrairMensagemErro } from '@/compartilhado/contextos/AuthContext';

interface LodgeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  lodgeData: any;
  isAdmin?: boolean;
  onUpdate?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lodge-tabpanel-${index}`}
      aria-labelledby={`lodge-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const LodgeDetailsModal: React.FC<LodgeDetailsModalProps> = ({
  open,
  onClose,
  lodgeData,
  isAdmin = false,
  onUpdate
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (lodgeData) {
      setFormData({ ...lodgeData });
      const apiBase = import.meta.env.VITE_LOJAS_API_URL || 'http://localhost:8001';
      setLogoPreview(lodgeData.logo_path ? `${apiBase}${lodgeData.logo_path}` : null);
    }
  }, [lodgeData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      await clienteHttp.put(`/lojas/${lodgeData.id}`, formData);
      setIsEditing(false);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err: any) {
      setError(extrairMensagemErro(err, 'Erro ao atualizar dados da Loja.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: theme.palette.background.paper,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#C49A45' }}>
          Detalhes da Oficina
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Abas da Loja">
          <Tab label="Dados Gerais" />
          <Tab label="Endereço" />
          <Tab label="Sessões & Rito" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {/* DADOS GERAIS */}
        <CustomTabPanel value={tabValue} index={0}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Avatar
                src={logoPreview || undefined}
                sx={{ width: 90, height: 90, border: `2px solid ${theme.palette.divider}`, bgcolor: 'background.default', color: '#C49A45', fontWeight: 700, fontSize: '1.2rem' }}
                variant="rounded"
              >
                {!logoPreview && (formData.titulo_loja || 'ARLS')}
              </Avatar>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Título Distintivo"
                name="titulo_loja"
                value={formData.titulo_loja || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nome da Loja"
                name="nome_loja"
                value={formData.nome_loja || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Número"
                name="numero_loja"
                value={formData.numero_loja || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={formData.cnpj || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
                placeholder="00.000.000/0000-00"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Data de Fundação"
                name="data_fundacao"
                type="date"
                value={formData.data_fundacao ? String(formData.data_fundacao).slice(0, 10) : ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Telefone Institucional"
                name="telefone"
                value={formData.telefone || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Potência Maçônica"
                name="potencia_nome"
                value={formData.potencia_nome || 'Grande Oriente do Brasil (GOB)'}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Jurisdição Estadual"
                name="obediencia_nome"
                value={formData.obediencia_nome || 'Grande Oriente do Brasil - Goiás (GOB-GO)'}
                disabled
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="E-mail da Secretaria"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Website Oficial"
                name="site"
                value={formData.site || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* ENDEREÇO */}
        <CustomTabPanel value={tabValue} index={1}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Logradouro (Templo)"
                name="logradouro"
                value={formData.logradouro || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Número"
                name="numero"
                value={formData.numero || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Complemento"
                name="complemento"
                value={formData.complemento || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Bairro"
                name="bairro"
                value={formData.bairro || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cidade"
                name="cidade"
                value={formData.cidade || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="UF"
                name="estado"
                value={formData.estado || 'GO'}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="CEP"
                name="cep"
                value={formData.cep || ''}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* SESSÕES & RITO */}
        <CustomTabPanel value={tabValue} index={2}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Rito"
                name="rito"
                value={formData.rito || 'REAA'}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Dia das Sessões"
                name="dia_sessao"
                value={formData.dia_sessao || 'Sextas-feiras'}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Horário Regular"
                name="horario_sessao"
                value={formData.horario_sessao ? String(formData.horario_sessao).slice(0, 5) : '19:30'}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Periodicidade"
                name="periodicidade"
                value={formData.periodicidade || 'Semanal'}
                onChange={handleInputChange}
                disabled={!isEditing || !isAdmin}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        {isAdmin && !isEditing && (
          <Button onClick={() => setIsEditing(true)} color="primary" variant="outlined">
            Editar Dados
          </Button>
        )}
        {isEditing && (
          <>
            <Button onClick={() => setIsEditing(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </>
        )}
        <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LodgeDetailsModal;
