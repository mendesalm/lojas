// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
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

export const PaginaConfirmarMagicLink: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const chamadaDisparada = useRef(false);

  useEffect(() => {
    if (chamadaDisparada.current) return;
    chamadaDisparada.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setErro('Link de acesso inválido (token ausente).');
      return;
    }

    const confirmarToken = async () => {
      try {
        const resposta = await axios.post(`${ESIGMA_API_URL}/auth/magic-link/confirmar`, {
          token,
          modulo_origem: 'lojas',
        });

        const { access_token, deve_trocar_senha } = resposta.data;
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
        setErro(err.response?.data?.detail || err.message || 'Link inválido ou expirado.');
      }
    };

    confirmarToken();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden z-0">
      <HeroBackground />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-yellow-500/20">

          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              <LogoAnimadaLojas width={90} height={90} animated={!erro} />
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 tracking-wider font-sans">
              Autenticação por Link
            </h1>
          </div>

          {erro ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                <XCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <span>{erro}</span>
              </div>
              <div className="text-center pt-2">
                <Link
                  to="/entrar-com-link"
                  className="text-xs text-yellow-500 hover:text-yellow-400 underline font-sans"
                >
                  Solicitar um novo link de acesso
                </Link>
              </div>
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-xs text-gray-400 hover:text-gray-300 underline font-sans"
                >
                  Voltar para o login com senha
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
              <p className="text-sm text-gray-300 font-sans">
                Validando seu link de acesso...
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaginaConfirmarMagicLink;
