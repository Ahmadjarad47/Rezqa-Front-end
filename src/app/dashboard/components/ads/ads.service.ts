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
  email?: string;
  isActive?: boolean;
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

  updateAd(adId: number, updateData: UpdateAdDto, files: File[]): Observable<AdResponseDto> {
    console.log('=== SERVICE: SENDING UPDATE REQUEST ===');
    console.log('API URL:', `${this.apiUrl}Ad/update`);
    console.log('Ad ID:', adId);
    console.log('Update Data:', updateData);
    console.log('Files count:', files.length);
    
    // Create FormData for the request
    const formData = new FormData();
    
    // Add the JSON data as individual form fields to match the UpdateAdDto structure
    formData.append('Id', updateData.id.toString());
    formData.append('Title', updateData.title);
    formData.append('Description', updateData.description);
    formData.append('Price', updateData.price.toString());
    formData.append('Location', updateData.location);
    formData.append('Phone', updateData.phone);
    if (updateData.email) {
      formData.append('Email', updateData.email);
    }
    if (updateData.isActive !== undefined) {
      formData.append('IsActive', updateData.isActive.toString());
    }
    
    // Add files with the correct parameter name that matches the C# API
    files.forEach((file, index) => {
      console.log(`Adding file ${index + 1}:`, file.name, file.size, file.type);
      formData.append('ImageUrl', file);
    });
    
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${(pair[1] as File).name}` : pair[1]));
    }
    
    return this.http.put<AdResponseDto>(`${this.apiUrl}Ad/update`, formData);
  }

  // Test method to check if the API endpoint is accessible
  testAdEndpoint(adId: number): Observable<any> {
    console.log('=== SERVICE: TESTING ENDPOINT ===');
    console.log('Testing URL:', `${this.apiUrl}Ad/${adId}`);
    
    return this.http.get(`${this.apiUrl}Ad/${adId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Updates the active status of an ad using the new backend endpoint.
   * @param adId The ID of the ad to update.
   */
  updateActiveStatus(adId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}Ad/update-Active-show?id=${adId}`, null);
  }

  /**
   * Initiates payment for a specific ad that has been confirmed by admin.
   * @param adId The ID of the ad to pay for.
   * @param activeMonths The number of months to activate the ad for.
   */
  payForSpecificAd(adId: number, activeMonths: number): Observable<AdResponseDto> {
    return this.http.post<AdResponseDto>(`${this.apiUrl}Ad/createpy`, {
      adId,
      months:activeMonths
    });
  }
} 