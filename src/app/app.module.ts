
import { NgModule } from '@angular/core';
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
} from '@angular/common/http';
import { AuthService } from './identity/services/auth.service';
import { authInterceptor } from './identity/interceptors/auth.interceptor';
import { NgxSpinnerModule } from 'ngx-spinner';
import { HomeComponent } from './core/components/home/home.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { AdsHomeComponent } from './core/components/ads/ads-home/ads-home.component';
import { AdsDetailsComponent } from './core/components/ads/ads-details/ads-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { credentialsInterceptor } from './core/interceptor/credentials.interceptor';
import { PrivacyPolicyComponent } from './core/components/privacy-policy/privacy-policy.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, NavbarComponent, AdsHomeComponent, AdsDetailsComponent, PrivacyPolicyComponent],
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
    }),
    AppRoutingModule,
    NgxSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([credentialsInterceptor])
    ),
    provideAnimations(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
