import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  AuthValidators,
  IResetPasswordRequest,
} from '../../models/auth.models';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token: string | null = null;
  email: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get token and email from query parameters
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'] || null;
      this.email = params['email'] || null;

      // Redirect to login if no token or email is present
      if (!this.token || !this.email) {
        this.router.navigate(['/identity/login']);
        return;
      }
    });

    this.initForm();
  }

  private initForm(): void {
    this.resetForm = this.formBuilder.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            AuthValidators.passwordStrength(),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: AuthValidators.passwordMatch('password', 'confirmPassword'),
      }
    );
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field ? field.valid && (field.dirty || field.touched) : false;
  }

  getFieldClass(fieldName: string): string {
    if (this.isFieldInvalid(fieldName)) {
      return 'border-red-500 focus:ring-red-500';
    }
    if (this.isFieldValid(fieldName)) {
      return 'border-green-500 focus:ring-green-500';
    }
    return 'border-gray-300 focus:ring-blue-500';
  }

  getPasswordStrengthClass(): string {
    const password = this.resetForm.get('password')?.value;
    if (!password) return 'bg-gray-200';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    switch (strength) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token || !this.email) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const resetRequest: IResetPasswordRequest = {
      email: this.email,
      token: this.token,
      newPassword: this.resetForm.value.password,
      confirmPassword: this.resetForm.value.confirmPassword,
    };

    this.authService.resetPassword(resetRequest).subscribe({
      next: (response) => {
        this.successMessage = 'تم تغيير كلمة المرور بنجاح';
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/identity/login'], {
            queryParams: { passwordReset: true },
          });
        }, 3000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'حدث خطأ أثناء تغيير كلمة المرور';
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
