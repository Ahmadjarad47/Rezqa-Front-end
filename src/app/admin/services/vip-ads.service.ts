import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VipAdsDto, CreateVipAdsDto, UpdateVipAdsDto, VipAdsResponseDto, GetAllVipAdsQuery } from '../models/vip-ads.model';
import { PaginatedResult } from '../../models/paginated-result.model';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class VipAdsService {
  private apiUrl = `${environment.apiUrl}admin/VipAds`;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  private handleError(error: any): Observable<never> {
    this.toastr.error('حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة لاحقاً.', 'خطأ');
    return throwError(() => error);
  }

  getAllVipAds(query: GetAllVipAdsQuery): Observable<PaginatedResult<VipAdsDto>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber.toString())
      .set('pageSize', query.pageSize.toString());

    if (query.searchTerm) {
      params = params.set('searchTerm', query.searchTerm);
    }
    if (query.minPrice) {
      params = params.set('minPrice', query.minPrice.toString());
    }
    if (query.maxPrice) {
      params = params.set('maxPrice', query.maxPrice.toString());
    }
    if (query.location) {
      params = params.set('location', query.location);
    }

    return this.http.get<PaginatedResult<VipAdsDto>>(this.apiUrl, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  getVipAdById(id: number): Observable<VipAdsResponseDto> {
    return this.http.get<VipAdsResponseDto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  createVipAd(createDto: CreateVipAdsDto): Observable<VipAdsResponseDto> {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', createDto.title);
    formData.append('description', createDto.description);
    formData.append('price', createDto.price.toString());
    formData.append('phonNumber', createDto.phonNumber);
    
    // Add images
    if (createDto.images && createDto.images.length > 0) {
      for (let i = 0; i < createDto.images.length; i++) {
        formData.append('images', createDto.images[i]);
      }
    }
    
    // Add adsInfo as JSON string
    if (createDto.adsInfo) {
      formData.append('adsInfo', JSON.stringify(createDto.adsInfo));
    }

    return this.http.post<VipAdsResponseDto>(this.apiUrl, formData)
      .pipe(catchError(error => this.handleError(error)));
  }

  updateVipAd(id: number, updateDto: UpdateVipAdsDto): Observable<VipAdsResponseDto> {
    const formData = new FormData();
    
    // Add text fields
    formData.append('id', updateDto.id.toString());
    formData.append('title', updateDto.title);
    formData.append('description', updateDto.description);
    formData.append('price', updateDto.price.toString());
    formData.append('phonNumber', updateDto.phonNumber);
    
    // Add existing images
    if (updateDto.image && updateDto.image.length > 0) {
      updateDto.image.forEach(img => {
        formData.append('image', img);
      });
    }
    
    // Add images to delete
    if (updateDto.imageWantDelete && updateDto.imageWantDelete.length > 0) {
      updateDto.imageWantDelete.forEach(img => {
        formData.append('imageWantDelete', img);
      });
    }
    
    // Add new images
    if (updateDto.images && updateDto.images.length > 0) {
      for (let i = 0; i < updateDto.images.length; i++) {
        formData.append('images', updateDto.images[i]);
      }
    }
    
    // Add adsInfo as JSON string
    if (updateDto.adsInfo) {
      formData.append('adsInfo', JSON.stringify(updateDto.adsInfo));
    }

    return this.http.put<VipAdsResponseDto>(`${this.apiUrl}/${id}`, formData)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteVipAd(id: number): Observable<VipAdsResponseDto> {
    return this.http.delete<VipAdsResponseDto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }
}
