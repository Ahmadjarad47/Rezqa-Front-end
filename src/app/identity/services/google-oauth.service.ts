import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IGoogleAuthResponse } from '../models/auth.models';
import { AuthService } from './auth.service';
import { NotificationService } from '@app/core/services/notification.service';
import { Router } from '@angular/router';

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleUser {
  sub: string; // Google ID
  email: string; // User's email
  email_verified: boolean;
  name: string; // Full name
  given_name: string; // First name
  family_name: string; // Last name
  picture: string; // Profile picture URL
  phoneNumber?: string; // Phone number (if available)
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  nbf: number;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleOAuthService {
  private googleInitialized = false;
  private googleInitializationSubject = new BehaviorSubject<boolean>(false);
  public googleInitialized$ = this.googleInitializationSubject.asObservable();

  private googleUserSubject = new BehaviorSubject<GoogleUser | null>(null);
  public googleUser$ = this.googleUserSubject.asObservable();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeGoogle();
    }
  }

  private initializeGoogle(): void {
    if (this.googleInitialized) return;

    const checkGoogle = () => {
      if (window.google?.accounts) {
        this.setupGoogleOAuth();
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    checkGoogle();
  }

  private setupGoogleOAuth(): void {
    try {
      const currentDomain = window.location.origin;
      const isLocalhost =
        currentDomain.includes('localhost') ||
        currentDomain.includes('127.0.0.1');

      window.google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        prompt_parent_id: 'google-signin-button',
        state: currentDomain,
        redirect_uri: isLocalhost
          ? 'https://localhost:4200/identity/login'
          : 'https://syriaopenstore.com/identity/login',
      });

      this.googleInitialized = true;
      this.googleInitializationSubject.next(true);
    } catch (error) {
      console.error('Failed to initialize Google OAuth:', error);
      this.googleInitializationSubject.next(false);
    }
  }

  private handleCredentialResponse(response: any): void {
    try {
      console.log(response.credential);

      // ✅ أرسل الـ credential نفسه (مش payload) للباك إند
      this.http
        .post<IGoogleAuthResponse>(`${environment.apiUrl}Auth/google-login`, {
          token: response.credential,
        })
        .subscribe({
          next: (res) => {
            debugger;
            if (res.isSuccess) {
              this.authService.getData();
              window.location.reload();
            } else {
              this.notificationService.error(res.message || 'فشل تسجيل الدخول');
            }
          },
          error: (err) => {
            this.notificationService.error('حدث خطأ أثناء تسجيل الدخول');
            console.error(err);
          },
        });

      } catch (error) {
      console.error('Error handling Google response:', error);
      this.googleUserSubject.next(null);
    }
  }

  private decodeJwtResponse(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  public renderButton(elementId: string, options: any = {}): void {
    if (!this.googleInitialized || !window.google) {
      console.error('Google OAuth not initialized');
      return;
    }

    try {
      const defaultOptions = {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 300,
        state: window.location.origin,
        ...options,
      };

      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = '';
        window.google.accounts.id.renderButton(element, defaultOptions);
      }
    } catch (error) {
      console.error('Failed to render Google button:', error);
    }
  }

  public signIn(): Observable<GoogleUser> {
    return new Observable((observer) => {
      if (!this.googleInitialized || !window.google) {
        observer.error('Google OAuth not initialized');
        return;
      }

      try {
        const tempCallback = (response: any) => {
          try {
            const payload = this.decodeJwtResponse(response.credential);
            observer.next(payload);
            observer.complete();
          } catch (error) {
            observer.error(error);
          }
        };

        // Override callback temporarily
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: tempCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          ux_mode: 'popup',
          prompt_parent_id: 'google-signin-button',
        });

        // Prompt user
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.tryAlternativeSignIn(observer);
          } else if (notification.isDismissedMoment()) {
            observer.error('Google OAuth prompt dismissed');
          }
        });

        // Restore original callback
        setTimeout(() => {
          this.setupGoogleOAuth();
        }, 5000);
      } catch (error) {
        observer.error(error);
      }
    });
  }

  private tryAlternativeSignIn(observer: any): void {
    try {
      if (window.google.accounts.id.initialize) {
        window.google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => {
            try {
              const payload = this.decodeJwtResponse(response.credential);
              observer.next(payload);
              observer.complete();
            } catch (error) {
              observer.error(error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          ux_mode: 'popup',
        });

        window.google.accounts.id.display();
      } else {
        observer.error('Alternative sign-in methods not available');
      }
    } catch (error) {
      observer.error('All Google sign-in methods failed');
    }
  }

  public checkForGoogleResponse(): GoogleUser | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const credential = urlParams.get('credential');

      if (credential) {
        const payload = this.decodeJwtResponse(credential);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return payload;
      }

      return null;
    } catch (error) {
      console.error('Error checking for Google response:', error);
      return null;
    }
  }

  public signOut(): void {
    if (this.googleInitialized && window.google) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error('Failed to sign out from Google:', error);
      }
    }
  }

  public isInitialized(): boolean {
    return this.googleInitialized;
  }

  public diagnoseGoogleOAuth(): void {
    if (window.google?.accounts) {
      // Google Accounts API Available
    } else {
      console.error('Google Accounts API Not Available');
    }
  }
}
