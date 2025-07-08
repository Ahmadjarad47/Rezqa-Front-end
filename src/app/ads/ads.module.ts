import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdsRoutingModule } from './ads-routing.module';
import { SelectCategoryComponent } from './components/select-category/select-category.component';
import { SelectSubCategoryComponent } from './components/select-sub-category/select-sub-category.component';
import { UploadPhotoComponent } from './components/upload-photo/upload-photo.component';
import { SelectDetailsComponent } from './components/select-details/select-details.component';
import { RouterModule } from '@angular/router';
import { StepperComponent } from './components/stepper/stepper.component';


@NgModule({
  declarations: [
    StepperComponent,
    SelectCategoryComponent,
    SelectSubCategoryComponent,
    UploadPhotoComponent,
    SelectDetailsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdsRoutingModule,
    RouterModule,
  ]
})
export class AdsModule { }
