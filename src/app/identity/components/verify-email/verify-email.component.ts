import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IVerifyEmailRequest } from '../../models/auth.models';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  emailFromQuery: string | null = null;
  tokenFromQuery: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get email and token from query parameters
    this.route.queryParams.subscribe((params) => {
      this.emailFromQuery = params['email'] || null;
      this.tokenFromQuery = params['token'] || null;
      if (this.emailFromQuery && this.tokenFromQuery) {
        this.verifyEmailFromUrl();
      } else {
        this.errorMessage = 'رابط التحقق غير صالح';
        this.isLoading = false;
      }
    });
  }

  private verifyEmailFromUrl(): void {
    const verifyRequest: IVerifyEmailRequest = {
      email: this.emailFromQuery!,
      token: this.tokenFromQuery!,
    };

    debugger
    this.authService.verifyEmail(verifyRequest).subscribe({
      next: (response) => {
        debugger
        this.successMessage = 'تم التحقق من البريد الإلكتروني بنجاح';
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/identity/login'], {
            queryParams: { verified: true },
          });
        }, 3000);
        return
      },
      error: (error:any) => {
        
        this.errorMessage =
          error.message || 'حدث خطأ أثناء التحقق من البريد الإلكتروني';
        this.isLoading = false;
        return
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
