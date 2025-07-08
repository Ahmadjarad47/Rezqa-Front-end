import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = environment.apiUrl + 'admin/report';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastr: ToastrService
  ) { }

  private handleError(error: any): Observable<never> {
    this.toastr.error('حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة لاحقاً.', 'خطأ');
    return throwError(() => error);
  }

  getStatus(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(`${this.apiUrl}/status`).pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  getHealth(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(`${this.apiUrl}/health`).pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  getMetrics(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get(`${this.apiUrl}/metrics`).pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  clearCache(): Observable<any> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.post(`${this.apiUrl}/clear-cache`, {}).pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }
}
