import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '@app/identity/services/auth.service';
import { IDeleteAccountRequest } from '@app/identity/models/auth.models';
import { Router } from '@angular/router';
import { NotificationService } from '@app/core/services/notification.service';

@Component({
  selector: 'app-delete-account',
  standalone: false,
  templateUrl: './delete-account.component.html',
  styleUrl: './delete-account.component.css'
})
export class DeleteAccountComponent implements OnInit {
  deleteAccountForm: FormGroup;
  isLoading = false;
  showConfirmation = false;
  confirmationText = 'DELETE MY ACCOUNT';
  userEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.deleteAccountForm = this.fb.group({
      password: ['', [Validators.required]],
      confirmationText: ['', [Validators.required, this.confirmationTextValidator.bind(this)]],
      reason: ['', [Validators.maxLength(500)]],
      agreeToDataDeletion: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit(): void {
    // Get user email for display
    this.authService.userData$.subscribe(userData => {
      if (userData?.email) {
        this.userEmail = userData.email;
      }
    });
  }

  /**
   * Custom validator for confirmation text
   */
  confirmationTextValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    if (value !== this.confirmationText) {
      return { confirmationMismatch: true };
    }
    return null;
  }

  /**
   * Show confirmation dialog
   */
  showDeleteConfirmation(): void {
    if (this.deleteAccountForm.valid) {
      this.showConfirmation = true;
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Cancel deletion
   */
  cancelDeletion(): void {
    this.showConfirmation = false;
    this.deleteAccountForm.reset();
  }

  /**
   * Proceed with account deletion
   */
  confirmDeletion(): void {
    if (!this.deleteAccountForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const request: IDeleteAccountRequest = {
      password: this.deleteAccountForm.value.password,
      confirmationText: this.deleteAccountForm.value.confirmationText,
      reason: this.deleteAccountForm.value.reason || undefined,
      agreeToDataDeletion: this.deleteAccountForm.value.agreeToDataDeletion
    };

    this.authService.deleteAccount(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.isSuccess) {
          this.notificationService.success('تم حذف حسابك بنجاح');
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deleting account:', error);
        this.notificationService.error('فشل في حذف الحساب. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  /**
   * Request account deletion via email
   */
  requestEmailDeletion(): void {
    this.isLoading = true;
    this.authService.requestAccountDeletion().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.isSuccess) {
          this.notificationService.success('تم إرسال طلب حذف الحساب بنجاح');
          this.showConfirmation = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error requesting account deletion:', error);
        this.notificationService.error('فشل في إرسال طلب حذف الحساب. يرجى المحاولة مرة أخرى.');
      }
    });
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.deleteAccountForm.controls).forEach(key => {
      const control = this.deleteAccountForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get form control for template access
   */
  getFormControl(controlName: string) {
    return this.deleteAccountForm.get(controlName);
  }

  /**
   * Check if form control has error
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.getFormControl(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }
}
