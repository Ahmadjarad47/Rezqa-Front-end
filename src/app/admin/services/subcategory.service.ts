import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, EMPTY, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  SubCategory,
  GetAllSubCategoriesRequest,
  PaginatedResult,
  CreateSubCategoryRequest,
  UpdateSubCategoryRequest,
  DeleteSubCategoryRequest,
  SubCategoryDto,
} from '../models/subcategory';
import { environment } from '../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class SubCategoryService {
  private apiUrl = environment.apiUrl + 'admin/SubCategory';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastr: ToastrService
  ) {}

  private handleError(error: any): Observable<never> {
    this.toastr.error('حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة لاحقاً.', 'خطأ');
    return throwError(() => error);
  }

  // Get all sub-categories with pagination, search, and filtering
  getSubCategories(
    request: GetAllSubCategoriesRequest
  ): Observable<PaginatedResult<SubCategoryDto>> {
    if (isPlatformBrowser(this.platformId)) {
      let params = new HttpParams()
        .set('PageNumber', request.pageNumber.toString())
        .set('PageSize', request.pageSize.toString());

      if (request.searchTerm) {
        params = params.set('SearchTerm', request.searchTerm);
      }
      if (request.categoryId) {
        params = params.set('CategoryId', request.categoryId.toString());
      }

      return this.http.get<PaginatedResult<SubCategoryDto>>(this.apiUrl, {
        params,
      }).pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  // Get sub-category by id
  getSubCategory(id: number): Observable<SubCategoryDto> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get<SubCategoryDto>(`${this.apiUrl}/${id}`)
        .pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  // Create new sub-category
  createSubCategory(
    request: CreateSubCategoryRequest
  ): Observable<SubCategoryDto> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.post<SubCategoryDto>(this.apiUrl, request)
        .pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  // Update sub-category
  updateSubCategory(
    id: number,
    request: UpdateSubCategoryRequest
  ): Observable<SubCategoryDto> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.put<SubCategoryDto>(`${this.apiUrl}/${id}`, request)
        .pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  // Delete sub-category
  deleteSubCategory(id: number): Observable<void> {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.delete<void>(`${this.apiUrl}/${id}`)
        .pipe(catchError(error => this.handleError(error)));
    }
    return EMPTY;
  }

  // Get sub-categories by category ID
  getSubCategoriesByCategory(
    categoryId: number,
    request: GetAllSubCategoriesRequest
  ): Observable<PaginatedResult<SubCategoryDto>> {
    let params = new HttpParams()
      .set('PageNumber', request.pageNumber.toString())
      .set('PageSize', request.pageSize.toString());

    if (request.searchTerm) {
      params = params.set('SearchTerm', request.searchTerm);
    }

    return this.http.get<PaginatedResult<SubCategoryDto>>(
      `${this.apiUrl}/by-category/${categoryId}`,
      { params }
    ).pipe(catchError(error => this.handleError(error)));
  }
}
