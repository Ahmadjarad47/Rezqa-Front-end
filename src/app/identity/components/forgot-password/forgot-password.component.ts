import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  isEmailSent = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        const control = this.forgotPasswordForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.isEmailSent = false; // Reset the email sent state
    const email = this.forgotPasswordForm.value.email;

    this.authService.requestToPasswordReset(email).subscribe({
      next: (response) => {
        this.isEmailSent = true;
        // Remove notificationService.success
        // Reset the form after successful submission
        this.forgotPasswordForm.reset();
        Object.keys(this.forgotPasswordForm.controls).forEach(key => {
          const control = this.forgotPasswordForm.get(key);
          control?.setErrors(null);
        });
      },
      error: (error) => {
        this.isEmailSent = false; // Ensure email sent state is false on error
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء إرسال طلب إعادة تعيين كلمة المرور';
        // Remove notificationService.error
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Helper getters for form validation
  get email() {
    return this.forgotPasswordForm.get('email');
  }
}
