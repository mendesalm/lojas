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
  loja_id?: string | number;
  user_type?: string;
  role?: string;
  active_role_name?: string;
}

export interface LojaItem {
  id: number;
  codigo_loja: string;
  nome_loja: string;
  numero_loja: string;
  titulo_loja: string;
  rito: string;
  filiacao?: string;
  cargo?: string;
  classe?: string;
  status?: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  lojaAtivaId: string | number;
  definirLojaAtivaId: (id: string | number) => void;
  setLojaAtivaId: (id: string | number) => void;
  lojasDisponiveis: LojaItem[];
  carregarLojasDisponiveis: (tokenOverride?: string) => Promise<LojaItem[]>;
  selecionarLoja: (loja: LojaItem) => void;
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
  const [lojaAtivaId, setLojaAtivaIdState] = useState<string | number>(() => {
    return localStorage.getItem('@lojas:loja_ativa_id') || 2181;
  });
  const [lojasDisponiveis, setLojasDisponiveis] = useState<LojaItem[]>([]);
  const [modoTema, setModoTema] = useState<'dark' | 'light'>('dark');

  const setLojaAtivaId = (id: string | number) => {
    setLojaAtivaIdState(id);
    localStorage.setItem('@lojas:loja_ativa_id', String(id));
  };

  const alternarModoTema = () => {
    setModoTema((prev) => {
      const proximo = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('@lojas:tema', proximo);
      return proximo;
    });
  };

  const carregarLojasDisponiveis = async (tokenOverride?: string): Promise<LojaItem[]> => {
    try {
      const headers = tokenOverride ? { Authorization: `Bearer ${tokenOverride}` } : {};
      const res = await clienteHttp.get('/minhas-lojas', { headers });
      const lista: LojaItem[] = res.data || [];
      setLojasDisponiveis(lista);
      if (lista.length > 0) {
        const salva = localStorage.getItem('@lojas:loja_ativa_id');
        const encontrada = salva ? lista.find(l => String(l.id) === salva || l.codigo_loja === salva) : null;
        if (encontrada) {
          setLojaAtivaId(encontrada.codigo_loja || encontrada.id);
        } else {
          // Prioriza a loja 2181 se existir
          const loja2181 = lista.find(l => String(l.numero_loja) === '2181');
          const escolhida = loja2181 || lista[0];
          setLojaAtivaId(escolhida.codigo_loja || escolhida.id);
        }
      }
      return lista;
    } catch (err) {
      console.error('Erro ao carregar lojas disponíveis:', err);
      return [];
    }
  };

  const selecionarLoja = (loja: LojaItem) => {
    const id = loja.codigo_loja || loja.id;
    setLojaAtivaId(id);
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
          user_type: payload.user_type || (payload.role === 'super_admin' ? 'super_admin' : 'member'),
          role: payload.role || (payload.roles && payload.roles[0]) || 'obreiro',
          active_role_name: payload.active_role_name || payload.cargo || '',
        });

        // Carrega lojas associadas do obreiro
        carregarLojasDisponiveis();
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
    carregarLojasDisponiveis();
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setLojasDisponiveis([]);
    localStorage.removeItem('@lojas:token');
    localStorage.removeItem('@lojas:loja_ativa_id');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        carregando,
        lojaAtivaId,
        definirLojaAtivaId: setLojaAtivaId,
        setLojaAtivaId,
        lojasDisponiveis,
        carregarLojasDisponiveis,
        selecionarLoja,
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
