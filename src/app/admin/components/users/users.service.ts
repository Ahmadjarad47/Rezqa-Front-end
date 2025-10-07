import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlockUserDto, GetAllUsers } from '../../models/users/Crud';
import { PaginatedResult } from '@app/models/paginated-result.model';
import { environment } from '@environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private url = `${environment.apiUrl}admin/Users/`;

  constructor(private http: HttpClient) {}

  getAllUsers(pageNumber: number = 1, pageSize: number = 10, search?: string): Observable<PaginatedResult<GetAllUsers>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResult<GetAllUsers>>(`${this.url}getAll`, { params });
  }

  blockUser(request: BlockUserDto): Observable<boolean> {
    return this.http.post<boolean>(`${this.url}block-unblock`, request);
  }

  getUniqueVisitorCount(): Observable<{ uniqueVisitors: number }> {
    return this.http.get<{ uniqueVisitors: number }>(`${this.url}unique-visitors`);
  }
}
