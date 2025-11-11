import 'hammerjs';
import { AppComponent } from './app/app.component';
import { routes } from './app/app-routing.module';
import { environment } from './environments/environment';
import { HttpService } from './services/http/http.service';
import { StorageService } from './services/storage/storage.service';
import { PaymentGatewayService } from './services/payment-gateway/payment-gateway.service';
import { AuthGuardService } from './services/user-authentication/auth-guard.service';
import { ErrorHandlerService } from './services/http/error-handler.service';
import { HttpErrorInterceptor } from './services/http/http-error.interceptor';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideRouter, RouteReuseStrategy, withRouterConfig } from '@angular/router';
import { IonicRouteStrategy, IonicModule } from '@ionic/angular';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
  provideHttpClient,
} from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Angulartics2Module } from 'angulartics2';
import { AnalyticsService } from './services/analytics/analytics.service';

if (environment.production) {
  enableProdMode();
}

// Register Firebase messaging service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Firebase messaging service worker registered successfully:', registration);
    })
    .catch((err) => {
      console.error('Firebase messaging service worker registration failed:', err);
    });
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      IonicModule.forRoot({ menuType: 'overlay' }),
      IonicStorageModule.forRoot(),
      Angulartics2Module.forRoot()
    ),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    HttpService,
    ErrorHandlerService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    StorageService,
    PaymentGatewayService,
    AuthGuardService,
    AnalyticsService,
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideAnimationsAsync(),
    provideAnimationsAsync(),
  ],
}).catch((err) => console.log(err));
