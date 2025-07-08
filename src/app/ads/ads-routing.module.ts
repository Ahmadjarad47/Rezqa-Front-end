import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SelectCategoryComponent } from './components/select-category/select-category.component';
import { SelectSubCategoryComponent } from './components/select-sub-category/select-sub-category.component';
import { UploadPhotoComponent } from './components/upload-photo/upload-photo.component';
import { SelectDetailsComponent } from './components/select-details/select-details.component';
import { AdsLeaveGuard } from './guards/ads-leave.guard';
import { StepperComponent } from './components/stepper/stepper.component';
import { authAdsGuardAndDashboard } from './guards/auth-ads.guard';

const routes: Routes = [
  {
    path: '',
    component: StepperComponent,
    canActivate: [authAdsGuardAndDashboard],
    canDeactivate: [AdsLeaveGuard],
    children: [
      { path: 'select-category', component: SelectCategoryComponent },
      { path: 'select-sub-category', component: SelectSubCategoryComponent },
      { path: 'upload-photo', component: UploadPhotoComponent },
      { path: 'select-details', component: SelectDetailsComponent },

      {
        path: '',
        redirectTo: 'select-category',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdsRoutingModule {}
