import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Category, GetAllCategoriesRequest, PaginatedResult } from '../models/category';
import { environment } from '../../../environments/environment.development';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = environment.apiUrl + 'admin/Category';

  constructor(private http: HttpClient, private toastr: ToastrService) { }

  private handleError(error: any): Observable<never> {
    this.toastr.error('حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة لاحقاً.', 'خطأ');
    return throwError(() => error);
  }

  // Get all categories with pagination, search, and filtering
  getCategories(request: GetAllCategoriesRequest): Observable<PaginatedResult<Category>> {
    let params = new HttpParams()
      .set('PageNumber', request.pageNumber.toString())
      .set('PageSize', request.pageSize.toString());

    if (request.searchTerm) {
      params = params.set('SearchTerm', request.searchTerm);
    }
    if (request.isActive !== undefined) {
      params = params.set('IsActive', request.isActive.toString());
    }

    return this.http.get<PaginatedResult<Category>>(this.apiUrl, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  // Get category by id
  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Create new category (with file upload)
  createCategory(category: FormData): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Update category
  updateCategory(id: number, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Delete category
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }
}
