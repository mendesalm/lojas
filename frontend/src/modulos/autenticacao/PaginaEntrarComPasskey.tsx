// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState } from 'react';
import axios from 'axios';
import { startAuthentication } from '@simplewebauthn/browser';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, UserCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/compartilhado/contextos/AuthContext';
import HeroBackground from '@/compartilhado/componentes/HeroBackground';
import LogoAnimadaLojas from '@/compartilhado/componentes/LogoAnimadaLojas';

const ESIGMA_API_URL = import.meta.env.VITE_ESIGMA_API_URL || 'http://localhost:8000/api/v1';

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

export const PaginaEntrarComPasskey: React.FC = () => {
  const [identificador, setIdentificador] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const respIniciar = await axios.post(`${ESIGMA_API_URL}/auth/passkey/login/iniciar`, {
        identificador,
        modulo_origem: 'lojas',
      });
      const options = respIniciar.data;

      if (!options.allowCredentials || options.allowCredentials.length === 0) {
        throw new Error('Nenhuma passkey encontrada para este usuário neste dispositivo.');
      }

      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: options });
      } catch (authErr: any) {
        if (authErr.name === 'NotAllowedError') {
          throw new Error('Operação cancelada pelo usuário ou tempo esgotado.');
        }
        throw new Error(authErr.message || 'Falha na leitura da passkey.');
      }

      const respConcluir = await axios.post(`${ESIGMA_API_URL}/auth/passkey/login/concluir`, {
        credential: assertion,
        modulo_origem: 'lojas',
      });

      const { access_token, deve_trocar_senha } = respConcluir.data;
      const payload = decodificarPayloadJwt(access_token);

      login(access_token, {
        id: payload.user_id || payload.sub,
        nome: payload.nome || payload.sub,
        email: payload.sub,
        roles: payload.role ? [payload.role] : [],
        loja_id: payload.loja_id,
      });

      if (deve_trocar_senha) {
        navigate('/trocar-senha-obrigatoria', { replace: true });
        return;
      }

      navigate('/inicio', { replace: true });
    } catch (err: any) {
      setErro(err.response?.data?.detail || err.message || 'Falha ao autenticar com passkey.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden z-0">
      <HeroBackground />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-yellow-500/20">

          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4">
              <LogoAnimadaLojas width={90} height={90} animated={false} />
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 tracking-wider font-sans">
              Entrar com Passkey
            </h1>
            <p className="text-sm text-gray-400 mt-2 font-sans">
              Use a biometria, chave física ou PIN configurados no seu dispositivo para acessar sem digitar senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 text-center">
                {erro}
              </div>
            )}

            <div className="relative group">
              <input
                type="text"
                id="identificador-passkey"
                autoComplete="username"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder=" "
                className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
              />
              <label
                htmlFor="identificador-passkey"
                className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500"
              >
                E-mail, CIM ou CPF
              </label>
              <UserCircle2 className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl text-sm shadow-[0_4px_14px_rgba(234,179,8,0.2)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.4)] transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              <Fingerprint className="w-5 h-5" />
              {carregando ? <span>Acionando leitor...</span> : <span>Autenticar com Passkey</span>}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaginaEntrarComPasskey;
