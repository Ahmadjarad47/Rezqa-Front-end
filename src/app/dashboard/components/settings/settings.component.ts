import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../identity/services/auth.service';
import { UserDetailsDto } from '../../../identity/models/auth.models';
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

  constructor(private authService: AuthService) {
    this.userDetails$ = this.authService.getUserDetails();
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
    return status ? 'text-green-600' : 'text-red-600';
  }

  getBlockedStatusText(isBlocked: boolean): string {
    return isBlocked ? 'محظور' : 'نشط';
  }

  getBlockedStatusClass(isBlocked: boolean): string {
    return isBlocked ? 'text-red-600' : 'text-green-600';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-SA');
  }
}
