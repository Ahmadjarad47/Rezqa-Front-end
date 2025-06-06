import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IRegisterRequest, AuthValidators } from '../../models/auth.models';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
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
    this.registerForm = this.formBuilder.group({
      userName: ['', [Validators.required, AuthValidators.userNameFormat()]],
      email: [
        '',
        [Validators.required, Validators.email, AuthValidators.emailFormat()],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          AuthValidators.passwordStrength(),
        ],
      ],
      phoneNumber: ['', [AuthValidators.phoneNumberFormat()]],
      acceptTerms: [false, [Validators.requiredTrue]],
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getPasswordStrengthClass(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password) return 'bg-gray-200';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [
      hasUpperCase,
      hasLowerCase,
      hasNumeric,
      hasSpecialChar,
      isLongEnough,
    ].filter(Boolean).length;

    switch (strength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Show validation errors in toast
      const formErrors = this.getFormValidationErrors();
      if (formErrors.length > 0) {
        this.notificationService.warning(formErrors.join('<br>'), 'يرجى تصحيح الأخطاء التالية');
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const registerRequest: IRegisterRequest = {
      userName: this.registerForm.value.userName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      phoneNumber: this.registerForm.value.phoneNumber,
      acceptTerms: this.registerForm.value.acceptTerms,
    };

    this.authService.register(registerRequest).subscribe({
      next: () => {
        this.notificationService.success(
          'تم إنشاء حسابك بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.',
          'تم التسجيل'
        );
        this.router.navigate(['/identity/login'], {
          queryParams: { registered: true },
        });
      },
      error: (error) => {
        this.errorMessage = error.message || 'حدث خطأ أثناء إنشاء الحساب';
        this.notificationService.error(this.errorMessage);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private getFormValidationErrors(): string[] {
    const errors: string[] = [];
    const controls = this.registerForm.controls;

    Object.keys(controls).forEach(key => {
      const control = controls[key];
      if (control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          switch (errorKey) {
            case 'required':
              errors.push(`حقل ${this.getFieldName(key)} مطلوب`);
              break;
            case 'email':
              errors.push('البريد الإلكتروني غير صالح');
              break;
            case 'minlength':
              errors.push(`يجب أن تكون ${this.getFieldName(key)} ${control.errors?.[errorKey].requiredLength} أحرف على الأقل`);
              break;
            case 'invalidUserName':
              errors.push('اسم المستخدم يجب أن يحتوي على 3-20 حرف (أحرف، أرقام، _، -)');
              break;
            case 'invalidEmail':
              errors.push('البريد الإلكتروني غير صالح');
              break;
            case 'invalidPhoneNumber':
              errors.push('رقم الهاتف غير صالح');
              break;
            case 'passwordStrength':
              errors.push('كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص');
              break;
            case 'requiredTrue':
              errors.push('يجب الموافقة على الشروط والأحكام');
              break;
          }
        });
      }
    });

    return errors;
  }

  private getFieldName(key: string): string {
    const fieldNames: { [key: string]: string } = {
      userName: 'اسم المستخدم',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      phoneNumber: 'رقم الهاتف',
      acceptTerms: 'الشروط والأحكام'
    };
    return fieldNames[key] || key;
  }
}
