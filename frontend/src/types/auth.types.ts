export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  personal_number: string;
  phone_number: string | null;
  must_change_password: boolean;
  is_admin: boolean;
  is_commander: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}
