import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { GoogleOAuthService, GoogleUser } from '../../services/google-oauth.service';
import { IGoogleLoginRequest, ILoginRequest } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('googleSignInButton', { static: false }) googleSignInButton!: ElementRef;
  
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private googleOAuthService: GoogleOAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.subscribeToAuthState();
 
  }

  ngAfterViewInit(): void {
 
    // Wait for Google OAuth to be initialized
    this.googleOAuthService.googleInitialized$
      .pipe(takeUntil(this.destroy$))
      .subscribe(initialized => {
        console.log('Google OAuth initialized:', initialized);
        if (initialized) {
          // Add a small delay to ensure the DOM element is ready
          setTimeout(() => {
            this.renderGoogleButton();
          }, 100);
        } else {
          // Run diagnosis if initialization fails
          setTimeout(() => {
            this.googleOAuthService.diagnoseGoogleOAuth();
          }, 2000);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private subscribeToAuthState(): void {
    this.authService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.isLoading = state.isLoading;
        if (state.error) {
          this.errorMessage = state.error.message;
        }
      });
  }



  private renderGoogleButton(): void {
    console.log('Attempting to render Google button...');
    console.log('Target element ID: google-signin-button');
    console.log('Element exists:', !!document.getElementById('google-signin-button'));
    
    this.googleOAuthService.renderButton('google-signin-button', {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 300,
      locale: 'ar'
    });
    
    // Fallback: if button still doesn't render after 1 second, try again
    setTimeout(() => {
      const buttonElement = document.getElementById('google-signin-button');
      if (buttonElement && buttonElement.children.length === 0) {
        console.log('Button not rendered, trying again...');
        this.googleOAuthService.renderButton('google-signin-button', {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 300,
          locale: 'ar'
        });
      }
    }, 1000);
  }

  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginRequest: ILoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService.login(loginRequest).subscribe({
      next: () => {
        // Remove notificationService.success here, as success is shown in the template
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isLoading = false;
        console.log(error);

        // Handle specific backend error cases
        if (error.message) {
          switch (error.message) {
            case 'Email not confirmed. Verification email has been sent.':
              this.errorMessage =
                'يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول';
              // Remove notificationService.warning
              break;
            case 'Invalid username or password.':
              this.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
              // Remove notificationService.error
              break;
            default:
              this.errorMessage =
                error.error.message || 'حدث خطأ أثناء تسجيل الدخول';
            // Remove notificationService.error
          }
        } else {
          this.errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
          // Remove notificationService.error
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
