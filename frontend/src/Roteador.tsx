// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutLojas } from '@/compartilhado/layout/LayoutLojas';
import { PaginaInicio } from '@/modulos/inicio/PaginaInicio';
import { PaginaQuadroObreiros } from '@/modulos/obreiros/PaginaQuadroObreiros';
import { PaginaSessoes } from '@/modulos/sessoes/PaginaSessoes';
import { PaginaVisitantes } from '@/modulos/sessoes/PaginaVisitantes';
import { PaginaComissoes } from '@/modulos/administracao/PaginaComissoes';
import { PaginaDadosLoja } from '@/modulos/administracao/PaginaDadosLoja';
import { PaginaMeuCadastro } from '@/modulos/obreiro/PaginaMeuCadastro';
import { PaginaLogin } from '@/modulos/autenticacao/PaginaLogin';
import { PaginaEsqueciSenha } from '@/modulos/autenticacao/PaginaEsqueciSenha';
import { PaginaSolicitarCadastro } from '@/modulos/autenticacao/PaginaSolicitarCadastro';
import { PaginaTrocarSenhaObrigatoria } from '@/modulos/autenticacao/PaginaTrocarSenhaObrigatoria';
import { PaginaEntrarComLink } from '@/modulos/autenticacao/PaginaEntrarComLink';
import { PaginaConfirmarMagicLink } from '@/modulos/autenticacao/PaginaConfirmarMagicLink';
import { PaginaEntrarComPasskey } from '@/modulos/autenticacao/PaginaEntrarComPasskey';
import { useAuth } from '@/compartilhado/contextos/AuthContext';

/**
 * Guarda de rota do Lojas — idêntico ao do CoReVM.
 * Se o usuário não possui token ou identidade válida do e-Sigma,
 * redireciona imediatamente para a tela de /login.
 */
function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { token, usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#080808] text-yellow-500 font-sans">
        Carregando Sistema de Lojas...
      </div>
    );
  }

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export const Roteador: React.FC = () => {
  return (
    <Routes>
      {/* Rotas Públicas de Autenticação */}
      <Route path="/login" element={<PaginaLogin />} />
      <Route path="/esqueci-senha" element={<PaginaEsqueciSenha />} />
      <Route path="/solicitar-cadastro" element={<PaginaSolicitarCadastro />} />
      <Route path="/entrar-com-link" element={<PaginaEntrarComLink />} />
      <Route path="/magic-link" element={<PaginaConfirmarMagicLink />} />
      <Route path="/entrar-com-passkey" element={<PaginaEntrarComPasskey />} />

      {/* Troca obrigatória de senha (exige token de primeiro acesso) */}
      <Route
        path="/trocar-senha-obrigatoria"
        element={
          <RotaProtegida>
            <PaginaTrocarSenhaObrigatoria />
          </RotaProtegida>
        }
      />

      {/* Rota Raiz redireciona para /inicio (protegido) */}
      <Route path="/" element={<Navigate to="/inicio" replace />} />

      {/* Rotas Protegidas sob Layout Oficial */}
      <Route
        element={
          <RotaProtegida>
            <LayoutLojas />
          </RotaProtegida>
        }
      >
        <Route path="/inicio" element={<PaginaInicio />} />
        <Route path="/obreiros" element={<PaginaQuadroObreiros />} />
        <Route path="/sessoes" element={<PaginaSessoes />} />
        <Route path="/visitantes" element={<PaginaVisitantes />} />
        <Route path="/comissoes" element={<PaginaComissoes />} />
        <Route path="/dados-loja" element={<PaginaDadosLoja />} />
        <Route path="/meu-cadastro" element={<PaginaMeuCadastro />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default Roteador;
