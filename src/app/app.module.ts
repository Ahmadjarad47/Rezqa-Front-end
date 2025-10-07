import { ErrorHandler, NgModule } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import {
  BrowserAnimationsModule,
  provideAnimations,
} from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withJsonpSupport,
} from '@angular/common/http';

import { NgxSpinnerModule } from 'ngx-spinner';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { AdsHomeComponent } from './core/components/ads/ads-home/ads-home.component';
import { AdsDetailsComponent } from './core/components/ads/ads-details/ads-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { credentialsInterceptor } from './core/interceptor/credentials.interceptor';
import { PrivacyPolicyComponent } from './core/components/privacy-policy/privacy-policy.component';
import { HomeComponent } from './core/components/home/home.component';
import { environment } from '../environments/environment.development';
import { LazyImageDirective } from './core/directives/lazy-image.directive';
import { ServiceWorkerModule } from '@angular/service-worker';
import { VipAdsComponent } from './core/components/vip-ads/vip-ads.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    AdsHomeComponent,
    AdsDetailsComponent,
    PrivacyPolicyComponent,
    HomeComponent,
    LazyImageDirective,
    VipAdsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      enableHtml: true,
      toastClass: 'ngx-toastr custom-toast',
      titleClass: 'custom-toast-title',
      messageClass: 'custom-toast-message',
    }),
    AppRoutingModule,
    NgxSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(), 
      withInterceptors([credentialsInterceptor]),
      withJsonpSupport()
    ),
    provideAnimations(),
    // إعدادات HTTP محسنة للرفع
    {
      provide: 'HTTP_TIMEOUT_CONFIG',
      useValue: {
        uploadTimeout: 5 * 60 * 1000, // 5 دقائق للرفع
        apiTimeout: 30 * 1000, // 30 ثانية للطلبات العادية
        retryAttempts: 3,
        retryDelay: 1000
      }
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
