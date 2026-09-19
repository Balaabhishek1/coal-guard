import apiClient from "@/lib/api-client";
import type { AuthResponse, LoginRequest, UserProfile } from "@/types/auth";

/**
 * Authenticate colliery personnel via username, email, or RFID tag
 */
export async function loginApi(credentials: LoginRequest): Promise<AuthResponse> {
  // Support either username or rfid_tag supplied through the unified identifier field
  const payload: Record<string, string> = {
    password: credentials.password,
  };

  const identifier = (credentials.username || credentials.rfid_tag_or_username || credentials.rfid_tag || "").trim();

  if (identifier.startsWith("RFID-")) {
    payload.rfid_tag = identifier;
  } else {
    payload.username = identifier;
  }

  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

/**
 * Fetch statutory profile and active credentials for currently authenticated user
 */
export async function getMeApi(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>("/auth/me");
  return response.data;
}
