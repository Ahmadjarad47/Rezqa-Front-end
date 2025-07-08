import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlockUserDto, GetAllUsers } from '../../models/users/Crud';
import { environment } from '@environments/environment.development';


@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private url = `${environment.apiUrl}admin/Users/`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<GetAllUsers[]> {
    return this.http.get<GetAllUsers[]>(`${this.url}getAll`);
  }

  blockUser(request: BlockUserDto): Observable<boolean> {
    return this.http.post<boolean>(`${this.url}block-unblock`, request);
  }
}
