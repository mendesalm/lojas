// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState } from 'react';
import axios from 'axios';
import { KeyRound, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroBackground from '@/compartilhado/componentes/HeroBackground';
import LogoAnimadaLojas from '@/compartilhado/componentes/LogoAnimadaLojas';
import { useAuth, clienteHttp } from '@/compartilhado/contextos/AuthContext';

const ESIGMA_API_URL = import.meta.env.VITE_ESIGMA_API_URL || 'http://localhost:8000/api/v1';

export const PaginaTrocarSenhaObrigatoria: React.FC = () => {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  const { token, usuario } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmacaoSenha) {
      setErro('A confirmação da nova senha não confere.');
      return;
    }

    setCarregando(true);
    try {
      await axios.post(
        `${ESIGMA_API_URL}/auth/trocar-senha-obrigatoria`,
        {
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
          confirmacao_nova_senha: confirmacaoSenha,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      navigate('/inicio', { replace: true });
    } catch (err: any) {
      setErro(err.response?.data?.detail || err.message || 'Não foi possível alterar sua senha.');
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
              Troca Obrigatória de Senha
            </h1>
            <p className="text-sm text-gray-400 mt-2 font-sans">
              Por motivos de segurança, você precisa definir uma nova senha pessoal antes de acessar o sistema.
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
                type="password"
                required
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder=" "
                className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
              />
              <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                Senha Provisória Atual
              </label>
              <KeyRound className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
            </div>

            <div className="relative group">
              <input
                type="password"
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder=" "
                className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
              />
              <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                Nova Senha (mínimo 8 dígitos)
              </label>
              <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
            </div>

            <div className="relative group">
              <input
                type="password"
                required
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
                placeholder=" "
                className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
              />
              <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                Confirme a Nova Senha
              </label>
              <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl text-sm shadow-[0_4px_14px_rgba(234,179,8,0.2)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.4)] transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {carregando ? <span>Atualizando senha...</span> : <span>Salvar Nova Senha</span>}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default PaginaTrocarSenhaObrigatoria;
