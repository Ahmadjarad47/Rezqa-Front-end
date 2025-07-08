import {
  HttpClient,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Create a service to manage the refresh token state
const refreshTokenState = {
  isRefreshing: false,
  refreshTokenSubject: new BehaviorSubject<any>(null),
};

// Helper function to handle refresh token errors
const handleRefreshTokenError = (router: Router) => {
  refreshTokenState.refreshTokenSubject.next(null);
  router.navigate(['/identity/login'], {
    queryParams: { returnUrl: router.url },
  });
};

// Helper function to refresh the token
const refreshToken = (http: HttpClient): Observable<any> => {
  return http.post(`${environment.apiUrl}Auth/refresh-token`, {
    withCredentials: true,
  });
};

// Helper function to handle 401 errors
const handle401Error = (
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  router: Router,
  http: HttpClient
): Observable<any> => {
  if (!refreshTokenState.isRefreshing) {
    refreshTokenState.isRefreshing = true;
    refreshTokenState.refreshTokenSubject.next(null);

    return refreshToken(http).pipe(
      switchMap(() => {
        refreshTokenState.isRefreshing = false;
        refreshTokenState.refreshTokenSubject.next(true);
        return next(
          request.clone({
            withCredentials: true,
          })
        );
      }),
      catchError((error) => {
        refreshTokenState.isRefreshing = false;
        handleRefreshTokenError(router);
        return throwError(() => error);
      })
    );
  }

  return refreshTokenState.refreshTokenSubject.pipe(
    filter((result) => result !== null),
    take(1),
    switchMap(() =>
      next(
        request.clone({
          withCredentials: true,
        })
      )
    )
  );
};

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const http = inject(HttpClient);

  // Add withCredentials to all requests, unless it's already set
  if (!request.withCredentials) {
    request = request.clone({
      withCredentials: true,
    });
  }

  // Skip token refresh for auth-related endpoints
  if (
    request.url.toLowerCase().includes('auth/refresh-token') ||
    request.url.toLowerCase().includes('auth/login') ||
    request.url.toLowerCase().includes('auth/is-auth')
  ) {
    return next(request);
  }

  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        if (event.url?.toLowerCase().includes('auth/refresh-token')) {
          refreshTokenState.refreshTokenSubject.next(true);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (error.url?.toLowerCase().includes('auth/refresh-token')) {
          handleRefreshTokenError(router);
          return throwError(() => error);
        }
        return handle401Error(request, next, router, http);
      }
      return throwError(() => error);
    })
  );
};
