import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, UrlTree } from '@angular/router';
import { environment } from '@environments/environment.development';
import { BehaviorSubject, catchError, filter, map, Observable, of, switchMap, take } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class authAdsGuardAndDashboard implements CanActivate {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);
  private originalUrl: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    // Store the original URL before any redirects
    this.originalUrl = this.router.url;

    return this.checkAuth().pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isRefreshing) {
          return this.handle401Error();
        }
        return of(this.redirectToLogin());
      })
    );
  }

  private checkAuth(): Observable<boolean | UrlTree> {
    return this.http
      .get(`${environment.apiUrl}Auth/is-auth`, {
        withCredentials: true,
        observe: 'response',
      })
      .pipe(  
        map((response) => {
          if (response.status === 200) {
            return true;
          }
          return this.redirectToLogin();
        })
      );
  }

  private handle401Error(): Observable<boolean | UrlTree> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);
          // After successful refresh, try the auth check again
          return this.checkAuth();
        }),
        catchError(() => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          this.originalUrl = null; // Clear stored URL on error
          return of(this.redirectToLogin());
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((result) => result !== null),
      take(1),
      switchMap(() => this.checkAuth())
    );
  }

  private refreshToken(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}Auth/refresh-token`,
      {},
      { withCredentials: true }
    );
  }

  private redirectToLogin(): UrlTree {
    // Store the current URL as returnUrl if it's not already the login page
    const returnUrl =
      this.router.url !== '/identity/login' ? this.router.url : undefined;
    return this.router.createUrlTree(['/identity/login'], {
      queryParams: { returnUrl },
    });
  }
}
