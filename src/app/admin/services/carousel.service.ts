import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Carousel, GetAllCarouselsRequest, PaginatedResult } from '../models/carousel';
import { environment } from '../../../environments/environment.development';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CarouselService {
  private apiUrl = environment.apiUrl + 'admin/Carousel';

  constructor(private http: HttpClient, private toastr: ToastrService) { }

  private handleError(error: any): Observable<never> {
    this.toastr.error('حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة لاحقاً.', 'خطأ');
    return throwError(() => error);
  }

  // Get all carousels with pagination, search, and filtering
  getCarousels(request: GetAllCarouselsRequest): Observable<PaginatedResult<Carousel>> {
    let params = new HttpParams()
      .set('PageNumber', request.pageNumber.toString())
      .set('PageSize', request.pageSize.toString());

    if (request.searchTerm) {
      params = params.set('SearchTerm', request.searchTerm);
    }
    if (request.isPagnationStop !== undefined) {
      params = params.set('isPagnationStop', request.isPagnationStop.toString());
    }

    return this.http.get<PaginatedResult<Carousel>>(this.apiUrl, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  // Get carousel by id
  getCarousel(id: number): Observable<Carousel> {
    return this.http.get<Carousel>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Create new carousel (with file upload)
  createCarousel(carousel: FormData): Observable<number> {
    return this.http.post<number>(this.apiUrl, carousel)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Update carousel
  updateCarousel(id: number, carousel: FormData): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}`, carousel)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Delete carousel
  deleteCarousel(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }
}
