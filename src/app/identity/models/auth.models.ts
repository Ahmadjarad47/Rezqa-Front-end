import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export enum UserRole {
  User = 'User',
  Admin = 'Admin',
  Moderator = 'Moderator'
}

export enum AuthStatus {
  Pending = 'Pending',
  Active = 'Active',
  Suspended = 'Suspended',
  Deactivated = 'Deactivated'
}

export interface IAuthUser {
  userName?: string;
  email?: string;
  roles?: string[];
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface IAuthResponse {
  isSuccess: boolean;
  message: string;
  accessToken?: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  imageUrl:string,
}

export interface IRegisterRequest {
  userName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  acceptTerms: boolean;
  profileImage?: File;
}

export interface ILoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

export interface IVerifyEmailRequest {
  email: string;
  token: string;
}

export interface IResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IResendEmailConfirmationRequest {
  email: string;
}
export interface UserData{
  userName?: string;
  email?: string;
  phoneNumber?: string;
  imageUrl:string,
}
export interface IUpdateProfileRequest {
  userName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface IAuthState {
  user: IAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

// Validation Functions
export class AuthValidators {
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumeric = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const isLongEnough = value.length >= 8;

      const errors: ValidationErrors = {};
      if (!hasUpperCase) errors['hasUpperCase'] = true;
      if (!hasLowerCase) errors['hasLowerCase'] = true;
      if (!hasNumeric) errors['hasNumeric'] = true;
      if (!hasSpecialChar) errors['hasSpecialChar'] = true;
      if (!isLongEnough) errors['minLength'] = true;

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  static passwordMatch(passwordControlName: string, confirmPasswordControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordControlName)?.value;
      const confirmPassword = formGroup.get(confirmPasswordControlName)?.value;

      if (password !== confirmPassword) {
        formGroup.get(confirmPasswordControlName)?.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }

      return null;
    };
  }

  static emailFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value;
      if (!email) return null;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email) ? null : { invalidEmail: true };
    };
  }

  static userNameFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const userName = control.value;
      if (!userName) return null;

      const userNameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      return userNameRegex.test(userName) ? null : { invalidUserName: true };
    };
  }

  
}
export interface CountryCode {
  name: string;
  arabicName:string
  code: string;
  dialCode: string;
  flag: string;
}
// Error Models
export enum AuthErrorCode {
  Unknown = 'Unknown',
  NetworkError = 'NetworkError',
  InvalidCredentials = 'InvalidCredentials',
  EmailNotConfirmed = 'EmailNotConfirmed',
  UserNotFound = 'UserNotFound',
  UserExists = 'UserExists',
  InvalidToken = 'InvalidToken',
  TokenExpired = 'TokenExpired',
  AccountLocked = 'AccountLocked',
  TooManyAttempts = 'TooManyAttempts',
  InvalidTwoFactorCode = 'InvalidTwoFactorCode',
  PasswordResetRequired = 'PasswordResetRequired',
  TermsNotAccepted = 'TermsNotAccepted'
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  statusCode?: number;
  name?: string;
}

// Constants
export const AUTH_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  EMAIL_MAX_LENGTH: 100,
  PHONE_MAX_LENGTH: 15,
  NAME_MAX_LENGTH: 50,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  ACCESS_TOKEN_EXPIRY_MINUTES: 15,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  TWO_FACTOR_CODE_LENGTH: 6,
  TWO_FACTOR_CODE_EXPIRY_MINUTES: 5
} as const;

// User Details DTO for comprehensive user information
export interface UserDetailsDto {
  id: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  imageUrl?: string;
  emailConfirmed: boolean;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnabled: boolean;
  isBlocked: boolean;
  lockoutEnd?: string;
  accessFailedCount: number;
  roles: string[];
  totalAds: number;
  activeAds: number;
  inactiveAds: number;
} 