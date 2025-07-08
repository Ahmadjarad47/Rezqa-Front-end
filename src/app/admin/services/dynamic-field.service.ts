import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  DynamicField, 
  GetAllDynamicFieldsRequest, 
  PaginatedResult, 
  CreateDynamicFieldsRequest, 
  UpdateDynamicFieldRequest, 
  DeleteDynamicFieldRequest, 
  DynamicFieldDto 
} from '../models/dynamic-field';
import { environment } from '../../../environments/environment.development';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class DynamicFieldService {
  private apiUrl = environment.apiUrl + 'admin/DynamicField';

  constructor(private http: HttpClient, private toastr: ToastrService) { }

  private handleError(error: any): Observable<never> {
    this.toastr.error('حدث خطأ أثناء تنفيذ العملية. الرجاء المحاولة لاحقاً.', 'خطأ');
    return throwError(() => error);
  }

  // Get all dynamic fields with pagination, search, and filtering
  getDynamicFields(request: GetAllDynamicFieldsRequest): Observable<PaginatedResult<DynamicFieldDto>> {
    let params = new HttpParams()
      .set('PageNumber', request.pageNumber.toString())
      .set('PageSize', request.pageSize.toString());

    if (request.searchTerm) {
      params = params.set('SearchTerm', request.searchTerm);
    }
    if (request.type) {
      params = params.set('Type', request.type);
    }
    if (request.categoryId) {
      params = params.set('CategoryId', request.categoryId.toString());
    }
    if (request.subCategoryId) {
      params = params.set('SubCategoryId', request.subCategoryId.toString());
    }

    return this.http.get<PaginatedResult<DynamicFieldDto>>(this.apiUrl, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  // Get dynamic field by id
  getDynamicField(id: number): Observable<DynamicFieldDto> {
    return this.http.get<DynamicFieldDto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Create dynamic fields in bulk
  createDynamicFields(request: CreateDynamicFieldsRequest): Observable<number[]> {
    return this.http.post<number[]>(this.apiUrl, request)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Update dynamic field
  updateDynamicField(id: number, request: UpdateDynamicFieldRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request)
      .pipe(catchError(error => this.handleError(error)));
  }

  // Delete dynamic field
  deleteDynamicField(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => this.handleError(error)));
  }
} 