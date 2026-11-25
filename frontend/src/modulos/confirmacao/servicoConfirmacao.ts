// EM CONFORMIDADE COM AS REGRAS DE OURO DO E-SIGMA
import axios from 'axios';
import { clienteHttp } from '@/compartilhado/contextos/AuthContext';
import { obterUrlLojasApi } from '@/compartilhado/servicos/configuracaoApi';

// Instância isolada para rotas públicas — nunca dispara interceptor de 401 -> /login
const clientePublico = axios.create({
  baseURL: obterUrlLojasApi(),
  timeout: 15000,
});

export interface TotaisConfirmacao {
  irmaos_confirmados: number;
  acompanhantes: number;
  total_pessoas: number;
  presentes_checkin: number;
}

export interface RegistroConfirmacao {
  id: number;
  lista_id: number;
  loja_id: number;
  primeiro_nome: string;
  ultimo_nome: string;
  acompanhantes: number;
  total_pessoas: number;
  status: 'CONFIRMADO' | 'CANCELADO' | string;
  origem: 'ANUNCIANTE' | 'LINK' | 'MANUAL' | string;
  presente: boolean;
  observacao?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ListaConfirmacao {
  id: number;
  loja_id: number;
  sessao_id?: number | null;
  titulo: string;
  texto_anuncio: string;
  data_evento: string;
  status: string;
  publicado_por_email?: string | null;
  publicado_por_nome?: string | null;
  publicado_em: string;
  encerrado_em?: string | null;
  ultimo_disparo_em?: string | null;
  totais?: TotaisConfirmacao | null;
  registros?: RegistroConfirmacao[] | null;
}

export interface ConfiguracaoConfirmacao {
  id: number;
  loja_id: number;
  slug_publico: string;
  url_publica_base?: string | null;
  grupo_whatsapp_jid?: string | null;
  grupo_whatsapp_nome?: string | null;
  horarios_dias_normais: string;
  horarios_dia_evento: string;
  dia_semana_reset: number;
  horario_reset: string;
  fuso_horario: string;
  republicar_ao_confirmar: boolean;
  ativo: boolean;
}

export interface PublicadorAutorizado {
  id: number;
  loja_id: number;
  email: string;
  nome?: string | null;
  observacao?: string | null;
  ativo: boolean;
  autorizado_por_email?: string | null;
  criado_em: string;
}

export interface LogDisparoWhatsapp {
  id: number;
  loja_id: number;
  lista_id?: number | null;
  tipo_disparo: string;
  slot_agendado?: string | null;
  grupo_whatsapp_jid?: string | null;
  modo_simulador: boolean;
  sucesso: boolean;
  mensagem_enviada?: string | null;
  erro?: string | null;
  criado_em: string;
}

export interface PainelConfirmacao {
  loja_id: number;
  nome_loja: string;
  usuario_logado_nome: string;
  usuario_logado_primeiro_nome: string;
  usuario_logado_ultimo_nome: string;
  eh_gestao_loja: boolean;
  configuracao: ConfiguracaoConfirmacao;
  url_publica_efetiva: string;
  lista_aberta?: ListaConfirmacao | null;
  totais: TotaisConfirmacao;
  proximo_disparo?: string | null;
  registros: RegistroConfirmacao[];
  logs_recentes: LogDisparoWhatsapp[];
}

export interface RegistroPublicoItem {
  id: number;
  primeiro_nome: string;
  ultimo_nome: string;
  acompanhantes: number;
  total_pessoas: number;
  origem: string;
}

export interface PainelPublico {
  loja_id: number;
  nome_loja: string;
  numero_loja?: string | null;
  slug_publico: string;
  em_espera: boolean;
  titulo?: string | null;
  texto_anuncio?: string | null;
  data_evento?: string | null;
  totais: TotaisConfirmacao;
  confirmados: RegistroPublicoItem[];
  meu_registro?: RegistroPublicoItem | null;
}

export interface WhatsappStatus {
  loja_id?: string;
  status: string;
  connected: boolean;
  modo_simulador?: boolean;
  qr_code?: string | null;
  phone_number?: string | null;
  push_name?: string | null;
  last_error?: string | null;
}

export interface WhatsappGrupo {
  jid: string;
  name: string;
  participants_count: number;
}

export const servicoConfirmacao = {
  async obterPainel(lojaId: string | number): Promise<PainelConfirmacao> {
    const res = await clienteHttp.get(`/lojas/${lojaId}/confirmacao-whatsapp/painel`);
    return res.data;
  },

  async previewAnuncio(
    lojaId: string | number,
    texto_anuncio: string
  ): Promise<{ data_evento: string; titulo_sugerido: string; data_encontrada_no_texto: boolean }> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/preview-anuncio`, {
      texto_anuncio,
    });
    return res.data;
  },

  async publicarLista(
    lojaId: string | number,
    payload: {
      texto_anuncio: string;
      titulo?: string;
      data_evento?: string;
      incluir_anunciante: boolean;
      primeiro_nome_anunciante?: string;
      ultimo_nome_anunciante?: string;
      acompanhantes_anunciante: number;
    }
  ): Promise<ListaConfirmacao> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/publicar`, payload);
    return res.data;
  },

  async listarHistorico(lojaId: string | number): Promise<ListaConfirmacao[]> {
    const res = await clienteHttp.get(`/lojas/${lojaId}/confirmacao-whatsapp/listas`);
    return res.data;
  },

  async baixarCsv(lojaId: string | number, listaId: number): Promise<Blob> {
    const res = await clienteHttp.get(`/lojas/${lojaId}/confirmacao-whatsapp/listas/${listaId}/csv`, {
      responseType: 'blob',
    });
    return res.data;
  },

  async resetarLista(lojaId: string | number): Promise<{ ok: boolean; arquivadas: number }> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/reset`);
    return res.data;
  },

  async dispararAgora(lojaId: string | number): Promise<LogDisparoWhatsapp> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/disparar-agora`);
    return res.data;
  },

  async inserirRegistroManual(
    lojaId: string | number,
    payload: { primeiro_nome: string; ultimo_nome: string; acompanhantes: number; observacao?: string }
  ): Promise<RegistroConfirmacao> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/registros`, payload);
    return res.data;
  },

  async atualizarRegistro(
    lojaId: string | number,
    registroId: number,
    payload: Partial<{
      primeiro_nome: string;
      ultimo_nome: string;
      acompanhantes: number;
      status: string;
      presente: boolean;
      observacao: string;
    }>
  ): Promise<RegistroConfirmacao> {
    const res = await clienteHttp.patch(
      `/lojas/${lojaId}/confirmacao-whatsapp/registros/${registroId}`,
      payload
    );
    return res.data;
  },

  async removerRegistro(lojaId: string | number, registroId: number): Promise<void> {
    await clienteHttp.delete(`/lojas/${lojaId}/confirmacao-whatsapp/registros/${registroId}`);
  },

  async listarPublicadores(lojaId: string | number): Promise<PublicadorAutorizado[]> {
    const res = await clienteHttp.get(`/lojas/${lojaId}/confirmacao-whatsapp/publicadores`);
    return res.data;
  },

  async adicionarPublicador(
    lojaId: string | number,
    payload: { email: string; nome?: string; observacao?: string }
  ): Promise<PublicadorAutorizado> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/publicadores`, payload);
    return res.data;
  },

  async removerPublicador(lojaId: string | number, pubId: number): Promise<void> {
    await clienteHttp.delete(`/lojas/${lojaId}/confirmacao-whatsapp/publicadores/${pubId}`);
  },

  async atualizarConfiguracao(
    lojaId: string | number,
    payload: Partial<ConfiguracaoConfirmacao>
  ): Promise<ConfiguracaoConfirmacao> {
    const res = await clienteHttp.put(`/lojas/${lojaId}/confirmacao-whatsapp/configuracao`, payload);
    return res.data;
  },

  async whatsappStatus(lojaId: string | number): Promise<WhatsappStatus> {
    const res = await clienteHttp.get(`/lojas/${lojaId}/confirmacao-whatsapp/whatsapp/status`);
    return res.data;
  },

  async whatsappConectar(lojaId: string | number): Promise<WhatsappStatus> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/whatsapp/conectar`);
    return res.data;
  },

  async whatsappDesconectar(lojaId: string | number): Promise<WhatsappStatus> {
    const res = await clienteHttp.post(`/lojas/${lojaId}/confirmacao-whatsapp/whatsapp/desconectar`);
    return res.data;
  },

  async whatsappGrupos(lojaId: string | number): Promise<{ groups: WhatsappGrupo[]; erro?: string; modo_simulador?: boolean }> {
    const res = await clienteHttp.get(`/lojas/${lojaId}/confirmacao-whatsapp/whatsapp/grupos`);
    return res.data;
  },

  // Rotas Públicas
  async obterPainelPublico(slugOuLoja: string, tokenAparelho?: string): Promise<PainelPublico> {
    const res = await clientePublico.get(`/confirmacao-publica/${encodeURIComponent(slugOuLoja)}`, {
      params: tokenAparelho ? { token_aparelho: tokenAparelho } : undefined,
    });
    return res.data;
  },

  async confirmarPublico(
    slugOuLoja: string,
    payload: { primeiro_nome: string; ultimo_nome: string; acompanhantes: number; token_aparelho: string }
  ): Promise<PainelPublico> {
    const res = await clientePublico.post(
      `/confirmacao-publica/${encodeURIComponent(slugOuLoja)}/confirmar`,
      payload
    );
    return res.data;
  },

  async cancelarPublico(slugOuLoja: string, token_aparelho: string): Promise<PainelPublico> {
    const res = await clientePublico.post(
      `/confirmacao-publica/${encodeURIComponent(slugOuLoja)}/cancelar`,
      { token_aparelho }
    );
    return res.data;
  },
};
