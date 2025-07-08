import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, AfterViewInit, Component, OnInit, Inject } from '@angular/core';
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
  isError = false;
  successMessage = '';
  emailFromQuery: string | null = null;
  tokenFromQuery: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Get email and token from query parameters

    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe((params) => {
        this.emailFromQuery = params['email'] || null;
        this.tokenFromQuery = params['token'] || null;
        if (this.emailFromQuery && this.tokenFromQuery) {
          this.verifyEmailFromUrl();
        } else {
          this.errorMessage = 'رابط التحقق غير صالح';
          this.isLoading = false;
          this.isError = true;
        }
      });
    }
  }

  private verifyEmailFromUrl(): void {
    const verifyRequest: IVerifyEmailRequest = {
      email: this.emailFromQuery!,
      token: this.tokenFromQuery!,
    };

    this.authService.verifyEmail(verifyRequest).subscribe({
      next: (response) => {
        this.successMessage = 'تم التحقق من البريد الإلكتروني بنجاح';
        this.isLoading = false;
        this.isError = false;
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/identity/login'], {
            queryParams: { verified: true },
          });
        }, 2000);
      },
      error: () => {
        this.errorMessage = 'حدث خطأ أثناء التحقق من البريد الإلكتروني';
        this.isLoading = false;
        this.isError = true;
      },
    });
  }
}
