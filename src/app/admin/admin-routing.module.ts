import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { AuthGuard } from './guards/auth.guard';
import { UsersComponent } from './components/users/users.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { SubCategoriesComponent } from './components/subcategories/subcategories.component';
import { DynamicFieldsComponent } from './components/dynamic-fields/dynamic-fields.component';
import { AdsComponent } from './components/ads/ads.component';
import { ReportComponent } from './components/report/report.component';
import { SupportComponent } from './components/support/support.component';
import { NotificationComponent } from './components/notification/notification.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'categories',
        component: CategoriesComponent,
      },
      {
        path: 'subcategories',
        component: SubCategoriesComponent,
      },
      {
        path: 'dynamic-fields',
        component: DynamicFieldsComponent,
      },
      {
        path: 'ads',
        component: AdsComponent,
      },
      {
        path: 'reports',
        component: ReportComponent,
      },
      {
        path: 'support',
        component: SupportComponent,
      },
      {
        path: 'notifications',
        component: NotificationComponent,
      },
      
      {
        path: '',
        redirectTo: 'categories',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
