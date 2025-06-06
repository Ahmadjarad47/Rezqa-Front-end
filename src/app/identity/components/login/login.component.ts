import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ILoginRequest } from '../../models/auth.models';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
     
    });
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
        this.notificationService.success('تم تسجيل الدخول بنجاح');
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
              this.notificationService.warning(' يرجى تأكيد البريد الإلكتروني\n تم ارسال رابط تاكيد جديد لبريدك الاكتروني');
              break;
            case 'Invalid username or password.':
              this.errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
              this.notificationService.error('فشل تسجيل الدخول');
              break;
            default:
              this.errorMessage =
                error.error.message || 'حدث خطأ أثناء تسجيل الدخول';
              this.notificationService.error('حدث خطأ');
          }
        } else {
          this.errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
          this.notificationService.error('حدث خطأ');
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
