import { Component, inject, OnInit } from '@angular/core';
import { FlowbiteService } from '../../../core/services/flowbite.service';
import { AuthService } from '@app/identity/services/auth.service';
import { NotificationService } from '@app/core/services/notification.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
 public authService = inject(AuthService);
  isSidebarOpen = false;

  constructor(
    public notificationService: NotificationService,
   
  ) {}

  ngOnInit(): void {
   
  }

  toggleSidebar(): void {
    const sidebar = document.getElementById('separator-sidebar');
    const backdrop = document.getElementById('separator-sidebar-backdrop');

    if (sidebar && backdrop) {
      this.isSidebarOpen = !this.isSidebarOpen;

      if (this.isSidebarOpen) {
        // Open sidebar
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
        backdrop.classList.remove('hidden');
      } else {
        // Close sidebar
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      }
    }
  }

  closeSidebar(): void {
    const sidebar = document.getElementById('separator-sidebar');
    const backdrop = document.getElementById('separator-sidebar-backdrop');

    if (sidebar && backdrop) {
      this.isSidebarOpen = false;
      sidebar.classList.remove('translate-x-0');
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
  }
}
