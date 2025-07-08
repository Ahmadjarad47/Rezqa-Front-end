import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { LayoutComponent } from './components/layout/layout.component';
import { SettingsComponent } from './components/settings/settings.component';
import { WishlistComponent } from './components/wishlist/wishlist.component';
import { AdsComponent } from './components/ads/ads.component';
import { NotificationComponent } from './components/notification/notification.component';
import { SupportComponent } from './components/support/support.component';


@NgModule({
  declarations: [
    LayoutComponent,
    SettingsComponent,
    WishlistComponent,
    AdsComponent,
    NotificationComponent,
    SupportComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
