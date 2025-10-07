import {
  Component,
  OnDestroy,
  OnInit,
  Inject,
  PLATFORM_ID,
  AfterViewInit,
} from '@angular/core';
import { FlowbiteService } from './core/services/flowbite.service';
import { initFlowbite } from 'flowbite';
import { AuthService } from './identity/services/auth.service';
import { SignalRService } from './core/services/signalr.service';
import { PerformanceService } from './core/services/performance.service';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'syria-open-store';
  private destroy$ = new Subject<void>();
  private signalRInitialized = false;
  public showNavbar = true; // Add this line

  constructor(
    private flowbiteService: FlowbiteService,
    private auth: AuthService,
    private signalRService: SignalRService,
    private performanceService: PerformanceService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalRService.stopConnection();
  }

  ngAfterViewInit(): void {
    this.initializeFlowbite();
    // Initialize performance monitoring
    this.performanceService.monitorPerformance();

    // Initialize Flowbite immediately

    // Initialize auth and SignalR with delay for better performance

    this.initializeAuthAndSignalR();

    // // Monitor route changes for lazy loading optimization
    // this.monitorRouteChanges();

    // // Preload critical resources
    // this.preloadCriticalResources();

    // Set initial navbar visibility
    if (isPlatformBrowser(this.platformId)) {
      this.updateNavbarVisibility();

      // Optional: Update on route changes
      this.router.events.subscribe(() => {
        this.updateNavbarVisibility();
      });
    }
  }

  updateNavbarVisibility() {
    const hideNavbarRoutes = ['/admin/', '/dashboard/', '/ads'];
    this.showNavbar = !hideNavbarRoutes.some((route) =>
      this.router.url.includes(route)
    );
  }
  private initializeFlowbite(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.flowbiteService.loadFlowbite((flowbite) => {
        initFlowbite();
      });
    }
  }

  private initializeAuthAndSignalR(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.auth.refreshToken().subscribe();

    // Check if user is authenticated first
    if (this.auth.isAuthenticated()) {
      // Initialize SignalR immediately for authenticated users
      this.auth.refreshToken().subscribe();
      this.initializeSignalR();
    } else {
      this.auth.refreshToken().subscribe({
        next: () => {
          this.auth.getData().subscribe({
            next: () => {
              this.initializeSignalR();
            },
            error: () => {
              // User is not authenticated, don't initialize SignalR
            },
          });
        },
        error: () => {},
      });
      // For non-authenticated users, try to get user data with delay
    }
  }

  private initializeSignalR(): void {
    if (this.signalRInitialized) {
      return;
    }

    this.signalRInitialized = true;
    this.signalRService.startConnection();
  }

  // private monitorRouteChanges(): void {
  //   if (!isPlatformBrowser(this.platformId)) {
  //     return;
  //   }

  //   this.router.events
  //     .pipe(
  //       filter(event => event instanceof NavigationEnd),
  //       takeUntil(this.destroy$)
  //     )
  //     .subscribe((event: NavigationEnd) => {
  //       // Preload critical resources based on route
  //       this.preloadResourcesForRoute(event.url);
  //       // Update navbar visibility
  //       this.showNavbar = !event.url.startsWith('/ads');
  //     });
  // }

  // private preloadResourcesForRoute(url: string): void {
  //   if (!isPlatformBrowser(this.platformId)) {
  //     return;
  //   }

  //   // Preload resources based on route
  //   if (url.includes('/dashboard')) {
  //     // Preload dashboard resources
  //     this.preloadDashboardResources();
  //   } else if (url.includes('/ads')) {
  //     // Preload ads resources
  //     this.preloadAdsResources();
  //   }
  // }

  private preloadDashboardResources(): void {
    // Preload dashboard images and critical resources
    const resources = [
      '/assets/images/dashboard-bg.jpg',
      '/assets/icons/dashboard.svg',
    ];

    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // private preloadCriticalResources(): void {
  //   if (!isPlatformBrowser(this.platformId)) {
  //     return;
  //   }

  //   // Preload critical images
  //   this.performanceService.preloadImages([
  //     '/assets/images/hero-bg.jpg',
  //     '/assets/icons/logo.svg'
  //   ]);

  //   // Preload critical resources
  //   this.performanceService.preloadResources([
  //     { url: '/assets/styles/critical.css', type: 'style' },
  //     { url: '/assets/fonts/main-font.woff2', type: 'font' }
  //   ]);
  // }

  // private preloadAdsResources(): void {
  //   // Preload ads-related resources
  //   const resources = [
  //     '/assets/images/ads-bg.jpg',
  //     '/assets/icons/ads.svg'
  //   ];

  //   resources.forEach(resource => {
  //     const link = document.createElement('link');
  //     link.rel = 'preload';
  //     link.as = 'image';
  //     link.href = resource;
  //     document.head.appendChild(link);
  //   });
  // }
}
