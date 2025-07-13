import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { UsersComponent } from './components/users/users.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { CategoryFormComponent } from './components/category-form/category-form.component';
import { SubCategoriesComponent } from './components/subcategories/subcategories.component';
import { SubCategoryFormComponent } from './components/subcategory-form/subcategory-form.component';
import { DynamicFieldsComponent } from './components/dynamic-fields/dynamic-fields.component';
import { DynamicFieldFormComponent } from './components/dynamic-field-form/dynamic-field-form.component';
import { AdsComponent } from './components/ads/ads.component';
import { ReportComponent } from './components/report/report.component';
import { SupportComponent } from './components/support/support.component';
import { NotificationComponent } from './components/notification/notification.component';

@NgModule({
  declarations: [
    DashboardLayoutComponent,
    UsersComponent,
    CategoriesComponent,
    CategoryFormComponent,
    SubCategoriesComponent,
    SubCategoryFormComponent,
    DynamicFieldsComponent,
    DynamicFieldFormComponent,
    AdsComponent,
    ReportComponent,
    SupportComponent,
    NotificationComponent,
    
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AdminRoutingModule,
  ],
  exports: [
    AdsComponent
  ]
})
export class AdminModule {}
