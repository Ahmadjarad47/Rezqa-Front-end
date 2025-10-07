import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './core/components/home/home.component';
import { AdsHomeComponent } from './core/components/ads/ads-home/ads-home.component';
import { AdsDetailsComponent } from './core/components/ads/ads-details/ads-details.component';
import { PrivacyPolicyComponent } from './core/components/privacy-policy/privacy-policy.component';
import { CustomPreloadStrategy } from './core/strategies/preload-strategy';
import { VipAdsComponent } from './core/components/vip-ads/vip-ads.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { preload: true }
  },
  {
    path: 'all',
    component: AdsHomeComponent,
    data: { preload: true }
  },
  {
    path: 'vip-ads',
    component: VipAdsComponent,
    data: { preload: true }
  },
  {
    path: 'privacy-Policy',
    component: PrivacyPolicyComponent,
    data: { preload: false }
  },
  {
    path: 'all/:category',
    component: AdsHomeComponent,
    data: { preload: true }
  },
  {
    path: 'all/:category/:ads/:id',
    component: AdsDetailsComponent,
    data: { preload: true }
  },
  {
    path: 'identity',
    loadChildren: () =>
      import('./identity/identity.module').then((m) => m.IdentityModule),
    data: { preload: false }
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminModule),
    data: { preload: false }
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
    data: { preload: false }
  },
  {
    path: 'ads',
    loadChildren: () => import('./ads/ads.module').then((m) => m.AdsModule),
    data: { preload: 'delayed' }
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    preloadingStrategy: CustomPreloadStrategy,
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled',
    scrollOffset: [0, 0],
    enableTracing: false
  })],
  exports: [RouterModule],
  providers: [CustomPreloadStrategy]
})
export class AppRoutingModule {}
