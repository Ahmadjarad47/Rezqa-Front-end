import {
  Component,
  OnInit,
  HostListener,
  inject,
  Renderer2,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Dropdown } from 'flowbite';
import { FlowbiteService } from '../../../core/services/flowbite.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: false,
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent implements OnInit {
  isSidebarOpen = true;
  isSidebarExpanded = true;
  currentRoute: string = '';
  currentPageTitle: string = 'Dashboard';
  isNotificationsOpen = false;
  isProfileMenuOpen = false;
  isDarkMode = false;
  flowService = inject(FlowbiteService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      this.isDarkMode = true;
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      this.isDarkMode = false;
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }

    if (typeof document !== 'undefined') {
      // Close dropdowns when clicking outside
      document.addEventListener('click', () => {
        this.isNotificationsOpen = false;
        this.isProfileMenuOpen = false;
      });

      // Initialize Flowbite dropdown
      const dropdownTrigger = document.getElementById('dropdown-user-trigger');
      const dropdownMenu = document.getElementById('dropdown-user');

      if (dropdownTrigger && dropdownMenu) {
        const dropdown = new Dropdown(dropdownMenu, dropdownTrigger, {
          placement: 'bottom',
          offsetSkidding: 0,
          offsetDistance: 10,
          delay: 300,
          onHide: () => {
            console.log('dropdown has been hidden');
          },
          onShow: () => {
            console.log('dropdown has been shown');
          },
        });
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close dropdowns when clicking outside
    if (!(event.target as HTMLElement).closest('.dropdown-trigger')) {
      this.isNotificationsOpen = false;
      this.isProfileMenuOpen = false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isProfileMenuOpen = false; // Close profile menu when opening notifications
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isNotificationsOpen = false; // Close notifications when opening profile menu
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }
}
