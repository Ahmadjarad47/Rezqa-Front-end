import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { AdDto } from '../../../models/ad.dto';

export interface UpdateAdDto {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  phone: string;
  email: string;
  imageUrl?: File[];
}

export interface AdResponseDto {
  isSuccess: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardAdsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUserAds(): Observable<AdDto[]> {
    return this.http.get<AdDto[]>(`${this.apiUrl}Ad/user`);
  }

  deleteAd(adId: number): Observable<AdResponseDto> {
    return this.http.delete<AdResponseDto>(`${this.apiUrl}Ad/${adId}`);
  }

  updateAdStatus(adId: number, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}Ad/${adId}/status`, { isActive });
  }

  updateAd(adId: number, formData: FormData): Observable<AdResponseDto> {
    return this.http.put<AdResponseDto>(`${this.apiUrl}Ad/${adId}`, formData);
  }

  /**
   * Updates the active status of an ad using the new backend endpoint.
   * @param adId The ID of the ad to update.
   */
  updateActiveStatus(adId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}Ad/update-Active-show?id=${adId}`, null);
  }
} 