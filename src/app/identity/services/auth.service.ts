import { inject, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  IAuthResponse,
  IAuthState,
  IAuthUser,
  IChangePasswordRequest,
  ILoginRequest,
  IRegisterRequest,
  IResetPasswordRequest,
  IResendEmailConfirmationRequest,
  IUpdateProfileRequest,
  IVerifyEmailRequest,
  AuthError,
  AuthErrorCode,
  UserData,
  UserDetailsDto,
} from '../models/auth.models';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '@app/core/services/notification.service';
import { SignalRService } from '@app/core/services/signalr.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}Auth`;
  private readonly userKey = 'currentUser';
  private userDataSource = new BehaviorSubject<UserData | null>(null);
  userData$ = this.userDataSource.asObservable();
  private readonly stateSubject = new BehaviorSubject<IAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  public readonly state$ = this.stateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private router: Router,
    private signalRService: SignalRService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  getData() {
    if (isPlatformBrowser(this.platformId)) {
      return this.http.get<UserData>(this.apiUrl + '/user-data').pipe(
        map((value) => {
          this.userDataSource.next(value);
          this.notificationService.success('مرحبا بك مجدداً');
        })
      );
    }
    return EMPTY;
  }

  register(request: IRegisterRequest | FormData): Observable<IAuthResponse> {
    this.setLoading(true);
    // Clear any previous errors
    this.stateSubject.next({
      ...this.stateSubject.value,
      error: null,
    });
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(
        tap((response) => {
          if (!response.isSuccess) {
            throw new Error(response.message || 'Registration failed');
          }
          this.setLoading(false);
        
          // Log successful registration (without sensitive data)
          console.log('Registration successful:', {
            userName: response.userName,
            email: response.email,
            message: response.message,
          });
        }),
        catchError((error) => this.handleError(error))
      );
  }

  login(request: ILoginRequest): Observable<IAuthResponse> {
    this.setLoading(true);
    // Clear any previous errors
    this.stateSubject.next({
      ...this.stateSubject.value,
      error: null,
    });
    return this.http.post<IAuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Login failed');
        }
        this.handleAuthSuccess(response);
        this.userDataSource.next({
          imageUrl: response.imageUrl,
          email: response.email,
          phoneNumber: response.phoneNumber,
          userName: response.userName,
        });
        this.signalRService.startConnection();

      }),
      catchError((error) => this.handleError(error))
    );
  }

  refreshToken(): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/refresh-token`, {})
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => this.handleError(error))
      );
  }

  verifyEmail(request: IVerifyEmailRequest): Observable<{ success: boolean }> {
    this.setLoading(true);
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/verify-email`, request)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  resetPassword(
    request: IResetPasswordRequest
  ): Observable<{ success: boolean }> {
    this.setLoading(true);
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/reset-password`, request)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  changePassword(
    request: IChangePasswordRequest
  ): Observable<{ success: boolean }> {
    this.setLoading(true);
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/change-password`, request)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  updateProfile(request: IUpdateProfileRequest): Observable<IAuthUser> {
    return this.http.put<IAuthUser>(`${this.apiUrl}/profile`, request).pipe(
      tap((user) => {
        this.stateSubject.next({
          ...this.stateSubject.value,
          user,
        });
      }),
      catchError((error) => this.handleError(error))
    );
  }

  logout() {
    this.http
      .post(this.apiUrl + '/logout', {})
      .pipe(
        tap(() => {
          this.signalRService.stopConnection();
          // Clear user data
          this.userDataSource.next(null);

          // Clear localStorage
          localStorage.clear();

          // Clear cookies more effectively
          this.clearAllCookies();

          // Update auth state
          this.stateSubject.next({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          this.router.navigateByUrl('/');
          this.notificationService.warning('تم تسجيل الخروج بنجاح!');
          this.signalRService.stopConnection();

        }),
        map(() => void 0),
        catchError((error) => {
          // Even if the logout request fails, clear local state
          this.userDataSource.next(null);
          localStorage.clear();
          this.clearAllCookies();
          this.stateSubject.next({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  private clearAllCookies(): void {
    // Clear specific auth cookies with proper options
    const cookieOptions = [
      { name: 'accessToken', path: '/', domain: window.location.hostname },
      { name: 'refreshToken', path: '/', domain: window.location.hostname },
      {
        name: 'accessToken',
        path: '/',
        domain: '.' + window.location.hostname,
      },
      {
        name: 'refreshToken',
        path: '/',
        domain: '.' + window.location.hostname,
      },
    ];

    cookieOptions.forEach((option) => {
      document.cookie = `${option.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${option.path}; domain=${option.domain}; secure; samesite=none`;
    });

    // Also clear all cookies as fallback
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
      }
    });
  }

  resendEmailConfirmation(
    request: IResendEmailConfirmationRequest
  ): Observable<{ message: string }> {
    this.setLoading(true);
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/resend-confirmation`, request)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError((error) => this.handleError(error))
      );
  }

  isAuthenticated(): boolean {
    return this.stateSubject.value.isAuthenticated;
  }

  getCurrentUser(): IAuthUser | null {
    return this.stateSubject.value.user;
  }

  private handleAuthSuccess(response: IAuthResponse): void {
    if (!response.isSuccess) {
      throw new Error(response.message || 'Authentication failed');
    }

    const user: IAuthUser = {
      userName: response.userName,
      email: response.email,
    };

    this.stateSubject.next({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  }

  private updateStoredUser(user: IAuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private clearAuthState(): void {
    localStorage.removeItem(this.userKey);
    this.stateSubject.next({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  private setLoading(isLoading: boolean): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      isLoading,
      error: null,
    });
  }

  private handleError(error: any): Observable<never> {
    this.setLoading(false);

    let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
    let errorCode: AuthErrorCode = AuthErrorCode.Unknown;
    let statusCode = error.status || 500;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'خطأ في الاتصال بالخادم';
      errorCode = AuthErrorCode.NetworkError;
      statusCode = 0;
    } else if (error.status === 0) {
      // Network error
      errorMessage = 'لا يمكن الاتصال بالخادم';
      errorCode = AuthErrorCode.NetworkError;
      statusCode = 0;
    } else if (error.error?.message) {
      // Backend error with message
      errorMessage = error.error.message;
      switch (error.error.message) {
        case 'Email not confirmed':
          errorCode = AuthErrorCode.EmailNotConfirmed;
          break;
        case 'Invalid username or password':
          errorCode = AuthErrorCode.InvalidCredentials;
          break;
        case 'User already exists':
          errorCode = AuthErrorCode.UserExists;
          break;
        default:
          // Use the message from the backend
          if (error.error.isSuccess === false) {
            errorMessage = error.error.message;
          }
      }
    }

    const authError: AuthError = {
      code: errorCode,
      message: errorMessage,
      statusCode,
      name: 'AuthError',
    };

    this.stateSubject.next({
      ...this.stateSubject.value,
      error: authError,
      isLoading: false,
    });
    this.notificationService.error(errorMessage);

    return throwError(() => authError);
  }

  requestToPasswordReset(email: string): Observable<{ message: string }> {
    this.setLoading(true);
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(
        tap(() => {
          this.setLoading(false);
        }),
        catchError((error) => {
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  getUserDetails(): Observable<UserDetailsDto> {
    return this.http.get<UserDetailsDto>(`${this.apiUrl}/user-details`).pipe(
      catchError((error) => {
        this.notificationService.error('فشل في جلب تفاصيل المستخدم');
        return throwError(() => error);
      })
    );
  }
}
