import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  IRegisterRequest,
  AuthValidators,
  CountryCode,
} from '../../models/auth.models';

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
  profileImage: File | null = null;
  imagePreview: string | null = null;
  isDragging = false;
  showCountryDropdown = false;
  selectedCountry: CountryCode;
  countries: CountryCode[] = this.getAllCountery();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    // Set default country to Syria
    this.selectedCountry = this.countries[0];
  }

  ngOnInit(): void {
    this.initForm();
    // Initialize with Syria as default country
    this.selectedCountry = this.countries[0];
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
      phoneNumber: [
        '',
        [
          Validators.pattern('^[0-9]{9,15}$'), // Accepts 9-15 digits without hyphens
          Validators.minLength(9),
          Validators.maxLength(15),
        ],
      ],
      countryCode: [this.selectedCountry.dialCode],
      acceptTerms: [false, [Validators.requiredTrue]],
      profileImage: [null,[Validators.required]],
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
    const hasSpecialChar =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])(?=.*\.)[A-Za-z\d@$!%*?&.]{8,}$/.test(
        password
      );
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.notificationService.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return;
    }

    this.profileImage = file;
    this.registerForm.patchValue({ profileImage: file });

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.profileImage = null;
    this.imagePreview = null;
    this.registerForm.patchValue({ profileImage: null });
  }

  toggleCountryDropdown(): void {
    this.showCountryDropdown = !this.showCountryDropdown;
  }

  selectCountry(country: CountryCode): void {
    this.selectedCountry = country;
    this.registerForm.patchValue({ countryCode: country.dialCode });
    this.showCountryDropdown = false;
    // Close the dropdown
    const dropdown = document.getElementById('dropdown-phone');
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
  }

  getFullPhoneNumber(): string {
    const phoneNumber = this.registerForm.get('phoneNumber')?.value || '';
    return phoneNumber ? `${this.selectedCountry.dialCode}${phoneNumber}` : '';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      const formErrors = this.getFormValidationErrors();
      if (formErrors.length > 0) {
        this.notificationService.warning(
          formErrors.join('<br>'),
          'يرجى تصحيح الأخطاء التالية'
        );
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('userName', this.registerForm.value.userName);
    formData.append('email', this.registerForm.value.email);
    formData.append('password', this.registerForm.value.password);

    // Append full phone number with country code
    const phoneNumber = this.registerForm.get('phoneNumber')?.value;
    if (phoneNumber) {
      formData.append('phoneNumber', this.getFullPhoneNumber());
    }

    formData.append('acceptTerms', this.registerForm.value.acceptTerms);
    if (this.profileImage) {
      formData.append('image', this.profileImage);
    }

    this.authService.register(formData).subscribe({
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

    Object.keys(controls).forEach((key) => {
      const control = controls[key];
      if (control.errors) {
        Object.keys(control.errors).forEach((errorKey) => {
          switch (errorKey) {
            case 'required':
              errors.push(`حقل ${this.getFieldName(key)} مطلوب`);
              break;
            case 'email':
              errors.push('البريد الإلكتروني غير صالح');
              break;
            case 'minlength':
              if (key === 'phoneNumber') {
                errors.push('رقم الهاتف يجب أن يحتوي على 9 أرقام على الأقل');
              } else {
                errors.push(
                  `يجب أن تكون ${this.getFieldName(key)} ${
                    control.errors?.[errorKey].requiredLength
                  } أحرف على الأقل`
                );
              }
              break;
            case 'maxlength':
              if (key === 'phoneNumber') {
                errors.push('رقم الهاتف يجب أن لا يتجاوز 15 رقم');
              }
              break;
            case 'pattern':
              if (key === 'phoneNumber') {
                errors.push('رقم الهاتف يجب أن يحتوي على 9-15 رقم فقط');
              }
              break;
            case 'invalidUserName':
              errors.push(
                'اسم المستخدم يجب أن يحتوي على 3-20 حرف (أحرف، أرقام، _، -)'
              );
              break;
            case 'invalidEmail':
              errors.push('البريد الإلكتروني غير صالح');
              break;
            case 'passwordStrength':
              errors.push(
                'كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص'
              );
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
      acceptTerms: 'الشروط والأحكام',
    };
    return fieldNames[key] || key;
  }

  private getAllCountery(): CountryCode[] {
    return [
      {
        name: 'Syria',
        arabicName: 'سوريا',
        code: 'SY',
        dialCode: '+963',
        flag: '🇸🇾',
      },
      {
        name: 'United States',
        arabicName: 'الولايات المتحدة',
        code: 'US',
        dialCode: '+1',
        flag: '🇺🇸',
      },
      {
        name: 'United Kingdom',
        arabicName: 'المملكة المتحدة',
        code: 'GB',
        dialCode: '+44',
        flag: '🇬🇧',
      },
      {
        name: 'Australia',
        arabicName: 'أستراليا',
        code: 'AU',
        dialCode: '+61',
        flag: '🇦🇺',
      },
      {
        name: 'Germany',
        arabicName: 'ألمانيا',
        code: 'DE',
        dialCode: '+49',
        flag: '🇩🇪',
      },
      {
        name: 'France',
        arabicName: 'فرنسا',
        code: 'FR',
        dialCode: '+33',
        flag: '🇫🇷',
      },
      {
        name: 'Saudi Arabia',
        arabicName: 'المملكة العربية السعودية',
        code: 'SA',
        dialCode: '+966',
        flag: '🇸🇦',
      },
      {
        name: 'UAE',
        arabicName: 'الإمارات العربية المتحدة',
        code: 'AE',
        dialCode: '+971',
        flag: '🇦🇪',
      },
      {
        name: 'Qatar',
        arabicName: 'قطر',
        code: 'QA',
        dialCode: '+974',
        flag: '🇶🇦',
      },
      {
        name: 'Kuwait',
        arabicName: 'الكويت',
        code: 'KW',
        dialCode: '+965',
        flag: '🇰🇼',
      },
      {
        name: 'Bahrain',
        arabicName: 'البحرين',
        code: 'BH',
        dialCode: '+973',
        flag: '🇧🇭',
      },
      {
        name: 'Oman',
        arabicName: 'عُمان',
        code: 'OM',
        dialCode: '+968',
        flag: '🇴🇲',
      },
      {
        name: 'Jordan',
        arabicName: 'الأردن',
        code: 'JO',
        dialCode: '+962',
        flag: '🇯🇴',
      },
      {
        name: 'Lebanon',
        arabicName: 'لبنان',
        code: 'LB',
        dialCode: '+961',
        flag: '🇱🇧',
      },
      {
        name: 'Egypt',
        arabicName: 'مصر',
        code: 'EG',
        dialCode: '+20',
        flag: '🇪🇬',
      },
      {
        name: 'Iraq',
        arabicName: 'العراق',
        code: 'IQ',
        dialCode: '+964',
        flag: '🇮🇶',
      },
      {
        name: 'Turkey',
        arabicName: 'تركيا',
        code: 'TR',
        dialCode: '+90',
        flag: '🇹🇷',
      },
      {
        name: 'Iran',
        arabicName: 'إيران',
        code: 'IR',
        dialCode: '+98',
        flag: '🇮🇷',
      },
      {
        name: 'Yemen',
        arabicName: 'اليمن',
        code: 'YE',
        dialCode: '+967',
        flag: '🇾🇪',
      },
      {
        name: 'Libya',
        arabicName: 'ليبيا',
        code: 'LY',
        dialCode: '+218',
        flag: '🇱🇾',
      },
      {
        name: 'Algeria',
        arabicName: 'الجزائر',
        code: 'DZ',
        dialCode: '+213',
        flag: '🇩🇿',
      },
      {
        name: 'Morocco',
        arabicName: 'المغرب',
        code: 'MA',
        dialCode: '+212',
        flag: '🇲🇦',
      },
      {
        name: 'Tunisia',
        arabicName: 'تونس',
        code: 'TN',
        dialCode: '+216',
        flag: '🇹🇳',
      },
      {
        name: 'Sudan',
        arabicName: 'السودان',
        code: 'SD',
        dialCode: '+249',
        flag: '🇸🇩',
      },
      {
        name: 'Palestine',
        arabicName: 'فلسطين',
        code: 'PS',
        dialCode: '+970',
        flag: '🇵🇸',
      },
      {
        name: 'Austria',
        arabicName: 'النمسا',
        code: 'AT',
        dialCode: '+43',
        flag: '🇦🇹',
      },
      {
        name: 'Belgium',
        arabicName: 'بلجيكا',
        code: 'BE',
        dialCode: '+32',
        flag: '🇧🇪',
      },
      {
        name: 'Bulgaria',
        arabicName: 'بلغاريا',
        code: 'BG',
        dialCode: '+359',
        flag: '🇧🇬',
      },
      {
        name: 'Croatia',
        arabicName: 'كرواتيا',
        code: 'HR',
        dialCode: '+385',
        flag: '🇭🇷',
      },
      {
        name: 'Cyprus',
        arabicName: 'قبرص',
        code: 'CY',
        dialCode: '+357',
        flag: '🇨🇾',
      },
      {
        name: 'Czech Republic',
        arabicName: 'جمهورية التشيك',
        code: 'CZ',
        dialCode: '+420',
        flag: '🇨🇿',
      },
      {
        name: 'Denmark',
        arabicName: 'الدنمارك',
        code: 'DK',
        dialCode: '+45',
        flag: '🇩🇰',
      },
      {
        name: 'Estonia',
        arabicName: 'إستونيا',
        code: 'EE',
        dialCode: '+372',
        flag: '🇪🇪',
      },
      {
        name: 'Finland',
        arabicName: 'فنلندا',
        code: 'FI',
        dialCode: '+358',
        flag: '🇫🇮',
      },
      {
        name: 'Greece',
        arabicName: 'اليونان',
        code: 'GR',
        dialCode: '+30',
        flag: '🇬🇷',
      },
      {
        name: 'Hungary',
        arabicName: 'المجر',
        code: 'HU',
        dialCode: '+36',
        flag: '🇭🇺',
      },
      {
        name: 'Iceland',
        arabicName: 'آيسلندا',
        code: 'IS',
        dialCode: '+354',
        flag: '🇮🇸',
      },
      {
        name: 'Ireland',
        arabicName: 'أيرلندا',
        code: 'IE',
        dialCode: '+353',
        flag: '🇮🇪',
      },
      {
        name: 'Italy',
        arabicName: 'إيطاليا',
        code: 'IT',
        dialCode: '+39',
        flag: '🇮🇹',
      },
      {
        name: 'Kosovo',
        arabicName: 'كوسوفو',
        code: 'XK',
        dialCode: '+383',
        flag: '🇽🇰',
      },
      {
        name: 'Latvia',
        arabicName: 'لاتفيا',
        code: 'LV',
        dialCode: '+371',
        flag: '🇱🇻',
      },
      {
        name: 'Liechtenstein',
        arabicName: 'ليختنشتاين',
        code: 'LI',
        dialCode: '+423',
        flag: '🇱🇮',
      },
      {
        name: 'Lithuania',
        arabicName: 'ليتوانيا',
        code: 'LT',
        dialCode: '+370',
        flag: '🇱🇹',
      },
      {
        name: 'Luxembourg',
        arabicName: 'لوكسمبورغ',
        code: 'LU',
        dialCode: '+352',
        flag: '🇱🇺',
      },
      {
        name: 'Malta',
        arabicName: 'مالطا',
        code: 'MT',
        dialCode: '+356',
        flag: '🇲🇹',
      },
      {
        name: 'Moldova',
        arabicName: 'مولدوفا',
        code: 'MD',
        dialCode: '+373',
        flag: '🇲🇩',
      },
      {
        name: 'Monaco',
        arabicName: 'موناكو',
        code: 'MC',
        dialCode: '+377',
        flag: '🇲🇨',
      },
      {
        name: 'Montenegro',
        arabicName: 'الجبل الأسود',
        code: 'ME',
        dialCode: '+382',
        flag: '🇲🇪',
      },
      {
        name: 'Netherlands',
        arabicName: 'هولندا',
        code: 'NL',
        dialCode: '+31',
        flag: '🇳🇱',
      },
      {
        name: 'North Macedonia',
        arabicName: 'مقدونيا الشمالية',
        code: 'MK',
        dialCode: '+389',
        flag: '🇲🇰',
      },
      {
        name: 'Norway',
        arabicName: 'النرويج',
        code: 'NO',
        dialCode: '+47',
        flag: '🇳🇴',
      },
      {
        name: 'Poland',
        arabicName: 'بولندا',
        code: 'PL',
        dialCode: '+48',
        flag: '🇵🇱',
      },
      {
        name: 'Portugal',
        arabicName: 'البرتغال',
        code: 'PT',
        dialCode: '+351',
        flag: '🇵🇹',
      },
      {
        name: 'Romania',
        arabicName: 'رومانيا',
        code: 'RO',
        dialCode: '+40',
        flag: '🇷🇴',
      },
      {
        name: 'Russia',
        arabicName: 'روسيا',
        code: 'RU',
        dialCode: '+7',
        flag: '🇷🇺',
      },
      {
        name: 'San Marino',
        arabicName: 'سان مارينو',
        code: 'SM',
        dialCode: '+378',
        flag: '🇸🇲',
      },
      {
        name: 'Serbia',
        arabicName: 'صربيا',
        code: 'RS',
        dialCode: '+381',
        flag: '🇷🇸',
      },
      {
        name: 'Slovakia',
        arabicName: 'سلوفاكيا',
        code: 'SK',
        dialCode: '+421',
        flag: '🇸🇰',
      },
      {
        name: 'Slovenia',
        arabicName: 'سلوفينيا',
        code: 'SI',
        dialCode: '+386',
        flag: '🇸🇮',
      },
      {
        name: 'Spain',
        arabicName: 'إسبانيا',
        code: 'ES',
        dialCode: '+34',
        flag: '🇪🇸',
      },
      {
        name: 'Sweden',
        arabicName: 'السويد',
        code: 'SE',
        dialCode: '+46',
        flag: '🇸🇪',
      },
      {
        name: 'Switzerland',
        arabicName: 'سويسرا',
        code: 'CH',
        dialCode: '+41',
        flag: '🇨🇭',
      },
      {
        name: 'Ukraine',
        arabicName: 'أوكرانيا',
        code: 'UA',
        dialCode: '+380',
        flag: '🇺🇦',
      },
      {
        name: 'United Kingdom',
        arabicName: 'المملكة المتحدة',
        code: 'GB',
        dialCode: '+44',
        flag: '🇬🇧',
      },
      {
        name: 'Vatican City',
        arabicName: 'دولة الفاتيكان',
        code: 'VA',
        dialCode: '+379',
        flag: '🇻🇦',
      },
    ];
  }
}
