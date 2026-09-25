// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React, { useState } from 'react';
import axios from 'axios';
import { Building2, Hash, Landmark, User, Mail, Phone, Briefcase, GraduationCap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeroBackground from '@/compartilhado/componentes/HeroBackground';
import LogoAnimadaLojas from '@/compartilhado/componentes/LogoAnimadaLojas';
import { obterUrlEsigmaApi } from '@/compartilhado/servicos/configuracaoApi';

const ESIGMA_API_URL = obterUrlEsigmaApi();

const GRAUS_MACONICOS = [
  { valor: 1, rotulo: 'Aprendiz' },
  { valor: 2, rotulo: 'Companheiro' },
  { valor: 3, rotulo: 'Mestre' },
];

interface FormularioSolicitacao {
  potencia_informada: string;
  numero_loja_informado: string;
  nome_loja_informado: string;
  nome_completo: string;
  grau_maconico: string;
  cim: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo_atual: string;
}

const FORMULARIO_VAZIO: FormularioSolicitacao = {
  potencia_informada: '',
  numero_loja_informado: '',
  nome_loja_informado: '',
  nome_completo: '',
  grau_maconico: '',
  cim: '',
  cpf: '',
  email: '',
  telefone: '',
  cargo_atual: '',
};

export const PaginaSolicitarCadastro: React.FC = () => {
  const [form, setForm] = useState<FormularioSolicitacao>(FORMULARIO_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const navigate = useNavigate();

  const atualizarCampo = (campo: keyof FormularioSolicitacao) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((atual) => ({ ...atual, [campo]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
    setCarregando(true);
    try {
      const resposta = await axios.post(`${ESIGMA_API_URL}/solicitacoes-cadastro/`, {
        potencia_informada: form.potencia_informada,
        numero_loja_informado: form.numero_loja_informado,
        nome_loja_informado: form.nome_loja_informado,
        nome_completo: form.nome_completo,
        grau_maconico: Number(form.grau_maconico),
        cim: form.cim,
        cpf: form.cpf,
        email: form.email,
        telefone: form.telefone,
        cargo_atual: form.cargo_atual,
      });
      setMensagem(resposta.data.mensagem || 'Solicitação enviada com sucesso! Aguarde a análise da diretoria.');
      setEnviado(true);
    } catch (err: any) {
      setErro(err.response?.data?.detail || err.message || 'Não foi possível enviar sua solicitação.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden z-0">
      <HeroBackground />

      <div className="w-full max-w-xl relative z-10 my-8">
        <div className="bg-[#1a1a1a]/60 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-yellow-500/20">

          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4">
              <LogoAnimadaLojas width={90} height={90} animated={false} />
            </div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 tracking-wider font-sans">
              Solicitação de Cadastro
            </h1>
            <p className="text-sm text-gray-400 mt-2 font-sans">
              Preencha os dados abaixo para solicitar acesso ao sistema de Lojas. Sua solicitação será analisada pela diretoria da sua Loja ou administração.
            </p>
          </div>

          {enviado ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-200 text-center">
                {mensagem || 'Solicitação enviada com sucesso. Quando aprovada, você receberá sua senha provisória por e-mail.'}
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl text-sm shadow-[0_4px_14px_rgba(234,179,8,0.2)] transition-all cursor-pointer"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 text-center">
                  {erro}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-yellow-500/80 font-bold mb-2">Dados da Loja e Potência</p>
                
                <div className="relative group">
                  <input
                    type="text"
                    required
                    value={form.potencia_informada}
                    onChange={atualizarCampo('potencia_informada')}
                    placeholder=" "
                    autoComplete="off"
                    className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                  />
                  <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                    Potência Maçônica (ex: GOB, GL, etc.)
                  </label>
                  <Landmark className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="relative group sm:col-span-1">
                    <input
                      type="text"
                      required
                      value={form.numero_loja_informado}
                      onChange={atualizarCampo('numero_loja_informado')}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                      Nº da Loja
                    </label>
                    <Hash className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>

                  <div className="relative group sm:col-span-2">
                    <input
                      type="text"
                      required
                      value={form.nome_loja_informado}
                      onChange={atualizarCampo('nome_loja_informado')}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                      Nome da Loja
                    </label>
                    <Building2 className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <p className="text-xs uppercase tracking-wider text-yellow-500/80 font-bold mb-2">Dados do Obreiro</p>

                <div className="relative group">
                  <input
                    type="text"
                    required
                    value={form.nome_completo}
                    onChange={atualizarCampo('nome_completo')}
                    placeholder=" "
                    className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                  />
                  <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                    Nome Completo
                  </label>
                  <User className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      value={form.cim}
                      onChange={atualizarCampo('cim')}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                      CIM
                    </label>
                    <Hash className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      required
                      value={form.cpf}
                      onChange={atualizarCampo('cpf')}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                      CPF (apenas números)
                    </label>
                    <Hash className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="relative group">
                    <select
                      required
                      value={form.grau_maconico}
                      onChange={atualizarCampo('grau_maconico')}
                      className="w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    >
                      <option value="">Selecione o Grau</option>
                      {GRAUS_MACONICOS.map((g) => (
                        <option key={g.valor} value={g.valor}>
                          {g.rotulo}
                        </option>
                      ))}
                    </select>
                    <GraduationCap className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      required
                      value={form.cargo_atual}
                      onChange={atualizarCampo('cargo_atual')}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                      Cargo Atual (ou "Membro")
                    </label>
                    <Briefcase className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="relative group">
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={atualizarCampo('email')}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                      E-mail de Contato
                    </label>
                    <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>

                  <div className="relative group">
                    <input
                      type="tel"
                      required
                      value={form.telefone}
                      onChange={atualizarCampo('telefone')}
                      placeholder=" "
                      className="peer w-full bg-[#222] border border-gray-700 rounded-xl pl-12 pr-4 pt-5 pb-2 text-sm text-white focus:border-yellow-500 outline-none transition-all focus:bg-[#2a2a2a]"
                    />
                    <label className="absolute left-12 top-1.5 text-[10px] text-gray-500 transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-yellow-500">
                      WhatsApp / Telefone
                    </label>
                    <Phone className="w-5 h-5 text-gray-500 absolute left-4 top-3.5 peer-focus:text-yellow-500 transition-colors" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={carregando}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3.5 px-4 rounded-xl text-sm shadow-[0_4px_14px_rgba(234,179,8,0.2)] hover:shadow-[0_6px_20px_rgba(234,179,8,0.4)] transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                {carregando ? <span>Enviando solicitação...</span> : <span>Enviar Solicitação de Cadastro</span>}
              </button>
            </form>
          )}

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

export default PaginaSolicitarCadastro;
