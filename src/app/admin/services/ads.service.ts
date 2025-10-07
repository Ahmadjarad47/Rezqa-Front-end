import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Ad } from '../../models/ad.model';
import { PaginatedResult } from '../../models/paginated-result.model';
import { SearchParams } from '../models/search-params.model';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AdsService {
  private apiUrl = `${environment.apiUrl}admin/Ads`;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  private handleError(error: any): Observable<never> {
    this.toastr.error('حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة لاحقاً.', 'خطأ');
    return throwError(() => error);
  }

  getAds(
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string
  ): Observable<PaginatedResult<Ad>> {
    let params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    return this.http.get<PaginatedResult<Ad>>(this.apiUrl+"/search", { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  searchAds(searchParams: SearchParams): Observable<PaginatedResult<Ad>> {
    let params = new HttpParams()
      .set('PageNumber', searchParams.pageNumber.toString())
      .set('PageSize', searchParams.pageSize.toString());

    if (searchParams.searchTerm) {
      params = params.set('searchTerm', searchParams.searchTerm);
    }
    if (searchParams.categoryId) {
      params = params.set('CategoryId', searchParams.categoryId.toString());
    }
    if (searchParams.subCategoryId) {
      params = params.set('SubCategoryId', searchParams.subCategoryId.toString());
    }
    if (searchParams.minPrice) {
      params = params.set('minPrice', searchParams.minPrice.toString());
    }
    if (searchParams.maxPrice) {
      params = params.set('maxPrice', searchParams.maxPrice.toString());
    }
    if (searchParams.location) {
      params = params.set('location', searchParams.location);
    }

    return this.http.get<PaginatedResult<Ad>>(`${this.apiUrl}/search`, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  updateAd(updatedAd: Ad): Observable<Ad> {
    return this.http.put<Ad>(`${this.apiUrl}/update?id=${updatedAd.id}`, updatedAd)
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteAd(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete?id=${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  getAdById(id: number): Observable<Ad> {
    return this.http.get<Ad>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  createAd(ad: Omit<Ad, 'id'>): Observable<Ad> {
    return this.http.post<Ad>(this.apiUrl, ad)
      .pipe(catchError(error => this.handleError(error)));
  }

  toggleAdStatus(id: number): Observable<Ad> {
    return this.http.put<Ad>(`${this.apiUrl}/update-Active-show?id=${id}`, null)
      .pipe(catchError(error => this.handleError(error)));
  }

  confirmAd(id: number): Observable<Ad> {
    return this.http.put<Ad>(`${this.apiUrl}/${id}/confirm`, null)
      .pipe(catchError(error => this.handleError(error)));
  }

  unconfirmAd(id: number): Observable<Ad> {
    return this.http.put<Ad>(`${this.apiUrl}/${id}/unconfirm`, null)
      .pipe(catchError(error => this.handleError(error)));
  }
}
