import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadStrategy implements PreloadingStrategy {
  private preloadedModules: Set<string> = new Set();

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Don't preload if already loaded
    if (this.preloadedModules.has(route.path || '')) {
      return of(null);
    }

    // Check if route should be preloaded based on data
    if (route.data && route.data['preload'] === false) {
      return of(null);
    }

    // Preload high priority routes immediately
    if (route.data && route.data['preload'] === true) {
      this.preloadedModules.add(route.path || '');
      return load();
    }

    // Preload other routes after a delay
    if (route.data && route.data['preload'] === 'delayed') {
      setTimeout(() => {
        if (!this.preloadedModules.has(route.path || '')) {
          this.preloadedModules.add(route.path || '');
          load().subscribe();
        }
      }, 3000); // 3 second delay
      return of(null);
    }

    // Default: preload after 5 seconds
    setTimeout(() => {
      if (!this.preloadedModules.has(route.path || '')) {
        this.preloadedModules.add(route.path || '');
        load().subscribe();
      }
    }, 5000);

    return of(null);
  }

  /**
   * Manually preload a specific route
   */
  preloadRoute(path: string, load: () => Observable<any>): Observable<any> {
    if (this.preloadedModules.has(path)) {
      return of(null);
    }

    this.preloadedModules.add(path);
    return load();
  }

  /**
   * Check if a route is preloaded
   */
  isPreloaded(path: string): boolean {
    return this.preloadedModules.has(path);
  }

  /**
   * Clear preloaded modules (useful for testing)
   */
  clearPreloadedModules(): void {
    this.preloadedModules.clear();
  }
} 