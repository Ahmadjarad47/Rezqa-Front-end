import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Ad } from '../../models/ad.model';
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
  ): Observable<{
    items: Ad[];
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.http.get<{
      items: Ad[];
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }>(this.apiUrl, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  updateAd(updatedAd: Ad): Observable<Ad> {
    return this.http.put<Ad>(`${this.apiUrl}/update-Active-show?id=${updatedAd.id}`, null)
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
}
