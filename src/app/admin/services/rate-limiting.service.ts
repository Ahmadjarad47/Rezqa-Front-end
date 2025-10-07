import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  BlockedUserInfo, 
  UnblockUserByIpRequest, 
  UnblockUserByClientIdRequest, 
  ApiResponse, 
  CountResponse 
} from '../models/blocked-user.model';

@Injectable({
  providedIn: 'root'
})
export class RateLimitingService {
  private baseUrl = `${environment.apiUrl}admin/Users`;

  constructor(private http: HttpClient) { }

  // Get all blocked users
  getBlockedUsers(): Observable<BlockedUserInfo[]> {
    return this.http.get<BlockedUserInfo[]>(`${this.baseUrl}/rate-limit-blocked`);
  }

  // Get count of blocked users
  getBlockedUsersCount(): Observable<CountResponse> {
    return this.http.get<CountResponse>(`${this.baseUrl}/rate-limit-blocked/count`);
  }

  // Unblock user by IP address
  unblockUserByIp(request: UnblockUserByIpRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/rate-limit-unblock/ip`, request);
  }

  // Unblock user by client ID
  unblockUserByClientId(request: UnblockUserByClientIdRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/rate-limit-unblock/client`, request);
  }

  // Get blocked user by IP address
  getBlockedUserByIp(ipAddress: string): Observable<BlockedUserInfo> {
    return this.http.get<BlockedUserInfo>(`${this.baseUrl}/rate-limit-blocked/ip/${ipAddress}`);
  }

  // Get blocked user by client ID
  getBlockedUserByClientId(clientId: string): Observable<BlockedUserInfo> {
    return this.http.get<BlockedUserInfo>(`${this.baseUrl}/rate-limit-blocked/client/${clientId}`);
  }
} 