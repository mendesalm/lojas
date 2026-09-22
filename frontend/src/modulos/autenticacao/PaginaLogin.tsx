// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '@/compartilhado/contextos/AuthContext';

export const PaginaLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const ESIGMA_AUTH_URL = import.meta.env.VITE_ESIGMA_API_URL || 'http://localhost:8000/api/v1';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCarregando(true);
      setErro('');

      // Autenticação contra o e-Sigma (IdP Central)
      const res = await axios.post(`${ESIGMA_AUTH_URL}/auth/login`, {
        identificador: identificador.trim(),
        senha: senha,
      });

      const token = res.data.access_token || res.data.token;
      if (token) {
        login(token, {
          id: res.data.usuario?.id || 'user',
          nome: res.data.usuario?.nome || identificador,
          email: res.data.usuario?.email || identificador,
          roles: res.data.usuario?.roles || ['obreiro'],
          loja_id: 2181,
        });
        navigate('/');
      } else {
        setErro('Token não retornado pelo servidor de autenticação.');
      }
    } catch (err: any) {
      setErro(err.response?.data?.detail || 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', p: 2 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', fontWeight: 700 }}>
              🏛️ LOJAS
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Acesso ao Módulo de Gestão da Loja
            </Typography>
          </Box>

          {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField
              label="E-mail, CIM ou CPF"
              fullWidth
              required
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Senha de Acesso"
              type="password"
              fullWidth
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={carregando}
              sx={{ fontWeight: 700 }}
            >
              {carregando ? <CircularProgress size={24} color="inherit" /> : 'Entrar no Sistema'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
