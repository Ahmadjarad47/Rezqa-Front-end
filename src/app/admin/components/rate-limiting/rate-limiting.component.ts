import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RateLimitingService } from '../../services/rate-limiting.service';
import { BlockedUserInfo, UnblockUserByIpRequest, UnblockUserByClientIdRequest } from '../../models/blocked-user.model';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-rate-limiting',
  standalone: false,
  templateUrl: './rate-limiting.component.html',
  styleUrl: './rate-limiting.component.css'
})
export class RateLimitingComponent implements OnInit, OnDestroy {
  blockedUsers: BlockedUserInfo[] = [];
  totalBlockedUsers = 0;
  loading = false;
  searchTerm = '';
  searchType: 'ip' | 'client' = 'ip';
  searchValue = '';
  searchResult: BlockedUserInfo | null = null;
  searchLoading = false;
  unblockLoading = false;
  selectedUser: BlockedUserInfo | null = null;
  showUnblockModal = false;
  unblockType: 'ip' | 'client' = 'ip';
  unblockValue = '';
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(private rateLimitingService: RateLimitingService) { }

  ngOnInit(): void {
    this.loadBlockedUsers();
    this.loadBlockedUsersCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBlockedUsers(): void {
    this.loading = true;
    this.rateLimitingService.getBlockedUsers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (users) => {
          this.blockedUsers = users.map(user => ({
            ...user,
            blockedAt: new Date(user.blockedAt),
            expiresAt: user.expiresAt ? new Date(user.expiresAt) : undefined
          }));
        },
        error: (error) => {
          console.error('Error loading blocked users:', error);
          this.showError('Failed to load blocked users');
        }
      });
  }

  loadBlockedUsersCount(): void {
    this.rateLimitingService.getBlockedUsersCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalBlockedUsers = response.count;
        },
        error: (error) => {
          console.error('Error loading blocked users count:', error);
        }
      });
  }

  searchBlockedUser(): void {
    if (!this.searchValue.trim()) {
      this.showError('Please enter a search value');
      return;
    }

    this.searchLoading = true;
    this.searchResult = null;

    const searchObservable = this.searchType === 'ip' 
      ? this.rateLimitingService.getBlockedUserByIp(this.searchValue)
      : this.rateLimitingService.getBlockedUserByClientId(this.searchValue);

    searchObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.searchLoading = false)
      )
      .subscribe({
        next: (user) => {
          this.searchResult = {
            ...user,
            blockedAt: new Date(user.blockedAt),
            expiresAt: user.expiresAt ? new Date(user.expiresAt) : undefined
          };
        },
        error: (error) => {
          if (error.status === 404) {
            this.searchResult = null;
            this.showError(`No blocked user found with ${this.searchType === 'ip' ? 'IP' : 'Client ID'}: ${this.searchValue}`);
          } else {
            console.error('Error searching blocked user:', error);
            this.showError('Failed to search for blocked user');
          }
        }
      });
  }

  openUnblockModal(user: BlockedUserInfo): void {
    this.selectedUser = user;
    this.unblockType = user.type.toLowerCase() as 'ip' | 'client';
    this.unblockValue = user.value;
    this.showUnblockModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeUnblockModal(): void {
    this.showUnblockModal = false;
    this.selectedUser = null;
    this.unblockValue = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  unblockUser(): void {
    if (!this.unblockValue.trim()) {
      this.showError('Please enter a value to unblock');
      return;
    }

    this.unblockLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.unblockType === 'ip' 
      ? { ipAddress: this.unblockValue } as UnblockUserByIpRequest
      : { clientId: this.unblockValue } as UnblockUserByClientIdRequest;

    const unblockObservable = this.unblockType === 'ip'
      ? this.rateLimitingService.unblockUserByIp(request as UnblockUserByIpRequest)
      : this.rateLimitingService.unblockUserByClientId(request as UnblockUserByClientIdRequest);

    unblockObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.unblockLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message || 'User unblocked successfully');
            this.closeUnblockModal();
            this.loadBlockedUsers();
            this.loadBlockedUsersCount();
          } else {
            this.showError(response.message || 'Failed to unblock user');
          }
        },
        error: (error) => {
          console.error('Error unblocking user:', error);
          this.showError('Failed to unblock user');
        }
      });
  }

  getFilteredUsers(): BlockedUserInfo[] {
    if (!this.searchTerm.trim()) {
      return this.blockedUsers;
    }
    
    return this.blockedUsers.filter(user => 
      user.value.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.reason?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.type.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  isExpired(user: BlockedUserInfo): boolean {
    return user.expiresAt ? new Date() > user.expiresAt : false;
  }

  getStatusBadgeClass(user: BlockedUserInfo): string {
    if (this.isExpired(user)) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-red-100 text-red-800';
  }

  getStatusText(user: BlockedUserInfo): string {
    return this.isExpired(user) ? 'Expired' : 'Active';
  }

  get activeBlockedUsersCount(): number {
    return this.blockedUsers.filter(user => !this.isExpired(user)).length;
  }

  get expiredBlockedUsersCount(): number {
    return this.blockedUsers.filter(user => this.isExpired(user)).length;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 5000);
  }
}
