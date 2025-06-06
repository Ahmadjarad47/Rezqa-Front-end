import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../core/services/notification.service';
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
  AuthStatus,
  UserRole,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}Auth`;
  private readonly userKey = 'currentUser';
  private readonly stateSubject = new BehaviorSubject<IAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  public readonly state$ = this.stateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    if (typeof localStorage !== 'undefined') {
      this.loadStoredUser();
    }
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // You might want to validate the token here
      this.stateSubject.next({
        ...this.stateSubject.value,
        isAuthenticated: true
      });
    }
  }

  register(request: IRegisterRequest): Observable<IAuthResponse> {
    this.setLoading(true);
    
    // Clear any previous errors
    this.stateSubject.next({
      ...this.stateSubject.value,
      error: null
    });

    return this.http.post<IAuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap((response) => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Registration failed');
        }

        // For registration, we don't set the auth state since user needs to verify email
        this.setLoading(false);
        
        // Log successful registration (without sensitive data)
        console.log('Registration successful:', {
          userName: response.userName,
          email: response.email,
          message: response.message
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
      error: null
    });

    return this.http.post<IAuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        if (!response.isSuccess) {
          throw new Error(response.message || 'Login failed');
        }

        this.handleAuthSuccess(response);
        
        // Log successful login (without sensitive data)
        console.log('Login successful:', {
          userName: response.userName,
          email: response.email,
          roles: response.roles,
          hasToken: !!response.accessToken
        });
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
          user
        });
      }),
      catchError((error) => this.handleError(error))
    );
  }

  logout(): Observable<void> {
    return new Observable<void>(observer => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('accessToken');
      }
      
      this.stateSubject.next({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      observer.next();
      observer.complete();
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
      roles: response.roles ?? []
    };

    // Store token if available
    if (response.accessToken && typeof localStorage !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
    }

    this.stateSubject.next({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
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
      name: 'AuthError'
    };

    this.stateSubject.next({
      ...this.stateSubject.value,
      error: authError,
      isLoading: false
    });

    return throwError(() => authError);
  }

  requestToPasswordReset(email: string): Observable<{ message: string }> {
    this.setLoading(true);
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      tap(() => {
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }
}
