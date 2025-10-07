import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { Dropdown } from 'flowbite';
import { DataTableOptions, ExportOptions } from '../../models/users/dataTable';
import { UsersService } from './users.service';
import { BlockUserDto, GetAllUsers } from '../../models/users/Crud';
import { NotificationService } from '@app/core/services/notification.service';
import { SignalRService } from '@app/core/services/signalr.service';
import { PaginatedResult } from '@app/models/paginated-result.model';

// Type definitions for simpleDatatables
declare const simpleDatatables: {
  DataTable: new (selector: string, options?: any) => any;
  exportCSV: (table: any, options?: ExportOptions) => string | false;
  exportSQL: (table: any, options?: ExportOptions) => void;
  exportTXT: (table: any, options?: ExportOptions) => void;
  exportJSON: (table: any, options?: ExportOptions) => void;
};

interface FilterOptions {
  status: string;
  emailStatus: string;
  onlineStatus: string;
  role: string;
}

interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements AfterViewInit, OnInit, OnDestroy {
  private table: any;
  loading: boolean = false;

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;
  hasPreviousPage: boolean = false;
  hasNextPage: boolean = false;
  searchTerm: string = '';

  // Image handling properties
  imageLoadErrors: { [key: string]: boolean } = {};
  imageLoading: { [key: string]: boolean } = {};

  // Export dropdown
  showExportDropdown: boolean = false;

  // Advanced filtering and sorting
  showFilters: boolean = false;
  filterOptions: FilterOptions = {
    status: '',
    emailStatus: '',
    onlineStatus: '',
    role: ''
  };
  sortOptions: SortOptions = {
    field: 'userName',
    direction: 'asc'
  };

  // Bulk actions
  selectedUsers: Set<string> = new Set();
  selectAll: boolean = false;
  showBulkActions: boolean = false;

  // Statistics
  statistics = {
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    onlineUsers: 0,
    verifiedEmails: 0,
    uniqueVisitors: 0
  };

  showVisitorsDialog = false;

  constructor(
    private usersService: UsersService,
    @Inject(PLATFORM_ID) private platformId: any,
    private notificationService: NotificationService,
    public signalR: SignalRService
  ) {
    this.minDate = new Date();
  }

  allUsers: GetAllUsers[] = [];
  showBlockModal = false;
  selectedUser: GetAllUsers | null = null;
  blockUntil: Date = new Date();
  minDate = new Date();
  showNotificationModal = false;
  notificationTitle = '';
  notificationMessage = '';
  showAllUsersNotificationModal = false;
  allUsersNotificationTitle = '';
  allUsersNotificationMessage = '';
  Math = Math;

  ngOnInit(): void {
    this.loadUsers();
    this.calculateStatistics();
    this.fetchUniqueVisitorCount();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeDataTable();
    }
  }

  ngOnDestroy(): void {
    this.showExportDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-dropdown-container')) {
      this.showExportDropdown = false;
    }
  }

  loadUsers() {
    this.loading = true;
    this.usersService
      .getAllUsers(this.currentPage, this.pageSize, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.allUsers = response.items;
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.hasPreviousPage = response.hasPreviousPage;
          this.hasNextPage = response.hasNextPage;
          this.loading = false;
          this.calculateStatistics();
          this.updateSelectAllState();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.notificationService.error('Failed to load users');
          this.loading = false;
        }
      });
  }

  calculateStatistics() {
    this.statistics = {
      totalUsers: this.allUsers.length,
      activeUsers: this.allUsers.filter(u => !u.isBlocked).length,
      blockedUsers: this.allUsers.filter(u => u.isBlocked).length,
      onlineUsers: this.allUsers.filter(u => u.online).length,
      verifiedEmails: this.allUsers.filter(u => u.isConfirmeEmail).length,
      uniqueVisitors: this.statistics.uniqueVisitors || 0
    };
  }

  onSearch() {
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadUsers();
  }

  // Advanced filtering
  applyFilters() {
    this.currentPage = 1;
    this.loadUsers();
  }

  clearFilters() {
    this.filterOptions = {
      status: '',
      emailStatus: '',
      onlineStatus: '',
      role: ''
    };
    this.applyFilters();
  }

  // Sorting
  sortBy(field: string) {
    if (this.sortOptions.field === field) {
      this.sortOptions.direction = this.sortOptions.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortOptions.field = field;
      this.sortOptions.direction = 'asc';
    }
    this.loadUsers();
  }

  getSortIcon(field: string): string {
    if (this.sortOptions.field !== field) return 'sort';
    return this.sortOptions.direction === 'asc' ? 'sort-up' : 'sort-down';
  }

  // Bulk actions
  toggleSelectAll() {
    if (this.selectAll) {
      this.selectedUsers.clear();
      this.allUsers.forEach(user => this.selectedUsers.add(user.id));
    } else {
      this.selectedUsers.clear();
    }
    this.updateBulkActionsVisibility();
  }

  toggleUserSelection(userId: string) {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.updateSelectAllState();
    this.updateBulkActionsVisibility();
  }

  updateSelectAllState() {
    this.selectAll = this.allUsers.length > 0 && 
                    this.allUsers.every(user => this.selectedUsers.has(user.id));
  }

  updateBulkActionsVisibility() {
    this.showBulkActions = this.selectedUsers.size > 0;
  }

  bulkBlockUsers() {
    if (this.selectedUsers.size === 0) return;
    
    const request: BlockUserDto = {
      userId: Array.from(this.selectedUsers)[0], // For now, handle one at a time
      blockUntil: this.blockUntil
    };

    this.usersService.blockUser(request).subscribe({
      next: () => {
        this.notificationService.success(`Blocked ${this.selectedUsers.size} users`);
        this.selectedUsers.clear();
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error blocking users:', error);
        this.notificationService.error('Failed to block users');
      }
    });
  }

  bulkSendNotification() {
    if (this.selectedUsers.size === 0) return;
    
    // Send notification to selected users
    this.selectedUsers.forEach(userId => {
      this.signalR.sendNotification(userId, 'Bulk Notification', 'You have received a bulk notification');
    });
    
    this.notificationService.success(`Sent notification to ${this.selectedUsers.size} users`);
    this.selectedUsers.clear();
    this.updateBulkActionsVisibility();
  }

  // Image handling methods
  onImageLoad(userId: string) {
    this.imageLoading[userId] = false;
    this.imageLoadErrors[userId] = false;
  }

  onImageError(userId: string) {
    this.imageLoading[userId] = false;
    this.imageLoadErrors[userId] = true;
  }

  // Export dropdown methods
  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  // Pagination helper methods
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  openBlockModal(user: GetAllUsers) {
    this.selectedUser = user;
    this.blockUntil = new Date();
    this.showBlockModal = true;
  }

  closeBlockModal() {
    this.showBlockModal = false;
    this.selectedUser = null;
  }

  blockUser() {
    if (!this.selectedUser) return;

    const request: BlockUserDto = {
      userId: this.selectedUser.id,
      blockUntil: this.blockUntil
    };

    this.loading = true;
    this.usersService.blockUser(request).subscribe({
      next: (result) => {
        this.notificationService.success('User status updated successfully');
        this.closeBlockModal();
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error blocking user:', error);
        this.notificationService.error('Failed to update user status');
        this.loading = false;
      }
    });
  }

  openNotificationModal(user: GetAllUsers) {
    this.selectedUser = user;
    this.notificationTitle = '';
    this.notificationMessage = '';
    this.showNotificationModal = true;
  }

  closeNotificationModal() {
    this.showNotificationModal = false;
    this.selectedUser = null;
  }

  sendNotification() {
    if (!this.selectedUser || !this.notificationTitle || !this.notificationMessage) {
      this.notificationService.error('Please fill in all fields');
      return;
    }

    this.signalR.sendNotification(this.selectedUser.id, this.notificationTitle, this.notificationMessage);
    this.notificationService.success('Notification sent successfully');
    this.closeNotificationModal();
  }

  openAllUsersNotificationModal() {
    this.allUsersNotificationTitle = '';
    this.allUsersNotificationMessage = '';
    this.showAllUsersNotificationModal = true;
  }

  closeAllUsersNotificationModal() {
    this.showAllUsersNotificationModal = false;
  }

  sendAllUsersNotification() {
    if (!this.allUsersNotificationTitle || !this.allUsersNotificationMessage) {
      this.notificationService.error('Please fill in all fields');
      return;
    }

    this.signalR.sendNotificationToAllUsers(this.allUsersNotificationTitle, this.allUsersNotificationMessage);
    this.notificationService.success('Notification sent to all users');
    this.closeAllUsersNotificationModal();
  }

  getStatusBadgeClass(user: GetAllUsers): string {
    if (user.isBlocked) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  }

  getStatusText(user: GetAllUsers): string {
    return user.isBlocked ? 'Blocked' : 'Active';
  }

  getEmailStatusBadgeClass(user: GetAllUsers): string {
    if (user.isConfirmeEmail) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  }

  getEmailStatusText(user: GetAllUsers): string {
    return user.isConfirmeEmail ? 'Verified' : 'Pending';
  }

  getOnlineStatusClass(user: GetAllUsers): string {
    return user.online ? 'bg-green-500' : 'bg-gray-400';
  }

  getOnlineStatusText(user: GetAllUsers): string {
    return user.online ? 'Online' : 'Offline';
  }

  private initializeDataTable() {
    // Initialize DataTable if needed
  }

  exportToCSV() {
    if (isPlatformBrowser(this.platformId) && this.table) {
      simpleDatatables.exportCSV(this.table, {
        filename: 'users-export'
      });
    }
  }

  exportToJSON() {
    if (isPlatformBrowser(this.platformId) && this.table) {
      simpleDatatables.exportJSON(this.table, {
        filename: 'users-export'
      });
    }
  }

  fetchUniqueVisitorCount() {
    this.usersService.getUniqueVisitorCount().subscribe({
      next: (res) => {
        this.statistics.uniqueVisitors = res.uniqueVisitors;
      },
      error: (err) => {
        this.statistics.uniqueVisitors = 0;
      }
    });
  }

  openVisitorsDialog() {
    this.showVisitorsDialog = true;
  }
  closeVisitorsDialog() {
    this.showVisitorsDialog = false;
  }

  getPieArc(value: number, max: number): string {
    const radius = 54;
    const center = 60;
    const angle = (value / max) * 360;
    const radians = (angle - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(radians);
    const y = center + radius * Math.sin(radians);
    const largeArc = angle > 180 ? 1 : 0;
    if (value === 0) {
      return '';
    }
    if (value >= max) {
      // Full circle
      return `M${center},${center - radius} A${radius},${radius} 0 1,1 ${center - 0.01},${center - radius} Z`;
    }
    return `M${center},${center} L${center},${center - radius} A${radius},${radius} 0 ${largeArc},1 ${x},${y} Z`;
  }
}
