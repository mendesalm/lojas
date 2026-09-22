// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState } from 'react';
import axios from 'axios';
import { UserCircle2, Lock, Landmark, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, clienteHttp } from '../../compartilhado/contextos/AuthContext';
import type { LojaItem } from '../../compartilhado/contextos/AuthContext';
import { HeroBackground } from '../../compartilhado/componentes/HeroBackground';
import { LogoAnimadaLojas } from '../../compartilhado/componentes/LogoAnimadaLojas';
import { GoogleLogin } from '@react-oauth/google';

// Integração real contra o e-Sigma (IdP central do ecossistema)
// Metodologia idêntica à do CoReVM: o Lojas não valida senhas localmente,
// delega a autenticação para o e-Sigma e valida o token via GET /auth/validate.
const ESIGMA_API_URL = import.meta.env.VITE_ESIGMA_API_URL || 'http://localhost:8000/api/v1';
const API_URL = import.meta.env.VITE_LOJAS_API_URL || 'http://localhost:8001/api/v1';

/**
 * Decodifica (sem verificar assinatura — isso já foi feito pelo e-Sigma)
 * o payload de um JWT só para preencher os dados de exibição do usuário no
 * AuthContext local. A fonte de verdade da identidade continua sendo o
 * e-Sigma: qualquer chamada de API sensível revalida o token no backend via
 * GET /auth/validate (core/auth_esigma.py do Lojas).
 */
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

/**
 * Consulta o backend do Lojas para resolver o vínculo da Loja do usuário.
 */
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
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [lojasParaEscolha, setLojasParaEscolha] = useState<LojaItem[]>([]);

  const navigate = useNavigate();
  const { login, setLojaAtivaId, selecionarLoja, carregarLojasDisponiveis } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      // Login real: POST /auth/login no e-Sigma (IdP central).
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden z-0">
      {/* Background Animado Idêntico ao CoReVM */}
      <HeroBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Cartão de Login ou Seleção de Loja - Glassmorphism */}
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-yellow-500/20">

          {/* Logo e Título */}
          <div className="flex flex-col items-center text-center mb-6">
            <div id="hero-logo" className="mb-3">
              <LogoAnimadaLojas width={95} height={95} animated={true} />
            </div>

            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 tracking-wider font-sans drop-shadow-[0_0_10px_rgba(234,179,8,0.2)]">
              E-Sigma: Lojas
            </h1>
            <p className="text-sm text-gray-400 mt-1 font-sans">
              Sistema de Gestão de Oficinas Maçônicas
            </p>
          </div>

          {/* Alerta de Erro */}
          {erro && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 text-center">
              {erro}
            </div>
          )}

          {lojasParaEscolha.length > 0 ? (
            /* Menu de Seleção de Loja quando Pluri-filiado / Duplicidade Detectada */
            <div className="space-y-5 animate-fadeIn">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 mb-2.5 shadow-[0_0_15px_rgba(234,179,8,0.25)]">
                  <Landmark className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Selecione a Loja de Destino
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Identificamos que seu obreiro possui filiação a múltiplas Oficinas. Escolha para qual Loja deseja direcionar seus trabalhos nesta sessão:
                </p>
              </div>

              <div className="space-y-2.5">
                {lojasParaEscolha.map((loja) => (
                  <button
                    key={loja.id}
                    type="button"
                    onClick={() => {
                      selecionarLoja(loja);
                      navigate('/inicio', { replace: true });
                    }}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#222]/90 hover:bg-yellow-500/15 border border-gray-700 hover:border-yellow-500/60 transition-all flex items-center justify-between group shadow-sm hover:shadow-yellow-500/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-black transition-colors shrink-0">
                        <Landmark className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                          {loja.titulo_loja || 'ARLS'} {loja.nome_loja} nº {loja.numero_loja}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {loja.rito ? `Rito ${loja.rito}` : 'Rito Maçônico'} {loja.classe ? `• ${loja.classe}` : ''}
                        </p>
                        {loja.filiacao && (
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[280px]">
                            {loja.filiacao.split('\n')[0]}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-gray-500 text-center">
                Você também poderá alternar livremente entre as suas Lojas a qualquer momento pelo menu superior.
              </p>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setLojasParaEscolha([])}
                  className="text-xs text-gray-400 hover:text-yellow-500 transition-colors underline"
                >
                  Voltar à tela de identificação
                </button>
              </div>
            </div>
          ) : (
            /* Formulário Normal de Login */
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="relative group">
                    <input
                      type="text"
                      id="identificador"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label
                      htmlFor="identificador"
                      className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500"
                    >
                      E-mail, CIM ou CPF
                    </label>
                    <UserCircle2 className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>
                </div>

                <div>
                  <div className="relative group">
                    <input
                      type="password"
                      id="senha"
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label
                      htmlFor="senha"
                      className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500"
                    >
                      Senha
                    </label>
                    <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl text-sm shadow-[0_4px_14px_rgba(234,179,8,0.2)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.4)] transition-all cursor-pointer disabled:opacity-50 mt-4"
                >
                  {carregando ? (
                    <span>Autenticando...</span>
                  ) : (
                    <span>Acessar Oficina</span>
                  )}
                </button>

                {/* Recuperação de senha */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/esqueci-senha')}
                    className="text-xs text-gray-400 hover:text-yellow-500 transition-colors underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {/* Magic link */}
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/entrar-com-link')}
                    className="text-xs text-gray-400 hover:text-yellow-500 transition-colors underline"
                  >
                    Entrar sem senha (link por e-mail)
                  </button>
                </div>

                {/* Passkey */}
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/entrar-com-passkey')}
                    className="text-xs text-gray-400 hover:text-yellow-500 transition-colors underline"
                  >
                    Entrar com passkey
                  </button>
                </div>
              </form>

              {/* Solicitação de Cadastro */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/solicitar-cadastro')}
                  className="text-xs text-gray-400 hover:text-yellow-500 transition-colors underline"
                >
                  Ainda não tem cadastro? Solicite seu acesso aqui
                </button>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="px-4 text-xs text-slate-500">ou</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <div className="flex justify-center mb-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErro('Ocorreu um erro ao tentar fazer login com o Google')}
                  theme="filled_black"
                  text="continue_with"
                  width="380"
                />
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaginaLogin;
