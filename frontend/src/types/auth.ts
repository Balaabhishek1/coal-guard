/**
 * Authentication and RBAC Role Contracts
 * Aligned strictly with Phase 1 FastAPI backend schemas and CMR 2017 statutory designations.
 */

export type UserRole =
  | "MINER"
  | "OVERMAN"
  | "MANAGER"
  | "COLLIERY_MANAGER"
  | "MINING_SIRDAR"
  | "SAFETY_OFFICER"
  | "GATE_OPERATOR"
  | "CORPORATE_HQ"
  | "DGMS_INSPECTOR"
  | "CONTRACTOR_SUPERVISOR"
  | "ADMIN";

export interface WorkerCredential {
  id: string;
  user_id: string;
  vtc_training_expiry: string;
  pme_medical_expiry: string;
  current_shift_start?: string | null;
  is_statutorily_eligible: boolean;
}

export interface Contractor {
  id: string;
  company_name: string;
  license_number: string;
  contract_code?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  safety_rating: number;
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email?: string | null;
  rfid_tag?: string | null;
  role: UserRole;
  contractor_id?: string | null;
  is_active: boolean;
  created_at?: string;
  credentials?: WorkerCredential | null;
  contractor?: Contractor | null;
}

export interface LoginRequest {
  username?: string;
  rfid_tag?: string;
  rfid_tag_or_username?: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  user?: UserProfile;
}

export interface TokenClaims {
  sub: string;
  role: UserRole;
  rfid_tag?: string | null;
  exp: number;
  iat?: number;
}
