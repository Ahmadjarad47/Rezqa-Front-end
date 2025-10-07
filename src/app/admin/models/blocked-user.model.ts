export interface BlockedUserInfo {
  id: string;
  type: string; // "IP" or "Client"
  value: string; // IP address or Client ID
  blockedAt: Date;
  expiresAt?: Date;
  requestCount: number;
  reason?: string;
}

export interface UnblockUserByIpRequest {
  ipAddress: string;
}

export interface UnblockUserByClientIdRequest {
  clientId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface CountResponse {
  count: number;
} 