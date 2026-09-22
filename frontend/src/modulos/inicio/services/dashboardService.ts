import { clienteHttp } from '@/compartilhado/contextos/AuthContext';

export interface DashboardStats {
  total_members: number;
  next_events: Array<{
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
  }>;
  upcoming_birthdays: Array<{
    name: string;
    date: string;
    type: string;
  }>;
  active_notices_count: number;
  active_notices: Array<Notice>;
  next_session: {
    id: number;
    title: string;
    session_date: string;
    start_time?: string;
  } | null;
  classifieds_count: number;
  dining_scale: Array<{
    id: number;
    date: string;
    position: string;
    member_id: number;
    name: string;
  }>;
  lodge_members_stats: {
    total: number;
    masters: number;
    fellows: number;
    apprentices: number;
  };
  lodge_info: {
    id: number;
    name: string;
    number: string;
    rite: string;
    session_day: string;
    session_time: string;
    potencia: string;
    subpotencia: string;
    foundation_date: string;
    address: string;
    email: string;
    cnpj: string;
    logo_url?: string;
  };
}

export interface CalendarEvent {
  date: number;
  title: string;
  type: 'sessao' | 'evento' | 'aniversario' | 'iniciacao' | 'elevacao' | 'exaltacao' | 'aniversario_familiar' | 'casamento' | 'instalacao';
  full_date: string;
  status?: string;
  situacao?: string;
}

export interface LodgeMember {
  id: number;
  full_name: string;
  cim?: string;
  email: string;
  phone?: string;
  profile_picture_path?: string;
  degree?: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  date_posted: string;
  expiration_date?: string;
  lodge_id: number;
}

export const getDashboardStats = async (lodgeId?: string | number): Promise<DashboardStats> => {
  const url = lodgeId ? `/lojas/${lodgeId}/dashboard/stats` : '/dashboard/stats';
  const response = await clienteHttp.get(url);
  return response.data;
};

export const getLodgeMembers = async (lodgeId?: string | number): Promise<LodgeMember[]> => {
  const url = lodgeId ? `/lojas/${lodgeId}/dashboard/members` : '/dashboard/members';
  const response = await clienteHttp.get(url);
  return response.data;
};

export const getCalendarEvents = async (month: number, year: number, lodgeId?: string | number): Promise<CalendarEvent[]> => {
  const url = lodgeId ? `/lojas/${lodgeId}/dashboard/calendar` : '/dashboard/calendar';
  const response = await clienteHttp.get(url, {
    params: { month, year }
  });
  return response.data;
};

export const getNotices = async (lodgeId?: string | number): Promise<Notice[]> => {
  const response = await clienteHttp.get('/notices/', { params: { lodge_id: lodgeId } });
  return response.data;
};

export const createNotice = async (data: { title: string; content: string; lodge_id?: string | number; expiration_date?: string }): Promise<Notice> => {
  const response = await clienteHttp.post('/notices/', data);
  return response.data;
};

export const updateNotice = async (id: number, data: { title?: string; content?: string; expiration_date?: string | null; lodge_id?: string | number }): Promise<Notice> => {
  const response = await clienteHttp.put(`/notices/${id}`, data, { params: { lodge_id: data.lodge_id } });
  return response.data;
};

export const deleteNotice = async (id: number, lodgeId?: string | number): Promise<void> => {
  await clienteHttp.delete(`/notices/${id}`, { params: { lodge_id: lodgeId } });
};
