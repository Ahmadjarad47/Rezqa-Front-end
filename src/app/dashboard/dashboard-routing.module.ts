import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { SettingsComponent } from './components/settings/settings.component';
import { WishlistComponent } from './components/wishlist/wishlist.component';
import { AdsComponent } from './components/ads/ads.component';
import { NotificationComponent } from './components/notification/notification.component';
import { authAdsGuardAndDashboard } from '@app/ads/guards/auth-ads.guard';
import { SupportComponent } from './components/support/support.component';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Inject } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authAdsGuardAndDashboard],
    children: [
      { path: '', redirectTo: 'ads', pathMatch: 'full' },
      { path: 'ads', component: AdsComponent },
      { path: 'wishlist', component: WishlistComponent },
      { path: 'notification', component: NotificationComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'support', component: SupportComponent },
    ],
  },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    { provide: PLATFORM_ID, useValue: 'server' },
  ],
})
export class DashboardRoutingModule {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
}
