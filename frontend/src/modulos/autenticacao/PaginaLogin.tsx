// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowForward, AccountBalance } from '@mui/icons-material';
import { useAuth, clienteHttp } from '../../compartilhado/contextos/AuthContext';
import type { LojaItem } from '../../compartilhado/contextos/AuthContext';
import { HeroBackground } from '../../compartilhado/componentes/HeroBackground';
import { LogoAnimadaLojas } from '../../compartilhado/componentes/LogoAnimadaLojas';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { obterUrlEsigmaApi, obterUrlLojasApi } from '@/compartilhado/servicos/configuracaoApi';

const ESIGMA_API_URL = obterUrlEsigmaApi();
const API_URL = obterUrlLojasApi();

function decodificarPayloadJwt(token: string): any {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = decodeURIComponent(
      atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(payloadJson);
  } catch {
    return {};
  }
}

async function buscarMinhaLoja(): Promise<{ loja_id?: number; loja_nome?: string } | null> {
  try {
    const resposta = await clienteHttp.get(`${API_URL}/obreiros/meu-perfil`);
    if (resposta.data && resposta.data.loja_id) {
      return {
        loja_id: resposta.data.loja_id,
        loja_nome: resposta.data.loja_nome || 'Oficina Maçônica'
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const PaginaLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [lojasParaEscolha, setLojasParaEscolha] = useState<LojaItem[]>([]);

  const navigate = useNavigate();
  const { login, setLojaAtivaId, selecionarLoja, carregarLojasDisponiveis } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setErro(null);
    setCarregando(true);
    try {
      const credential = credentialResponse?.credential;
      if (!credential) throw new Error('O Google não retornou uma credencial válida.');

      const resposta = await axios.post(`${ESIGMA_API_URL}/auth/google`, {
        credential,
        modulo_origem: 'lojas'
      });
      const { access_token, deve_trocar_senha } = resposta.data;
      const payload = decodificarPayloadJwt(access_token);

      login(access_token, {
        id: payload.user_id || payload.sub,
        nome: payload.nome || payload.sub,
        email: payload.sub,
        roles: payload.role ? [payload.role] : [],
        loja_id: payload.loja_id
      });

      if (deve_trocar_senha) {
        navigate('/trocar-senha-obrigatoria', { replace: true });
        return;
      }

      const lojas = await carregarLojasDisponiveis(access_token);
      if (lojas && lojas.length > 1) {
        setLojasParaEscolha(lojas);
        return;
      }

      if (lojas && lojas.length === 1) {
        selecionarLoja(lojas[0]);
      } else {
        const vinculo = await buscarMinhaLoja();
        if (vinculo?.loja_id) {
          setLojaAtivaId(vinculo.loja_id);
        }
      }
      navigate('/inicio', { replace: true });
    } catch (err: any) {
      setErro(err.response?.data?.detail || err.message || 'Falha no login com Google.');
    } finally {
      setCarregando(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await axios.post(`${ESIGMA_API_URL}/auth/login`, {
        username: email,
        password: senha,
        modulo_origem: 'lojas'
      });
      const { access_token, deve_trocar_senha } = resposta.data;
      const payload = decodificarPayloadJwt(access_token);

      login(access_token, {
        id: payload.user_id || payload.sub,
        nome: payload.nome || payload.sub,
        email: payload.sub,
        roles: payload.role ? [payload.role] : [],
        loja_id: payload.loja_id
      });

      if (deve_trocar_senha) {
        navigate('/trocar-senha-obrigatoria', { replace: true });
        return;
      }

      const lojas = await carregarLojasDisponiveis(access_token);
      if (lojas && lojas.length > 1) {
        setLojasParaEscolha(lojas);
        return;
      }

      if (lojas && lojas.length === 1) {
        selecionarLoja(lojas[0]);
      } else {
        const vinculo = await buscarMinhaLoja();
        if (vinculo?.loja_id) {
          setLojaAtivaId(vinculo.loja_id);
        }
      }
      navigate('/inicio', { replace: true });
    } catch (err: any) {
      setErro(err.response?.data?.detail || err.message || 'Falha na autenticação. Verifique seu e-mail, CIM ou CPF e a senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Box
      sx={{
        color: 'text.primary',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#050508',
      }}
    >
      {/* Background Animado de Partículas idêntico ao e-Sigma */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <HeroBackground />
      </Box>

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          position: 'relative',
          zIndex: 1,
          margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          py: 4,
        }}
      >
        <Box
          className="card-deep-blue-glass"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: { xs: 4, md: 6 },
            width: '100%',
          }}
        >
          {/* Logo Animada Exclusiva de Lojas com Brasão Dourado */}
          <Box sx={{ mb: 1, mt: 1, display: 'flex', justifyContent: 'center' }}>
            <LogoAnimadaLojas theme="ouro" width={100} height={100} showText={false} animated={true} />
          </Box>

          {/* Título e Subtítulo Padronizados como Clone Visual do e-Sigma */}
          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 1,
              fontWeight: 700,
              fontFamily: "'Tektur', sans-serif",
              background: 'linear-gradient(135deg, #FDE68A 0%, #DDB96B 50%, #B8862D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(221, 185, 107, 0.35))',
              textAlign: 'center'
            }}
          >
            Acesso Restrito
          </Typography>
          <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center' }}>
            {lojasParaEscolha.length > 0 
              ? 'Selecione a Loja para iniciar seus trabalhos'
              : 'Insira suas credenciais para continuar'}
          </Typography>

          {/* Alerta de Erro */}
          {erro && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {erro}
            </Alert>
          )}

          {lojasParaEscolha.length > 0 ? (
            /* Seleção de Loja quando Pluri-filiado */
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, p: 2, borderRadius: 2, bgcolor: 'rgba(221,185,107,0.08)', border: '1px solid rgba(221,185,107,0.2)' }}>
                <AccountBalance sx={{ color: '#DDB96B' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Identificamos múltiplos vínculos ativos. Selecione a Loja de destino para esta sessão:
                </Typography>
              </Box>

              {lojasParaEscolha.map((loja) => (
                <Box
                  key={loja.id}
                  onClick={() => {
                    selecionarLoja(loja);
                    navigate('/inicio', { replace: true });
                  }}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    bgcolor: 'rgba(10, 20, 40, 0.6)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    '&:hover': {
                      border: '1px solid #DDB96B',
                      bgcolor: 'rgba(221, 185, 107, 0.1)',
                    }
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                      {loja.titulo_loja || 'ARLS'} {loja.nome_loja} nº {loja.numero_loja}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {loja.rito ? `Rito ${loja.rito}` : 'Rito Maçônico'} {loja.classe ? `• ${loja.classe}` : ''}
                    </Typography>
                  </Box>
                  <ArrowForward sx={{ color: '#DDB96B' }} />
                </Box>
              ))}

              <Button
                variant="text"
                onClick={() => setLojasParaEscolha([])}
                sx={{ mt: 2, color: 'text.secondary', '&:hover': { color: '#DDB96B' } }}
              >
                Voltar à tela de identificação
              </Button>
            </Box>
          ) : (
            /* Formulário Principal de Login */
            <Box component="form" onSubmit={handleFormSubmit} noValidate sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="E-mail, CIM ou CPF"
                name="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={carregando}
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type={mostrarSenha ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={carregando}
                variant="outlined"
                sx={{ mb: 2 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="alternar visibilidade da senha"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          edge="end"
                          sx={{ color: 'text.secondary' }}
                        >
                          {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={lembrarMe}
                      onChange={(e) => setLembrarMe(e.target.checked)}
                      disabled={carregando}
                    />
                  }
                  label={<Typography variant="body2" sx={{ color: 'text.secondary' }}>Lembrar-me</Typography>}
                />
                <Link
                  component={RouterLink}
                  to="/esqueci-senha"
                  variant="body2"
                  sx={{ color: '#DDB96B', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Esqueci a senha
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={carregando}
                className="btn-masonic-pill btn-pill-blue"
                sx={{
                  py: 1.5,
                  mb: 3,
                  fontSize: '1rem',
                }}
              >
                {carregando ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>ou</Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.1)' }} />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setErro('Ocorreu um erro ao tentar fazer login com o Google');
                  }}
                  theme="filled_black"
                  text="continue_with"
                  width="100%"
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Não tem uma conta?{' '}
                  <Link
                    component={RouterLink}
                    to="/solicitar-cadastro"
                    sx={{ color: '#DDB96B', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    Solicitar cadastro
                  </Link>
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Link
                    component={RouterLink}
                    to="/entrar-com-link"
                    variant="caption"
                    sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#DDB96B', textDecoration: 'underline' } }}
                  >
                    Entrar sem senha (link)
                  </Link>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>•</Typography>
                  <Link
                    component={RouterLink}
                    to="/entrar-com-passkey"
                    variant="caption"
                    sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: '#DDB96B', textDecoration: 'underline' } }}
                  >
                    Entrar com passkey
                  </Link>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default PaginaLogin;
