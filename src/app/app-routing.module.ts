import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './core/components/home/home.component';
import { AdsHomeComponent } from './core/components/ads/ads-home/ads-home.component';
import { AdsDetailsComponent } from './core/components/ads/ads-details/ads-details.component';
import { PrivacyPolicyComponent } from './core/components/privacy-policy/privacy-policy.component';

const routes: Routes = [
  {
    path: '/',

    component: HomeComponent,
  },
  {
    path: 'all',

    component: AdsHomeComponent,
  },
  {
    path: 'privacy-Policy',

    component: PrivacyPolicyComponent,
  },
  {
    path: 'all/:category',
    component: AdsHomeComponent,
  },
  {
    path: 'all/:category/:ads/:id',
    component: AdsDetailsComponent,
  },
  {
    path: 'identity',
    loadChildren: () =>
      import('./identity/identity.module').then((m) => m.IdentityModule),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'ads',
    loadChildren: () => import('./ads/ads.module').then((m) => m.AdsModule),
  },
  { path: '**', redirectTo: '/', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
