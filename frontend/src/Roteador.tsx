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

export const Roteador: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />

      {/* Rotas Protegidas sob Layout Oficial */}
      <Route path="/" element={<LayoutLojas />}>
        <Route index element={<PaginaInicio />} />
        <Route path="obreiros" element={<PaginaQuadroObreiros />} />
        <Route path="sessoes" element={<PaginaSessoes />} />
        <Route path="visitantes" element={<PaginaVisitantes />} />
        <Route path="comissoes" element={<PaginaComissoes />} />
        <Route path="dados-loja" element={<PaginaDadosLoja />} />
        <Route path="meu-cadastro" element={<PaginaMeuCadastro />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
