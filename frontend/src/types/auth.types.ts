export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  personal_number: string;
  phone_number: string | null;
  must_change_password: boolean;
  is_admin: boolean;
  is_commander: boolean;
  assigned_department_id?: number;
  assigned_section_id?: number;
  commands_department_id?: number;
  commands_section_id?: number;
  commands_team_id?: number;
  notif_sick_leave?: boolean;
  notif_transfers?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}
