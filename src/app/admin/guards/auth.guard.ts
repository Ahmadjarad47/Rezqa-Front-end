import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private originalUrl: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    // Store the original URL before any redirects
    this.originalUrl = this.router.url;
    return this.checkAuth().pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Authentication error:', error);
        if (error.status === 401) {
          // Clear any stored credentials or tokens here if needed
          return of(this.redirectToLogin());
        }
        // For other errors, still redirect to login but log the error
        return of(this.redirectToLogin());
      })
    );
  }

  private checkAuth(): Observable<boolean | UrlTree> {
    return this.http
      .get(`${environment.apiUrl}admin/Base/is-auth`, {
        withCredentials: true,
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (response.status === 200) {
            return true;
          }
          return this.redirectToLogin();
        }),
        catchError((error) => {
          console.error('Auth check failed:', error);
          return throwError(() => error);
        })
      );
  }

  private redirectToLogin(): UrlTree {
    // Use the stored original URL or current URL as returnUrl if it's not already the login page
    const returnUrl =
      this.originalUrl && this.originalUrl !== '/identity/login'
        ? this.originalUrl
        : this.router.url !== '/identity/login'
        ? this.router.url
        : undefined;

    return this.router.createUrlTree(['/identity/login'], {
      queryParams: { returnUrl },
    });
  }
}
