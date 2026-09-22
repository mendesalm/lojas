// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: string[];
  cim?: string;
  cpf?: string;
  loja_id?: number;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  lojaAtivaId: number;
  definirLojaAtivaId: (id: number) => void;
  login: (token: string, usuarioData: Usuario) => void;
  logout: () => void;
  modoTema: 'dark' | 'light';
  alternarModoTema: () => void;
}

export const clienteHttp = axios.create({
  baseURL: import.meta.env.VITE_LOJAS_API_URL || 'http://localhost:8001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o token Bearer do e-Sigma
clienteHttp.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('@lojas:token') ||
    localStorage.getItem('@corevm:token') ||
    localStorage.getItem('@esigma:token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Utilitário seguro para extrair mensagem legível de erros HTTP,
 * especialmente 422 (Unprocessable Entity do FastAPI), evitando crashes no React.
 */
export function extrairMensagemErro(error: unknown, fallback: string = 'Ocorreu um erro inesperado'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        return data.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
      }
      if (data.message) {
        return data.message;
      }
    }
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

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

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [lojaAtivaId, setLojaAtivaId] = useState<number>(2181); // Padrão: Loja 2181 (João Pedro Junqueira)
  const [modoTema, setModoTema] = useState<'dark' | 'light'>('dark');

  const alternarModoTema = () => {
    setModoTema((prev) => {
      const proximo = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('@lojas:tema', proximo);
      return proximo;
    });
  };

  useEffect(() => {
    const temaSalvo = localStorage.getItem('@lojas:tema') as 'dark' | 'light';
    if (temaSalvo) {
      setModoTema(temaSalvo);
    }

    const storedToken =
      localStorage.getItem('@lojas:token') ||
      localStorage.getItem('@corevm:token') ||
      localStorage.getItem('@esigma:token');

    if (storedToken) {
      try {
        setToken(storedToken);
        const payload = decodificarPayloadJwt(storedToken);
        setUsuario({
          id: payload.user_id || payload.sub || '',
          nome: payload.nome || payload.sub || 'Irmão',
          email: payload.email || '',
          roles: payload.roles || (payload.role ? [payload.role] : ['obreiro']),
          cim: payload.cim,
          cpf: payload.cpf,
          loja_id: payload.loja_id || 2181,
        });
        if (payload.loja_id) {
          setLojaAtivaId(payload.loja_id);
        }
      } catch (err) {
        console.error('Erro ao decodificar token:', err);
      }
    }
    setCarregando(false);
  }, []);

  const login = (newToken: string, usuarioData: Usuario) => {
    setToken(newToken);
    setUsuario(usuarioData);
    localStorage.setItem('@lojas:token', newToken);
    if (usuarioData.loja_id) {
      setLojaAtivaId(usuarioData.loja_id);
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('@lojas:token');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        carregando,
        lojaAtivaId,
        definirLojaAtivaId: setLojaAtivaId,
        login,
        logout,
        modoTema,
        alternarModoTema,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
