export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  personal_number: string;
  phone_number: string | null;
  national_id?: string; // Often protected/not returned in lists

  // Dates (ISO Strings from backend)
  birth_date: string | null;
  enlistment_date: string | null;
  discharge_date: string | null;

  // Address/Emergency
  city: string | null;
  emergency_contact: string | null;

  // Permissions & Metadata
  is_commander: boolean;
  is_admin: boolean;
  security_clearance: number;
  police_license: boolean;

  // Hierarchy (Flattened for display)
  team_name: string | null;
  section_name: string | null;
  department_name: string | null;
  role_name?: string;
  service_type_name?: string | null;

  // IDs for hierarchy
  team_id: number | null;
  section_id?: number | null;
  department_id?: number | null;
  role_id: number | null;
  service_type_id?: number | null;
  assignment_date?: string | null;

  // Current Status
  status_name: string;
  status_color: string;
}

export interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  personal_number: string;
  national_id: string;
  phone_number?: string;
  city?: string;
  birth_date?: string;
  enlistment_date?: string;
  discharge_date?: string;
  assignment_date?: string;
  team_id?: number;
  section_id?: number;
  department_id?: number;
  role_id?: number;
  service_type_id?: number;
  is_commander?: boolean;
  is_admin?: boolean;
  security_clearance?: number;
  police_license?: boolean;
  emergency_contact?: string;
}

// Hierarchy Tree Structure
export interface TeamNode {
  id: number;
  name: string;
  section_id: number;
}

export interface SectionNode {
  id: number;
  name: string;
  department_id: number;
  teams: TeamNode[];
}

export interface DepartmentNode {
  id: number;
  name: string;
  sections: SectionNode[];
}