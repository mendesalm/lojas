// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  EventAvailable as PresenceIcon,
  School as DegreeIcon
} from '@mui/icons-material';
import { useAuth, clienteHttp } from '@/compartilhado/contextos/AuthContext';

export const PaginaMeuCadastro: React.FC = () => {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [minhasPresencas, setMinhasPresencas] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState(0);

  useEffect(() => {
    async function carregarMeuPerfil() {
      try {
        setCarregando(true);
        const [resPerfil, resPresencas] = await Promise.all([
          clienteHttp.get('/obreiros/meu-perfil'),
          clienteHttp.get('/obreiros/minhas-presencas'),
        ]);
        setPerfil(resPerfil.data);
        setMinhasPresencas(resPresencas.data || []);
      } catch (err) {
        console.error('Erro ao carregar autoatendimento:', err);
      } finally {
        setCarregando(false);
      }
    }
    carregarMeuPerfil();
  }, []);

  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!perfil) {
    return (
      <Alert severity="info">
        Não foi possível localizar o cadastro de Obreiro para esta conta. Entre em contato com a Secretaria da sua Loja.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Meu Cadastro & Frequência
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Consulte seus dados cadastrais, familiares e o espelho individual de presença nas sessões.
        </Typography>
      </Box>

      {/* Header do Obreiro */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Avatar
            src={perfil.caminho_foto_perfil}
            sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32, fontWeight: 700 }}
          >
            {perfil.nome_completo.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {perfil.nome_completo}
              </Typography>
              <Chip label={perfil.grau} color="primary" size="small" sx={{ fontWeight: 600 }} />
              <Chip label={perfil.status} color="success" size="small" variant="outlined" />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              CIM: {perfil.cim || '—'} • CPF: {perfil.cpf || '—'} • {perfil.email}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Tabs value={abaAtiva} onChange={(_, val) => setAbaAtiva(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Dados Cadastrais" icon={<PersonIcon />} iconPosition="start" />
        <Tab label="Histórico de Frequência" icon={<PresenceIcon />} iconPosition="start" />
      </Tabs>

      {/* Aba 0: Ficha Pessoal */}
      {abaAtiva === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Dados Pessoais & Contato</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>NASCIMENTO</Typography>
                    <Typography variant="body2">{perfil.data_nascimento || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ESTADO CIVIL</Typography>
                    <Typography variant="body2">{perfil.estado_civil || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TIPO SANGUÍNEO</Typography>
                    <Typography variant="body2">{perfil.tipo_sanguineo || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>TELEFONE</Typography>
                    <Typography variant="body2">{perfil.telefone || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>PROFISSÃO</Typography>
                    <Typography variant="body2">{perfil.profissao || '—'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Datas Maçônicas</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>INICIAÇÃO</Typography>
                    <Typography variant="body2">{perfil.data_iniciacao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>ELEVAÇÃO</Typography>
                    <Typography variant="body2">{perfil.data_elevacao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>EXALTAÇÃO</Typography>
                    <Typography variant="body2">{perfil.data_exaltacao || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>INSTALAÇÃO</Typography>
                    <Typography variant="body2">{perfil.data_instalacao || '—'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Aba 1: Histórico de Frequência */}
      {abaAtiva === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Presenças Registradas ({minhasPresencas.length})
            </Typography>
            {minhasPresencas.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                Nenhum registro de presença localizado.
              </Typography>
            ) : (
              <List disablePadding>
                {minhasPresencas.map((p, idx) => (
                  <React.Fragment key={p.presenca_id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {p.sessao_titulo}
                          </Typography>
                        }
                        secondary={`Data da Sessão: ${p.data_sessao} • Método: ${p.metodo_checkin || 'QR_CODE'}`}
                      />
                      <Chip label={p.status_presenca} color="success" size="small" />
                    </ListItem>
                    {idx < minhasPresencas.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
