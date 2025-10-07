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
  UpdateUsernameRequest,
  UpdatePhoneNumberRequest,
  UpdateUserResponse,
  IGoogleLoginRequest,
  IGoogleAuthResponse,
  IDeleteAccountRequest,
  IConfirmAccountDeletionRequest,
  IDeleteAccountResponse,
  IRequestAccountDeletionResponse,
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
  handleGoogleResponse: any;

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
          if (!value.phoneNumber) {
            this.notificationService.info('يرجى إضافة رقم الهاتف للمتابعة');
            this.userDataSource.next(value);

            this.router.navigateByUrl('/dashboard/settings');
            return;
          }
          
          this.userDataSource.next(value);
          

          this.notificationService.success('مرحبا بك مجدداً');
          this.signalRService.getNotifications();
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
          debugger;
          if (!response.isSuccess) {
            this.notificationService.error(response.message);
          }
          this.setLoading(false);

          // Log successful registration (without sensitive data)
          console.log('Registration successful:', {
            userName: response.userName,
            email: response.email,
            message: response.message,
          });
          this.notificationService.success(
            'تم التسجيل بنجاح! يرجى تأكيد البريد الإلكتروني تحقق منه '
          );
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
        this.handleAuthSuccess(response);
        this.userDataSource.next({
          imageUrl: response.imageUrl,
          email: response.email,
          phoneNumber: response.phoneNumber,
          userName: response.userName,
        });
        this.signalRService.stopConnection();
        this.signalRService.startConnection();
        this.signalRService.getNotifications();
        this.notificationService.success('تم تسجيل الدخول بنجاح!');
      }),
      catchError((error) => this.handleError(error))
    );
  }

  refreshToken(): Observable<IAuthResponse> {
    return this.http
      .post<IAuthResponse>(`${this.apiUrl}/refresh-token`, {})
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  verifyEmail(request: IVerifyEmailRequest): Observable<{ success: boolean }> {
    this.setLoading(true);
    return this.http
      .post<{ success: boolean }>(`${this.apiUrl}/verify-email`, request)
      .pipe(
        tap((res) => {
          this.setLoading(false);
          if (res.success) {
            this.notificationService.success(
              'تم تفعيل البريد الإلكتروني بنجاح!'
            );
          }
        }),
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
        tap((res) => {
          this.setLoading(false);
          if (res.success) {
            this.notificationService.success(
              'تم إعادة تعيين كلمة المرور بنجاح!'
            );
          }
        }),
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
        tap((res) => {
          this.setLoading(false);
          if (res.success) {
            this.notificationService.success('تم تغيير كلمة المرور بنجاح!');
          }
        }),
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
        this.notificationService.success('تم تحديث الملف الشخصي بنجاح!');
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
        tap(() => {
          this.setLoading(false);
          this.notificationService.success(
            'تم إرسال رسالة تأكيد البريد الإلكتروني بنجاح!'
          );
        }),
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
    debugger;
    let errorMessage = error.error.message;
    let errorCode: AuthErrorCode = AuthErrorCode.Unknown;
    let statusCode = error.status || 500;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
      errorCode = AuthErrorCode.NetworkError;
      statusCode = 0;
    } else if (error.status === 0) {
      // Network error
      errorMessage = error.error.message;
      errorCode = AuthErrorCode.NetworkError;
      statusCode = 0;
    } else if (error.error?.message) {
      // Backend error with message
      if (error.error.message) {
        errorMessage = error.error.message;
        this.notificationService.error(errorMessage);
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
          this.notificationService.success(
            'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني!'
          );
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

  updateUsername(
    request: UpdateUsernameRequest
  ): Observable<UpdateUserResponse> {
    this.setLoading(true);
    return this.http
      .put<UpdateUserResponse>(`${this.apiUrl}/update-username`, request)
      .pipe(
        tap((response) => {
          this.setLoading(false);
          if (response.isSuccess) {
            this.notificationService.success('تم تحديث اسم المستخدم بنجاح!');
            // Refresh user details
            this.getUserDetails().subscribe();
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  updatePhoneNumber(
    request: UpdatePhoneNumberRequest
  ): Observable<UpdateUserResponse> {
    this.setLoading(true);
    return this.http
      .put<UpdateUserResponse>(`${this.apiUrl}/update-phone`, request)
      .pipe(
        tap((response) => {
          this.setLoading(false);
          if (response.isSuccess) {
            this.notificationService.success('تم تحديث رقم الهاتف بنجاح!');
            // Refresh user details
            this.getUserDetails().subscribe();
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Request account deletion (sends confirmation email)
   */
  requestAccountDeletion(): Observable<IRequestAccountDeletionResponse> {
    this.setLoading(true);
    return this.http.post<IRequestAccountDeletionResponse>(`${this.apiUrl}/request-account-deletion`, {}).pipe(
      tap((response) => {
        this.setLoading(false);
        if (response.isSuccess) {
          this.notificationService.success('تم إرسال رابط تأكيد حذف الحساب إلى بريدك الإلكتروني');
        }
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Delete account permanently with confirmation
   */
  deleteAccount(request: IDeleteAccountRequest): Observable<IDeleteAccountResponse> {
    this.setLoading(true);
    return this.http.delete<IDeleteAccountResponse>(`${this.apiUrl}/delete-account`, { body: request }).pipe(
      tap((response) => {
        this.setLoading(false);
        if (response.isSuccess) {
          this.notificationService.success('تم حذف حسابك بنجاح');
          this.logout();
          this.router.navigate(['/']);
        }
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Confirm account deletion using token from email
   */
  confirmAccountDeletion(request: IConfirmAccountDeletionRequest): Observable<IDeleteAccountResponse> {
    this.setLoading(true);
    return this.http.post<IDeleteAccountResponse>(`${this.apiUrl}/confirm-account-deletion`, request).pipe(
      tap((response) => {
        this.setLoading(false);
        if (response.isSuccess) {
          this.notificationService.success('تم حذف حسابك بنجاح');
          this.logout();
          this.router.navigate(['/']);
        }
      }),
      catchError((error) => this.handleError(error))
    );
  }
}
