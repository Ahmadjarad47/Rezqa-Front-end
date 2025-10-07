import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  AfterViewInit,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from 'src/app/identity/services/auth.service';
import { UserData } from 'src/app/identity/models/auth.models';
import { WishlistService } from '@app/dashboard/components/wishlist/wishlist.service';
import { HomeService, CategoryDto } from '@app/core/services/home.service';
import { FormControl } from '@angular/forms';
import { NotificationService } from '@app/core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  isDarkMode = false;
  userData: UserData | null = null;
  isDropdownOpen = false;
  showNavbar = true;
  private routerSubscription!: Subscription;
  private searchSubscription!: Subscription;

  // Search functionality
  searchControl = new FormControl('');
  searchResults: CategoryDto[] = [];
  isSearching = false;
  showSearchResults = false;
  allCategories: CategoryDto[] = [];

  // Governorate selector
  selectedGovernorate = 'كل المحافظات';
  isGovernorateDropdownOpen = false;

  // Syrian governorates
  governorates = [
    { id: 'all', name: 'كل المحافظات', nameEn: 'كل المحافظات', flag: 'photo_2025-07-25_00-19-46_6_11zon.jpg' },
    { id: 'damascus', name: 'دمشق', nameEn: 'Damascus', flag: 'photo_2025-07-25_00-19-46_6_11zon.jpg' },
    { id: 'aleppo', name: 'حلب', nameEn: 'Aleppo', flag: 'R_12_11zon.jpg' },
    { id: 'homs', name: 'حمص', nameEn: 'Homs', flag: 'photo_2025-07-25_00-19-39_3_11zon.jpg' },
    { id: 'latakia', name: 'اللاذقية', nameEn: 'Latakia', flag: 'photo_2025-07-25_00-19-52_10_11zon.jpg' },
    { id: 'hama', name: 'حماة', nameEn: 'Hama', flag: 'photo_2025-07-25_00-19-44_5_11zon.jpg' },
    { id: 'tartus', name: 'طرطوس', nameEn: 'Tartus', flag: 'photo_2025-07-25_00-19-50_9_11zon.jpg' },
    { id: 'idlib', name: 'إدلب', nameEn: 'Idlib', flag: 'photo_2025-07-25_00-19-48_7_11zon.jpg' },
    { id: 'raqqa', name: 'الرقة', nameEn: 'Raqqa', flag: 'photo_2025-07-25_00-19-42_4_11zon.jpg' },
    { id: 'deir-ez-zor', name: 'دير الزور', nameEn: 'Deir ez-Zor', flag: 'photo_2025-07-25_00-19-49_8_11zon.jpg' },
    { id: 'hasakah', name: 'الحسكة', nameEn: 'Hasakah', flag: 'photo_2025-07-25_00-19-48_7_11zon.jpg' },
    { id: 'quneitra', name: 'القنيطرة', nameEn: 'Quneitra', flag: '-1-1_1_11zon.jpg' },
    { id: 'daraa', name: 'درعا', nameEn: 'Daraa', flag: 'photo_2025-07-25_00-19-37_2_11zon.jpg' },
    {
      id: 'damascus-countryside',
      name: 'ريف دمشق',
      nameEn: 'Damascus Countryside',
      flag: '🏞️',
    },
  ];

  showMobileNotifications = false;
  showMobileWishlist = false;

  constructor(
    public authService: AuthService,
    public wishlistService: WishlistService,
    public notificationService: NotificationService,
    private router: Router,
    private homeService: HomeService
  ) {
    // Subscribe to user data
    this.authService.userData$.subscribe((data) => {
      this.userData = data;
      notificationService.loadNotifications();
    });
  }

  ngAfterViewInit() {
    this.wishlistService.getWishlist().subscribe();

    // Initialize notifications if user is authenticated
    this.homeService.getCategories().subscribe((value) => {
      this.allCategories = value.items;
    });
    this.notificationService.startConnection();

    // Setup search functionality
    this.setupSearch();

    // Monitor route changes to hide navbar on dashboard pages
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showNavbar = !event.url.includes('dashboard') ;
      });

    // Check initial URL
    this.showNavbar = !this.router.url.includes('dashboard');
   
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

 

  private setupSearch(): void {
    this.searchSubscription = this.searchControl.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged() // Only emit if value has changed
      )
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm || '');
      });
  }

  private performSearch(searchTerm: string): void {
  
    if (!searchTerm.trim()) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.isSearching = true;

    // Filter categories based on search term
    if (this.allCategories) {
      const filteredResults = this.allCategories.filter(
        (category) =>
          category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Limit results to first 10 for better UX
      this.searchResults = filteredResults.slice(0, 10);
      this.showSearchResults = this.searchResults.length > 0;
      this.isSearching = false;
    }
  }

  onSearchFocus(): void {
    if (this.searchControl.value && this.searchResults.length > 0) {
      this.showSearchResults = true;
    }
  }

  onSearchBlur(): void {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  onSearchResultClick(category: CategoryDto): void {
    this.homeService.setCategory(category);
    this.router.navigate(['/all', category.title.replaceAll(' ', '-')]);
    this.searchControl.setValue('');
    this.showSearchResults = false;
  }

  onSearchSubmit(): void {
    // Navigate to search results page or perform search
    this.router.navigate(['/all']);
    this.showSearchResults = false;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchResults = [];
    this.showSearchResults = false;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  toggleMobileNotifications(): void {
    this.showMobileNotifications = !this.showMobileNotifications;
    if (this.showMobileNotifications) {
      this.showMobileWishlist = false;
    }
  }

  toggleMobileWishlist(): void {
    this.showMobileWishlist = !this.showMobileWishlist;
    if (this.showMobileWishlist) {
      this.showMobileNotifications = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.closeDropdown();
    }
    // Close search results when clicking outside
    if (!target.closest('.search-container')) {
      this.showSearchResults = false;
    }
    // Close governorate dropdown when clicking outside
    if (!target.closest('.governorate-dropdown-container')) {
      this.closeGovernorateDropdown();
    }
    // Close mobile notifications dropdown when clicking outside
    if (
      !target.closest('.mobile-notifications-dropdown') &&
      !target.closest('.mobile-notifications-btn')
    ) {
      this.showMobileNotifications = false;
    }
    // Close mobile wishlist dropdown when clicking outside
    if (
      !target.closest('.mobile-wishlist-dropdown') &&
      !target.closest('.mobile-wishlist-btn')
    ) {
      this.showMobileWishlist = false;
    }
  }

  // Governorate selector methods
  toggleGovernorateDropdown(): void {
    this.isGovernorateDropdownOpen = !this.isGovernorateDropdownOpen;
  }

  closeGovernorateDropdown(): void {
    this.isGovernorateDropdownOpen = false;
  }

  selectGovernorate(governorate: string): void {
    this.selectedGovernorate = governorate;
    this.closeGovernorateDropdown();
    // You can add additional logic here like changing location-based content, etc.
    console.log('Selected governorate:', governorate);
  }

  getSelectedGovernorateData() {
    return this.governorates.find((g) => g.name === this.selectedGovernorate);
  }

  getWishlistItemLink(item: any): any[] {
    if (!item) return ['/all'];
    const category = (item.categoryName || '').split(' ').join('-');
    const title = (item.title || '').split(' ').join('-');
    return ['/all', category, title, item.adId];
  }
}
