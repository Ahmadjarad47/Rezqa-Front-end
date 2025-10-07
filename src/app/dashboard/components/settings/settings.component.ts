import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../identity/services/auth.service';
import { UserDetailsDto, UpdateUsernameRequest, UpdatePhoneNumberRequest } from '../../../identity/models/auth.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  userDetails$: Observable<UserDetailsDto>;
  userDetails: UserDetailsDto | null = null;
  isLoading = false;
  
  // Form properties
  usernameForm: FormGroup;
  phoneForm: FormGroup;
  isEditingUsername = false;
  isEditingPhone = false;
  isUpdatingUsername = false;
  isUpdatingPhone = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userDetails$ = this.authService.getUserDetails();
    
    // Initialize forms
    this.usernameForm = this.fb.group({
      newUsername: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]]
    });
    
    this.phoneForm = this.fb.group({
      newPhoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s\-\(\)]+$/)]]
    });
  }

  ngOnInit(): void {
    this.loadUserDetails();
  }

  loadUserDetails(): void {
    this.isLoading = true;
    this.userDetails$.subscribe({
      next: (details) => {
        this.userDetails = details;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.isLoading = false;
      }
    });
  }

  getStatusText(status: boolean): string {
    return status ? 'مفعل' : 'غير مفعل';
  }

  getStatusClass(status: boolean): string {
    return status ? 'text-[#0061fe]' : 'text-red-600';
  }

  getBlockedStatusText(isBlocked: boolean): string {
    return isBlocked ? 'محظور' : 'نشط';
  }

  getBlockedStatusClass(isBlocked: boolean): string {
    return isBlocked ? 'text-red-600' : 'text-[#0061fe]';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
  }

  // Username editing methods
  startEditUsername(): void {
    this.isEditingUsername = true;
    this.usernameForm.patchValue({
      newUsername: this.userDetails?.userName || ''
    });
  }

  cancelEditUsername(): void {
    this.isEditingUsername = false;
    this.usernameForm.reset();
  }

  updateUsername(): void {
    if (this.usernameForm.valid && this.userDetails) {
      this.isUpdatingUsername = true;
      const request: UpdateUsernameRequest = {
        newUsername: this.usernameForm.get('newUsername')?.value
      };

      this.authService.updateUsername(request).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.isEditingUsername = false;
            this.usernameForm.reset();
            this.loadUserDetails(); // Refresh user details
          }
          this.isUpdatingUsername = false;
        },
        error: (error) => {
          console.error('Error updating username:', error);
          this.isUpdatingUsername = false;
        }
      });
    }
  }

  // Phone number editing methods
  startEditPhone(): void {
    this.isEditingPhone = true;
    this.phoneForm.patchValue({
      newPhoneNumber: this.userDetails?.phoneNumber || ''
    });
  }

  cancelEditPhone(): void {
    this.isEditingPhone = false;
    this.phoneForm.reset();
  }

  updatePhoneNumber(): void {
    if (this.phoneForm.valid && this.userDetails) {
      this.isUpdatingPhone = true;
      const request: UpdatePhoneNumberRequest = {
        newPhoneNumber: this.phoneForm.get('newPhoneNumber')?.value
      };

      this.authService.updatePhoneNumber(request).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.isEditingPhone = false;
            this.phoneForm.reset();
            this.loadUserDetails(); // Refresh user details
          }
          this.isUpdatingPhone = false;
        },
        error: (error) => {
          console.error('Error updating phone number:', error);
          this.isUpdatingPhone = false;
        }
      });
    }
  }

  // Form validation helpers
  getUsernameError(): string {
    const control = this.usernameForm.get('newUsername');
    if (control?.errors) {
      if (control.errors['required']) return 'اسم المستخدم مطلوب';
      if (control.errors['minlength']) return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
      if (control.errors['maxlength']) return 'اسم المستخدم يجب أن يكون 50 حرف أو أقل';
    }
    return '';
  }

  getPhoneError(): string {
    const control = this.phoneForm.get('newPhoneNumber');
    if (control?.errors) {
      if (control.errors['required']) return 'رقم الهاتف مطلوب';
      if (control.errors['pattern']) return 'صيغة رقم الهاتف غير صحيحة';
    }
    return '';
  }
}
